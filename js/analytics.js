// ============================================================
//  Google Analytics 4 + a simple cookie-consent banner.
//  GA only loads AFTER the visitor clicks Accept (GDPR-friendly).
//  Set CONFIG.gaMeasurementId to turn it on.
// ============================================================
(function () {
  var GA_ID = (window.CONFIG && CONFIG.gaMeasurementId) || "";
  if (!GA_ID) return;   // analytics off until an ID is set

  var CONSENT_KEY = "mrpc.cookieConsent";
  var choice = localStorage.getItem(CONSENT_KEY);

  if (choice === "accepted") { loadGA(); return; }
  if (choice === "declined") { return; }
  // Show the banner whether or not DOMContentLoaded has already fired.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showBanner);
  else showBanner();

  function loadGA() {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", GA_ID);
  }

  function showBanner() {
    var b = document.createElement("div");
    b.className = "cookie-bar";
    b.innerHTML =
      '<span>We use cookies to count visits and see which cards people like. That\'s it.</span>' +
      '<span class="cookie-btns">' +
        '<button class="btn btn-gold btn-sm" id="ckAccept">Accept</button>' +
        '<button class="btn btn-outline btn-sm" id="ckDecline">No thanks</button>' +
      '</span>';
    document.body.appendChild(b);
    document.getElementById("ckAccept").onclick = function () {
      localStorage.setItem(CONSENT_KEY, "accepted"); b.remove(); loadGA();
    };
    document.getElementById("ckDecline").onclick = function () {
      localStorage.setItem(CONSENT_KEY, "declined"); b.remove();
    };
  }
})();
