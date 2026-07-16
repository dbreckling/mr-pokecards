// ============================================================
//  Card + cart storage. Everything saves in the browser so
//  Saxon can run the shop with no server.
//  Use "Save backup" on the admin page to export a file.
// ============================================================

const STORE_KEY = "mrpokecards.cards.v1";
const CART_KEY = "mrpokecards.cart.v1";

// Example cards so the shop looks alive on day one.
// Saxon can delete these on the card manager.
const SEED_CARDS = [
  {
    id: "seed1", name: "Charizard ex", set: "Obsidian Flames", number: "125/197",
    rarity: "Ultra Rare", year: "2023", language: "English", cardType: "Pokémon ex",
    illustrator: "5ban Graphics", includes: "Sleeved + Top Loader",
    condition: "Near Mint", status: "sale", price: 129.99,
    notes: "The chase card of my collection. Pulled it myself!", image: ""
  },
  {
    id: "seed2", name: "Pikachu V", set: "Vivid Voltage", number: "043/185",
    rarity: "Ultra Rare", year: "2020", language: "English", cardType: "Pokémon V",
    condition: "Near Mint", status: "sale", price: 49.99,
    notes: "Classic Pikachu V, super clean.", image: ""
  },
  {
    id: "seed3", name: "Umbreon VMAX", set: "Evolving Skies", number: "215/203",
    rarity: "Ultra Rare", year: "2021", language: "English", cardType: "Pokémon VMAX",
    condition: "Near Mint", status: "sale", price: 89.99,
    notes: "Moonbreon! One of the coolest cards ever.", image: ""
  },
  {
    id: "seed4", name: "Lugia V", set: "Silver Tempest", number: "138/195",
    rarity: "Ultra Rare", year: "2022", language: "English", cardType: "Pokémon V",
    condition: "Near Mint", status: "sale", price: 74.99, notes: "", image: ""
  },
  {
    id: "seed5", name: "Gengar ex", set: "Obsidian Flames", number: "155/197",
    rarity: "Ultra Rare", year: "2023", language: "English", cardType: "Pokémon ex",
    condition: "Near Mint", status: "sale", price: 39.99, notes: "", image: ""
  },
  {
    id: "seed6", name: "Mega Lucario ex", set: "Brilliant Stars", number: "112/172",
    rarity: "Ultra Rare", year: "2022", language: "English", cardType: "Pokémon ex",
    illustrator: "5ban Graphics", includes: "Sleeved + Top Loader",
    condition: "Near Mint", status: "sale", price: 34.99,
    notes: "I pulled this from my second Brilliant Stars ETB! Lucario is one of my favorite Pokémon because he's awesome in the games.",
    image: ""
  },
  {
    id: "seed7", name: "Arceus VSTAR", set: "Brilliant Stars", number: "123/172",
    rarity: "Ultra Rare", year: "2022", language: "English", cardType: "Pokémon VSTAR",
    condition: "Near Mint", status: "sale", price: 34.99, notes: "", image: ""
  },
  {
    id: "seed8", name: "Mew ex", set: "151", number: "151/165",
    rarity: "Ultra Rare", year: "2023", language: "English", cardType: "Pokémon ex",
    condition: "Near Mint", status: "sale", price: 49.99, notes: "", image: ""
  },
  {
    id: "seed9", name: "Rayquaza VMAX", set: "Evolving Skies", number: "111/203",
    rarity: "Ultra Rare", year: "2021", language: "English", cardType: "Pokémon VMAX",
    condition: "Near Mint", status: "sale", price: 44.99, qty: 2,
    notes: "I have two of these!", image: ""
  },
  {
    id: "seed13", name: "Bulk Commons & Energy", set: "Mixed sets", number: "",
    rarity: "Common", year: "", language: "English", cardType: "Pokémon",
    condition: "Played", status: "bulk", price: 0, qty: 240,
    notes: "My bulk box. Just for tracking, not for the shop.", image: ""
  },
  {
    id: "seed10", name: "Pikachu", set: "Jungle", number: "60/64",
    rarity: "Common", year: "1999", language: "English", cardType: "Pokémon",
    condition: "Mint", status: "collection", price: 0,
    notes: "My very first Pokémon card. This one stays with me forever.", image: ""
  },
  {
    id: "seed11", name: "Bulbasaur", set: "Base Set", number: "44/102",
    rarity: "Common", year: "1999", language: "English", cardType: "Pokémon",
    condition: "Good", status: "trade", price: 0,
    notes: "Up for trade, looking for a water starter.", image: ""
  },
  {
    id: "seed12", name: "Mimikyu", set: "Paldea Evolved", number: "097/193",
    rarity: "Rare", year: "2023", language: "English", cardType: "Pokémon",
    condition: "Near Mint", status: "sale", price: 14.99, notes: "", image: ""
  }
];

