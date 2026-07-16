// ============================================================
//  Checkout: show the order, then hand off to Stripe's secure
//  hosted checkout (which collects card + shipping + email).
// ============================================================

function orderSummaryHtml(items, total) {
  const rows = items.map(it =>
    '<div class="co-line"><span>' + escapeHtml(it.card.name) +
    (it.qty > 1 ? ' &times;' + it.qty : '') + '</span><span>' + money((it.card.price || 0) * it.qty) + '</span></div>'
  ).join("");
  return '<div class="co-summary"><h3>Your order</h3>' + rows +
    '<div class="co-line total"><span>Total</span><span>' + money(total) + '</span></div></div>';
}

function render() {
  const items = cartItems();
  const body = document.getElementById("checkoutBody");
  if (!items.length) {
    body.innerHTML = '<div class="empty">Your cart is empty.<br><br><a class="btn btn-gold" href="shop.html">Shop cards</a></div>';
    return;
  }
  const total = cartTotal();
  body.innerHTML = '<div class="co-grid">' +
    '<div class="co-form">' +
      '<h3>Ready to check out</h3>' +
      '<p style="color:var(--muted);line-height:1.6">You\'ll go to our secure Stripe checkout to enter your card and shipping address. ' +
      'Pay by card, Apple Pay, or Google Pay, no account needed. You\'ll get an emailed receipt.</p>' +
      '<button id="payBtn" class="btn btn-gold btn-lg btn-block">Pay ' + money(total) + ' securely &rarr;</button>' +
      '<div id="coErr" class="gate-err"></div>' +
      '<div style="margin-top:14px"><a href="cart.html" style="color:var(--gold)">&larr; Back to cart</a></div>' +
    '</div>' +
    orderSummaryHtml(items, total) +
  '</div>';

  document.getElementById("payBtn").addEventListener("click", async function () {
    const btn = this, err = document.getElementById("coErr");
    err.textContent = "";
    btn.textContent = "Taking you to checkout…"; btn.disabled = true;
    const payload = cartItems().map(it => ({ id: it.card.id, qty: it.qty }));
    const res = await apiStripeCreate(payload, CONFIG.currencyCode);
    if (res && res.url) { window.location.href = res.url; return; }
    err.textContent = (res && res.error) ? res.error : "Checkout isn't available right now. Please try again.";
    btn.textContent = "Pay " + money(total) + " securely →"; btn.disabled = false;
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  await bootstrapCards();
  render();
});
