import { getStore } from "@netlify/blobs";

// Orders: buyers submit (public POST), Saxon reads/updates (admin key required).
export const config = { path: "/api/orders" };

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
  const key = req.headers.get("x-admin-key") || "";
  const isAdmin = process.env.ADMIN_WRITE_KEY && key === process.env.ADMIN_WRITE_KEY;

  if (req.method === "GET") {
    if (!isAdmin) return json({ error: "unauthorized" }, 401); // orders are private
    const orders = (await store.get("orders", { type: "json" })) || [];
    return json(orders);
  }

  if (req.method === "POST") {
    let body = {};
    try { body = await req.json(); } catch (e) { /* ignore */ }

    // Admin replace (status updates)
    if (body.orders) {
      if (!isAdmin) return json({ error: "unauthorized" }, 401);
      await store.setJSON("orders", Array.isArray(body.orders) ? body.orders : []);
      return json({ ok: true });
    }

    // Public new order
    const o = body.newOrder;
    if (!o || typeof o !== "object" || !Array.isArray(o.items) || !o.items.length) {
      return json({ error: "bad order" }, 400);
    }
    const orders = (await store.get("orders", { type: "json" })) || [];
    orders.unshift(o);
    if (orders.length > 1000) orders.length = 1000; // safety cap
    await store.setJSON("orders", orders);
    return json({ ok: true, no: o.no });
  }

  return json({ error: "method not allowed" }, 405);
};
