# Mr. PokeCards

Saxon's Pokemon card website. Show off the collection, mark cards for sale or
trade, and take payments with PayPal. No monthly fees.

## What's here

| File | What it does |
|------|--------------|
| `index.html` | The storefront everyone sees (the card gallery) |
| `admin.html` | The card manager where Saxon adds/edits/removes cards |
| `js/config.js` | **The one file a grown-up edits** (PayPal handle, email) |
| `js/store.js` | Saves the cards in the browser |
| `js/main.js` | Draws the storefront |
| `js/admin.js` | Runs the card manager |
| `css/styles.css` | All the colors and styling |
| `assets/logo.png` | Drop the logo here (see below) |

## How Saxon uses it

1. Open `admin.html`.
2. Tap **add a photo**, take/pick a picture of the card.
3. Type the name (set and number are optional).
4. Tap **Sell it**, **Trade it**, or **Keep it**. If selling, type a price.
5. Tap **Add this card**. Done. It shows up on the site.
6. Every so often, tap **Save backup** to download a copy of all the cards.

Cards are stored in the browser, so use the same device/browser to manage them,
and keep a backup file safe.

## Two things to set before going live (grown-up)

1. **Logo:** save the logo image as `assets/logo.png`. Until then the site
   shows the name as text (still looks fine).
2. **PayPal:** open `js/config.js` and set:
   - `paypalMeHandle` to your PayPal.me username (make one free at paypal.me).
   - `contactEmail` to a parent's email (trade offers go here).

   The account holder must be 18+, so payments land in a parent's PayPal.

## Run it locally

Easiest: double-click `index.html`.

Or serve it:

```
cd mr-pokecards
python3 -m http.server 4321
```

Then open http://localhost:4321

## Putting it online (free options)

Any static host works since there's no server code:

- **Netlify Drop** – drag the folder onto app.netlify.com/drop, done.
- **Cloudflare Pages / GitHub Pages** – connect a repo.
- Point `kid-pokemon.com` (or a "poke" domain) at whichever host you pick.

## Note on the logo/name

The current logo is a placeholder that copies Pokemon's Poke Ball and logo
style. Fine for a private page, but risky on a public store that sells things.
Before going fully public, consider swapping to an original mascot/wordmark so
the brand is safely Saxon's own. See the chat for safer name/logo options.
