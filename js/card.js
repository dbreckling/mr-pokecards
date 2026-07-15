// ============================================================
//  Product detail page.
// ============================================================

function mediaHtml(card) {
  const main = card.image
    ? '<img src="' + card.image + '" alt="' + escapeHtml(card.name) + '">'
    : '<div class="cardback"><div class="emblem" style="width:96px;height:96px;font-size:44px">&#9733;</div>' +
      '<div class="nm" style="font-size:20px">' + escapeHtml(card.name) + '</div></div>';
  const thumb = card.image
    ? '<div class="pdp-thumb active"><img src="' + card.image + '" alt=""></div>'
    : '<div class="pdp-thumb active">&#9733;</div>';
  return '<div class="pdp-media">' +
    '<div class="pdp-thumbs">' + thumb + '</div>' +
    '<div class="pdp-main">' + main + '</div>' +
  '</div>';
}

function actionsHtml(card) {
  if (card.status === "sale") {
    const link = paypalMeLink(card.price);
    const buy = link
      ? '<a class="btn btn-gold btn-lg btn-block" href="' + link + '" target="_blank" rel="noopener">Buy Now · ' + money(card.price) + '</a>'
      : '<button class="btn btn-gold btn-lg btn-block" onclick="alert(\'Ask a grown-up to set the PayPal.me username in js/config.js so Buy Now works.\')">Buy Now · ' + money(card.price) + '</button>';
    return buy +
      '<button class="btn btn-outline btn-lg btn-block" onclick="addToCart(\'' + card.id + '\');updateCartBadge();this.textContent=\'Added to cart \\u2713\';">' +
      '&#128722; Add to Cart</button>';
  }
  if (card.status === "trade") {
    const subject = "Trade offer: " + card.name;
    const body = "Hi! I'd like to talk about trading for your " + card.name + " (" + (card.set || "") + " " + (card.number || "") + ").";
    const href = "mailto:" + CONFIG.contactEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    return '<a class="btn btn-gold btn-lg btn-block" href="' + href + '">Propose a Trade</a>';
  }
  const href = "mailto:" + CONFIG.contactEmail + "?subject=" + encodeURIComponent("Question about: " + card.name);
  return '<div class="meta-pill" style="padding:14px;text-align:center;width:100%">&#128274; In Saxon\'s personal collection — not for sale</div>' +
    '<a class="btn btn-outline btn-lg btn-block" href="' + href + '">Ask about this card</a>';
}

function specRow(k, v) {
  if (!v) return "";
  return '<div class="spec-row"><span class="k">' + k + '</span><span class="v">' + escapeHtml(v) + '</span></div>';
}

function pdpHtml(card) {
  const rarity = card.rarity ? '<span class="rarity-tag">' + escapeHtml(card.rarity) + '</span>' : "";
  const setline = [card.set, card.number ? "#" + card.number : ""].filter(Boolean).join(" ");
  const priceBlock = card.status === "sale" ? '<div class="pdp-price">' + money(card.price) + '</div>' : "";
  const shipPill = card.status === "sale"
    ? '<span class="meta-pill">' + escapeHtml(card.condition || "Near Mint") + '</span><span class="meta-pill ships">&#10003; Ships next business day</span>'
    : '<span class="meta-pill">' + escapeHtml(card.condition || "") + '</span><span class="meta-pill">' + statusLabel(card.status) + '</span>';

  const info = '<div class="pdp-info">' +
    rarity +
    '<h1>' + escapeHtml(card.name) + '</h1>' +
    (setline ? '<div class="setline">' + escapeHtml(setline) + '</div>' : "") +
    priceBlock +
    '<div class="pdp-meta">' + shipPill + '</div>' +
    '<div class="pdp-actions">' + actionsHtml(card) + '</div>' +
    '<div class="watchlist"><span class="ic">&#9734;</span> Add to Watchlist</div>' +
    '<div class="guarantee"><span class="ic">&#128737;</span><div>' +
      '<div class="t">100% Authentic Guarantee</div>' +
      '<div class="s">Hand checked by Saxon, or your money back.</div>' +
    '</div></div>' +
    verifyCardHtml(card) +
  '</div>';

  return '<div class="pdp">' + mediaHtml(card) + info + '</div>' + panelsHtml(card);
}

