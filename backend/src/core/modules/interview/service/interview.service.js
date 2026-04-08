import crypto from 'crypto';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { InterviewEventRepository, InterviewMessageRepository, InterviewReportRepository, InterviewSessionRepository } from '../interview.repository';
import { broadcastSessionEvent } from '../realtime';
import { buildInterviewPlan, scoreAnswer } from '../plan';

const safeJson = value => {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value === 'string') {
        return value;
    }

    return JSON.stringify(value);
};

const parseMaybeJson = value => {
    if (!value) {
        return null;
    }

    if (typeof value === 'object') {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        return value;
    }
};

const resolveResumeText = async file => {
    if (!file?.path || !fs.existsSync(file.path)) {
        return '';
    }

    const buffer = fs.readFileSync(file.path);
    const parsed = await pdfParse(buffer);
    return (parsed.text || '').replace(/\s+/g, ' ').trim();
};

const buildAiReply = ({ session, userMessage, turnIndex }) => {
    const plan = session.interview_plan || {};
    const questions = Array.isArray(plan.questions) ? plan.questions : [];
    const nextQuestion = questions[turnIndex + 1] || questions[turnIndex] || 'Bạn có thể chia sẻ thêm một ví dụ cụ thể không?';
    const score = scoreAnswer({ questionIndex: turnIndex, answer: userMessage, plan });

    return {
        text: `Cảm ơn bạn. Điểm phản hồi cho câu vừa rồi hiện tại là ${score}/100. ${nextQuestion}`,
        score,
        questionIndex: Math.min(turnIndex + 1, Math.max(questions.length - 1, 0)),
    };
};

class Service {
    async createSessionFromResume({ candidate = {}, job = {}, analysis = {}, file }) {
        const resumeText = await resolveResumeText(file);
        const plan = buildInterviewPlan({ candidate, job, analysis, resumeText });
        const sessionKey = crypto.randomUUID();

        const [session] = await InterviewSessionRepository.createOne({
            session_key: sessionKey,
            candidate_snapshot: safeJson(candidate),
            job_snapshot: safeJson(job),
            analysis_snapshot: safeJson(analysis),
            interview_plan: safeJson(plan),
            resume_file: file?.path || null,
            resume_text: resumeText,
            status: 'active',
            current_question_index: 0,
            anti_cheat_score: 100,
            started_at: new Date(),
        });

        const [openingMessage] = await InterviewMessageRepository.createOne({
            session_id: session.id,
            sender: 'ai',
            text: plan.openingMessage,
            metadata: safeJson({ type: 'opening' }),
        });

        broadcastSessionEvent(session.id, {
            type: 'session.created',
            session,
            openingMessage,
        });

        return {
            sessionId: session.id,
            sessionKey: session.session_key,
            session,
            plan,
            openingMessage,
        };
    }

    async getSession(id) {
        const session = await InterviewSessionRepository.findById(id);
        if (!session) {
            throw new Error('Interview session not found');
        }

        const messages = await InterviewMessageRepository.listBySessionId(id);
        const events = await InterviewEventRepository.listBySessionId(id);
        const report = await InterviewReportRepository.query()
            .where('session_id', id)
            .whereNull('deleted_at')
            .first();

        return {
            ...session,
            candidate_snapshot: parseMaybeJson(session.candidate_snapshot),
            job_snapshot: parseMaybeJson(session.job_snapshot),
            analysis_snapshot: parseMaybeJson(session.analysis_snapshot),
            interview_plan: parseMaybeJson(session.interview_plan),
            messages: messages.map(message => ({
                ...message,
                metadata: parseMaybeJson(message.metadata),
            })),
            events: events.map(event => ({
                ...event,
                payload: parseMaybeJson(event.payload),
            })),
            report: report ? {
                ...report,
                report_payload: parseMaybeJson(report.report_payload),
                recommendations: parseMaybeJson(report.recommendations),
            } : null,
        };
    }

    async getHistory() {
        return InterviewSessionRepository.query()
            .whereNull('deleted_at')
            .orderBy('created_at', 'desc')
            .limit(50);
    }

