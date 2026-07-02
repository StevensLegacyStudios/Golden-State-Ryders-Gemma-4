# 💰 Isola — Alameda Eats · Business Playbook

The operating manual for turning this app into revenue. Written so the owner
does the **minimum possible** (account signups that legally require a human)
and Claude handles everything else (data, code, pages, wiring links).

**Live site:** https://stevenslegacystudios.github.io/Golden-State-Ryders-Gemma-4/
**Status:** 45 verified Alameda restaurants · 13 cuisines · 19 SEO landing pages ·
Google Search Console verified · sitemap submitted · monetization hooks built.

---

## Revenue streams, ranked by realistic near-term dollars

### 1. ⭐ Featured listings (needs ZERO traffic — start anytime)
Local restaurants pay to be pinned at the top with a labeled "Featured" badge.
- **Pricing:** $25–50/month, or $300/year (founding-sponsor rate for the first 5–10)
- **To activate a sale:** set `featured: true` on that restaurant in `data.js`, commit — done.
- **What's already built:** pinned sorting, gold badge + border, "Get Featured" button
  routed to StevensLegacyStudios@gmail.com, "Sponsored/Featured" labeling for FTC.
- **Never sell ranking** — only the labeled Featured slots. Trust is the moat.

**Copy-paste pitch email (when a restaurant asks, or to send to any Alameda spot):**
> Subject: Your restaurant is on Alameda's new food guide — want the top spot?
>
> Hi — I run Isola (Alameda Eats), a free guide locals use to see who's open
> right now in Alameda: [link]. Your restaurant is already listed free with your
> menu, hours, and one-tap call/directions.
>
> I'm offering the first Featured spots on the Island at a founding rate:
> **$25/month (or $300/year), first month free, cancel anytime.** Featured means
> you're pinned at the top of the guide and every relevant category page, with a
> highlighted card — seen first by every hungry local who opens the site.
> Reply "yes" and you're live the same day.

### 2. 🔗 Affiliate links (10-min signups, then passive)
The app's Order/Reserve buttons are affiliate-ready (`rel="sponsored"`, FTC
disclosure live on the site). Owner signs up once per program, sends Claude the
tracking links/IDs, Claude wires all 45 restaurants' buttons.
- **Uber Eats** — publisher program via impact.com (search "Uber Eats affiliate")
- **Grubhub** — via impact.com / FlexOffers
- **DoorDash** — merchant-referral program (pays for referring *restaurants*, pairs
  perfectly with the Featured pitch above)
- **OpenTable** — dev.opentable.com → Become a Partner (3–4 wk review; revenue
  only after ~100 seated covers/month — apply early, expect $0 for a while)
- **Restaurant.com** — ~20% commission, easiest approval

### 3. 📰 Display ads (needs traffic — do NOT rush this)
- **AdSense:** apply only after (a) custom domain and (b) steady traffic
  (~50–100 visitors/day). Approval needs: privacy policy ✅ (built), about ✅ (built),
  original content ✅ (built). When approved: paste the `ca-pub-…` ID into
  `CONFIG.ADSENSE_CLIENT` in `data.js` — ads turn on automatically. Add `ads.txt`.
- **Ezoic:** no traffic minimum — reasonable first ad network once there are a
  few thousand visits/month.
- **Reality check:** local/food RPM is ~$1–3 per 1,000 pageviews. Ads are the
  *last* stream to matter, not the first.

### 4. 📬 Newsletter (asset that appreciates)
Signup box is live (stores locally; set `CONFIG.FORMSPREE_ID` with a free
formspree.io form ID to actually collect emails — 5-min signup).
Local newsletters sell sponsorships at $50–100 CPM once there are ~500+ subscribers.

---

## The ONE thing that unlocks the most: a custom domain (~$12/year)
`alamedaeats.com` (or similar) at Porkbun/Namecheap/Cloudflare.
- Required in practice for AdSense approval; big Google-trust and
  restaurant-credibility upgrade.
- **Owner does:** buy the domain (10 min). Then either tell Claude the domain
  (Claude adds the CNAME file + updates every canonical/sitemap URL) and add
  4 DNS records at the registrar:
  - `A @ 185.199.108.153` · `A @ 185.199.109.153` · `A @ 185.199.110.153` · `A @ 185.199.111.153`
  - `CNAME www → stevenslegacystudios.github.io`
- Then in GitHub → Settings → Pages → Custom domain → enter it → Enforce HTTPS.

---

## Growth playbook (from market research — what actually gets Alameda users)
1. Be the helpful regular in Alameda Facebook groups + Nextdoor — answer
   "who's open / where should we eat" threads with the relevant page link.
2. Walk Park St & Webster St: every restaurant is already listed free — offer a
   window/table QR card ("See who's open in Alameda →"). They become distribution.
3. Instagram: "new this month," "open late tonight," patio roundups; tag the
   restaurants so they reshare.
4. Pitch the Alameda Post / Alameda Sun: "local builds free open-now food guide"
   is an easy story = backlink + traffic spike.
5. One genuinely useful launch post on r/alameda.
6. Let the 19 SEO landing pages compound (indexed via Search Console ✅).

## Maintenance (Claude does this on request)
- New/closed restaurants: edit `data.js`, run `node build-pages.js`, push.
- Every push auto-deploys via GitHub Actions.
- Keep the "Updated [Month Year]" stamp fresh monthly (SEO freshness signal).

## Honest expectations
- Months 0–2: ~zero revenue. Google is indexing; traffic is seed-stage.
- First real dollars: Featured listings (relationship-driven, not traffic-driven).
- Ads become meaningful only at tens of thousands of pageviews/month.
- Nobody can collect money on the owner's behalf — payouts legally require the
  owner's accounts (AdSense, impact.com, bank). Claude builds and operates
  everything up to that line.