function verifyCardHtml(card) {
  return '<div class="verify-card">' +
    '<div class="verify-info">' +
      '<div class="verify-badge"><span class="ic">&#10003;</span> Verified by Saxon</div>' +
      '<div class="verify-id">Card ID: <b>' + cardCode(card) + '</b></div>' +
      '<div class="verify-sub">Scan to open this card\'s page anytime.</div>' +
    '</div>' +
    '<div class="verify-qr" id="qr"></div>' +
  '</div>';
}

function panelsHtml(card) {
  const details = '<div class="info-panel"><h3>Card Details</h3>' +
    specRow("Set", card.set) +
    specRow("Card Number", card.number) +
    specRow("Language", card.language) +
    specRow("Condition", card.condition) +
    specRow("Rarity", card.rarity) +
    specRow("Card Type", card.cardType) +
    specRow("Illustrator", card.illustrator) +
    specRow("Year", card.year) +
    specRow("Includes", card.includes) +
  '</div>';

  const notes = card.notes ? '<div class="info-panel"><h3>Saxon\'s Notes</h3>' +
    '<div class="notes-quote"><span class="mark">&#8220;</span> ' + escapeHtml(card.notes) + '</div>' +
    '<div class="notes-by">— Saxon &#10084;</div></div>' :
    '<div class="info-panel"><h3>Saxon\'s Notes</h3><div class="notes-quote" style="color:var(--muted)">No notes on this one yet.</div></div>';

  const g = pokeGrade(card.condition);
  const n = condStars(card.condition);
  const aspects = ["Centering", "Corners", "Edges", "Surface"];
  const cond = '<div class="info-panel"><h3>Mr PokeCards Grade</h3>' +
    '<div class="grade-badge">' +
      '<span class="grade-shield">&#9733;</span>' +
      '<div><div class="grade-tier">' + escapeHtml(g.tier) + '</div>' + starsHtml(g.stars) + '</div>' +
    '</div>' +
    aspects.map(a => '<div class="cond-row"><span class="k">' + a + '</span>' + starsHtml(n) + '</div>').join("") +
    '<div class="grade-note">Saxon\'s own honest grade, not a professional grading service.</div>' +
  '</div>';

  return '<div class="pdp-panels">' + details + notes + cond + '</div>';
}

document.addEventListener("DOMContentLoaded", function () {
  const id = getParam("id");
  const card = id ? getCard(id) : null;
  const crumb = document.getElementById("crumb");
  const pdp = document.getElementById("pdp");

  if (!card) {
    crumb.innerHTML = '<a href="index.html">Home</a><span class="sep">/</span><span class="cur">Not found</span>';
    pdp.innerHTML = '<div class="empty">That card could not be found. <a href="shop.html" style="color:var(--gold)">Back to shop</a></div>';
    return;
  }

  document.title = card.name + " — Mr. PokeCards";
  crumb.innerHTML = '<a href="index.html">Home</a><span class="sep">/</span>' +
    '<a href="shop.html">Shop Cards</a>' +
    (card.set ? '<span class="sep">/</span><span>' + escapeHtml(card.set) + '</span>' : "") +
    '<span class="sep">/</span><span class="cur">' + escapeHtml(card.name) + '</span>';

  pdp.innerHTML = pdpHtml(card);

  // Build the scan-to-verify QR pointing at this exact card page (adapts to whatever domain the site is on)
  const qrEl = document.getElementById("qr");
  if (qrEl && typeof QRCode !== "undefined") {
    const url = location.origin + location.pathname + "?id=" + encodeURIComponent(card.id);
    new QRCode(qrEl, {
      text: url, width: 92, height: 92,
      colorDark: "#0a0e1a", colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  // Related: same set first, then others; exclude this card
  const others = loadCards().filter(c => c.id !== card.id);
  const sameSet = others.filter(c => c.set && c.set === card.set);
  const rest = others.filter(c => !c.set || c.set !== card.set);
  const related = sameSet.concat(rest).slice(0, 8);
  document.getElementById("relatedRow").innerHTML = related.map(cardTileHtml).join("");
});
