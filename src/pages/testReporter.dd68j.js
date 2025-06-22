import wixWindowFrontend from 'wix-window-frontend';

$w.onReady(function () {
    console.log("Página de Test Reporter lista [Velo].");
    // console.log("Contenido de wixWindowFrontend al inicio de onReady [Velo]:", wixWindowFrontend); // Opcional, ya lo vimos

    const iFrameElementId = '#testReporter';
    const iFrameElement = $w(iFrameElementId);

    console.log(`[Velo] Intentando seleccionar iFrame con ID: ${iFrameElementId}`);
    
    if (iFrameElement && iFrameElement.id) {
        // console.log(`[Velo] Elemento iFrame encontrado. ID: ${iFrameElement.id}, Tipo: "${iFrameElement.type}"`); // Opcional
        // console.log(`[Velo] ¿Tiene iFrame el método onMessage?: ${typeof iFrameElement.onMessage === 'function'}`); // Opcional

        if (typeof iFrameElement.onMessage === 'function') {
            iFrameElement.onMessage((event) => {
                if (event.data && event.data.type === 'veloAction') {
                    console.log("[Velo] Mensaje completo recibido del iFrame:", JSON.stringify(event.data)); // Loguear como string para ver exacto
                    
                    const action = event.data.action;
                    const payload = event.data.payload;

                    if (action === 'copy') {
                        // --- DEBUG EXPLÍCITO DE LA CONDICIÓN ---
                        console.log("[Velo DEBUG Copy] Verificando payload:", payload);
                        const hasPayload = !!payload;
                        const hasPayloadText = payload ? typeof payload.text === 'string' && payload.text.length > 0 : false;
                        const hasPayloadFeedbackTestId = payload ? typeof payload.feedbackTestId === 'string' && payload.feedbackTestId.length > 0 : false;
                        
                        console.log("[Velo DEBUG Copy] ¿Existe payload?:", hasPayload);
                        console.log("[Velo DEBUG Copy] ¿payload.text es string no vacío?:", hasPayloadText, "(Valor: ", payload ? payload.text : "N/A", ")");
                        console.log("[Velo DEBUG Copy] ¿payload.feedbackTestId es string no vacío?:", hasPayloadFeedbackTestId, "(Valor: ", payload ? payload.feedbackTestId : "N/A", ")");
                        // --- FIN DEBUG EXPLÍCITO ---

                        // if (payload && payload.text && payload.feedbackTestId) { // Condición original
                        if (hasPayload && hasPayloadText && hasPayloadFeedbackTestId) { // Nueva condición más robusta
                            console.log("[Velo] Payload para 'copy' ES VÁLIDO. Procediendo a copiar.");
                            wixWindowFrontend.copyToClipboard(payload.text)
                                .then(() => {
                                    console.log("[Velo] Texto copiado al portapapeles:", payload.text);
                                    iFrameElement.postMessage({
                                        type: 'veloResponse',
                                        action: 'copyResponse',
                                        payload: {
                                            success: true,
                                            message: '¡Copiado! (Velo)', // Añadido (Velo) para diferenciar
                                            feedbackTestId: payload.feedbackTestId
                                        }
                                    });
                                })
                                .catch((error) => {
                                    console.error("[Velo] Error al copiar al portapapeles:", error);
                                    iFrameElement.postMessage({
                                        type: 'veloResponse',
                                        action: 'copyResponse',
                                        payload: {
                                            success: false,
                                            message: 'Error al copiar (Velo)', // Añadido (Velo)
                                            errorDetails: error.message,
                                            feedbackTestId: payload.feedbackTestId
                                        }
                                    });
                                });
                        } else {
                            console.error("[Velo] Payload inválido para la acción 'copy' (después de debug explícito). Payload fue:", payload);
                        }
                    } 
                    // No hay 'print' aquí, se hace en el iFrame
                    else {
                        console.warn("[Velo] Acción desconocida recibida del iFrame:", action);
                    }
                }
            });
            console.log(`[Velo] Receptor de mensajes .onMessage configurado para ${iFrameElementId}`);
        } else {
            // ... (errores anteriores)
        }
    } 
    // ... (errores anteriores)
});