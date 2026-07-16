import { getStore } from "@netlify/blobs";

// Serves the shared card inventory. GET is public (everyone reads the same list).
// POST writes it, protected by the ADMIN_WRITE_KEY env var (set in Netlify).
export const config = { path: "/api/cards" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-admin-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { headers: CORS });

  const store = getStore("mrpokecards");

  if (req.method === "GET") {
    // Safe diagnostic: reports only whether the key is set + its length, never the value
    if (new URL(req.url).searchParams.has("debug")) {
      const k = process.env.ADMIN_WRITE_KEY || "";
      return json({ hasKey: !!k, keyLength: k.length });
    }
    const all = (await store.get("cards", { type: "json" })) || [];
    const key = req.headers.get("x-admin-key") || "";
    const isAdmin = process.env.ADMIN_WRITE_KEY && key === process.env.ADMIN_WRITE_KEY;
    // Public reads never include private Bulk/Personal cards
    return json(isAdmin ? all : all.filter(c => c && c.status !== "bulk"));
  }

  if (req.method === "POST") {
    const key = req.headers.get("x-admin-key") || "";
    if (!process.env.ADMIN_WRITE_KEY || key !== process.env.ADMIN_WRITE_KEY) {
      return json({ error: "unauthorized" }, 401);
    }
    let body = {};
    try { body = await req.json(); } catch (e) { /* ignore */ }
    if (body.verify) return json({ ok: true });          // used to check the password at login
    const cards = Array.isArray(body.cards) ? body.cards : [];
    await store.setJSON("cards", cards);
    return json({ ok: true, count: cards.length });
  }

  return json({ error: "method not allowed" }, 405);
};
