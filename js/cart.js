// ============================================================
//  Cart page: list items, change quantity, check out via PayPal.
// ============================================================

function lineHtml(item) {
  const c = item.card;
  const th = c.image
    ? '<div class="th"><img src="' + c.image + '" alt=""></div>'
    : '<div class="th">&#9733;</div>';
  const max = cardAvail(c);
  const atMax = item.qty >= max;
  const plusBtn = atMax
    ? '<button disabled style="opacity:.35;cursor:not-allowed">&plus;</button>'
    : '<button onclick="chg(\'' + c.id + '\',' + (item.qty + 1) + ')">&plus;</button>';
  const stockNote = max > 1
    ? '<div style="color:var(--muted);font-size:12px">' + max + ' available' + (atMax ? ' (max)' : '') + '</div>'
    : (atMax ? '<div style="color:var(--muted);font-size:12px">Only 1 available</div>' : '');
  return '<div class="cart-line">' +
    th +
    '<div>' +
      '<div style="font-weight:700;color:#fff"><a href="card.html?id=' + encodeURIComponent(c.id) + '">' + escapeHtml(c.name) + '</a></div>' +
      '<div style="color:var(--muted);font-size:13px">' + escapeHtml(c.set || "") +
        (c.condition ? " · " + escapeHtml(c.condition) : "") + '</div>' +
      stockNote +
    '</div>' +
    '<div class="qty">' +
      '<button onclick="chg(\'' + c.id + '\',' + (item.qty - 1) + ')">&minus;</button>' +
      '<span>' + item.qty + '</span>' +
      plusBtn +
    '</div>' +
    '<div style="text-align:right;min-width:80px">' +
      '<div style="color:var(--gold);font-weight:800">' + money((c.price || 0) * item.qty) + '</div>' +
      '<button class="btn btn-sm" style="background:none;color:var(--muted);padding:4px 0" onclick="rm(\'' + c.id + '\')">Remove</button>' +
    '</div>' +
  '</div>';
}

function render() {
  const items = cartItems();
  const body = document.getElementById("cartBody");

  if (!items.length) {
    body.innerHTML = '<div class="empty">Your cart is empty.<br><br>' +
      '<a class="btn btn-gold" href="shop.html">Shop cards</a></div>';
    updateCartBadge();
    return;
  }

  const total = cartTotal();
  const checkout = '<a class="btn btn-gold btn-lg btn-block" href="checkout.html" style="margin-top:14px">Checkout &middot; ' + money(total) + '</a>';

  body.innerHTML =
    items.map(lineHtml).join("") +
    '<div class="cart-summary">' +
      '<div class="row"><span>Items</span><span>' + cartCount() + '</span></div>' +
      '<div class="row total"><span>Total</span><span class="amt">' + money(total) + '</span></div>' +
      checkout +
      '<div style="color:var(--muted);font-size:12px;text-align:center;margin-top:12px">' +
        'Next you\'ll enter your shipping details, then pay securely by card.' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:16px"><a href="shop.html" style="color:var(--gold)">&larr; Keep shopping</a></div>';

  updateCartBadge();
}

function chg(id, qty) { setCartQty(id, qty); render(); }
function rm(id) { removeFromCart(id); render(); }

document.addEventListener("DOMContentLoaded", async function () {
  await bootstrapCards();
  render();
});
