$w.onReady(function () {
    /**
     * Configura el manejador de eventos para el repetidor #repeater1.
     * Esta función se ejecuta una vez por cada item que el dataset carga en el repetidor.
     * $item es una función de selección que se refiere a los elementos dentro del item actual del repetidor.
     * itemData contiene los datos de la fila de la colección para ese item específico.
     */
    $w('#repeater1').onItemReady(($item, itemData, index) => {

        // Conecta los elementos internos del repetidor con los datos del producto.

        // 1. Asigna la URL de la imagen del producto al elemento de imagen #imageX16.
        //    Asegúrate de que 'mainImage' sea la clave de campo (Field Key) correcta para la imagen en tu colección.
        if(itemData.mainImage) {
            $item('#imageX16').src = itemData.mainImage;
        }

        // 2. Asigna el título del producto al elemento de texto #text5.
        //    Asegúrate de que 'title' sea la clave de campo correcta para el título.
        if(itemData.title) {
            $item('#text5').text = itemData.title;
        }

        // 3. Asigna el precio al elemento de texto #text6.
        //    Asegúrate de que 'price' sea la clave de campo correcta para el precio.
        //    Se añade el símbolo '$' para el formato.
        if(itemData.price !== undefined) {
            $item('#text6').text = `$${itemData.price}`;
        }
    });
});
