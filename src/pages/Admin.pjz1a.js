// Importa la función que queremos ejecutar desde el backend.
import { forceProductSync } from 'backend/manualTriggers.jsw';

$w.onReady(function () {
    // Configura lo que sucede cuando se hace clic en el botón #syncButton.
    $w('#syncButton').onClick(async () => {

        // 1. Da feedback visual al usuario: deshabilita el botón y cambia el texto.
        $w('#syncButton').disable();
        $w('#syncButton').label = 'Sincronizando...';

        console.log('Iniciando sincronización manual desde el botón de admin...');

        // 2. Llama a la función del backend y espera a que termine.
        const result = await forceProductSync();

        console.log('Sincronización manual completada. Resultado:', result);

        // 3. Vuelve a habilitar el botón y restaura el texto original.
        $w('#syncButton').label = 'Sincronizar Productos';
        $w('#syncButton').enable();

        // Opcional: Si quieres mostrar un mensaje de estado, puedes añadir un
        // elemento de texto a la página con el ID #statusText y este código lo actualizará.
        /*
        if (result.success) {
            $w('#statusText').text = '¡Sincronización completada con éxito!';
        } else {
            $w('#statusText').text = `Error: ${result.message}`;
        }
        $w('#statusText').show();
        */
    });
});
