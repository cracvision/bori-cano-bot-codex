import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { createBooking } from 'backend/viatorAPI';
import { wixWindow } from 'wix-window';

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
  const bookingRequest = {
    productCode: currentProductId
  };
  if ($w('#dateInput')) {
    bookingRequest.travelDate = $w('#dateInput').value;
  }
  if ($w('#travelersInput')) {
    bookingRequest.numberOfTravelers = Number($w('#travelersInput').value);
  }
  try {
    const res = await createBooking(bookingRequest);
    const url = res?.iframeUrl || res?.payment?.iframeUrl || res?.paymentUrl;
    if (url) {
      if ($w('#paymentFrame')) {
        $w('#paymentFrame').src = url;
        $w('#paymentFrame').show();
      } else {
        wixWindow.openLightbox('PaymentIframe', { url });
      }
    }
    if ($w('#bookingStatus')) {
      $w('#bookingStatus').text = 'Booking created!';
    }
  } catch (err) {
    console.error('booking error', err);
    if ($w('#bookingStatus')) {
      $w('#bookingStatus').text = 'Could not create booking';
    }
  }
}
