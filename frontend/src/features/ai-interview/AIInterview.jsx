import React from 'react';
import { Loader } from "@react-three/drei";
import { Lipsync } from "wawa-lipsync";
import { UI } from "./components/UI";
import { UserCamera } from "./components/UserCamera";
import { useLocation } from 'react-router-dom';
import { interviewApi } from '@/core/services/interview.service';

// Initialize the lipsync manager
export const lipsyncManager = new Lipsync({});

export default function AIInterview() {
    const location = useLocation();
    const sessionId = new URLSearchParams(location.search).get('sessionId');

    const handleCameraStatusChange = event => {
        if (!sessionId) {
            return;
        }

        interviewApi.recordEvent(sessionId, event).catch(error => {
            console.warn('Unable to persist camera event:', error);
        });
    };

    return (
        <>
            <Loader />
            <UI />
            <UserCamera onStatusChange={handleCameraStatusChange} />
        </>
    );
}
