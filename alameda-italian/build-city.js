/* ===========================================================
   build-city.js — generates a city guide at <slug>/ from the
   living root Alameda app (index.html is the template).

   Run:   node build-city.js <slug>          e.g. catalina
   Needs: cities.json entry for <slug>, and <slug>/data.js
          (CONFIG + RESTAURANTS, same format as root data.js —
          you author the data; this script never invents it).

   What it does:
   1. <slug>/index.html  — root index.html with a targeted
      REPLACEMENTS table applied. Every find-string is asserted
      to occur the expected number of times: if the root app
      copy drifts, this build FAILS LOUDLY instead of silently
      shipping Alameda copy to another city.
   2. <slug>/sw.js       — CACHE_VERSION prefixed with the slug
      so city caches never collide with root or each other.
   3. <slug>/manifest.json — name/short_name "Isola <City>".
   4. <slug>/icon-192.png, icon-512.png — copied.

   After this, run:  node build-pages.js <slug>   for the SEO
   landing pages + <slug>/sitemap.xml.

   ---------------------------------------------------------------
   DECISION TABLE — every "Alameda" / island-brand string in root
   index.html, and what we do with it for other cities:
   ---------------------------------------------------------------
   | Occurrence (root index.html)                | Decision       |
   |---------------------------------------------|----------------|
   | <title> "…in Alameda, CA…"                  | parameterize   |
   | meta description "…in Alameda, CA…"         | parameterize   |
   | meta keywords (Alameda x7, Crown Beach,     | parameterize   |
   |   USS Hornet — Alameda landmarks)           | (generic set)  |
   | canonical + og:url https://isolaguides.com/ | parameterize   |
   | google-site-verification                    | KEEP UNCHANGED |
   | og:title "Isola — Alameda's guide…"         | parameterize   |
   | og:description "Everything on the Island…"  | parameterize   |
   | twitter:title/desc "Alameda…"               | parameterize   |
   | og:image / twitter:image (generic stock)    | keep           |
   | hidden h1 span "…in Alameda, CA…"           | parameterize   |
   | static kicker "· ALAMEDA, CALIFORNIA"       | parameterize   |
   | .deck paragraph                             | registry       |
   |                                             |   tagline      |
   | .edition "… island spots …"                 | keep ("island  |
   |                                             |   spots" is    |
   |                                             |   brand voice, |
   |                                             |   per spec)    |
   | dateline "LOADING ISLAND TIME…"             | nickname noun  |
   | dateline JS "on the island"                 | on_phrase      |
   | JS kicker suffix "· ALAMEDA, CALIFORNIA"    | parameterize   |
   | daypart rails "…ON THE ISLAND…" (x4)        | on_phrase      |
   | "ON THE ISLAND TONIGHT" h2                  | on_phrase      |
   | late banner "After hours on the Island."    | on_phrase      |
   | empty state "Nothing on the Island…" (x2)   | on_phrase      |
   | "the top of the Island is open"             | nickname       |
   | countline "· ISLAND TIME "                  | nickname noun  |
   | install banner "THE ISLAND GUIDE, OFFLINE"  | nickname noun  |
   | newsletter "where to eat on the Island."    | on_phrase      |
   | card/sheet img alt "restaurant in Alameda"  | parameterize   |
   | share title "Isola, Alameda Eats"           | parameterize   |
   | "Isola — Alameda Eats" (twitter:title,      | parameterize   |
   |   footer brand, mail subject, JSON-LD) x4   |   (global)     |
   | footer "The Island's restaurant guide"      | nickname       |
   | footer "Browse Alameda restaurants…"        | parameterize   |
   | footer cuisine/feature link rows            | REGENERATED    |
   |   (links into Alameda landing pages; other  | from the       |
   |   cities must not link to Alameda pages;    | city's own     |
   |   place/feature rows dropped — cuisine      | data.js        |
   |   pages are always emitted by build-pages)  |                |
   | footer about/privacy links (+ JS fallback)  | ../about.html  |
   |   (root-level shared pages, not per-city)   | ../privacy.html|
   | footer "Built in Alameda."                  | keep — true    |
   |   statement about the maker, not the city   |                |
   | featSubj "my Alameda restaurant"            | parameterize   |
   | JSON-LD addr regex /,\s*Alameda,\s*CA…/     | registry       |
   |   + "addressLocality":"Alameda"             |   "locality"   |
   | JSON-LD WebSite desc "Alameda's guide…"     | parameterize   |
   | JSON-LD ItemList "…in Alameda, CA"          | parameterize   |
   | JSON-LD breadcrumb "Alameda Restaurants"    | parameterize   |
   | JS comment "ISOLA — Island Edition"         | keep (comment) |
   | data.js / sw.js / manifest.json / icons     | keep — already |
   |   references                                |   relative     |
   | Google-Maps links (built from full          | keep — data.js |
   |   addresses, already city-qualified)        |   addresses    |
   |   e.g. "…, Avalon, CA 90704" resolve fine   |   carry city   |
   ---------------------------------------------------------------
   =========================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadCity, loadRestaurants, slugify, escapeRegExp } = require('./city-lib');

const slug = process.argv[2];
if (!slug) { console.error('Usage: node build-city.js <slug>'); process.exit(1); }

const city = loadCity(slug);
assert(!city.isRoot, 'Refusing to build the root city over itself.');
const outDir = city.dir;
const dataPath = path.join(outDir, 'data.js');
assert(fs.existsSync(dataPath),
  `${city.slug}/data.js not found — create the city data first (same CONFIG+RESTAURANTS format as root data.js).`);

const RESTAURANTS = loadRestaurants(dataPath);
assert(Array.isArray(RESTAURANTS) && RESTAURANTS.length > 0, 'City data.js has no RESTAURANTS.');

const N = city.name, ST = city.state, LOC = city.locality;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* footer cuisine links, regenerated from THIS city's data
   (build-pages.js <slug> emits one page per cuisine present) */
