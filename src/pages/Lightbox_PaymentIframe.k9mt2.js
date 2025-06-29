import { lightbox } from 'wix-window';

$w.onReady(function () {
  const ctx = lightbox.getContext();
  if (ctx && ctx.url && $w('#htmlPaymentFrame')) {
    $w('#htmlPaymentFrame').src = ctx.url;
  }
});
