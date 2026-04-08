import React, { useState, useRef, useEffect } from 'react';
import { lipsyncManager } from '../App';
import { VISEMES } from 'wawa-lipsync';
import * as THREE from 'three';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useLocation } from 'react-router-dom';
import { interviewApi } from '@/core/services/interview.service';
import Logo from './Logo';

const AUTO_INTERVIEW_STORAGE_KEY = 'hiretab-auto-interview-context';

const getStoredAutoInterviewContext = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const rawContext = window.sessionStorage.getItem(AUTO_INTERVIEW_STORAGE_KEY);
        if (!rawContext) {
            return null;
        }

        return JSON.parse(rawContext);
    } catch (error) {
        console.warn('Unable to load auto interview context:', error);
        return null;
    }
};

const buildInitialInterviewContext = () => {
    const storedContext = getStoredAutoInterviewContext();

    if (!storedContext) {
        return {
            candidateName: '',
            position: '',
            experience: '',
            skills: [],
            keyGaps: [],
            currentTopic: 'introduction'
        };
    }

    const analysis = storedContext.analysis || {};
    const candidate = storedContext.candidate || {};
    const job = storedContext.job || {};

    const matchingScore =
        analysis?.final_matching_score ??
        analysis?.finalAssessment?.final_matching_score ??
        analysis?.score ??
        analysis?.matching_score ??
        '';

    const keyStrengths = Array.isArray(analysis?.key_strengths) ? analysis.key_strengths : [];
    const keyGaps = Array.isArray(analysis?.key_gaps) ? analysis.key_gaps : [];

    return {
        candidateName: candidate.name || '',
        position: job.title || candidate.currentJobTitle || '',
        experience: matchingScore ? `${matchingScore}` : '',
        skills: keyStrengths.slice(0, 5),
        keyGaps,
        currentTopic: 'introduction'
    };
};

const buildInitialMessages = context => {
    if (context.openingMessage) {
        return [
            {
                id: 1,
                sender: 'ai',
                text: context.openingMessage,
                timestamp: new Date(),
            }
        ];
    }

    if (!context.position) {
        return [
            {
                id: 1,
                sender: 'ai',
                text: 'Xin chào! Tôi là AI Interview Assistant. Hãy bắt đầu cuộc phỏng vấn nhé!',
                timestamp: new Date()
            }
        ];
    }

    const greeting = context.candidateName ? `Xin chào ${context.candidateName}!` : 'Xin chào!';
    const scoreText = context.experience
        ? `Dựa trên CV của bạn, mức độ phù hợp sơ bộ hiện tại là ${context.experience}/100.`
        : 'Tôi đã nhận được CV của bạn và sẽ phỏng vấn dựa trên vị trí đã ứng tuyển.';
    const questionText = context.keyGaps && context.keyGaps.length > 0
        ? `Câu hỏi đầu tiên: hãy kể về một kinh nghiệm hoặc dự án giúp bạn cải thiện các điểm sau: ${context.keyGaps.slice(0, 3).join(', ')}.`
        : `Câu hỏi đầu tiên: hãy giới thiệu ngắn gọn về bản thân và lý do bạn ứng tuyển vị trí ${context.position}.`;

    return [
        {
            id: 1,
            sender: 'ai',
            text: `${greeting} Đây là buổi phỏng vấn tự động cho vị trí ${context.position}. ${scoreText} ${questionText}`,
            timestamp: new Date()
        }
    ];
};

