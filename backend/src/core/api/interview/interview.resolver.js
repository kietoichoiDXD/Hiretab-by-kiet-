import { Module } from 'packages/handler/Module';
import { InterviewController } from './interview.controller';
import { ResumePdfInterceptor } from 'core/modules/interview';

export const InterviewResolver = Module.builder()
    .addPrefix({
        prefixPath: '/interview-sessions',
        tag: 'interview-sessions',
        module: 'InterviewModule',
    })
    .register([
        {
            route: '/from-resume',
            method: 'post',
            interceptors: [ResumePdfInterceptor],
            controller: InterviewController.createSessionFromResume,
            preAuthorization: true,
        },
        {
            route: '/history',
            method: 'get',
            controller: InterviewController.getHistory,
        },
        {
            route: '/:id',
            method: 'get',
            controller: InterviewController.getSession,
        },
        {
            route: '/:id/turn',
            method: 'post',
            controller: InterviewController.sendTurn,
            preAuthorization: true,
        },
        {
            route: '/:id/events',
            method: 'post',
            controller: InterviewController.recordEvent,
            preAuthorization: true,
        },
        {
            route: '/:id/finish',
            method: 'post',
            controller: InterviewController.finishSession,
            preAuthorization: true,
        },
    ]);
