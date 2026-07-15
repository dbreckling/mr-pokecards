// ============================================================
//  Storefront: shows the cards and the Buy / Trade buttons.
// ============================================================

let currentFilter = "all";

function money(n) {
  return CONFIG.currencySymbol + Number(n || 0).toFixed(2);
}

function paypalLink(card) {
  if (!CONFIG.paypalMeHandle) return "";
  const amount = Number(card.price || 0).toFixed(2);
  return "https://www.paypal.com/paypalme/" +
    encodeURIComponent(CONFIG.paypalMeHandle) + "/" + amount + CONFIG.currencyCode;
}

function tradeLink(card) {
  const subject = "Trade offer: " + card.name;
  const body = "Hi! I'd like to talk about trading for your " + card.name +
    " (" + (card.set || "") + " " + (card.number || "") + ").";
  return "mailto:" + CONFIG.contactEmail +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body);
}

function askLink(card) {
  const subject = "Question about: " + card.name;
  return "mailto:" + CONFIG.contactEmail + "?subject=" + encodeURIComponent(subject);
}

function photoHtml(card) {
  if (card.image) {
    return '<img src="' + card.image + '" alt="' + escapeHtml(card.name) + '">';
  }
  return '<div class="cardback"><div class="emblem">&#9733;</div>' +
    '<div class="nm">' + escapeHtml(card.name) + '</div></div>';
}

function ribbonHtml(status) {
  if (status === "sale") return '<div class="ribbon sale">For Sale</div>';
  if (status === "trade") return '<div class="ribbon trade">For Trade</div>';
  return '<div class="ribbon collection">Collection</div>';
}

function footHtml(card) {
  if (card.status === "sale") {
    const link = paypalLink(card);
    if (link) {
      return '<div class="card-price">' + money(card.price) + '</div>' +
        '<a class="btn btn-green btn-block" href="' + link + '" target="_blank" rel="noopener">' +
        'Buy with PayPal</a>';
    }
    return '<div class="card-price">' + money(card.price) + '</div>' +
      '<button class="btn btn-ghost btn-block" onclick="alert(\'Ask a grown-up to add a PayPal.me username in js/config.js so this button works.\')">Buy with PayPal</button>';
  }
  if (card.status === "trade") {
    return '<a class="btn btn-navy btn-block" href="' + tradeLink(card) + '">Propose a trade</a>';
  }
  return '<span class="pill">Not for sale &#128274;</span>' +
    '<div style="height:8px"></div>' +
    '<a class="btn btn-ghost btn-block" href="' + askLink(card) + '">Ask about this card</a>';
}

function cardHtml(card) {
  const meta = [card.set, card.number].filter(Boolean).join(" &middot; ");
  const cond = card.condition ? '<div class="card-meta">Condition: ' + escapeHtml(card.condition) + '</div>' : "";
  const notes = card.notes ? '<div class="card-notes">' + escapeHtml(card.notes) + '</div>' : "";
  return '<div class="card">' +
    '<div class="card-photo">' + ribbonHtml(card.status) + photoHtml(card) + '</div>' +
    '<div class="card-body">' +
      '<div class="card-name">' + escapeHtml(card.name) + '</div>' +
      (meta ? '<div class="card-meta">' + meta + '</div>' : "") +
      cond + notes +
      '<div class="card-foot">' + footHtml(card) + '</div>' +
    '</div>' +
  '</div>';
}

function render() {
  const cards = loadCards();
  const counts = {
    all: cards.length,
    sale: cards.filter(c => c.status === "sale").length,
    trade: cards.filter(c => c.status === "trade").length,
    collection: cards.filter(c => c.status === "collection").length
  };
  document.querySelectorAll(".tab").forEach(t => {
    const f = t.dataset.filter;
    t.classList.toggle("active", f === currentFilter);
    const c = t.querySelector(".count");
    if (c) c.textContent = "(" + counts[f] + ")";
  });

  const shown = currentFilter === "all"
    ? cards
    : cards.filter(c => c.status === currentFilter);

  const grid = document.getElementById("grid");
  if (!shown.length) {
    grid.innerHTML = '<div class="empty">No cards here yet. Add some on the ' +
      '<a href="admin.html">card manager</a>!</div>';
    return;
  }
  grid.innerHTML = shown.map(cardHtml).join("");
}

function setFilter(f) {
  currentFilter = f;
  render();
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("siteName").textContent = CONFIG.siteName;
  document.getElementById("siteName2").textContent = CONFIG.siteName;
  document.querySelectorAll(".tab").forEach(t => {
    t.addEventListener("click", () => setFilter(t.dataset.filter));
  });
  render();
});