const ChatInterview = () => {
    const location = useLocation();
    const initialInterviewContext = buildInitialInterviewContext();

    // Chat states
    const [messages, setMessages] = useState(() => buildInitialMessages(initialInterviewContext));
    const [currentMessage, setCurrentMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Speech states
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useState('vi-VN');
    const [webSpeechSupported, setWebSpeechSupported] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState('');
    const [speechRate, setSpeechRate] = useState(0.9);
    const [speechPitch, setSpeechPitch] = useState(1.0);
    const [speechVolume, setSpeechVolume] = useState(1.0);
    const [sessionId, setSessionId] = useState(() => {
        if (typeof window === 'undefined') {
            return initialInterviewContext.sessionId || '';
        }

        const urlSessionId = new URLSearchParams(window.location.search).get('sessionId');
        const storedContext = getStoredAutoInterviewContext();
        return urlSessionId || storedContext?.sessionId || '';
    });

    // Refs
    const speechRecognitionRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const speechUtteranceRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fakeLipsyncRef = useRef(null);
    const websocketRef = useRef(null);

    // Interview context state
    const [interviewContext, setInterviewContext] = useState(initialInterviewContext);

    // Language options
    const languageOptions = [
        { code: 'vi-VN', name: 'Tiếng Việt' },
        { code: 'en-US', name: 'English (US)' },
        { code: 'en-GB', name: 'English (UK)' },
    ];

    // Load available voices
    useEffect(() => {
        const updateVoices = () => {
            const availableVoices = speechSynthesis.getVoices();
            setVoices(availableVoices);

            if (availableVoices.length > 0 && !selectedVoice) {
                const vietnameseVoice = availableVoices.find(voice =>
                    voice.lang === 'vi-VN' || voice.lang.startsWith('vi')
                );
                const defaultVoice = vietnameseVoice || availableVoices.find(voice => voice.default) || availableVoices[0];
                setSelectedVoice(defaultVoice.name);
            }
        };

        updateVoices();
        speechSynthesis.addEventListener('voiceschanged', updateVoices);

        return () => {
            speechSynthesis.removeEventListener('voiceschanged', updateVoices);
        };
    }, [selectedVoice]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const urlSessionId = searchParams.get('sessionId');

        if (urlSessionId && urlSessionId !== sessionId) {
            setSessionId(urlSessionId);
        }
    }, [location.search, sessionId]);

    useEffect(() => {
        if (!sessionId) {
            return;
        }

        let cancelled = false;

        const hydrateSession = async () => {
            try {
                const sessionData = await interviewApi.getSession(sessionId);

                if (cancelled || !sessionData) {
                    return;
                }

                const plan = sessionData.interview_plan || {};
                const candidate = sessionData.candidate_snapshot || {};
                const job = sessionData.job_snapshot || {};
                const analysis = sessionData.analysis_snapshot || {};
                const matchingScore =
                    analysis?.final_matching_score ??
                    analysis?.finalAssessment?.final_matching_score ??
                    analysis?.score ??
                    analysis?.matching_score ??
                    '';

                const hydratedContext = {
                    candidateName: candidate.name || '',
                    position: job.title || candidate.currentJobTitle || '',
                    experience: matchingScore ? `${matchingScore}` : '',
                    skills: Array.isArray(plan.strengths) ? plan.strengths.slice(0, 5) : [],
                    keyGaps: Array.isArray(plan.gaps) ? plan.gaps.slice(0, 5) : [],
                    currentTopic: 'introduction',
                    sessionId,
                    openingMessage: plan.openingMessage || '',
                };

                setInterviewContext(hydratedContext);

                if (Array.isArray(sessionData.messages) && sessionData.messages.length > 0) {
                    setMessages(
                        sessionData.messages.map(message => ({
                            id: message.id,
                            sender: message.sender,
                            text: message.text,
                            timestamp: message.created_at ? new Date(message.created_at) : new Date(),
                        }))
                    );
                } else {
                    setMessages(buildInitialMessages(hydratedContext));
                }
            } catch (error) {
                console.warn('Unable to hydrate interview session from backend:', error);
            }
        };

        hydrateSession();

        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId || typeof window === 'undefined' || typeof window.WebSocket === 'undefined') {
            return undefined;
        }

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${wsProtocol}//${window.location.host}/interview-ws`);
        websocketRef.current = socket;

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'subscribe',
                sessionId,
            }));
        };

        socket.onmessage = event => {
            try {
                const payload = JSON.parse(event.data);

                if (payload.type === 'session.completed' && payload.payload?.report?.score !== undefined) {
                    setInterviewContext(prev => ({
                        ...prev,
                        currentTopic: 'completed',
                    }));
                }
            } catch (error) {
                console.warn('Unable to parse websocket payload:', error);
            }
        };

        socket.onerror = error => {
            console.warn('Interview websocket error:', error);
        };

        return () => {
            socket.close();
            websocketRef.current = null;
        };
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId) {
            return undefined;
        }

        const emitEvent = eventType => {
            interviewApi.recordEvent(sessionId, {
                eventType,
                at: new Date().toISOString(),
            }).catch(error => console.warn('Failed to record interview event:', error));
        };

        const onVisibilityChange = () => {
            emitEvent(document.hidden ? 'tab-hidden' : 'tab-visible');
        };

        const onBlur = () => emitEvent('window-blur');
        const onFocus = () => emitEvent('window-focus');

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onBlur);
        window.addEventListener('focus', onFocus);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', onBlur);
            window.removeEventListener('focus', onFocus);
        };
    }, [sessionId]);

    // Check Web Speech API support
    useEffect(() => {
        const checkWebSpeechSupport = () => {
            setWebSpeechSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
        };
        checkWebSpeechSupport();
    }, []);

    // Auto scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Format recording time
    const formatRecordingTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Start recording voice
    const startRecording = async () => {
        if (!webSpeechSupported) {
            alert('Trình duyệt không hỗ trợ Speech Recognition API');
            return;
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = selectedLanguage;

            let finalTranscript = '';
            let interimTranscript = '';

            recognition.onstart = () => {
                setIsRecording(true);
                setRecordingTime(0);
                console.log('🎤 Bắt đầu ghi âm...');

                recordingTimerRef.current = setInterval(() => {
                    setRecordingTime(prev => prev + 1);
                }, 1000);
            };

            recognition.onresult = (event) => {
                interimTranscript = '';
                finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                const displayText = finalTranscript + interimTranscript;
                setCurrentMessage(displayText);
                console.log('🎯 Speech result:', displayText);
            };

            recognition.onerror = (event) => {
                console.error('❌ Speech recognition error:', event.error);
                setIsRecording(false);
                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                }
            };

            recognition.onend = () => {
                console.log('⏹️ Speech recognition ended');
                setIsRecording(false);
                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                }
            };

            speechRecognitionRef.current = recognition;
            recognition.start();
        } catch (error) {
            console.error('❌ Error starting speech recognition:', error);
            setIsRecording(false);
        }
    };

    // Stop recording
    const stopRecording = () => {
        if (speechRecognitionRef.current) {
            speechRecognitionRef.current.stop();
            speechRecognitionRef.current = null;
        }

        setIsRecording(false);

        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        console.log('⏹️ Dừng ghi âm');
    };

    // Call N8N webhook directly with messageToProcess
    const callN8nWebhook = async (messageToProcess) => {
        try {
            console.log('🔗 Gọi N8N webhook trực tiếp với message:', messageToProcess);

            const response = await fetch('https://carreer-path.app.n8n.cloud/webhook-test/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messageToProcess: messageToProcess,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ N8N direct response:', data);

            return data;
        } catch (error) {
            console.error('❌ Error calling N8N webhook directly:', error);
            throw error;
        }
    };

    // Send message to webhook
    const sendToGemini = async (userMessage) => {
        try {
            setIsProcessing(true);

            if (sessionId) {
                const backendResult = await interviewApi.sendTurn(sessionId, userMessage, {
                    interviewContext,
                    conversationHistory: messages.slice(-3).map(message => ({
                        sender: message.sender,
                        text: message.text,
                    })),
                });

                if (backendResult?.aiMessage?.text) {
                    return backendResult.aiMessage.text;
                }

                if (backendResult?.aiMessage?.message) {
                    return backendResult.aiMessage.message;
                }
            }

            // Prepare interview context data
            // const webhookPayload = {
            //     userMessage: userMessage,
            //     candidateName: interviewContext.candidateName || 'chưa biết',
            //     position: interviewContext.position || 'chưa biết',
            //     experience: interviewContext.experience || 'chưa biết',
            //     currentTopic: interviewContext.currentTopic,
            //     conversationHistory: messages.slice(-3).map(m => ({
            //         sender: m.sender,
            //         text: m.text
            //     }))
            // };

            // console.log('📤 Gửi yêu cầu đến backend:', webhookPayload);

            // Option 1: Dùng mock webhook (testing, không cần n8n)
            const useMockWebhook = false;
            const useDirectN8n = true;

            // Auto-detect backend URL
            let backendUrl;
            if (useDirectN8n) {
                backendUrl = 'https://carreer-path.app.n8n.cloud/webhook/send';
            }
            // else if (useMockWebhook) {
            //     backendUrl = 'http://localhost:3000/call-n8n-mock';
            // } else {
            //     backendUrl = window.location.hostname === 'localhost'
            //         ? 'http://localhost:3000/call-n8n'
            //         : 'https://interview-backend-proxy.onrender.com/call-n8n';
            // }

            console.log(`📡 Using endpoint: ${backendUrl}`);
            console.log(`📡 Using userMessage: ${userMessage}`);
            // Send to backend proxy or N8N directly
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userMessage: userMessage,
                    interviewContext,
                    conversationHistory: messages.slice(-3).map(message => ({
                        sender: message.sender,
                        text: message.text,
                    }))
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Backend response:', data);

            // Extract AI response from backend response
            const aiResponse = data.output ||
                'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.';

            return aiResponse;
        } catch (error) {
            console.error('❌ Error calling webhook:', error);

            // Fallback response if API fails
            const fallbackResponses = interviewContext.position
                ? [
                    `Cảm ơn bạn đã chia sẻ. Hãy nói rõ hơn về kinh nghiệm liên quan trực tiếp tới vị trí ${interviewContext.position} nhé?`,
                    `Rất thú vị. Kỹ năng nào của bạn sẽ giúp bạn làm tốt nhất ở vị trí ${interviewContext.position}?`,
                    `Bạn có thể mô tả một dự án hoặc tình huống mà bạn đã xử lý tương tự với công việc này không?`,
                    `Nếu được chọn cho vị trí ${interviewContext.position}, bạn sẽ ưu tiên học thêm điều gì trong 3 tháng đầu tiên?`,
                    `Tôi hiểu rồi. Hãy kể thêm về cách bạn phối hợp với team trong những dự án trước đây nhé?`
                ]
                : [
                    `Cảm ơn bạn đã chia sẻ! Tôi hiểu rồi. Hãy kể thêm về kinh nghiệm làm việc của bạn nhé?`,
                    `Rất thú vị! Bạn có thể chia sẻ về kỹ năng mạnh nhất của mình không?`,
                    `Tuyệt vời! Tại sao bạn quan tâm đến vị trí này?`,
                    `Cảm ơn bạn! Bạn có thể kể về một dự án mà bạn tự hào nhất không?`,
                    `Tôi hiểu rồi. Bạn mong muốn phát triển như thế nào trong tương lai?`
                ];

            const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
            return randomResponse;
        } finally {
            setIsProcessing(false);
        }
    };

    // Speak text with lip sync
    const speakText = async (text) => {
        if (!text.trim()) return;

        try {
            setIsSpeaking(true);
            console.log('🎤 Bắt đầu synthesis cho:', text.substring(0, 50) + '...');

            // Debug: Kiểm tra lipsyncManager (same as TextToSpeech)
            console.log('🔍 Kiểm tra lipsyncManager:', {
                exists: !!lipsyncManager,
                type: typeof lipsyncManager,
                viseme: lipsyncManager?.viseme,
                features: !!lipsyncManager?.features,
                processAudio: typeof lipsyncManager?.processAudio
            });

            // Stop any current speech
            speechSynthesis.cancel();

            // Stop any existing fake lipsync
            if (fakeLipsyncRef.current) {
                clearInterval(fakeLipsyncRef.current);
                fakeLipsyncRef.current = null;
            }

            // Create speech utterance
            const utterance = new SpeechSynthesisUtterance(text);

            // Find selected voice
            const voice = voices.find(v => v.name === selectedVoice);
            if (voice) {
                utterance.voice = voice;
            }

            utterance.rate = speechRate;
            utterance.pitch = speechPitch;
            utterance.volume = speechVolume;

            utterance.onstart = () => {
                console.log('🔊 Speech synthesis started');
                console.log('ℹ️ Fake lipsync đã được khởi tạo trước đó');
            };

            utterance.onend = () => {
                console.log('✅ Speech synthesis completed');
                setIsSpeaking(false);
                // Stop fake lipsync when speech ends
                if (fakeLipsyncRef.current) {
                    clearInterval(fakeLipsyncRef.current);
                    fakeLipsyncRef.current = null;
                }
                if (lipsyncManager) {
                    lipsyncManager.viseme = VISEMES.sil;
                }
            };

            utterance.onerror = (event) => {
                console.error('❌ Speech synthesis error:', event.error);
                setIsSpeaking(false);
                stopDirectVisemeUpdate();
            };

            speechUtteranceRef.current = utterance;
            speechSynthesis.speak(utterance);

            // Start direct viseme update immediately (AFTER speak, not in onstart)
            console.log('🎯 Bắt đầu direct viseme update ngay lập tức...');
            startDirectVisemeUpdate(text, speechRate);

        } catch (error) {
            console.error('❌ Error in speech synthesis:', error);
            setIsSpeaking(false);
            stopDirectVisemeUpdate();
        }
    };

    // Simple direct viseme update for lip sync (using TextToSpeech logic)
    const startDirectVisemeUpdate = (textContent, speechRate) => {
        if (!lipsyncManager) {
            console.warn('⚠️ lipsyncManager không khả dụng');
            return;
        }

        console.log('🎯 Bắt đầu direct viseme update cho:', textContent.substring(0, 50) + '...');

        // Create word sequence like TextToSpeech
        const words = textContent.split(/[\s.,!?;:-]+/).filter(word => word.length > 0);
        console.log(`📝 Direct update cho ${words.length} từ:`, words);

        const wordDuration = Math.max(600, (60 / (speechRate * 100)) * 1000); // Adaptive duration
        const pauseDuration = 150; // Pause between words

        // Clear any existing interval
        if (fakeLipsyncRef.current) {
            clearInterval(fakeLipsyncRef.current);
            fakeLipsyncRef.current = null;
        }

        let wordIndex = 0;

        const updateViseme = () => {
            // Check if we've gone through all words
            if (wordIndex >= words.length) {
                console.log('✅ Direct viseme update hoàn thành');
                // Don't clear interval yet - let speech finish naturally
                return;
            }

            const word = words[wordIndex].toLowerCase();
            const firstChar = word[0];
            let viseme = VISEMES.aa; // Default

            // Map character to viseme (same logic as TextToSpeech)
            if ('aáàảãạăắằẳẵặâấầẩẫậ'.includes(firstChar)) {
                viseme = VISEMES.aa;
            } else if ('eéèẻẽẹêếềểễệ'.includes(firstChar)) {
                viseme = VISEMES.E;
            } else if ('iíìỉĩị'.includes(firstChar)) {
                viseme = VISEMES.I;
            } else if ('oóòỏõọôốồổỗộơớờởỡợ'.includes(firstChar)) {
                viseme = VISEMES.O;
            } else if ('uúùủũụưứừửữự'.includes(firstChar)) {
                viseme = VISEMES.U;
            } else if ('bpmw'.includes(firstChar)) {
                viseme = VISEMES.PP;
            } else if ('fv'.includes(firstChar)) {
                viseme = VISEMES.FF;
            } else if ('dt'.includes(firstChar)) {
                viseme = VISEMES.DD;
            } else if ('kgc'.includes(firstChar)) {
                viseme = VISEMES.kk;
            } else if ('sz'.includes(firstChar)) {
                viseme = VISEMES.SS;
            } else if ('n'.includes(firstChar)) {
                viseme = VISEMES.nn;
            } else if ('rlx'.includes(firstChar)) {
                viseme = VISEMES.RR;
            } else if ('jy'.includes(firstChar)) {
                viseme = VISEMES.CH;
            }

            // DIRECT UPDATE - set viseme only
            lipsyncManager.viseme = viseme;

            console.log(`🎯 DIRECT [${wordIndex}/${words.length}]: "${word}" [${firstChar}] → ${viseme}`);

            wordIndex++;
        };

        // Start immediately with first word
        updateViseme();

        // Continue with interval for remaining words
        fakeLipsyncRef.current = setInterval(updateViseme, wordDuration + pauseDuration);
    };

    // Stop lip sync
    const stopDirectVisemeUpdate = () => {
        if (fakeLipsyncRef.current) {
            clearInterval(fakeLipsyncRef.current);
            fakeLipsyncRef.current = null;
        }

        if (lipsyncManager) {
            lipsyncManager.viseme = VISEMES.sil;
            if (lipsyncManager.features) {
                lipsyncManager.features.volume = 0;
            }
            console.log('🔇 Dừng fake lipsync - Đặt về silence');
        }
    };

    // Send message
    const sendMessage = async () => {
        if (!currentMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            sender: 'user',
            text: currentMessage.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const messageToProcess = currentMessage.trim();
        setCurrentMessage('');

        // Update interview context based on user message
        updateInterviewContext(messageToProcess);

        // Get AI response
        const aiResponse = await sendToGemini(messageToProcess);

        const aiMessage = {
            id: Date.now() + 1,
            sender: 'ai',
            text: aiResponse,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);

        // Speak AI response
        await speakText(aiResponse);
    };

    // Update interview context
    const updateInterviewContext = (message) => {
        const lowerMessage = message.toLowerCase();

        // Extract name
        if (lowerMessage.includes('tên') && lowerMessage.includes('tôi là')) {
            const nameMatch = message.match(/tôi là\s+([^.!?]+)/i);
            if (nameMatch) {
                setInterviewContext(prev => ({ ...prev, candidateName: nameMatch[1].trim() }));
            }
        }

        // Extract position
        if (lowerMessage.includes('vị trí') || lowerMessage.includes('công việc')) {
            setInterviewContext(prev => ({ ...prev, currentTopic: 'position' }));
        }

        // Extract experience
        if (lowerMessage.includes('kinh nghiệm') || lowerMessage.includes('năm')) {
            setInterviewContext(prev => ({ ...prev, currentTopic: 'experience' }));
        }
    };

    // Stop speech
    const stopSpeech = () => {
        speechSynthesis.cancel();
        setIsSpeaking(false);
        stopDirectVisemeUpdate();
    };

    const finishInterview = async () => {
        if (!sessionId) {
            return;
        }

        try {
            const result = await interviewApi.finishSession(sessionId);
            const reportPayload = result?.reportPayload || {};
            const finalScore = result?.report?.score ?? reportPayload.finalScore ?? interviewContext.experience ?? 0;

            setInterviewContext(prev => ({
                ...prev,
                currentTopic: 'completed',
            }));

            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'ai',
                text: `Buổi phỏng vấn đã kết thúc. Điểm cuối cùng là ${finalScore}/100. Bạn có thể xem report trong backend session.`,
                timestamp: new Date(),
            }]);
        } catch (error) {
            console.warn('Unable to finish interview session:', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto max-h-96">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-800'
                                    }`}
                            >
                                <p className="text-sm">{message.text}</p>
                                <p className="text-xs opacity-70 mt-1">
                                    {message.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* Voice Controls */}
            <div className="border-t p-4 bg-gray-50">
                {/* Speech Settings */}
                <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="p-1 border rounded text-xs"
                        disabled={isRecording}
                    >
                        {languageOptions.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="p-1 border rounded text-xs"
                        disabled={isSpeaking}
                    >
                        {voices.map((voice) => (
                            <option key={voice.name} value={voice.name}>
                                {voice.name.substring(0, 20)}...
                            </option>
                        ))}
                    </select>
                    <div className="text-center">
                        <span>Tốc độ: {speechRate}</span>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={speechRate}
                            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>
                    <div className="text-center">
                        <span>Âm lượng: {speechVolume}</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={speechVolume}
                            onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Recording Status */}
                {isRecording && (
                    <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded flex items-center space-x-2">
                        <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-600">
                            🎤 Đang nghe: {formatRecordingTime(recordingTime)}
                        </span>
                    </div>
                )}

                {/* Speaking Status */}
                {isSpeaking && (
                    <div className="mb-2 p-2 bg-green-100 border border-green-300 rounded flex items-center space-x-2">
                        <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-600">
                            🔊 AI đang phản hồi...
                        </span>
                    </div>
                )}

                {/* Message Input */}
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Nhập tin nhắn hoặc sử dụng giọng nói..."
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        disabled={isProcessing}
                    />

                    {/* Voice Button */}
                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            disabled={!webSpeechSupported || isProcessing}
                            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                        >
                            🎤
                        </button>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            ⏹️
                        </button>
                    )}

                    {/* Send Button */}
                    <button
                        onClick={sendMessage}
                        disabled={!currentMessage.trim() || isProcessing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        📤
                    </button>

                    {/* Stop Speech Button */}
                    {isSpeaking && (
                        <button
                            onClick={stopSpeech}
                            className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                            🔇
                        </button>
                    )}

                    {sessionId && (
                        <button
                            onClick={finishInterview}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                            ✅ Kết thúc
                        </button>
                    )}
                </div>

                {/* Status Info */}
                <div className="mt-2 text-xs text-gray-600 flex justify-between">
                    <span>🤖 Web Speech: {webSpeechSupported ? '✅' : '❌'}</span>
                    <span>💬 Chủ đề: {interviewContext.currentTopic}</span>
                    <span>👤 Ứng viên: {interviewContext.candidateName || 'Chưa biết'}</span>
                </div>
            </div>
        </div>
    );
};

export default ChatInterview;
