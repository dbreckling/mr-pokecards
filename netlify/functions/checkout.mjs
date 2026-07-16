import Stripe from "stripe";
import { getStore } from "@netlify/blobs";

// Stripe Checkout: create a session (prices looked up server-side from the DB),
// and verify/record the order after payment. Needs STRIPE_SECRET_KEY env var.
export const config = { path: "/api/checkout" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-admin-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "content-type": "application/json" } });
}

const SHIP_COUNTRIES = ["US", "CA", "GB", "IE", "ES", "FR", "DE", "IT", "PT", "NL", "BE", "AU", "NZ", "JP", "MX"];

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return json({ error: "Stripe is not configured yet." }, 500);
  const stripe = new Stripe(secret);
  const store = getStore("mrpokecards");

  let body = {};
  try { body = await req.json(); } catch (e) { /* ignore */ }

  // ---- Create a Checkout Session ----
  if (body.action === "create") {
    const wanted = Array.isArray(body.items) ? body.items : [];
    if (!wanted.length) return json({ error: "empty cart" }, 400);
    const currency = (body.currency || "usd").toLowerCase();

    const cards = (await store.get("cards", { type: "json" })) || [];
    const byId = {};
    cards.forEach(c => { byId[c.id] = c; });

    const line_items = [];
    const orderItems = [];
    let total = 0;
    for (const w of wanted) {
      const c = byId[w.id];
      if (!c || c.status !== "sale") continue;      // only sellable cards
      const price = Number(c.price) || 0;
      if (price <= 0) continue;
      const qty = Math.max(1, parseInt(w.qty, 10) || 1);
      total += price * qty;
      line_items.push({
        quantity: qty,
        price_data: {
          currency,
          unit_amount: Math.round(price * 100),
          product_data: { name: c.name + (c.set ? " (" + c.set + ")" : "") },
        },
      });
      orderItems.push({ id: c.id, name: c.name, set: c.set || "", qty, price });
    }
    if (!line_items.length) return json({ error: "no valid items" }, 400);

    const origin = req.headers.get("origin") || ("https://" + (req.headers.get("host") || ""));
    const no = "MPC-" + Date.now().toString().slice(-8);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      shipping_address_collection: { allowed_countries: SHIP_COUNTRIES },
      phone_number_collection: { enabled: true },
      success_url: origin + "/success.html?sid={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/cart.html",
      client_reference_id: no,
      metadata: { no },
    });

    const orders = (await store.get("orders", { type: "json" })) || [];
    orders.unshift({ no, date: new Date().toISOString(), status: "pending",
      currency: currency.toUpperCase(), total, items: orderItems, sessionId: session.id });
    if (orders.length > 1000) orders.length = 1000;
    await store.setJSON("orders", orders);

    return json({ url: session.url, no });
  }

  // ---- Verify + record after payment ----
  if (body.action === "verify") {
    if (!body.sid) return json({ error: "no session" }, 400);
    const session = await stripe.checkout.sessions.retrieve(body.sid);
    const orders = (await store.get("orders", { type: "json" })) || [];
    const idx = orders.findIndex(o => o.sessionId === body.sid);
    if (idx === -1) return json({ error: "order not found" }, 404);

    if (session.payment_status === "paid" && orders[idx].status !== "paid") {
      const cd = session.customer_details || {};
      const sh = session.shipping_details || {};
      const a = sh.address || cd.address || {};
      orders[idx].status = "paid";
      orders[idx].buyer = {
        name: sh.name || cd.name || "",
        email: cd.email || "",
        phone: cd.phone || "",
        address1: a.line1 || "", address2: a.line2 || "", city: a.city || "",
        region: a.state || "", postal: a.postal_code || "", country: a.country || "",
      };
      await store.setJSON("orders", orders);
    }
    const o = orders[idx];
    return json({ paid: session.payment_status === "paid", no: o.no, total: o.total, currency: o.currency });
  }

  // ---- Sync every order's real status straight from Stripe (admin) ----
  if (body.action === "sync") {
    const key = req.headers.get("x-admin-key") || "";
    if (!process.env.ADMIN_WRITE_KEY || key !== process.env.ADMIN_WRITE_KEY) {
      return json({ error: "unauthorized" }, 401);
    }
    const orders = (await store.get("orders", { type: "json" })) || [];
    let changed = false;

    for (const o of orders) {
      if (!o.sessionId) continue;
      // Once an order is fully done we still refresh it, so refunds show up too.
      let session;
      try {
        session = await stripe.checkout.sessions.retrieve(o.sessionId, {
          expand: ["payment_intent.latest_charge"],
        });
      } catch (e) { continue; } // session gone / bad id — leave the order as-is

      const paid = session.payment_status === "paid";
      const charge = session.payment_intent && session.payment_intent.latest_charge;
      const refunded = !!(charge && (charge.refunded || (charge.amount_refunded || 0) > 0));

      // Decide the true status from Stripe. Never downgrade a manual "shipped".
      let next = o.status;
      if (refunded) next = "refunded";
      else if (paid) next = (o.status === "shipped" || o.status === "refunded") ? o.status : "paid";
      else next = "pending";

      if (next !== o.status) { o.status = next; changed = true; }

      // Fill in buyer/shipping details from Stripe once we have them.
      if (paid && (!o.buyer || !o.buyer.name)) {
        const cd = session.customer_details || {};
        const sh = session.shipping_details || {};
        const a = sh.address || cd.address || {};
        o.buyer = {
          name: sh.name || cd.name || "",
          email: cd.email || "",
          phone: cd.phone || "",
          address1: a.line1 || "", address2: a.line2 || "", city: a.city || "",
          region: a.state || "", postal: a.postal_code || "", country: a.country || "",
        };
        changed = true;
      }
    }

    if (changed) await store.setJSON("orders", orders);
    return json(orders);
  }

  return json({ error: "bad action" }, 400);
};
