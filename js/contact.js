// ============================================================
//  Contact form: submits to Netlify Forms (AJAX so we can show
//  an inline thank-you), and also adds the sender to the Emails list.
// ============================================================

function showThanks() {
  const form = document.getElementById("contactForm");
  form.innerHTML =
    '<div class="empty" style="text-align:center;padding:30px 10px">' +
      '<div style="font-size:40px">&#9989;</div>' +
      '<h3 style="color:#fff;margin:10px 0 6px">Thanks, message sent!</h3>' +
      '<p style="color:var(--muted)">Saxon will get back to you soon. ' +
      '<a href="shop.html" style="color:var(--gold)">Keep shopping &rarr;</a></p>' +
    '</div>';
}

async function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById("contactMsg");
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = "Sending…";
  msg.textContent = "";

  const fd = new FormData(form);
  const body = new URLSearchParams(fd).toString();
  try {
    await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    // Also drop the sender into the Emails list (tagged "contact").
    const email = fd.get("email"), name = fd.get("name");
    if (email) apiSubscribe(email, "contact", name);
    showThanks();
  } catch (err) {
    btn.disabled = false; btn.textContent = "Send message";
    msg.innerHTML = '<span style="color:#ff8a8a">Something went wrong. Please try again, or email ' +
      escapeHtml(CONFIG.contactEmail) + '.</span>';
  }
  return false;
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contactForm");
  if (form) form.addEventListener("submit", submitContact);
  // No-JS fallback: Netlify redirects to ?sent=1 after a normal submit.
  if (getParam("sent") === "1") showThanks();
  // Preset subject if linked with ?topic=
  const topic = getParam("topic");
  if (topic) {
    const sel = document.querySelector('select[name="subject"]');
    if (sel) Array.from(sel.options).forEach(o => { if (o.value.toLowerCase().includes(topic.toLowerCase())) sel.value = o.value; });
  }
});
