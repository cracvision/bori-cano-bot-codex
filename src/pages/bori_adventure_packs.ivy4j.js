import wixData from 'wix-data';

$w.onReady(function () {
  // 1. Configura el repetidor para que sepa qué hacer con cada item
  $w('#productRepeater').onItemReady(($item, itemData, index) => {
    // 2. Asigna los datos a los elementos correspondientes usando sus IDs
    $item('#productTitle').text = itemData.title;

    // Formateamos el precio para que se vea bien
    if (itemData.priceFrom) {
      $item('#productPrice').text = `$${itemData.priceFrom}`;
    } else {
      $item('#productPrice').text = 'Precio no disponible';
    }

    // Asigna la URL de la imagen al elemento de imagen
    if (itemData.productImage) {
      $item('#productImage').src = itemData.productImage;
    }
  });

  // 3. Finalmente, consulta la base de datos y le pasa los datos al repetidor
  wixData
    .query('ViatorProducts')
    .limit(100) // Traemos hasta 100 productos
    .find()
    .then((results) => {
      if (results.items.length > 0) {
        $w('#productRepeater').data = results.items;
      } else {
        console.log(
          'No se encontraron productos en la colección ViatorProducts.'
        );
      }
    })
    .catch((error) => {
      console.error(
        'Error al consultar la colección ViatorProducts:',
        error
      );
    });
});
