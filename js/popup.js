// ============================================================
//  Marketing popup: shows on the storefront if enabled in the
//  Marketing admin. Captures an email into the subscriber list.
// ============================================================
(function () {
  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (sessionStorage.getItem("mrpc.popup.seen")) return;   // once per visit
    const m = await apiGetMarketing();
    if (!m || !m.enabled) return;
    // Small delay so it doesn't slam the page instantly
    setTimeout(() => show(m), 1200);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function show(m) {
    if (sessionStorage.getItem("mrpc.popup.seen")) return;
    const wrap = document.createElement("div");
    wrap.className = "mkt-pop-overlay";
    wrap.innerHTML =
      '<div class="mkt-pop">' +
        '<button class="mkt-pop-x" aria-label="Close">&times;</button>' +
        (m.offer ? '<div class="mkt-pop-offer">' + esc(m.offer) + '</div>' : "") +
        '<h3>' + esc(m.headline || "Join the club") + '</h3>' +
        (m.message ? '<p>' + esc(m.message) + '</p>' : "") +
        (m.collectEmail
          ? '<form class="mkt-pop-form"><input type="email" required placeholder="you@email.com" autocomplete="email">' +
            '<button type="submit" class="btn btn-gold btn-block">' + esc(m.button || "Get my code") + '</button></form>'
          : '<button class="btn btn-gold btn-block mkt-pop-ok">' + esc(m.button || "Got it") + '</button>') +
        '<div class="mkt-pop-msg"></div>' +
      '</div>';
    document.body.appendChild(wrap);

    function close() { sessionStorage.setItem("mrpc.popup.seen", "1"); wrap.remove(); }
    wrap.querySelector(".mkt-pop-x").onclick = close;
    wrap.onclick = e => { if (e.target === wrap) close(); };
    const ok = wrap.querySelector(".mkt-pop-ok");
    if (ok) ok.onclick = close;

    const form = wrap.querySelector(".mkt-pop-form");
    if (form) form.onsubmit = async e => {
      e.preventDefault();
      const email = form.querySelector("input").value;
      const msg = wrap.querySelector(".mkt-pop-msg");
      msg.className = "mkt-pop-msg"; msg.textContent = "Saving…";
      const res = await apiSubscribe(email, "popup");
      if (res && res.ok) {
        sessionStorage.setItem("mrpc.popup.seen", "1");
        form.style.display = "none";
        msg.className = "mkt-pop-msg ok";
        msg.innerHTML = m.success ? esc(m.success) : "You're in! Thanks for joining.";
      } else {
        msg.textContent = "Hmm, that didn't work. Try again?";
      }
    };
  }
})();
