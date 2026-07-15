// ============================================================
//  Card manager: lookup (TCGdex), add, edit, remove cards.
// ============================================================

let editingId = null;
let pickedStatus = "sale";
let pickedImage = "";      // main image (official URL from lookup, or uploaded)
let pickedImages = [];     // Saxon's own additional photos (data URLs)
let pickedEst = null;      // { value, currency, source, updated } market value from lookup
let pickedGuide = null;    // rich price guide (range + 30-day trend) from lookup

const EXTRA_FIELDS = ["set", "number", "year", "language", "cardType", "illustrator", "includes"];
const TCGDEX = "https://api.tcgdex.net/v2";

function el(id) { return document.getElementById(id); }

function pickStatus(s) {
  pickedStatus = s;
  document.querySelectorAll(".status-opt").forEach(o => o.classList.toggle("on", o.dataset.status === s));
  el("priceField").style.display = (s === "sale") ? "block" : "none";
}

// ---------- Images ----------
function renderMainPreview() {
  el("mainPreview").innerHTML = pickedImage
    ? '<img src="' + pickedImage + '" alt="main"><div style="margin-top:8px;font-size:13px">Tap to replace main image</div>'
    : "&#128247; Use Card lookup above, or tap to upload";
}

function renderAddThumbs() {
  el("addThumbs").innerHTML = pickedImages.map(function (src, i) {
    return '<div class="add-thumb"><img src="' + src + '" alt="">' +
      '<button type="button" onclick="removeAddImage(' + i + ')" aria-label="Remove">&times;</button></div>';
  }).join("");
}

function removeAddImage(i) { pickedImages.splice(i, 1); renderAddThumbs(); }

function updateEstHint() {
  const h = el("estHint");
  if (pickedEst && pickedEst.value != null) {
    h.style.display = "block";
    h.innerHTML = "Market value ~" + fmtCur(pickedEst.value, pickedEst.currency) +
      " (" + escapeHtml(pickedEst.source) + (pickedEst.updated ? ", " + escapeHtml(pickedEst.updated) : "") + ")";
  } else {
    h.style.display = "none";
  }
}

function readImageFile(file, cb) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert("That photo is a little big. Try one under 5 MB."); return; }
  const reader = new FileReader();
  reader.onload = e => cb(e.target.result);
  reader.readAsDataURL(file);
}

// ---------- TCGdex lookup ----------
function addOrSelectOption(sel, value) {
  if (!value) return;
  let found = false;
  [...sel.options].forEach(o => { if (o.value.toLowerCase() === value.toLowerCase()) { sel.value = o.value; found = true; } });
  if (!found) { const o = document.createElement("option"); o.value = value; o.textContent = value; sel.appendChild(o); sel.value = value; }
}

