// ============================================================
//  Homepage: featured row, new arrivals, shop-by-value chips.
// ============================================================

function heroFanHtml(cards) {
  const angles = [
    "rotate(-15deg) translateY(16px)",
    "rotate(-5deg) translateY(-8px)",
    "rotate(5deg) translateY(-8px)",
    "rotate(15deg) translateY(16px)"
  ];
  const cards4 = cards.slice(0, 4);
  return '<div class="hero-fan">' + cards4.map(function (c, i) {
    const inner = c.image
      ? '<img src="' + c.image + '" alt="' + escapeHtml(c.name) + '">'
      : '<div class="hero-blank">&#9733;</div>';
    return '<a class="hero-card" href="card.html?id=' + encodeURIComponent(c.id) + '" ' +
      'title="' + escapeHtml(c.name) + '" style="transform:' + angles[i] + ';z-index:' + i + '">' +
      inner + '</a>';
  }).join("") + '</div>';
}

document.addEventListener("DOMContentLoaded", function () {
  const cards = loadCards();
  const forSale = cards.filter(c => c.status === "sale");

  // Stat: real count of available (for sale) cards
  const statEl = document.getElementById("statCount");
  if (statEl) statEl.textContent = forSale.length + " cards";

  // Hero fan: cards Saxon marked "hero" (up to 4). Falls back to the static image.
  const heroCards = cards.filter(c => c.hero).slice(0, 4);
  const heroArt = document.getElementById("heroArt");
  if (heroArt && heroCards.length) heroArt.innerHTML = heroFanHtml(heroCards);

  // Featured = cards Saxon checked "featured"; if none, fall back to the priciest for-sale cards
  const manual = cards.filter(c => c.featured);
  const featured = manual.length
    ? manual.slice(0, 10)
    : forSale.slice().sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 5);
  const fRow = document.getElementById("featuredRow");
  if (fRow) fRow.innerHTML = featured.map(cardTileHtml).join("") ||
    '<div class="empty">No cards yet. Add some in the card manager.</div>';

  // New arrivals = most recently added (cards are stored newest-first)
  const newest = cards.slice(0, 5);
  const nRow = document.getElementById("newRow");
  if (nRow) nRow.innerHTML = newest.map(cardTileHtml).join("");

  // Shop by value buckets (based on real prices)
  const buckets = [
    { t: "Under $10", ic: "&#128176;", max: 10, min: 0 },
    { t: "$10 – $25", ic: "&#127991;", max: 25, min: 10 },
    { t: "$25 – $100", ic: "&#127894;", max: 100, min: 25 },
    { t: "$100+", ic: "&#128081;", max: Infinity, min: 100 }
  ];
  const chips = document.getElementById("valueChips");
  if (chips) {
    chips.innerHTML = buckets.map(function (b) {
      const n = forSale.filter(c => (c.price || 0) >= b.min && (c.price || 0) < b.max).length;
      const q = "shop.html?min=" + b.min + (b.max === Infinity ? "" : "&max=" + b.max);
      return '<a class="chip" href="' + q + '">' +
        '<div class="ic">' + b.ic + '</div>' +
        '<div class="t">' + b.t + '</div>' +
        '<div class="n">' + n + ' card' + (n === 1 ? "" : "s") + '</div></a>';
    }).join("");
  }
});
