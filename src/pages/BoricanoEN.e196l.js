// Código para la PÁGINA "BoricanoEN.js" en Wix (Frontend Velo)

// --- IMPORTACIONES (CORREGIDO) ---
import { startAssistantRun, getAssistantRunResult } from 'backend/openaiHandler';
import { enviarEmailAlHuesped, enviarEmail } from 'backend/email';
import { generateAudio } from 'backend/ttsHandler';

// --- CONFIGURACIÓN DE TEMPORIZADORES ---
const INACTIVITY_WARNING_DURATION = 2 * 60 * 1000;
const INACTIVITY_CLOSE_DURATION_AFTER_WARNING = 1 * 60 * 1000;
const INITIAL_AUTO_CLOSE_DURATION = 1 * 60 * 1000;

// --- VARIABLES DE ESTADO ---
let activityWarningTimeoutId;
let activityCloseTimeoutId;
let initialAutoCloseTimeoutId;
let lastBotResponse = "";
let chatTranscript = [];
let hasUserInteractedInitially = false;
let currentSessionState = { threadId: null };
let pollingInterval = null; // Para controlar el ciclo de polling
let lastMapLink = "";

function prepareTextForTTS(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/https?:\/\/\S+/g, '')
        .replace(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/g, '')
        .trim();
}

// --- MANEJO DE LA PÁGINA ---
$w.onReady(() => {
    console.log("🔥 BoricanoEN page ready. Setting up iFrame communication.");
    const iFrameElement = $w("#html1");
    iFrameElement.scrolling = "no";

    resetChatSessionState();
    startInitialAutoCloseTimer(iFrameElement);

    iFrameElement.onMessage(async (event) => {
        if (!event || !event.data) {
            console.warn("⚠️ EN: Received empty or invalid event data from iFrame:", event);
            return;
        }
        const messageFromIframe = event.data;

        if (typeof messageFromIframe === 'string') {
            console.log("💬 EN: User sent a message string.");
            handleUserActivity(iFrameElement);
            await processUserChatMessage(messageFromIframe, iFrameElement);

        } else if (messageFromIframe && typeof messageFromIframe.type !== 'undefined') {
            switch (messageFromIframe.type) {
                case 'chatInitialized':
                    console.log("🚀 EN: iFrame chat UI initialized.");
                    break;
                case 'userInputFocus':
                    console.log("⌨️ EN: User focused on input. Handling activity.");
                    handleUserActivity(iFrameElement);
                    break;
                case 'sendToGuest':
                    console.log("📧 EN: Received 'sendToGuest' request.");
                    handleUserActivity(iFrameElement);
                    if (lastBotResponse) {
                        try {
                            await enviarEmailAlHuesped(messageFromIframe.email, lastBotResponse);
                            const successMsg = messageFromIframe.language === 'es' ?
                                "✅ ¡Email enviado con éxito!" : "✅ Email sent successfully!";
                            iFrameElement.postMessage({ type: 'botMessage', text: successMsg });
                        } catch (err) {
                            console.error("🛑 EN: Error in enviarEmailAlHuesped:", err);
                            const errorMsg = messageFromIframe.language === 'es' ?
                                "❌ ¡Problema al enviar el email! Intenta de nuevo." : "❌ Problem sending email. Try again.";
                            iFrameElement.postMessage({ type: 'botError', text: errorMsg });
                        }
                    } else {
                        const noResponseMsg = messageFromIframe.language === 'es' ?
                            "🤔 ¡No hay respuesta para enviar! Chatea primero." : "🤔 No response to send. Chat first!";
                        iFrameElement.postMessage({ type: 'botMessage', text: noResponseMsg });
                    }
                    break;
                case 'playAudio':
                    console.log("🔊 EN: User clicked speaker icon. Requesting audio for:", messageFromIframe.text);
                    handleUserActivity(iFrameElement);
                    try {
                        const ttsText = prepareTextForTTS(messageFromIframe.text);
                        const audioData = await generateAudio(ttsText, messageFromIframe.language);
                        if (audioData && !audioData.error) {
                            iFrameElement.postMessage({
                                type: 'audioResponse',
                                text: messageFromIframe.text,
                                audioData: audioData.audioUri,
                                originalText: messageFromIframe.text
                            });
                            console.log("🔊 EN: Audio generated and sent to iFrame.");
                        } else {
                            const errorMsg = messageFromIframe.language === 'es' ?
                                "❌ ¡No se pudo generar el audio!" : "❌ Could not generate audio.";
                            iFrameElement.postMessage({ type: 'botError', text: errorMsg });
                            console.warn("⚠️ EN: Audio generation failed:", audioData?.error);
                        }
                    } catch (err) {
                        console.error("💥 EN: Error generating audio:", err);
                        const errorMsg = messageFromIframe.language === 'es' ?
                            "❌ ¡Fallo al generar el audio!" : "❌ Audio generation failed.";
                        iFrameElement.postMessage({ type: 'botError', text: errorMsg });
                    }
                    break;
                default:
                    console.warn(`⚠️ EN: Unexpected message type: ${messageFromIframe.type}`);
            }
        } else {
            console.log("<?> EN: Unexpected message format:", messageFromIframe);
        }
    });
});