function loadCards() {
  // 1) Saxon's own edits in this browser (the admin working copy)
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn("Could not read saved cards:", e); }
  // 2) The published shop inventory (cards.js sets window.MRPC_CARDS) — what customers see
  if (typeof window !== "undefined" && Array.isArray(window.MRPC_CARDS) && window.MRPC_CARDS.length) {
    return window.MRPC_CARDS.slice();
  }
  // 3) Built-in demo cards
  return SEED_CARDS.slice();
}

function saveCards(cards) { localStorage.setItem(STORE_KEY, JSON.stringify(cards)); }

function getCard(id) { return loadCards().find(c => c.id === id) || null; }

function addCard(card) {
  const cards = loadCards();
  card.id = "c" + Date.now();
  cards.unshift(card);
  saveCards(cards);
  return card;
}

function updateCard(id, patch) {
  const cards = loadCards();
  const i = cards.findIndex(c => c.id === id);
  if (i !== -1) { cards[i] = Object.assign({}, cards[i], patch); saveCards(cards); }
  return cards[i];
}

function deleteCard(id) { saveCards(loadCards().filter(c => c.id !== id)); }
function replaceAllCards(cards) { saveCards(cards); }

// ---- Cart (for-sale cards only) ----
function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
// How many of a card can actually be bought (0 unless it's for sale + in stock).
function cardAvail(card) {
  if (!card || card.status !== "sale") return 0;
  const q = Number(card.qty);
  return Math.max(0, Number.isFinite(q) ? q : 1);
}
function addToCart(id) {
  const cart = loadCart();
  const max = cardAvail(getCard(id));
  const cur = cart[id] || 0;
  if (cur >= max) {
    if (max > 0 && typeof alert === "function") alert("Only " + max + " of this card " + (max === 1 ? "is" : "are") + " available.");
    return cartCount();
  }
  cart[id] = cur + 1;
  saveCart(cart);
  return cartCount();
}
function setCartQty(id, qty) {
  const cart = loadCart();
  const max = cardAvail(getCard(id));
  qty = Math.min(qty, max);          // never exceed stock
  if (qty <= 0) delete cart[id]; else cart[id] = qty;
  saveCart(cart);
}
function removeFromCart(id) { const cart = loadCart(); delete cart[id]; saveCart(cart); }
function clearCart() { saveCart({}); }
function cartCount() {
  const cart = loadCart();
  return Object.values(cart).reduce((a, b) => a + b, 0);
}
function cartItems() {
  const cart = loadCart();
  return Object.keys(cart).map(id => {
    const card = getCard(id);
    if (!card) return null;
    const max = cardAvail(card);
    if (max <= 0) return null;                 // sold out / no longer for sale
    return { card: card, qty: Math.min(cart[id], max) };   // never exceed stock
  }).filter(Boolean);
}
function cartTotal() {
  return cartItems().reduce((sum, it) => sum + Number(it.card.price || 0) * it.qty, 0);
}
