import { getStore } from "@netlify/blobs";

// Email capture + marketing popup config.
//   POST /api/subscribe        (public)  add an email to the list
//   GET  /api/marketing        (public)  popup settings for the storefront
//   POST /api/marketing        (admin)   save popup settings
//   GET  /api/emails           (admin)   full subscriber list + settings
export const config = { path: ["/api/emails", "/api/subscribe", "/api/marketing"] };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-admin-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "content-type": "application/json" } });
}

const normEmail = e => String(e || "").trim().toLowerCase();
const validEmail = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

function cleanMarketing(m) {
  m = m || {};
  return {
    enabled: !!m.enabled,
    headline: String(m.headline || "").slice(0, 120),
    message: String(m.message || "").slice(0, 400),
    offer: String(m.offer || "").slice(0, 120),
    button: String(m.button || "Get my code").slice(0, 40),
    success: String(m.success || "").slice(0, 300),
    collectEmail: m.collectEmail !== false,
    updated: m.updated || "",
  };
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { headers: CORS });

  const store = getStore("mrpokecards");
  const path = new URL(req.url).pathname;
  const key = req.headers.get("x-admin-key") || "";
  const isAdmin = process.env.ADMIN_WRITE_KEY && key === process.env.ADMIN_WRITE_KEY;

  // ---- Public: add an email ----
  if (path.endsWith("/subscribe") && req.method === "POST") {
    let body = {};
    try { body = await req.json(); } catch (e) { /* ignore */ }
    const email = normEmail(body.email);
    if (!validEmail(email)) return json({ error: "invalid email" }, 400);
    const subs = (await store.get("subscribers", { type: "json" })) || [];
    if (!subs.some(s => s.email === email)) {
      subs.unshift({
        email,
        name: String(body.name || "").slice(0, 80),
        source: String(body.source || "form").slice(0, 20),
        date: new Date().toISOString(),
      });
      if (subs.length > 5000) subs.length = 5000;
      await store.setJSON("subscribers", subs);
    }
    return json({ ok: true });
  }

  // ---- Public: popup settings ----
  if (path.endsWith("/marketing") && req.method === "GET") {
    const m = cleanMarketing((await store.get("marketing", { type: "json" })) || {});
    return json(m);
  }

  // ---- Admin: save popup settings ----
  if (path.endsWith("/marketing") && req.method === "POST") {
    if (!isAdmin) return json({ error: "unauthorized" }, 401);
    let body = {};
    try { body = await req.json(); } catch (e) { /* ignore */ }
    const m = cleanMarketing(body.marketing);
    m.updated = new Date().toISOString();
    await store.setJSON("marketing", m);
    return json({ ok: true, marketing: m });
  }

  // ---- Admin: full list ----
  if (path.endsWith("/emails") && req.method === "GET") {
    if (!isAdmin) return json({ error: "unauthorized" }, 401);
    const subscribers = (await store.get("subscribers", { type: "json" })) || [];
    const marketing = cleanMarketing((await store.get("marketing", { type: "json" })) || {});
    return json({ subscribers, marketing });
  }

  // ---- Admin: remove a subscriber by email ----
  if (path.endsWith("/emails") && req.method === "POST") {
    if (!isAdmin) return json({ error: "unauthorized" }, 401);
    let body = {};
    try { body = await req.json(); } catch (e) { /* ignore */ }
    if (body.action === "remove" && body.email) {
      const target = normEmail(body.email);
      const subs = (await store.get("subscribers", { type: "json" })) || [];
      const next = subs.filter(s => s.email !== target);
      await store.setJSON("subscribers", next);
      return json({ ok: true, subscribers: next });
    }
    return json({ error: "bad action" }, 400);
  }

  return json({ error: "not found" }, 404);
};
