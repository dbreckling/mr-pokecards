// ============================================================
//  Card manager: Saxon adds, edits and removes cards here.
// ============================================================

let editingId = null;
let pickedStatus = "sale";
let pickedImage = "";

function el(id) { return document.getElementById(id); }

function pickStatus(s) {
  pickedStatus = s;
  document.querySelectorAll(".status-opt").forEach(o => {
    o.classList.toggle("on", o.dataset.status === s);
  });
  // Price only matters for "for sale"
  el("priceField").style.display = (s === "sale") ? "block" : "none";
}

function readPhoto(file) {
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) {
    alert("That photo is a little big. Try one under 4 MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    pickedImage = e.target.result;
    el("photoPreview").innerHTML =
      '<img src="' + pickedImage + '" alt="preview">' +
      '<div style="margin-top:8px;font-size:13px">Tap to change photo</div>';
  };
  reader.readAsDataURL(file);
}

function resetForm() {
  editingId = null;
  pickedImage = "";
  el("name").value = "";
  el("set").value = "";
  el("number").value = "";
  el("condition").value = "Near Mint";
  el("price").value = "";
  el("notes").value = "";
  el("photoPreview").innerHTML = "&#128247; Tap to add a photo";
  pickStatus("sale");
  el("saveBtn").textContent = "Add this card";
  el("cancelEdit").style.display = "none";
}

function saveForm() {
  const name = el("name").value.trim();
  if (!name) {
    alert("Please give the card a name first.");
    el("name").focus();
    return;
  }
  const data = {
    name: name,
    set: el("set").value.trim(),
    number: el("number").value.trim(),
    condition: el("condition").value,
    status: pickedStatus,
    price: pickedStatus === "sale" ? Number(el("price").value || 0) : 0,
    notes: el("notes").value.trim(),
    image: pickedImage
  };

  if (editingId) {
    updateCard(editingId, data);
  } else {
    addCard(data);
  }
  resetForm();
  renderList();
  flash("Saved! " + name + " is on your site.");
}

function editCard(id) {
  const card = loadCards().find(c => c.id === id);
  if (!card) return;
  editingId = id;
  pickedImage = card.image || "";
  el("name").value = card.name || "";
  el("set").value = card.set || "";
  el("number").value = card.number || "";
  el("condition").value = card.condition || "Near Mint";
  el("price").value = card.price || "";
  el("notes").value = card.notes || "";
  el("photoPreview").innerHTML = pickedImage
    ? '<img src="' + pickedImage + '" alt="preview"><div style="margin-top:8px;font-size:13px">Tap to change photo</div>'
    : "&#128247; Tap to add a photo";
  pickStatus(card.status || "sale");
  el("saveBtn").textContent = "Save changes";
  el("cancelEdit").style.display = "inline-flex";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function removeCard(id) {
  const card = loadCards().find(c => c.id === id);
  if (!card) return;
  if (confirm('Remove "' + card.name + '"?')) {
    deleteCard(id);
    renderList();
  }
}

function statusLabel(s) {
  return s === "sale" ? "For Sale" : s === "trade" ? "For Trade" : "Collection";
}

function renderList() {
  const cards = loadCards();
  const list = el("adminList");
  if (!cards.length) {
    list.innerHTML = '<div style="color:var(--muted)">No cards yet. Add your first one above!</div>';
    return;
  }
  list.innerHTML = cards.map(function (c) {
    const thumb = c.image
      ? '<img class="thumb" src="' + c.image + '" alt="">'
      : '<div class="thumb">&#9733;</div>';
    const price = c.status === "sale" ? " &middot; " + CONFIG.currencySymbol + Number(c.price || 0).toFixed(2) : "";
    return '<div class="admin-row">' +
      thumb +
      '<div class="info"><div class="nm">' + escapeHtml(c.name) + '</div>' +
      '<div class="mt">' + statusLabel(c.status) + price +
      (c.set ? " &middot; " + escapeHtml(c.set) : "") + '</div></div>' +
      '<button class="btn btn-ghost" onclick="editCard(\'' + c.id + '\')">Edit</button>' +
      '<button class="btn btn-danger" onclick="removeCard(\'' + c.id + '\')">Delete</button>' +
    '</div>';
  }).join("");
}

function flash(msg) {
  const f = el("flash");
  f.textContent = msg;
  f.style.display = "block";
  setTimeout(() => { f.style.display = "none"; }, 2500);
}

// ---- Backup / restore so cards aren't lost ----
function exportCards() {
  const data = JSON.stringify(loadCards(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mr-pokecards-backup.json";
  a.click();
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
    } catch (err) {
      alert("That file didn't look like a card backup.");
    }
  };
  reader.readAsText(file);
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".status-opt").forEach(o => {
    o.addEventListener("click", () => pickStatus(o.dataset.status));
  });
  el("photoInput").addEventListener("change", e => readPhoto(e.target.files[0]));
  el("photoDrop").addEventListener("click", () => el("photoInput").click());
  el("saveBtn").addEventListener("click", saveForm);
  el("cancelEdit").addEventListener("click", resetForm);
  el("exportBtn").addEventListener("click", exportCards);
  el("importInput").addEventListener("change", e => importCards(e.target.files[0]));
  resetForm();
  renderList();
});
