// ============================================================
//  Orders admin: view orders + update status. Password gated.
// ============================================================

let ORDERS = [];
let CARDS_BY_ID = {};   // id -> full card, for photos on the packing slip
const STATUSES = ["pending", "paid", "shipped", "refunded"];

function adminKey() { return sessionStorage.getItem("mrpc.key") || ""; }

function statusPill(s) {
  return '<span class="ostatus ' + s + '">' + s + '</span>';
}

function orderCard(o, idx) {
  const b = o.buyer || {};
  const items = (o.items || []).map(it =>
    '<div class="co-line"><span>' + escapeHtml(it.name) + (it.qty > 1 ? ' &times;' + it.qty : '') +
    '</span><span>' + fmtCur(it.price * it.qty, o.currency) + '</span></div>').join("");
  const opts = STATUSES.map(s => '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + s + '</option>').join("");
  return '<div class="order-card">' +
    '<div class="order-top">' +
      '<div><span class="order-no">' + escapeHtml(o.no || o.id || "") + '</span> ' + statusPill(o.status || "pending") +
        '<div class="order-date">' + escapeHtml((o.date || "").slice(0, 16).replace("T", " ")) + '</div></div>' +
      '<div class="order-total">' + fmtCur(o.total, o.currency) + '</div>' +
    '</div>' +
    '<div class="order-grid">' +
      '<div class="order-buyer">' +
        '<b>' + escapeHtml(b.name || "") + '</b><br>' +
        escapeHtml(b.address1 || "") + (b.address2 ? "<br>" + escapeHtml(b.address2) : "") + '<br>' +
        escapeHtml(b.city || "") + ", " + escapeHtml(b.region || "") + " " + escapeHtml(b.postal || "") + '<br>' +
        escapeHtml(b.country || "") + '<br>' +
        '<a href="mailto:' + escapeHtml(b.email || "") + '">' + escapeHtml(b.email || "") + '</a> &middot; ' + escapeHtml(b.phone || "") +
        (b.note ? '<div class="order-note">&ldquo;' + escapeHtml(b.note) + '&rdquo;</div>' : "") +
      '</div>' +
      '<div class="order-items">' + items + '</div>' +
    '</div>' +
    '<div class="order-actions">' +
      '<label>Status: <select onchange="setStatus(' + idx + ', this.value)">' + opts + '</select></label>' +
      '<button class="btn btn-outline btn-sm" onclick="printPackingSlip(' + idx + ')">🖨 Print packing slip</button>' +
      (o.status === "refunded" ? '' : '<span class="order-hint">Refund? Do it in Stripe, then reload this page.</span>') +
    '</div>' +
  '</div>';
}

function renderOrders() {
  const list = document.getElementById("ordersList");
  if (!ORDERS.length) { list.innerHTML = '<div class="empty">No orders yet.</div>'; return; }
  list.innerHTML = ORDERS.map(orderCard).join("");
}

async function setStatus(idx, status) {
  ORDERS[idx].status = status;
  renderOrders();
  await apiSaveOrders(ORDERS, adminKey());
}

async function loadOrders() {
  const list = document.getElementById("ordersList");
  list.innerHTML = '<div class="empty">Checking Stripe for the latest…</div>';
  // Pull card photos (for packing slips) and the live order list in parallel.
  const [cards, synced] = await Promise.all([
    apiGetCards(adminKey()),
    apiSyncOrders(adminKey()),
  ]);
  CARDS_BY_ID = {};
  (Array.isArray(cards) ? cards : []).forEach(c => { CARDS_BY_ID[c.id] = c; });
  let data = synced;
  if (!Array.isArray(data)) data = await apiGetOrders(adminKey()); // fallback if sync fails
  ORDERS = Array.isArray(data) ? data : [];
  renderOrders();
}

// ---- Printable packing slip (logo + card photo + unique ID + verify QR) ----
function slipItemRow(it, i) {
  const card = CARDS_BY_ID[it.id] || {};
  const code = cardCode({ id: it.id, name: it.name });
  const photo = (Array.isArray(card.images) ? card.images : []).find(u => /^https?:\/\//.test(u || ""));
  const img = photo || (/^https?:\/\//.test(card.image || "") ? card.image : "");
  return '<tr>' +
    '<td class="ps-thumb">' + (img ? '<img src="' + escapeHtml(img) + '" alt="">' : '') + '</td>' +
    '<td class="ps-item">' +
      '<div class="ps-name">' + escapeHtml(it.name) + (it.set ? ' <span>(' + escapeHtml(it.set) + ')</span>' : '') + '</div>' +
      '<div class="ps-id">Card ID: <b>' + escapeHtml(code) + '</b></div>' +
      '<div class="ps-verify">&#10003; Verified by Saxon</div>' +
    '</td>' +
    '<td class="ps-qty">&times;' + (it.qty || 1) + '</td>' +
    '<td class="ps-qr"><div id="psqr_' + i + '"></div><div class="ps-scan">Scan to verify</div></td>' +
  '</tr>';
}

function printPackingSlip(idx) {
  const o = ORDERS[idx];
  if (!o) return;
  const b = o.buyer || {};
  const rows = (o.items || []).map(slipItemRow).join("");
  const hasAddr = b.name || b.address1;
  const site = (location.host || "mrpokecards.com").replace(/^www\./, "");

  document.getElementById("printArea").innerHTML =
    '<div class="ps">' +
      '<div class="ps-head">' +
        '<img class="ps-logo" src="assets/logo.png" alt="Mr. PokeCards">' +
        '<div class="ps-title">Packing Slip</div>' +
      '</div>' +
      '<div class="ps-meta">' +
        '<div><span class="ps-lbl">Order</span>' + escapeHtml(o.no || "") + '</div>' +
        '<div><span class="ps-lbl">Date</span>' + escapeHtml((o.date || "").slice(0, 10)) + '</div>' +
        '<div><span class="ps-lbl">Status</span>' + escapeHtml(o.status || "") + '</div>' +
      '</div>' +
      '<div class="ps-ship">' +
        '<span class="ps-lbl">Ship to</span>' +
        '<div class="ps-addr">' + (hasAddr ?
          ('<b>' + escapeHtml(b.name || "") + '</b><br>' +
           escapeHtml(b.address1 || "") + (b.address2 ? '<br>' + escapeHtml(b.address2) : "") + '<br>' +
           escapeHtml(b.city || "") + ", " + escapeHtml(b.region || "") + " " + escapeHtml(b.postal || "") + '<br>' +
           escapeHtml(b.country || "")) :
          '<i>No shipping details yet (order not paid).</i>') +
        '</div>' +
      '</div>' +
      '<table class="ps-table"><tbody>' + rows + '</tbody></table>' +
      '<div class="ps-note">' +
        '<p>Thanks so much for your order! Every card is hand checked, sleeved, and toploaded by me. Scan the QR on any card to open its page and see its unique ID.</p>' +
        '<p class="ps-sign">Thanks, Saxon</p>' +
        '<div class="ps-tag">KID OWNED &middot; KID COLLECTED &middot; COLLECTOR APPROVED</div>' +
        '<div class="ps-url">' + escapeHtml(site) + '</div>' +
      '</div>' +
    '</div>';

  // Render one verify-QR per item, pointing at that card's page on this domain.
  (o.items || []).forEach((it, i) => {
    const el = document.getElementById("psqr_" + i);
    if (el && typeof QRCode !== "undefined") {
      el.innerHTML = "";
      new QRCode(el, {
        text: location.origin + "/card.html?id=" + encodeURIComponent(it.id),
        width: 80, height: 80, colorDark: "#000000", colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    }
  });

  document.body.classList.add("printing");
  setTimeout(() => window.print(), 150);
}
window.addEventListener("afterprint", () => document.body.classList.remove("printing"));

function setupGate() {
  const gate = document.getElementById("adminGate");
  function unlock(key) { gate.style.display = "none"; sessionStorage.setItem("mrpc.admin", "ok"); if (key) sessionStorage.setItem("mrpc.key", key); loadOrders(); }
  if (sessionStorage.getItem("mrpc.admin") === "ok") { gate.style.display = "none"; loadOrders(); }
  else { gate.style.display = "flex"; }
  async function tryPw() {
    const pw = document.getElementById("gatePw").value;
    document.getElementById("gateErr").textContent = "Checking…";
    const res = await apiVerifyKey(pw);
    if (res === true) unlock(pw);
    else if (res === null && pw === CONFIG.adminPassword) unlock(pw);
    else { document.getElementById("gateErr").textContent = "Wrong password."; document.getElementById("gatePw").value = ""; }
  }
  document.getElementById("gateBtn").addEventListener("click", tryPw);
  document.getElementById("gatePw").addEventListener("keydown", e => { if (e.key === "Enter") tryPw(); });
}

document.addEventListener("DOMContentLoaded", setupGate);
