// ============================================================
//  Emails admin: signups (popup/newsletter) + past customers.
// ============================================================

let CONTACTS = [];   // merged, deduped { email, name, source, date }

function srcTag(source) {
  const label = source === "customer" ? "Customer" : source === "popup" ? "Popup" : source === "contact" ? "Contact" : "Signup";
  const cls = source === "customer" ? "customer" : source === "popup" ? "popup" : "";
  return '<span class="src-tag ' + cls + '">' + label + '</span>';
}

function render() {
  const el = document.getElementById("emailList");
  document.getElementById("emailCount").textContent = CONTACTS.length ? "(" + CONTACTS.length + ")" : "";
  if (!CONTACTS.length) {
    el.innerHTML = '<div class="empty">No emails yet. They\'ll show up here as people sign up through the site popup or buy a card.</div>';
    return;
  }
  el.innerHTML = '<table class="email-table"><thead><tr>' +
    '<th>Email</th><th>Name</th><th>Source</th><th>Date</th><th></th></tr></thead><tbody>' +
    CONTACTS.map(c =>
      '<tr>' +
        '<td><a href="mailto:' + escapeHtml(c.email) + '">' + escapeHtml(c.email) + '</a></td>' +
        '<td>' + escapeHtml(c.name || "") + '</td>' +
        '<td>' + srcTag(c.source) + '</td>' +
        '<td>' + escapeHtml((c.date || "").slice(0, 10)) + '</td>' +
        '<td>' + (c.source === "customer" ? "" :
          '<button class="btn btn-sm" style="background:none;color:var(--muted);padding:2px 6px" onclick="removeContact(\'' + escapeHtml(c.email) + '\')">Remove</button>') + '</td>' +
      '</tr>'
    ).join("") +
    '</tbody></table>';
}

async function removeContact(email) {
  if (!confirm("Remove " + email + " from your email list?")) return;
  const ok = await apiRemoveEmail(email, adminKey());
  if (ok) { CONTACTS = CONTACTS.filter(c => c.email !== email); render(); }
  else alert("Could not remove. Try again.");
}

async function load() {
  const el = document.getElementById("emailList");
  el.innerHTML = '<div class="empty">Loading…</div>';
  const [emailData, orders] = await Promise.all([
    apiGetEmails(adminKey()),
    apiGetOrders(adminKey()),
  ]);

  const map = new Map();   // email -> contact (first wins, but customer upgrades the tag)
  function add(email, name, source, date) {
    email = String(email || "").trim().toLowerCase();
    if (!email) return;
    if (!map.has(email)) { map.set(email, { email, name: name || "", source, date: date || "" }); return; }
    const ex = map.get(email);
    if (!ex.name && name) ex.name = name;
    if (source === "customer") ex.source = "customer";   // buying is the strongest signal
  }

  (emailData && Array.isArray(emailData.subscribers) ? emailData.subscribers : [])
    .forEach(s => add(s.email, s.name, s.source || "form", s.date));

  (Array.isArray(orders) ? orders : [])
    .filter(o => o.status === "paid" || o.status === "shipped" || o.status === "refunded")
    .forEach(o => { const b = o.buyer || {}; add(b.email, b.name, "customer", o.date); });

  CONTACTS = Array.from(map.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  render();
}

function allEmails() { return CONTACTS.map(c => c.email); }

document.getElementById("copyBtn").addEventListener("click", async () => {
  const text = allEmails().join(", ");
  try { await navigator.clipboard.writeText(text); alert("Copied " + CONTACTS.length + " emails to your clipboard."); }
  catch (e) { prompt("Copy these emails:", text); }
});

document.getElementById("csvBtn").addEventListener("click", () => {
  const rows = [["email", "name", "source", "date"]].concat(
    CONTACTS.map(c => [c.email, c.name || "", c.source, (c.date || "").slice(0, 10)])
  );
  const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mrpokecards-emails.csv";
  a.click();
  URL.revokeObjectURL(a.href);
});

document.addEventListener("DOMContentLoaded", () => {
  renderAdminNav("emails");
  setupAdminGate(load);
});
