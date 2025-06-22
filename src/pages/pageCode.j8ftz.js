import { wixWindow } from 'wix-window';

$w.onReady(function () {
    // Asegurarse de que el iFrame esté listo
    $w('#testReporter').onReady(() => {
        // Seleccionar todos los elementos con clase .query dentro del iFrame
        const iframe = $w('#testReporter').getIframeDocument();
        const queries = iframe.querySelectorAll('.query');

        queries.forEach(query => {
            query.addEventListener('click', async () => {
                const text = query.textContent;
                try {
                    // Usar navigator.clipboard con Velo
                    await wixWindow.copyToClipboard(text);

                    // Mostrar confirmación de copiado
                    query.classList.add('copied');
                    const confirmation = query.nextElementSibling;
                    if (confirmation && confirmation.classList.contains('copy-confirmation')) {
                        confirmation.classList.add('show');
                        setTimeout(() => {
                            confirmation.classList.remove('show');
                            query.classList.remove('copied');
                        }, 1500);
                    }
                } catch (err) {
                    console.error('Error al copiar:', err);
                    // Mostrar mensaje de error
                    const errorMessage = query.nextElementSibling.nextElementSibling;
                    if (errorMessage && errorMessage.classList.contains('copy-error')) {
                        errorMessage.classList.add('show');
                        setTimeout(() => errorMessage.classList.remove('show'), 1500);
                    }
                }
            });
        });

        // Configurar el botón de PDF
        $w('#pdfButton').onClick(() => {
            wixWindow.print();
        });
    });
});