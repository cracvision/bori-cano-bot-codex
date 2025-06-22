import { getViatorProductDetails } from 'backend/viatorAPI';
import wixData from 'wix-data';

$w.onReady(async function () {
  // Array de ejemplo con 51 productCodes (reemplaza con los tuyos)
  const productCodes = [
    '12345', '12346', '12347', /* ... hasta 51 códigos únicos */
    // Agrega los 51 productCodes reales que obtengas de tu panel de Viator
  ];

  try {
    const products = await getViatorProductDetails(productCodes);

    // Configura el Repeater con los datos
    $w('#repeaterAttractions').data = products.map(product => ({
      title: product.name,
      description: product.shortDescription || 'Sin descripción',
      image: product.images[0]?.url || '',
      productUrl: product.productUrl
    }));

    // Conecta los datos al Repeater
    $w('#repeaterAttractions').onItemReady(($item, itemData) => {
      $item('#textTitle').text = itemData.title;
      $item('#textDescription').text = itemData.description;
      $item('#imageAttraction').src = itemData.image;
      $item('#buttonReserve').link = itemData.productUrl;
      $item('#buttonReserve').target = '_blank'; // Abre en nueva pestaña
    });
  } catch (error) {
    console.error('Error displaying attractions:', error);
    $w('#textError').text = 'Error al cargar las atracciones. Intenta de nuevo.';
  }
});