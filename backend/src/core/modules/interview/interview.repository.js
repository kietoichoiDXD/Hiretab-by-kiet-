import { DataRepository } from 'packages/restBuilder/core/dataHandler';

class Repository extends DataRepository {
    constructor(tableName) {
        super(tableName);
    }

    createOne(payload) {
        return this.query().insert(payload).returning('*');
    }

    updateOne(id, payload) {
        return this.query()
            .where('id', id)
            .update({
                ...payload,
                updated_at: new Date(),
            })
            .returning('*');
    }

    findById(id) {
        return this.query()
            .where('id', id)
            .whereNull('deleted_at')
            .first();
    }

    listBySessionId(sessionId) {
        return this.query()
            .where('session_id', sessionId)
            .whereNull('deleted_at')
            .orderBy('created_at', 'asc');
    }
}

export const InterviewSessionRepository = new Repository('interview_sessions');
export const InterviewMessageRepository = new Repository('interview_session_messages');
export const InterviewEventRepository = new Repository('interview_session_events');
export const InterviewReportRepository = new Repository('interview_session_reports');