// --- PROCESAMIENTO DE MENSAJES (NUEVA ARQUITECTURA ASÍNCRONA) ---
async function processUserChatMessage(userMessage, iFrameElement) {
    chatTranscript.push({ role: 'user', content: userMessage });
    iFrameElement.postMessage({ type: 'showTypingIndicator' });
    const wantsMap = /\b(coordenadas?|coordinates?|map(?:a)?|link|enlace)\b/i.test(userMessage);

    try {
        const startResult = await startAssistantRun(userMessage, currentSessionState.threadId);
        if (startResult.error) {
            throw new Error(startResult.error);
        }
        currentSessionState.threadId = startResult.threadId;
        startPolling(startResult.runId, startResult.threadId, wantsMap, iFrameElement);
    } catch (error) {
        console.error("❌ EN: Error processing message:", error);
        const errorMsg = "Oops! Something went wrong. Try again? 🌊";
        iFrameElement.postMessage({ type: 'botError', text: errorMsg });
        iFrameElement.postMessage({ type: 'hideTypingIndicator' });
        resetActivityTimers(iFrameElement);
    }
}

function startPolling(runId, threadId, includeMapLink, iFrameElement) {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    pollingInterval = setInterval(async () => {
        try {
            console.log(`⏳ EN: Polling for result... RunID: ${runId}`);
            const result = await getAssistantRunResult(threadId, runId, 'en', { includeMapLink, lastMapLink });
            if (result.status === 'completed') {
                clearInterval(pollingInterval);
                console.log("✅ EN: Polling complete. Received message:", result.botResponseText);
                lastBotResponse = result.botResponseText;
                if (result.mapsLink) {
                    lastMapLink = result.mapsLink;
                }
                chatTranscript.push({ role: 'assistant', content: lastBotResponse, language: result.languageForTTS });
                iFrameElement.postMessage({ type: 'botMessage', text: lastBotResponse });
                iFrameElement.postMessage({ type: 'hideTypingIndicator' });
                resetActivityTimers(iFrameElement);
            } else if (result.status === 'failed') {
                clearInterval(pollingInterval);
                console.error("💥 EN: Run failed or polling error:", result.error);
                iFrameElement.postMessage({ type: 'botError', text: result.botResponseText });
                iFrameElement.postMessage({ type: 'hideTypingIndicator' });
                resetActivityTimers(iFrameElement);
            } else {
                console.log(`...still working (status: ${result.status})`);
            }
        } catch (e) {
            clearInterval(pollingInterval);
            console.error("💥 EN: Critical error during polling interval:", e);
            iFrameElement.postMessage({ type: 'hideTypingIndicator' });
        }
    }, 3000);
}

// --- TEMPORIZADORES Y FUNCIONES DE SESIÓN (SIN CAMBIOS) ---
function handleUserActivity(iFrameElement) {
    if (!hasUserInteractedInitially) {
        console.log("🎉 EN: First user interaction. Cancelling initial timer.");
        hasUserInteractedInitially = true;
        clearTimeout(initialAutoCloseTimeoutId);
        initialAutoCloseTimeoutId = null;
        resetActivityTimers(iFrameElement);
    } else {
        resetActivityTimers(iFrameElement);
    }
}

