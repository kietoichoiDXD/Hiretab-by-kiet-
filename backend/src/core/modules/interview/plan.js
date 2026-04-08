const DEFAULT_QUESTION_COUNT = 5;

const KEYWORD_BANK = [
    { keyword: 'javascript', label: 'JavaScript' },
    { keyword: 'typescript', label: 'TypeScript' },
    { keyword: 'react', label: 'React' },
    { keyword: 'node', label: 'Node.js' },
    { keyword: 'express', label: 'Express' },
    { keyword: 'python', label: 'Python' },
    { keyword: 'postgres', label: 'PostgreSQL' },
    { keyword: 'sql', label: 'SQL' },
    { keyword: 'cloud', label: 'Cloud' },
    { keyword: 'aws', label: 'AWS' },
    { keyword: 'docker', label: 'Docker' },
    { keyword: 'kubernetes', label: 'Kubernetes' },
    { keyword: 'api', label: 'API' },
    { keyword: 'rest', label: 'REST' },
    { keyword: 'graphql', label: 'GraphQL' },
    { keyword: 'testing', label: 'Testing' },
    { keyword: 'lead', label: 'Leadership' },
    { keyword: 'team', label: 'Teamwork' },
];

export const extractKeywords = text => {
    const source = (text || '').toLowerCase();
    return KEYWORD_BANK
        .filter(item => source.includes(item.keyword))
        .map(item => item.label);
};

export const buildInterviewPlan = ({ candidate = {}, job = {}, analysis = {}, resumeText = '' }) => {
    const jobTitle = job.title || candidate.currentJobTitle || 'vị trí ứng tuyển';
    const keyStrengths = Array.isArray(analysis.key_strengths) ? analysis.key_strengths : [];
    const keyGaps = Array.isArray(analysis.key_gaps) ? analysis.key_gaps : [];
    const resumeKeywords = extractKeywords(resumeText).slice(0, 6);

    const questions = [
        `Hãy giới thiệu ngắn gọn về bản thân và lý do bạn ứng tuyển vị trí ${jobTitle}.`,
        keyGaps.length > 0
            ? `Bạn sẽ cải thiện những điểm sau như thế nào: ${keyGaps.slice(0, 3).join(', ')}?`
            : `Hãy kể về một thử thách lớn nhất bạn từng gặp trong công việc và cách bạn vượt qua nó.`,
        resumeKeywords.length > 0
            ? `Bạn đã áp dụng ${resumeKeywords.slice(0, 3).join(', ')} trong dự án thực tế như thế nào?`
            : 'Kỹ năng nào của bạn phù hợp nhất với yêu cầu công việc này?',
        `Nếu được nhận cho vị trí ${jobTitle}, 30 ngày đầu bạn sẽ ưu tiên điều gì?`,
        'Hãy mô tả một lần bạn làm việc với đội nhóm và xử lý xung đột hoặc áp lực tiến độ.',
    ].slice(0, DEFAULT_QUESTION_COUNT);

    return {
        jobTitle,
        candidateName: candidate.name || '',
        summary: `Phỏng vấn tự động cho ${jobTitle}. ${resumeKeywords.length > 0 ? `Phát hiện các từ khóa: ${resumeKeywords.join(', ')}.` : 'Chưa có nhiều từ khóa nổi bật từ CV.'}`,
        openingMessage: candidate.name
            ? `Xin chào ${candidate.name}! Tôi đã nhận được CV của bạn cho vị trí ${jobTitle}. Hãy bắt đầu buổi phỏng vấn tự động nhé.`
            : `Xin chào! Tôi đã nhận được CV của bạn cho vị trí ${jobTitle}. Hãy bắt đầu buổi phỏng vấn tự động nhé.`,
        questions,
        strengths: keyStrengths.slice(0, 5),
        gaps: keyGaps.slice(0, 5),
        resumeKeywords,
    };
};

export const scoreAnswer = ({ questionIndex = 0, answer = '', plan }) => {
    const normalizedAnswer = (answer || '').trim();
    const baseScore = normalizedAnswer.length >= 40 ? 65 : normalizedAnswer.length >= 20 ? 50 : 30;
    const keywordBonus = (plan.resumeKeywords || []).reduce((score, keyword) => {
        return normalizedAnswer.toLowerCase().includes(keyword.toLowerCase()) ? score + 6 : score;
    }, 0);
    const structureBonus = /\b(vì|bởi vì|tôi đã|tôi từng|kết quả|thành quả|doanh thu|team|project|dự án)\b/i.test(normalizedAnswer)
        ? 10
        : 0;
    const questionPenalty = questionIndex === 0 ? 0 : Math.min(questionIndex * 2, 8);

    return Math.max(0, Math.min(100, baseScore + keywordBonus + structureBonus - questionPenalty));
};