const cuisines = [...new Set(RESTAURANTS.filter(r => r.kind !== 'place').map(r => r.cuisine))];
const cuisineLinks = cuisines.map(c => `<a href="${slugify(c)}.html">${esc(c)}</a>`).join(' · ');

let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

/* root-only blocks (e.g. the "More Isola island guides" footer strip)
   are wrapped in cities-strip markers and removed from city builds */
html = html.replace(/[ \t]*<!-- cities-strip -->[\s\S]*?<!-- \/cities-strip -->\n?/g, '');

/* ---------- REPLACEMENTS table ----------
   [find, replace, expectedCount] — find may be a string or RegExp.
   Every entry is asserted to match exactly expectedCount times. */
const REPLACEMENTS = [
  // <title>
  ['<title>Things to Do in Alameda, CA — Restaurants, Bars, Beaches &amp; Date Nights | Isola</title>',
   `<title>Things to Do in ${N}, ${ST} — Restaurants, Bars, Beaches &amp; Date Nights | Isola</title>`, 1],
  // meta description
  ['<meta name="description" content="The Island\'s guide to everything: the best restaurants, bars, breweries, beaches, trails, attractions and date-night spots in Alameda, CA — with live open-now status, menus, hours and one-tap directions. Updated July 2026." />',
   `<meta name="description" content="${esc(city.nickCap)}'s guide to everything: the best restaurants, bars, attractions and things to do in ${N}, ${ST} — with live open-now status, menus, hours and one-tap directions. Updated July 2026." />`, 1],
  // meta keywords (Alameda landmark keywords swapped for a generic city set)
  ['<meta name="keywords" content="things to do in Alameda, Alameda restaurants, Alameda bars, date night Alameda, Alameda beaches, Alameda attractions, restaurants open now Alameda, Alameda nightlife, Crown Beach, USS Hornet" />',
   `<meta name="keywords" content="things to do in ${N}, ${N} restaurants, ${N} bars, date night ${N}, ${N} beaches, ${N} attractions, restaurants open now ${N}, ${N} nightlife" />`, 1],
  // canonical + og:url  (google-site-verification is deliberately NOT touched)
  ['<link rel="canonical" href="https://isolaguides.com/" />',
   `<link rel="canonical" href="${city.canon}" />`, 1],
  ['<meta property="og:url" content="https://isolaguides.com/" />',
   `<meta property="og:url" content="${city.canon}" />`, 1],
  // og / twitter copy
  ['<meta property="og:title" content="Isola — Alameda\'s guide to eat, drink &amp; do" />',
   `<meta property="og:title" content="Isola — ${N}'s guide to eat, drink &amp; do" />`, 1],
  ['<meta property="og:description" content="Everything on the Island in one tap — restaurants, bars, beaches, attractions and date-night spots, with live open-now status." />',
   `<meta property="og:description" content="Everything ${city.onpDisp} in one tap — restaurants, bars, beaches, attractions and date-night spots, with live open-now status." />`, 1],
  ['<meta name="twitter:description" content="Alameda\'s guide to eat, drink &amp; do — open now, hours, one-tap directions." />',
   `<meta name="twitter:description" content="${N}'s guide to eat, drink &amp; do — open now, hours, one-tap directions." />`, 1],
  // hidden h1 span
  [' — Things to do in Alameda, CA: restaurants, bars, beaches &amp; date nights, open now',
   ` — Things to do in ${N}, ${ST}: restaurants, bars, beaches &amp; date nights, open now`, 1],
  // .deck — registry tagline
  ['<p class="deck">Everything on the Island — restaurants, bars, beaches and things to do. Who\'s open right now, one tap to go.</p>',
   `<p class="deck">${esc(city.tagline)} Who's open right now, one tap to go.</p>`, 1],
  // kicker suffix — static masthead + JS updater
  ['<span id="kicker">GOLDEN HOUR · ALAMEDA, CALIFORNIA</span>',
   `<span id="kicker">GOLDEN HOUR · ${city.nameUp}, ${city.stateFull.toUpperCase()}</span>`, 1],
  ["daypart(n.dec).k+' · ALAMEDA, CALIFORNIA'",
   `daypart(n.dec).k+' · ${city.nameUp}, ${city.stateFull.toUpperCase()}'`, 1],
  // dateline (registry on_phrase; brand noun for "ISLAND TIME")
  ['LOADING ISLAND TIME…', `LOADING ${city.nickNounUp} TIME…`, 1],
  ['${timeTxt} on the island ·', '${timeTxt} ' + city.onp + ' ·', 1],
  ['· ISLAND TIME ', `· ${city.nickNounUp} TIME `, 1],
  // daypart rails + tonight rail (on_phrase, uppercased)
  ["'DAWN ON THE ISLAND'", `'DAWN ${city.onpUp}'`, 1],
  ["'ON THE ISLAND THIS MORNING'", `'${city.onpUp} THIS MORNING'`, 1],
  ["'LUNCH ON THE ISLAND'", `'LUNCH ${city.onpUp}'`, 1],
  ["'GOLDEN HOUR ON THE ISLAND'", `'GOLDEN HOUR ${city.onpUp}'`, 1],
  ['ON THE ISLAND TONIGHT', `${city.onpUp} TONIGHT`, 1],
  // in-app copy
  ['<strong>After hours on the Island.</strong>', `<strong>After hours ${city.onpDisp}.</strong>`, 1],
  ['Nothing on the Island matches that — try another filter.',
   `Nothing ${city.onpDisp} matches that — try another filter.`, 2],
  ['the top of the Island is open', `the top of ${city.nick} is open`, 1],
  ['ADD ISOLA TO YOUR HOME SCREEN · THE ISLAND GUIDE, OFFLINE',
   `ADD ISOLA TO YOUR HOME SCREEN · THE ${city.nickNounUp} GUIDE, OFFLINE`, 1],
  ['where to eat on the Island.', `where to eat ${city.onpDisp}.`, 1],
  ['restaurant in Alameda', `restaurant in ${N}`, 2],
  ["' — Isola, Alameda Eats'", `' — Isola, ${N} Eats'`, 1],
  ['"I\'d like to feature my Alameda restaurant on Isola"',
   `"I'd like to feature my ${N} restaurant on Isola"`, 1],
  // brand line — twitter:title, footer brand, contact mail subject, JSON-LD WebSite name
  ['Isola — Alameda Eats', `Isola — ${N} Eats`, 4],
  // footer
  ["· The Island's restaurant guide", `· ${city.nickCap}'s restaurant guide`, 1],
  ['Browse Alameda restaurants by cuisine', `Browse ${N} restaurants by cuisine`, 1],
  // footer link rows: Alameda's cuisine/place/feature landing links must not
  // leak into other cities — regenerate cuisine links from the city's data
  [/<a href="italian\.html">Italian<\/a>[\s\S]*?<a href="bars\.html">Bars &amp; Cocktails<\/a>/,
   cuisineLinks, 1],
  // shared root-level pages (about/privacy live only at site root)
  ['href="about.html"', 'href="../about.html"', 1],
  ['href="privacy.html#disclosure"', 'href="../privacy.html#disclosure"', 1],
  ['href="privacy.html"', 'href="../privacy.html"', 1],
  ["fc.href=foot.href='about.html'", "fc.href=foot.href='../about.html'", 1],
  // JSON-LD (locality-driven address parsing + city naming)
  ['a.match(/^(.*),\\s*Alameda,\\s*CA\\s*(\\d{5})/)',
   `a.match(/^(.*),\\s*${escapeRegExp(LOC)},\\s*${ST}\\s*(\\d{5})/)`, 1],
  ['"addressLocality":"Alameda"', `"addressLocality":"${LOC}"`, 1],
  ['"description":"Alameda\'s guide to eat, drink and do — restaurants, bars, beaches, attractions and date nights, with live open-now status."',
   `"description":"${N}'s guide to eat, drink and do — restaurants, bars, beaches, attractions and date nights, with live open-now status."`, 1],
  ['"Things to Do & Best Restaurants in Alameda, CA"',
   `"Things to Do & Best Restaurants in ${N}, ${ST}"`, 1],
  ['"name":"Alameda Restaurants"', `"name":"${N} Restaurants"`, 1],
];

