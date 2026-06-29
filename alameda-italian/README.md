# 🌴 Isola — Alameda Eats

A friendly, fast, Alameda island-themed web app for finding the best restaurants in **Alameda, CA** —
**all cuisines**, with live "open now," menus, photos, and one-tap call / directions / order.
Single self-contained `index.html` (no build) + a few static pages. Deploys free on GitHub Pages.

**Live:** https://stevenslegacystudios.github.io/Golden-State-Ryders-Gemma-4/

## Features
- 🟢 **Live "Open Now"** — open / closed / "closes soon," computed in real time (Pacific), refreshed every minute.
- 🍽️ **22 restaurants, every cuisine** — Italian, Mexican, Thai, Chinese, Vietnamese, Japanese, Indian, American, Seafood, Cafe, Mediterranean, Vegetarian. Filter by cuisine.
- 🔎 **Filters** — Open Now · Favorites · ⭐ Featured · 🌊 Waterfront · 🌿 Patio · 🍳 Breakfast · 🥗 Veg-friendly · cuisine chips · free-text search.
- 📖 **Full menus**, 📸 photos, ❤️ favorites (saved), ↕️ sorting, 🎲 surprise picker, 🌙 day/night theme.
- 📞 **One-tap** call / directions / website / smart **Order**-or-**Reserve** button.

## SEO (built in)
- Keyword-tuned `<title>`/meta, Open Graph + Twitter cards, canonical.
- **JSON-LD structured data** (Restaurant + OpeningHours + ItemList + WebSite + Breadcrumb) generated from the data → eligible for Google rich results / AI overviews.
- `sitemap.xml`, `robots.txt`, `.nojekyll`, semantic HTML (`<main>`, `<article>`, `<address>`), "Updated" freshness stamp.
- **Next SEO step (highest impact):** a custom domain + per-cuisine landing pages (`/italian`, `/patio`, `/open-now`). A single page can't rank for everything.

## 💰 Monetization — how to turn it on
Edit the `CONFIG` block at the top of `index.html`:

```js
const CONFIG = {
  CONTACT_EMAIL: "StevensLegacyStudios@gmail.com", // "Get Featured" + contact go here
  ADSENSE_CLIENT: "",   // set "ca-pub-XX..." once AdSense-approved to turn on ads
  FORMSPREE_ID:   ""    // set a formspree.io form id to collect newsletter emails
};
```

1. **Featured listings (best near-term money, no traffic needed).** Set `featured: true` on any restaurant
   object to pin it to the top with a "Featured" badge. Sell these to local restaurants (~$25–$50/mo or ~$300/yr,
   founding-sponsor discount). The "Get Featured" button + footer route to your `CONTACT_EMAIL`.
2. **Affiliate links.** "Order"/"Reserve" buttons use `rel="sponsored nofollow"`. Sign up for Uber Eats / DoorDash /
   Grubhub / OpenTable / Restaurant.com affiliate programs and swap the `reserve:` URLs for your tagged links.
   (FTC disclosure is already in the footer + `privacy.html`.)
3. **AdSense.** Leave `ADSENSE_CLIENT` empty until approved (a new directory usually won't be approved at launch).
   When ready, paste your `ca-pub-…` id and the ad slot turns on automatically. Add `ads.txt` at the site root.
4. **Newsletter.** Create a free Formspree form, paste its id into `FORMSPREE_ID`, and the signup box collects emails.

## Growth (from the market research)
Become the helpful regular in Alameda Facebook/Nextdoor groups · drop QR table-tents in restaurants ·
Instagram "new this month / happy hour now" · pitch the Alameda Post/Sun · long-tail local SEO. Never sell *ranking* — sell *Featured placement* — to keep the guide trusted.

## Run locally
Open `index.html`, or `python3 -m http.server` then visit `/alameda-italian/`.
