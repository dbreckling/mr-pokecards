// ============================================================
//  Shared UI: header, card tiles, helpers. Loaded on every page.
// ============================================================

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function money(n) {
  return CONFIG.currencySymbol + Number(n || 0).toFixed(2);
}

function statusLabel(s) {
  return s === "sale" ? "For Sale" : s === "trade" ? "For Trade" : "Collection";
}

// Map a condition to a 0-5 star rating for the condition report.
function condStars(condition) {
  const map = { "Mint": 5, "Near Mint": 5, "Graded": 5, "Good": 4, "Played": 3 };
  return map[condition] || 4;
}

// Mr PokeCards Grade — Saxon's own friendly scale (NOT a professional grade).
function pokeGrade(condition) {
  const map = {
    "Mint":      { tier: "Gem Mint",  stars: 5 },
    "Near Mint": { tier: "Near Mint", stars: 5 },
    "Graded":    { tier: "Slabbed",   stars: 5 },
    "Good":      { tier: "Great",     stars: 4 },
    "Played":    { tier: "Played",    stars: 3 }
  };
  return map[condition] || { tier: condition || "Ungraded", stars: 4 };
}

// Stable unique card ID (e.g. MPC-000421) derived from the card's id.
function cardCode(card) {
  if (card.cardId) return card.cardId;
  let h = 0;
  const s = String(card.id || card.name || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return "MPC-" + String(100000 + (h % 900000));
}
function starsHtml(n) {
  let out = "";
  for (let i = 1; i <= 5; i++) {
    out += i <= n ? "&#9733;" : '<span class="off">&#9733;</span>';
  }
  return '<span class="stars">' + out + "</span>";
}

function fmtCur(v, cur) {
  const sym = cur === "EUR" ? "€" : (cur === "USD" ? "$" : (CONFIG.currencySymbol || "$"));
  return sym + Number(v || 0).toFixed(2);
}

// Pull a real market value from a TCGdex card object (TCGplayer USD first, then Cardmarket EUR).
function extractMarketValue(card) {
  const p = card.pricing ||
    (card.variants_detailed && card.variants_detailed[0] && card.variants_detailed[0].pricing) || {};
  const tp = p.tcgplayer;
  if (tp) {
    for (const k of Object.keys(tp)) {
      const v = tp[k];
      if (v && typeof v === "object" && (v.marketPrice != null || v.midPrice != null)) {
        return { value: v.marketPrice != null ? v.marketPrice : v.midPrice,
                 currency: "USD", source: "TCGplayer", updated: (tp.updated || "").slice(0, 10) };
      }
    }
  }
  const cm = p.cardmarket;
  if (cm && (cm.trend != null || cm.avg != null)) {
    return { value: cm.trend != null ? cm.trend : cm.avg,
             currency: "EUR", source: "Cardmarket", updated: (cm.updated || "").slice(0, 10) };
  }
  return null;
}

function paypalMeLink(amount) {
  if (!CONFIG.paypalMeHandle) return "";
  return "https://www.paypal.com/paypalme/" +
    encodeURIComponent(CONFIG.paypalMeHandle) + "/" +
    Number(amount || 0).toFixed(2) + CONFIG.currencyCode;
}

function renderHeader(active) {
  const count = cartCount();
  const badge = count > 0 ? '<span class="cart-badge">' + count + "</span>" : "";
  return '' +
  '<div class="header-inner">' +
    '<a class="brand" href="index.html">' +
      '<img src="assets/logo.png" alt="Mr. PokeCards" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">' +
      '<div class="brand-text" style="display:none">' +
        '<div class="l1">MR <span class="poke">POKECARDS</span></div>' +
        '<div class="l2">COLLECT · TRADE · SELL</div>' +
      '</div>' +
    '</a>' +
    '<nav class="main-nav">' +
      '<a href="shop.html" class="' + (active === "shop" ? "active" : "") + '">Shop Cards</a>' +
      '<a href="shop.html?filter=collection" class="' + (active === "collection" ? "active" : "") + '">My Collection</a>' +
      '<a href="shop.html?filter=trade">For Trade</a>' +
      '<a href="index.html#about">About Saxon</a>' +
      '<a href="mailto:' + CONFIG.contactEmail + '">Contact</a>' +
    '</nav>' +
    '<div class="kid-badge"><span class="dot"></span> Support a Young Collector</div>' +
    '<div class="header-icons">' +
      '<a class="icon-btn" href="admin.html" title="Card manager" aria-label="Card manager">&#9881;</a>' +
      '<a class="icon-btn" href="cart.html" title="Cart" aria-label="Cart">&#128722;' + badge + '</a>' +
    '</div>' +
  '</div>';
}

function renderFooter() {
  const email = CONFIG.contactEmail;
  const ig = CONFIG.instagramUrl
    ? '<a href="' + CONFIG.instagramUrl + '">Instagram</a>'
    : '<span class="soon">Instagram (coming soon)</span>';
  const yt = CONFIG.youtubeUrl
    ? '<a href="' + CONFIG.youtubeUrl + '">YouTube</a>'
    : '<span class="soon">YouTube (coming soon)</span>';
  return '' +
  '<div class="footer-inner">' +
    '<div class="footer-story">' +
      '<h3>Every card has a story</h3>' +
      '<p>Some cards stay in my collection forever.<br>' +
      'Some cards help me buy my next booster pack.<br>' +
      'Thanks for helping me continue my collecting journey.</p>' +
      '<div class="footer-sign">&mdash; Saxon</div>' +
      '<div class="footer-stamp">Kid Owned &middot; Kid Collected &middot; Collector Approved</div>' +
    '</div>' +
    '<div class="footer-cols">' +
      '<div class="footer-col"><h4>Shop</h4>' +
        '<a href="shop.html">Shop Cards</a>' +
        '<a href="shop.html?filter=collection">My Collection</a>' +
        '<a href="shop.html?filter=trade">For Trade</a>' +
        '<a href="shop.html">New Arrivals</a>' +
      '</div>' +
      '<div class="footer-col"><h4>Collector Resources</h4>' +
        '<a href="info.html#care">Card Care</a>' +
        '<a href="info.html#shipping">Shipping</a>' +
        '<a href="info.html#faq">FAQ</a>' +
        '<a href="mailto:' + email + '">Contact</a>' +
      '</div>' +
      '<div class="footer-col"><h4>Follow My Journey</h4>' +
        ig + yt +
        '<a href="mailto:' + email + '?subject=' + encodeURIComponent("Newsletter signup") + '">Email Newsletter</a>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div class="footer-bottom">Mr. PokeCards &middot; built by Saxon &middot; ' +
    '<span class="dot"></span> Support a Young Collector</div>';
}

function updateCartBadge() {
  document.querySelectorAll(".site-header").forEach(h => {
    const active = h.getAttribute("data-active") || "";
    h.innerHTML = renderHeader(active);
  });
}

// Small tile used in rows and the shop grid.
function cardTileHtml(card) {
  const back = card.image
    ? '<img src="' + card.image + '" alt="' + escapeHtml(card.name) + '">'
    : '<div class="cardback"><div class="emblem">&#9733;</div><div class="nm">' + escapeHtml(card.name) + '</div></div>';
  const rarity = card.rarity && card.rarity !== "Common"
    ? '<span class="badge badge-rarity">' + escapeHtml(card.rarity) + '</span>' : "";
  const statusBadge = '<span class="badge badge-status ' + card.status + '">' + statusLabel(card.status) + '</span>';
  let foot;
  if (card.status === "sale") {
    foot = '<span class="pcard-price">' + money(card.price) + '</span>' +
      '<button class="mini-btn" title="Add to cart" aria-label="Add to cart" ' +
      'onclick="event.stopPropagation();event.preventDefault();addToCart(\'' + card.id + '\');updateCartBadge();">&#43;</button>';
  } else {
    foot = '<span class="pcard-price free">' + (card.status === "trade" ? "Open to trade" : "Not for sale") + '</span>';
  }
  return '<a class="pcard" href="card.html?id=' + encodeURIComponent(card.id) + '">' +
    '<div class="pcard-photo">' + statusBadge + rarity + back +
      '<span class="fav">&#9734;</span></div>' +
    '<div class="pcard-body">' +
      '<div class="pcard-name">' + escapeHtml(card.name) + '</div>' +
      '<div class="pcard-cond">' + escapeHtml(card.condition || "") +
        (card.set ? " · " + escapeHtml(card.set) : "") + '</div>' +
      '<div class="pcard-foot">' + foot + '</div>' +
    '</div>' +
  '</a>';
}

function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

document.addEventListener("DOMContentLoaded", function () {
  updateCartBadge();
  document.querySelectorAll(".site-footer").forEach(f => { f.innerHTML = renderFooter(); });
});