function countMatches(hay, find) {
  if (find instanceof RegExp) {
    const m = hay.match(new RegExp(find.source, (find.flags.includes('g') ? find.flags : find.flags + 'g')));
    return m ? m.length : 0;
  }
  return hay.split(find).length - 1;
}

REPLACEMENTS.forEach(([find, replace, expected], i) => {
  const n = countMatches(html, find);
  assert.strictEqual(n, expected,
    `REPLACEMENTS[${i}] matched ${n}x (expected ${expected}): ${String(find).slice(0, 90)}`);
  html = (find instanceof RegExp)
    ? html.replace(new RegExp(find.source, find.flags.includes('g') ? find.flags : find.flags + 'g'), () => replace)
    : html.split(find).join(replace);
});

/* the app must keep loading its assets relatively (per-city copies) */
['<script src="data.js"></script>', "navigator.serviceWorker.register('sw.js')",
 '<link rel="manifest" href="manifest.json" />', '<link rel="apple-touch-icon" href="icon-192.png" />']
  .forEach(ref => assert(html.includes(ref), 'Relative asset reference missing from template: ' + ref));

/* verify: google-site-verification untouched */
assert(html.includes('<meta name="google-site-verification" content="IbxTYmalcBs3AUrqCtbfS_G3g_MGMsX9px7jC5zhjKY" />'),
  'google-site-verification must stay unchanged');