    async sendTurn(sessionId, userMessage) {
        const session = await InterviewSessionRepository.findById(sessionId);
        if (!session) {
            throw new Error('Interview session not found');
        }

        const currentMessages = await InterviewMessageRepository.listBySessionId(sessionId);
        const turnIndex = currentMessages.filter(message => message.sender === 'user').length;

        const [userRecord] = await InterviewMessageRepository.createOne({
            session_id: sessionId,
            sender: 'user',
            text: userMessage,
            metadata: safeJson({ turnIndex }),
        });

        const aiReply = buildAiReply({ session, userMessage, turnIndex });
        const [aiRecord] = await InterviewMessageRepository.createOne({
            session_id: sessionId,
            sender: 'ai',
            text: aiReply.text,
            metadata: safeJson({
                turnIndex: aiReply.questionIndex,
                score: aiReply.score,
            }),
        });

        const updatedPlan = parseMaybeJson(session.interview_plan) || {};
        updatedPlan.currentQuestionIndex = aiReply.questionIndex;

        await InterviewSessionRepository.updateOne(sessionId, {
            current_question_index: aiReply.questionIndex,
            interview_plan: safeJson(updatedPlan),
        });

        broadcastSessionEvent(sessionId, {
            type: 'session.message',
            userMessage: userRecord,
            aiMessage: aiRecord,
        });

        return {
            userMessage: userRecord,
            aiMessage: aiRecord,
            score: aiReply.score,
            currentQuestionIndex: aiReply.questionIndex,
        };
    }

    async recordEvent(sessionId, payload) {
        const [event] = await InterviewEventRepository.createOne({
            session_id: sessionId,
            event_type: payload.eventType || payload.type || 'unknown',
            payload: safeJson(payload),
        });

        const session = await InterviewSessionRepository.findById(sessionId);
        if (session && /camera|tab|blur|focus|visibility|permission/i.test(event.event_type)) {
            const nextAntiCheat = Math.max(0, (session.anti_cheat_score ?? 100) - 5);
            await InterviewSessionRepository.updateOne(sessionId, {
                anti_cheat_score: nextAntiCheat,
            });
        }

        broadcastSessionEvent(sessionId, {
            type: 'session.event',
            event,
        });

        return event;
    }

    async finishSession(sessionId) {
        const session = await InterviewSessionRepository.findById(sessionId);
        if (!session) {
            throw new Error('Interview session not found');
        }

        const messages = await InterviewMessageRepository.listBySessionId(sessionId);
        const userMessages = messages.filter(message => message.sender === 'user');
        const aiMessages = messages.filter(message => message.sender === 'ai');
        const analysis = parseMaybeJson(session.analysis_snapshot) || {};
        const plan = parseMaybeJson(session.interview_plan) || {};

        const baseScore = analysis.final_matching_score ?? analysis.score ?? analysis.matching_score ?? 60;
        const answerLengthBonus = Math.min(15, userMessages.reduce((sum, message) => sum + (message.text || '').length / 40, 0));
        const engagementBonus = Math.min(10, aiMessages.length + userMessages.length);
        const antiCheatPenalty = Math.max(0, 100 - (session.anti_cheat_score ?? 100)) * 0.2;

        const finalScore = Math.max(0, Math.min(100, Math.round(baseScore + answerLengthBonus + engagementBonus - antiCheatPenalty)));

        const summary = `Buổi phỏng vấn cho ${plan.jobTitle || 'vị trí ứng tuyển'} đã hoàn tất với ${userMessages.length} lượt trả lời từ ứng viên.`;
        const recommendations = [
            ...(Array.isArray(plan.gaps) ? plan.gaps.slice(0, 3) : []),
            'Cần bổ sung phần phản hồi chi tiết từ AI model nếu muốn scoring chính xác hơn.',
        ];

        const reportPayload = {
            finalScore,
            answerCount: userMessages.length,
            aiTurnCount: aiMessages.length,
            antiCheatScore: session.anti_cheat_score ?? 100,
            summary,
            recommendations,
        };

        const [report] = await InterviewReportRepository.createOne({
            session_id: sessionId,
            score: finalScore,
            summary,
            report_payload: safeJson(reportPayload),
            recommendations: safeJson(recommendations),
        });

        await InterviewSessionRepository.updateOne(sessionId, {
            status: 'completed',
            score: finalScore,
            summary,
            completed_at: new Date(),
        });

        broadcastSessionEvent(sessionId, {
            type: 'session.completed',
            report,
        });

        return {
            report,
            reportPayload,
        };
    }
}

export const InterviewService = new Service();
