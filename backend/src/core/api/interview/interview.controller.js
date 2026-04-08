import { ValidHttpResponse } from '../../../packages/handler/response/validHttp.response';
import { InterviewService } from 'core/modules/interview';

const parseJsonField = value => {
    if (!value) {
        return {};
    }

    if (typeof value === 'object') {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        return {};
    }
};

class Controller {
    constructor() {
        this.service = InterviewService;
    }

    createSessionFromResume = async req => {
        const candidate = parseJsonField(req.body.candidate);
        const job = parseJsonField(req.body.job);
        const analysis = parseJsonField(req.body.analysis);

        const data = await this.service.createSessionFromResume({
            candidate,
            job,
            analysis,
            file: req.file,
        });

        return ValidHttpResponse.toCreatedResponse(data);
    };

    getSession = async req => {
        const data = await this.service.getSession(req.params.id);
        return ValidHttpResponse.toOkResponse(data);
    };

    getHistory = async () => {
        const data = await this.service.getHistory();
        return ValidHttpResponse.toOkResponse(data);
    };

    sendTurn = async req => {
        const message = req.body.message || req.body.userMessage;
        const data = await this.service.sendTurn(req.params.id, message);
        return ValidHttpResponse.toOkResponse(data);
    };

    recordEvent = async req => {
        const data = await this.service.recordEvent(req.params.id, req.body);
        return ValidHttpResponse.toOkResponse(data);
    };

    finishSession = async req => {
        const data = await this.service.finishSession(req.params.id);
        return ValidHttpResponse.toOkResponse(data);
    };
}

export const InterviewController = new Controller();
