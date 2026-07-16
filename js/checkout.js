// ============================================================
//  Checkout: collect buyer + shipping info, create an order
//  record (invoice), then send the buyer to PayPal to pay.
// ============================================================

function orderSummaryHtml(items, total) {
  const rows = items.map(it =>
    '<div class="co-line"><span>' + escapeHtml(it.card.name) +
    (it.qty > 1 ? ' &times;' + it.qty : '') + '</span><span>' + money((it.card.price || 0) * it.qty) + '</span></div>'
  ).join("");
  return '<div class="co-summary"><h3>Your order</h3>' + rows +
    '<div class="co-line total"><span>Total</span><span>' + money(total) + '</span></div></div>';
}

function formHtml() {
  return '<form id="coForm" class="co-form">' +
    '<h3>Shipping details</h3>' +
    '<div class="field"><label>Full name *</label><input id="f_name" type="text" required></div>' +
    '<div class="row-between">' +
      '<div class="field" style="flex:1;min-width:180px"><label>Email *</label><input id="f_email" type="email" required></div>' +
      '<div class="field" style="flex:1;min-width:160px"><label>Phone *</label><input id="f_phone" type="tel" required></div>' +
    '</div>' +
    '<div class="field"><label>Address *</label><input id="f_addr1" type="text" placeholder="Street address" required></div>' +
    '<div class="field"><label>Address line 2 (optional)</label><input id="f_addr2" type="text" placeholder="Apt, unit, etc."></div>' +
    '<div class="row-between">' +
      '<div class="field" style="flex:1;min-width:140px"><label>City *</label><input id="f_city" type="text" required></div>' +
      '<div class="field" style="flex:1;min-width:120px"><label>State / Region *</label><input id="f_region" type="text" required></div>' +
    '</div>' +
    '<div class="row-between">' +
      '<div class="field" style="flex:1;min-width:120px"><label>Postal code *</label><input id="f_postal" type="text" required></div>' +
      '<div class="field" style="flex:1;min-width:140px"><label>Country *</label><input id="f_country" type="text" required></div>' +
    '</div>' +
    '<div class="field"><label>Note to Saxon (optional)</label><textarea id="f_note" placeholder="Anything I should know?"></textarea></div>' +
    '<button type="submit" class="btn btn-gold btn-lg btn-block">Place order</button>' +
    '<div id="coErr" class="gate-err"></div>' +
  '</form>';
}

function pad2(n) { return n < 10 ? "0" + n : "" + n; }

function makeOrderNo(now) {
  return "MPC-" + now.getFullYear() + pad2(now.getMonth() + 1) + pad2(now.getDate()) + "-" +
    String(Math.abs((now.getTime() % 10000))).padStart(4, "0");
}

function invoiceHtml(order) {
  const rows = order.items.map(it =>
    '<div class="co-line"><span>' + escapeHtml(it.name) + (it.qty > 1 ? ' &times;' + it.qty : '') +
    '</span><span>' + money(it.price * it.qty) + '</span></div>'
  ).join("");
  const pay = paypalMeLink(order.total);
  const payBtn = pay
    ? '<a class="btn btn-gold btn-lg btn-block" href="' + pay + '" target="_blank" rel="noopener">Pay ' + money(order.total) + ' with PayPal</a>'
    : '<div class="gate-err">PayPal isn\'t set up yet.</div>';
  return '<div class="invoice" id="invoice">' +
    '<div class="inv-head"><div><div class="inv-brand">MR <span>PokeCards</span></div>' +
      '<div class="inv-sub">Order confirmation</div></div>' +
      '<div class="inv-no">' + escapeHtml(order.no) + '<div class="inv-date">' + order.date.slice(0, 10) + '</div></div></div>' +
    '<div class="inv-cols">' +
      '<div><div class="inv-label">Ship to</div>' +
        '<div class="inv-buyer">' + escapeHtml(order.buyer.name) + '<br>' +
        escapeHtml(order.buyer.address1) + (order.buyer.address2 ? "<br>" + escapeHtml(order.buyer.address2) : "") + '<br>' +
        escapeHtml(order.buyer.city) + ", " + escapeHtml(order.buyer.region) + " " + escapeHtml(order.buyer.postal) + '<br>' +
        escapeHtml(order.buyer.country) + '<br>' + escapeHtml(order.buyer.email) + " &middot; " + escapeHtml(order.buyer.phone) +
        '</div></div>' +
    '</div>' +
    '<div class="inv-items">' + rows + '<div class="co-line total"><span>Total</span><span>' + money(order.total) + '</span></div></div>' +
    '<div class="inv-pay">' + payBtn +
      '<p class="inv-note">Please include your order number <b>' + escapeHtml(order.no) + '</b> in the PayPal note so Saxon can match your payment. ' +
      'You\'ll get a confirmation once payment is received.</p>' +
      '<button class="btn btn-outline" onclick="window.print()">Print / save invoice</button>' +
    '</div></div>';
}

function render() {
  const items = cartItems();
  const body = document.getElementById("checkoutBody");
  if (!items.length) {
    body.innerHTML = '<div class="empty">Your cart is empty.<br><br><a class="btn btn-gold" href="shop.html">Shop cards</a></div>';
    return;
  }
  const total = cartTotal();
  body.innerHTML = '<div class="co-grid">' + formHtml() + orderSummaryHtml(items, total) + '</div>';

  document.getElementById("coForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const err = document.getElementById("coErr");
    const btn = e.target.querySelector('button[type="submit"]');
    const now = new Date();
    const order = {
      no: makeOrderNo(now),
      date: now.toISOString(),
      status: "pending",
      currency: CONFIG.currencyCode,
      buyer: {
        name: val("f_name"), email: val("f_email"), phone: val("f_phone"),
        address1: val("f_addr1"), address2: val("f_addr2"), city: val("f_city"),
        region: val("f_region"), postal: val("f_postal"), country: val("f_country"), note: val("f_note")
      },
      items: cartItems().map(it => ({ id: it.card.id, name: it.card.name, set: it.card.set || "", qty: it.qty, price: it.card.price || 0 })),
      total: cartTotal()
    };
    btn.textContent = "Placing order…"; btn.disabled = true;
    const ok = await apiCreateOrder(order);
    if (!ok) {
      err.textContent = "Could not place the order (connection issue). Please try again.";
      btn.textContent = "Place order"; btn.disabled = false;
      return;
    }
    clearCart();
    updateCartBadge();
    document.getElementById("checkoutBody").innerHTML = invoiceHtml(order);
    window.scrollTo(0, 0);
  });
}

function val(id) { return (document.getElementById(id).value || "").trim(); }

document.addEventListener("DOMContentLoaded", async function () {
  await bootstrapCards();
  render();
});
