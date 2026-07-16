// ============================================================
//  Success page: confirm the Stripe payment, clear the cart.
// ============================================================

document.addEventListener("DOMContentLoaded", async function () {
  const body = document.getElementById("successBody");
  const sid = getParam("sid");

  if (!sid) {
    body.innerHTML = '<h1 style="color:#fff">Thanks!</h1><p style="color:var(--muted)">' +
      'If you just paid, your order is confirmed.</p><a class="btn btn-gold" href="shop.html">Back to shop</a>';
    return;
  }

  const res = await apiStripeVerify(sid);
  if (res && res.paid) {
    clearCart();
    updateCartBadge();
    body.innerHTML =
      '<div style="font-size:54px">&#127881;</div>' +
      '<h1 style="color:#fff;margin:10px 0">Thank you!</h1>' +
      '<p style="color:var(--muted);line-height:1.7">Your payment went through and your order <b style="color:#fff">' +
        escapeHtml(res.no) + '</b> is confirmed.<br>Saxon will pack it with care and ship it out. ' +
        'A receipt is on its way to your email.</p>' +
      '<div style="margin-top:20px"><a class="btn btn-gold" href="shop.html">Keep shopping</a></div>';
  } else {
    body.innerHTML =
      '<h1 style="color:#fff">Payment not completed</h1>' +
      '<p style="color:var(--muted);line-height:1.7">It looks like the payment wasn\'t finished. ' +
      'Your cart is still saved, you can try again.</p>' +
      '<div style="margin-top:16px"><a class="btn btn-gold" href="cart.html">Back to cart</a></div>';
  }
});