function startInitialAutoCloseTimer(iFrameElement) {
    clearAllTimers();
    if (!hasUserInteractedInitially) {
        console.log(`⏳ EN: Starting initial auto-close timer for ${INITIAL_AUTO_CLOSE_DURATION / 1000}s.`);
        initialAutoCloseTimeoutId = setTimeout(() => {
            console.log("🚪 EN: Initial timer expired. Closing chat.");
            const closeMsg = "Timeout! Chat closed due to inactivity. 🦤";
            iFrameElement.postMessage({ type: 'forceCloseChat', reason: 'initial_inactivity', message: closeMsg });
            finalizeChatSession(iFrameElement, false);
        }, INITIAL_AUTO_CLOSE_DURATION);
    }
}

function resetActivityTimers(iFrameElement) {
    if (!hasUserInteractedInitially) {
        console.log("📝 EN: No initial interaction. Activity timers not started.");
        return;
    }
    clearTimeout(activityWarningTimeoutId);
    clearTimeout(activityCloseTimeoutId);
    activityWarningTimeoutId = null;
    activityCloseTimeoutId = null;
    console.log(`⏳ EN: Resetting activity timers. Warning in ${INACTIVITY_WARNING_DURATION / 1000}s.`);
    activityWarningTimeoutId = setTimeout(() => {
        console.log("🔔 EN: Inactivity warning triggered.");
        const warningMsg = `Still there? Chat will close in ${INACTIVITY_CLOSE_DURATION_AFTER_WARNING / 60000} minute(s).`;
        iFrameElement.postMessage({ type: 'activityWarning', message: warningMsg });
        activityCloseTimeoutId = setTimeout(() => {
            console.log("🚪 EN: Inactivity close timer expired.");
            const closeMsg = "Timeout! Chat closed due to inactivity. 🦤";
            iFrameElement.postMessage({ type: 'forceCloseChat', reason: 'session_timeout', message: closeMsg });
            finalizeChatSession(iFrameElement, true);
        }, INACTIVITY_CLOSE_DURATION_AFTER_WARNING);
    }, INACTIVITY_WARNING_DURATION);
}

function clearAllTimers() {
    console.log("🧹 EN: Clearing all timers.");
    clearTimeout(initialAutoCloseTimeoutId);
    clearTimeout(activityWarningTimeoutId);
    clearTimeout(activityCloseTimeoutId);
    initialAutoCloseTimeoutId = null;
    activityWarningTimeoutId = null;
    activityCloseTimeoutId = null;
}

function finalizeChatSession(iFrameElement, shouldSendTranscript) {
    console.log(`🔚 EN: Finalizing chat session. Send transcript: ${shouldSendTranscript}`);
    clearAllTimers();
    if (shouldSendTranscript && chatTranscript.length >= 2) {
        console.log("ℹ️ EN: Preparing to send transcript.");
        chatTranscript.push({ role: 'assistant', content: "--- Chat session ended ---", language: 'en' });
        sendTranscriptByEmail();
    }
    resetChatSessionState();
}

function resetChatSessionState() {
    chatTranscript = [];
    lastBotResponse = "";
    hasUserInteractedInitially = false;
    currentSessionState = { threadId: null };
    lastMapLink = "";
    console.log("🔄 EN: Chat session state reset.");
}

function sendTranscriptByEmail() {
    console.log("📬 EN: Preparing to send transcript...");
    if (chatTranscript.length === 0) {
        console.log("🤷‍♂️ EN: Empty transcript, no email sent.");
        return;
    }
    const formattedTranscript = chatTranscript.map(entry => ({
        tipo: entry.role === 'user' ? 'usuario' : 'bot',
        mensaje: entry.content
    }));
    enviarEmail(formattedTranscript)
        .then(() => console.log("✅ EN: Transcript emailed."))
        .catch(err => console.error("❌ EN: Error sending transcript:", err));
}