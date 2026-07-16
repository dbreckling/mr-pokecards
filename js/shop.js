// ============================================================
//  Shop page: filter tabs, search, price buckets from the URL.
// ============================================================

let filter = getParam("filter") || "all";
let minPrice = parseFloat(getParam("min"));
let maxPrice = parseFloat(getParam("max"));
let query = "";

function publicCards() { return loadCards().filter(isPublicCard); }

function priceFiltered(cards) {
  if (isNaN(minPrice) && isNaN(maxPrice)) return cards;
  return cards.filter(c => {
    const p = c.price || 0;
    if (!isNaN(minPrice) && p < minPrice) return false;
    if (!isNaN(maxPrice) && p >= maxPrice) return false;
    return c.status === "sale";
  });
}

function render() {
  const all = priceFiltered(publicCards());

  const counts = {
    all: all.length,
    sale: all.filter(c => c.status === "sale").length,
    trade: all.filter(c => c.status === "trade").length,
    collection: all.filter(c => c.status === "collection").length
  };
  document.querySelectorAll(".tab").forEach(t => {
    const f = t.dataset.filter;
    t.classList.toggle("active", f === filter);
    const c = t.querySelector(".count");
    if (c) c.textContent = "(" + counts[f] + ")";
  });

  let shown = filter === "all" ? all : all.filter(c => c.status === filter);
  if (query) {
    const q = query.toLowerCase();
    shown = shown.filter(c =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.set || "").toLowerCase().includes(q));
  }

  const grid = document.getElementById("grid");
  grid.innerHTML = shown.length
    ? shown.map(cardTileHtml).join("")
    : '<div class="empty">No cards match. Try a different filter or search.</div>';
}

document.addEventListener("DOMContentLoaded", function () {
  // Title reflects any active price bucket / filter
  const title = document.getElementById("shopTitle");
  const sub = document.getElementById("shopSub");
  if (!isNaN(minPrice) || !isNaN(maxPrice)) {
    if (!isNaN(maxPrice) && maxPrice <= 10) title.textContent = "Cards Under $10";
    else if (!isNaN(minPrice) && minPrice >= 100) title.textContent = "Cards $100+";
    else title.textContent = "Cards " + (isNaN(minPrice) ? "" : "$" + minPrice) + (isNaN(maxPrice) ? "+" : " – $" + maxPrice);
    filter = "all";
  } else if (filter === "collection") {
    title.textContent = "My Collection";
    sub.textContent = "Cards Saxon is keeping and showing off.";
  } else if (filter === "trade") {
    title.textContent = "For Trade";
    sub.textContent = "Cards Saxon is open to trading.";
  }

  document.querySelectorAll(".tab").forEach(t => {
    t.addEventListener("click", () => { filter = t.dataset.filter; render(); });
  });
  const search = document.getElementById("search");
  search.addEventListener("input", e => { query = e.target.value; render(); });

  render();
});
