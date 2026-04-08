import { WebSocket, WebSocketServer } from 'ws';

let websocketServer = null;
const sessionClients = new Map();

const safeJson = payload => {
    try {
        return JSON.stringify(payload);
    } catch (error) {
        return JSON.stringify({ type: 'error', message: 'Unable to serialize payload' });
    }
};

export const createInterviewRealtime = server => {
    if (websocketServer) {
        return websocketServer;
    }

    websocketServer = new WebSocketServer({ server, path: '/interview-ws' });

    websocketServer.on('connection', socket => {
        let currentSessionId = null;

        socket.on('message', rawMessage => {
            try {
                const message = JSON.parse(rawMessage.toString());

                if (message.type === 'subscribe' && message.sessionId) {
                    currentSessionId = String(message.sessionId);
                    if (!sessionClients.has(currentSessionId)) {
                        sessionClients.set(currentSessionId, new Set());
                    }
                    sessionClients.get(currentSessionId).add(socket);
                    socket.send(safeJson({ type: 'subscribed', sessionId: currentSessionId }));
                }

                if (message.type === 'ping') {
                    socket.send(safeJson({ type: 'pong', at: new Date().toISOString() }));
                }
            } catch (error) {
                socket.send(safeJson({ type: 'error', message: error.message }));
            }
        });

        socket.on('close', () => {
            if (currentSessionId && sessionClients.has(currentSessionId)) {
                sessionClients.get(currentSessionId).delete(socket);
                if (sessionClients.get(currentSessionId).size === 0) {
                    sessionClients.delete(currentSessionId);
                }
            }
        });
    });

    return websocketServer;
};

export const broadcastSessionEvent = (sessionId, payload) => {
    const clients = sessionClients.get(String(sessionId));
    if (!clients || clients.size === 0) {
        return;
    }

    const message = safeJson({
        type: 'session-event',
        sessionId: String(sessionId),
        payload,
    });

    clients.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        }
    });
};
