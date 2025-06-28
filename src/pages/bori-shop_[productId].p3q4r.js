import wixData from 'wix-data';
import wixLocation from 'wix-location';

let currentProductId;

$w.onReady(async function () {
  const path = wixLocation.path;
  currentProductId = path[path.length - 1];
  await loadProduct(currentProductId);

  if ($w('#buttonBookNow')) {
    $w('#buttonBookNow').onClick(handleBookNow);
  }
});

async function loadProduct(id) {
  try {
    const product = await wixData.get('ViatorProducts', id);
    if (!product) return;

    $w('#productTitle').text = product.title || product.name;
    $w('#productImage').src = product.image || product.imageUrl;
    $w('#productDescription').text = product.description || product.shortDescription;
    $w('#reviewProvider').text = product.reviewProvider || '';

    const reviews = product.reviews || [];
    if ($w('#repeaterReviews')) {
      $w('#repeaterReviews').data = reviews;
      $w('#repeaterReviews').onItemReady(($item, review) => {
        $item('#reviewAuthor').text = review.author || '';
        $item('#reviewText').text = review.text || '';
        if ($item('#reviewRating')) $item('#reviewRating').value = review.rating || 0;
      });
    }
  } catch (err) {
    console.error('loadProduct error', err);
  }
}

async function handleBookNow() {
  const booking = {
    productCode: currentProductId,
    createdAt: new Date()
  };
  try {
    await wixData.insert('ViatorBookings', booking);
    if ($w('#bookingStatus')) {
      $w('#bookingStatus').text = 'Booking saved!';
    }
  } catch (err) {
    console.error('booking error', err);
    if ($w('#bookingStatus')) {
      $w('#bookingStatus').text = 'Could not save booking';
    }
  }
}
