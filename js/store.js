// ============================================================
//  Card storage. Cards are saved in the browser (localStorage)
//  so Saxon can add cards with no server needed.
//  Use "Save backup" on the admin page to export a file.
// ============================================================

const STORE_KEY = "mrpokecards.cards.v1";

// A few example cards so the site isn't empty on day one.
// Saxon can delete these on the admin page.
const SEED_CARDS = [
  {
    id: "seed1",
    name: "Charizard",
    set: "Base Set",
    number: "4/102",
    condition: "Near Mint",
    status: "sale",
    price: 25,
    notes: "My favorite fire type. Holo!",
    image: ""
  },
  {
    id: "seed2",
    name: "Pikachu",
    set: "Jungle",
    number: "60/64",
    condition: "Mint",
    status: "collection",
    price: 0,
    notes: "Not for sale, this one stays with me.",
    image: ""
  },
  {
    id: "seed3",
    name: "Bulbasaur",
    set: "Base Set",
    number: "44/102",
    condition: "Good",
    status: "trade",
    price: 0,
    notes: "Looking to trade for a water type.",
    image: ""
  }
];

function loadCards() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read saved cards:", e);
  }
  return SEED_CARDS.slice();
}

function saveCards(cards) {
  localStorage.setItem(STORE_KEY, JSON.stringify(cards));
}

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
  if (i !== -1) {
    cards[i] = Object.assign({}, cards[i], patch);
    saveCards(cards);
  }
  return cards[i];
}

function deleteCard(id) {
  const cards = loadCards().filter(c => c.id !== id);
  saveCards(cards);
}

function replaceAllCards(cards) {
  saveCards(cards);
}