/* no stray Alameda left except the whitelisted maker credit */
const leftovers = (html.match(/Alameda/gi) || []).length;
assert.strictEqual(leftovers, 1,
  `Expected exactly 1 remaining "Alameda" ("Built in Alameda" maker credit), found ${leftovers}`);
assert(html.includes('Built in Alameda'), '"Built in Alameda" maker credit missing');

fs.writeFileSync(path.join(outDir, 'index.html'), html);

/* ---------- sw.js: slug-prefixed cache version ---------- */
let sw = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
assert(sw.includes("const CACHE_VERSION = 'isola-"), 'sw.js CACHE_VERSION pattern changed');
sw = sw.replace("const CACHE_VERSION = 'isola-", `const CACHE_VERSION = '${city.slug}-isola-`);
assert(sw.includes('Isola — Alameda Eats service worker.'), 'sw.js header comment changed');
sw = sw.replace('Isola — Alameda Eats service worker.', `Isola — ${N} Eats service worker.`);
fs.writeFileSync(path.join(outDir, 'sw.js'), sw);

/* ---------- manifest.json: Isola <City> ---------- */
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
manifest.name = `Isola ${N}`;
manifest.short_name = `Isola ${N}`;
assert(manifest.description.includes('on the Island'), 'manifest description pattern changed');
manifest.description = manifest.description.replace('on the Island', city.onpDisp);
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

/* ---------- icons ---------- */
['icon-192.png', 'icon-512.png'].forEach(f =>
  fs.copyFileSync(path.join(__dirname, f), path.join(outDir, f)));

console.log(`Built ${city.slug}/: index.html (${RESTAURANTS.length} spots), sw.js (cache '${city.slug}-isola-*'), manifest.json, icons.`);
console.log(`Next: node build-pages.js ${city.slug}`);
