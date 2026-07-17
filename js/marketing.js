// ============================================================
//  Marketing admin: enable/edit the storefront popup offer.
// ============================================================

const el = id => document.getElementById(id);

function currentFromForm() {
  return {
    enabled: el("enabled").checked,
    offer: el("offer").value.trim(),
    headline: el("headline").value.trim(),
    message: el("message").value.trim(),
    button: el("button").value.trim() || "Get my code",
    success: el("success").value.trim(),
    collectEmail: el("collectEmail").checked,
  };
}

function fill(m) {
  m = m || {};
  el("enabled").checked = !!m.enabled;
  el("offer").value = m.offer || "";
  el("headline").value = m.headline || "";
  el("message").value = m.message || "";
  el("button").value = m.button || "Get my code";
  el("success").value = m.success || "";
  el("collectEmail").checked = m.collectEmail !== false;
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Show the popup exactly as visitors would see it (no email actually saved).
function preview() {
  const m = currentFromForm();
  const mount = el("previewMount");
  mount.innerHTML =
    '<div class="mkt-pop-overlay">' +
      '<div class="mkt-pop">' +
        '<button class="mkt-pop-x" aria-label="Close">&times;</button>' +
        (m.offer ? '<div class="mkt-pop-offer">' + esc(m.offer) + '</div>' : "") +
        '<h3>' + esc(m.headline || "Join the club") + '</h3>' +
        (m.message ? '<p>' + esc(m.message) + '</p>' : "") +
        (m.collectEmail
          ? '<form class="mkt-pop-form" onsubmit="return false"><input type="email" placeholder="you@email.com">' +
            '<button class="btn btn-gold btn-block">' + esc(m.button || "Get my code") + '</button></form>'
          : '<button class="btn btn-gold btn-block">' + esc(m.button || "Got it") + '</button>') +
        '<div class="mkt-pop-msg" style="font-size:12px">Preview only</div>' +
      '</div>' +
    '</div>';
  const ov = mount.querySelector(".mkt-pop-overlay");
  const close = () => { mount.innerHTML = ""; };
  mount.querySelector(".mkt-pop-x").onclick = close;
  ov.onclick = e => { if (e.target === ov) close(); };
}

async function save() {
  const btn = el("saveBtn"), msg = el("saveMsg");
  btn.disabled = true; btn.textContent = "Saving…";
  const res = await apiSaveMarketing(currentFromForm(), adminKey());
  btn.disabled = false; btn.textContent = "Save popup";
  msg.style.display = "block";
  if (res && res.ok) {
    msg.textContent = currentFromForm().enabled
      ? "✓ Saved. The popup is now LIVE on the site."
      : "✓ Saved. The popup is turned off.";
  } else {
    msg.textContent = "Could not save. Check you're logged in and try again.";
  }
}

async function load() {
  const m = await apiGetMarketing();
  fill(m);
}

el("saveBtn").addEventListener("click", save);
el("previewBtn").addEventListener("click", preview);

document.addEventListener("DOMContentLoaded", () => {
  renderAdminNav("marketing");
  setupAdminGate(load);
});
