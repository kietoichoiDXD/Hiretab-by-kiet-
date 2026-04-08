import React from 'react';
import { Loader } from "@react-three/drei";
import { Lipsync } from "wawa-lipsync";
import { UI } from "./components/UI";
import { UserCamera } from "./components/UserCamera";

// Initialize the lipsync manager
export const lipsyncManager = new Lipsync({});

export default function AIInterview() {
    return (
        <>
            <Loader />
            <UI />
            <UserCamera />
        </>
    );
}
