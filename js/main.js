// ============================================================
//  Homepage: featured row, new arrivals, shop-by-value chips.
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  const cards = loadCards();
  const forSale = cards.filter(c => c.status === "sale");

  // Stat: real count of available (for sale) cards
  const statEl = document.getElementById("statCount");
  if (statEl) statEl.textContent = forSale.length + " cards";

  // Featured = highest priced for-sale cards
  const featured = forSale.slice().sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 8);
  const fRow = document.getElementById("featuredRow");
  if (fRow) fRow.innerHTML = featured.map(cardTileHtml).join("") ||
    '<div class="empty">No cards yet. Add some in the card manager.</div>';

  // New arrivals = most recently added (cards are stored newest-first)
  const newest = cards.slice(0, 8);
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
