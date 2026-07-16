// ============================================================
//  Orders admin: view orders + update status. Password gated.
// ============================================================

let ORDERS = [];
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
      (o.status === "refunded" ? '' : '<span class="order-hint">Refund? Do it in PayPal, then set status to Refunded.</span>') +
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
  list.innerHTML = '<div class="empty">Loading orders…</div>';
  const data = await apiGetOrders(adminKey());
  ORDERS = Array.isArray(data) ? data : [];
  renderOrders();
}

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
