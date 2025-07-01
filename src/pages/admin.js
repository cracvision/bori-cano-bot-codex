// Importa la función que queremos ejecutar desde el backend.
import { forceProductSync } from 'backend/manualTriggers.jsw';

$w.onReady(function () {
    // Configura el evento onClick para el botón #syncButton.
    $w('#syncButton').onClick(async () => {
        // Da feedback visual al usuario.
        $w('#syncButton').disable();
        $w('#syncButton').label = 'Sincronizando...';

        console.log('Iniciando sincronización manual desde el botón de admin...');

        // Llama a la función del backend.
        await forceProductSync();

        console.log('Sincronización manual completada.');

        // Vuelve a habilitar el botón.
        $w('#syncButton').label = 'Sincronizar Productos';
        $w('#syncButton').enable();
    });
});