async function jget(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

// From a list of candidate sets, pick the best: prefer the one whose official
// count matches the printed "/NNN" total; otherwise the largest set (the main
// set over subsets like Trainer Gallery).
function pickSet(cands, denom) {
  if (!cands || !cands.length) return null;
  if (denom) {
    const d = parseInt(denom, 10);
    const exact = cands.filter(s => s.cardCount && s.cardCount.official === d);
    if (exact.length) return exact[0].id;
  }
  const sorted = cands.slice().sort((a, b) =>
    ((b.cardCount && b.cardCount.official) || 0) - ((a.cardCount && a.cardCount.official) || 0));
  return sorted[0].id;
}

async function resolveSetId(setCode, lang, denom) {
  // Try official abbreviation first (may return several sets that share a code)
  const byAbbr = await jget(TCGDEX + "/" + lang + "/sets?abbreviation.official=" + encodeURIComponent(setCode.toUpperCase()));
  if (Array.isArray(byAbbr) && byAbbr.length) {
    const id = pickSet(byAbbr, denom);
    if (id) return id;
  }
  // Fallback: match by set name (any language)
  const all = await jget(TCGDEX + "/" + lang + "/sets");
  const q = setCode.toLowerCase();
  const matches = all.filter(s => (s.name || "").toLowerCase().includes(q));
  return pickSet(matches, denom);
}

async function doLookup() {
  const setCode = el("luSet").value.trim();
  const lang = el("luLang").value;
  const numRaw = el("luNum").value.trim();
  const out = el("luResult");
  if (!setCode || !numRaw) { out.innerHTML = '<div class="lu-msg">Enter a set code and a card number first.</div>'; return; }

  const parts = numRaw.split("/");
  const localId = parts[0].trim();
  const denom = (parts[1] || "").trim();
  out.innerHTML = '<div class="lu-msg">Looking up&hellip;</div>';

  try {
    const setId = await resolveSetId(setCode, lang, denom);
    if (!setId) { out.innerHTML = '<div class="lu-msg err">Couldn\'t find set "' + escapeHtml(setCode) + '". Check the code (e.g. MEG) or just fill the form manually.</div>'; return; }

    const setObj = await jget(TCGDEX + "/" + lang + "/sets/" + setId);
    const official = setObj.cardCount && setObj.cardCount.official;
    const year = (setObj.releaseDate || "").slice(0, 4);

    let card;
    try {
      card = await jget(TCGDEX + "/" + lang + "/cards/" + setId + "-" + localId);
    } catch (e) {
      out.innerHTML = '<div class="lu-msg err">No card #' + escapeHtml(localId) + ' found in ' + escapeHtml(setObj.name) + '.</div>';
      return;
    }

    // Fill the form
    el("name").value = card.name || "";
    el("set").value = setObj.name || "";
    el("number").value = card.localId + (official ? "/" + official : "");
    addOrSelectOption(el("rarity"), card.rarity || "");
    if (el("year")) el("year").value = year || "";
    if (el("language")) el("language").value = (lang === "es") ? "Spanish" : "English";
    if (el("illustrator")) el("illustrator").value = card.illustrator || "";
    if (el("cardType")) el("cardType").value = card.category === "Pokemon" ? "Pokémon" : (card.category || "");

    // Main image = official card image
    pickedImage = card.image ? card.image + "/high.webp" : "";
    renderMainPreview();

    // Real market value (TCGplayer USD, else Cardmarket EUR) + full price guide
    pickedEst = extractMarketValue(card);
    pickedGuide = extractPriceGuide(card);
    updateEstHint();
    const estLine = (pickedEst && pickedEst.value != null)
      ? '<div class="lu-sub">Market value ~' + fmtCur(pickedEst.value, pickedEst.currency) +
        ' (' + escapeHtml(pickedEst.source) + ')</div>' : "";

    out.innerHTML = '<div class="lu-card">' +
      (pickedImage ? '<img src="' + pickedImage + '" alt="">' : "") +
      '<div><div class="lu-name">' + escapeHtml(card.name) + '</div>' +
      '<div class="lu-sub">' + escapeHtml(setObj.name) + ' &middot; #' + escapeHtml(card.localId) +
      (official ? "/" + official : "") + ' &middot; ' + escapeHtml(card.rarity || "") + '</div>' +
      estLine +
      '<div class="lu-ok">&#10003; Details filled in below. Now add your own photos.</div></div></div>';
  } catch (e) {
    out.innerHTML = '<div class="lu-msg err">Lookup failed (network issue). You can still fill the form manually.</div>';
  }
}

// ---------- Form ----------
function resetForm() {
  editingId = null;
  pickedImage = "";
  pickedImages = [];
  pickedEst = null;
  pickedGuide = null;
  el("name").value = "";
  el("condition").value = "Near Mint";
  el("rarity").value = "";
  el("price").value = "";
  el("notes").value = "";
  el("featured").checked = false;
  el("hero").checked = false;
  EXTRA_FIELDS.forEach(f => { if (el(f)) el(f).value = ""; });
  renderMainPreview();
  renderAddThumbs();
  updateEstHint();
  el("luResult").innerHTML = "";
  pickStatus("sale");
  el("saveBtn").textContent = "Add this card";
  el("cancelEdit").style.display = "none";
}

function saveForm() {
  const name = el("name").value.trim();
  if (!name) { alert("Please give the card a name first (or use Card lookup)."); el("name").focus(); return; }
  // If no main image but Saxon added photos, promote the first photo to main
  let main = pickedImage, extras = pickedImages.slice();
  if (!main && extras.length) { main = extras.shift(); }

  const data = {
    name: name,
    condition: el("condition").value,
    rarity: el("rarity").value,
    status: pickedStatus,
    price: pickedStatus === "sale" ? Number(el("price").value || 0) : 0,
    notes: el("notes").value.trim(),
    image: main,
    images: extras,
    featured: el("featured").checked,
    hero: el("hero").checked
  };
  EXTRA_FIELDS.forEach(f => { if (el(f)) data[f] = el(f).value.trim(); });
  if (pickedEst && pickedEst.value != null) {
    data.estValue = pickedEst.value;
    data.estCurrency = pickedEst.currency;
    data.estSource = pickedEst.source;
    data.estUpdated = pickedEst.updated;
  } else {
    data.estValue = null;
  }
  data.priceGuide = pickedGuide || null;

  if (editingId) updateCard(editingId, data); else addCard(data);
  resetForm();
  renderList();
  flash("Saved! " + name + " is on your site.");
}

function editCard(id) {
  const card = getCard(id);
  if (!card) return;
  editingId = id;
  pickedImage = card.image || "";
  pickedImages = (card.images || []).slice();
  el("name").value = card.name || "";
  el("condition").value = card.condition || "Near Mint";
  addOrSelectOption(el("rarity"), card.rarity || "");
  if (!card.rarity) el("rarity").value = "";
  el("price").value = card.price || "";
  el("notes").value = card.notes || "";
  el("featured").checked = !!card.featured;
  el("hero").checked = !!card.hero;
  pickedEst = card.estValue != null
    ? { value: card.estValue, currency: card.estCurrency, source: card.estSource, updated: card.estUpdated }
    : null;
  pickedGuide = card.priceGuide || null;
  EXTRA_FIELDS.forEach(f => { if (el(f)) el(f).value = card[f] || ""; });
  renderMainPreview();
  renderAddThumbs();
  updateEstHint();
  pickStatus(card.status || "sale");
  el("saveBtn").textContent = "Save changes";
  el("cancelEdit").style.display = "inline-flex";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function removeCard(id) {
  const card = getCard(id);
  if (!card) return;
  if (confirm('Remove "' + card.name + '"?')) { deleteCard(id); renderList(); }
}

function renderList() {
  const cards = loadCards();
  const list = el("adminList");
  if (!cards.length) { list.innerHTML = '<div style="color:var(--muted)">No cards yet. Add your first one above!</div>'; return; }
  list.innerHTML = cards.map(function (c) {
    const thumb = c.image ? '<img class="thumb" src="' + c.image + '" alt="">' : '<div class="thumb">&#9733;</div>';
    const price = c.status === "sale" ? " · " + money(c.price) : "";
    const extra = (c.images && c.images.length) ? " · " + c.images.length + " photo" + (c.images.length === 1 ? "" : "s") : "";
    return '<div class="admin-row">' + thumb +
      '<div class="info"><div class="nm">' + escapeHtml(c.name) + '</div>' +
      '<div class="mt">' + statusLabel(c.status) + price +
      (c.set ? " · " + escapeHtml(c.set) : "") + extra + '</div></div>' +
      '<button class="btn btn-outline btn-sm" onclick="editCard(\'' + c.id + '\')">Edit</button>' +
      '<button class="btn btn-danger btn-sm" onclick="removeCard(\'' + c.id + '\')">Delete</button>' +
    '</div>';
  }).join("");
}

function flash(msg) {
  const f = el("flash");
  f.textContent = msg; f.style.display = "block";
  setTimeout(() => { f.style.display = "none"; }, 2500);
}

function exportCards() {
  const data = JSON.stringify(loadCards(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "mr-pokecards-backup.json"; a.click();
  URL.revokeObjectURL(url);
}

function importCards(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const cards = JSON.parse(e.target.result);
      if (!Array.isArray(cards)) throw new Error("not a list");
      replaceAllCards(cards);
      renderList();
      flash("Restored " + cards.length + " cards from backup.");
    } catch (err) { alert("That file didn't look like a card backup."); }
  };
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".status-opt").forEach(o => o.addEventListener("click", () => pickStatus(o.dataset.status)));

  el("luBtn").addEventListener("click", doLookup);
  el("luNum").addEventListener("keydown", e => { if (e.key === "Enter") doLookup(); });

  el("mainDrop").addEventListener("click", () => el("mainInput").click());
  el("mainInput").addEventListener("change", e => readImageFile(e.target.files[0], src => { pickedImage = src; renderMainPreview(); }));

  el("addDrop").addEventListener("click", () => el("addInput").click());
  el("addInput").addEventListener("change", e => {
    [...e.target.files].forEach(f => readImageFile(f, src => { pickedImages.push(src); renderAddThumbs(); }));
    e.target.value = "";
  });

  el("saveBtn").addEventListener("click", saveForm);
  el("cancelEdit").addEventListener("click", resetForm);
  el("exportBtn").addEventListener("click", exportCards);
  el("importInput").addEventListener("change", e => importCards(e.target.files[0]));

  resetForm();
  renderList();
});
