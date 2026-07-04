/* ===========================================================
   build-pages.js — generates SEO landing pages from the
   RESTAURANTS data in index.html (one per cuisine + feature).
   Run:  node build-pages.js
   Re-run any time the data changes. Fully automated.
   =========================================================== */
const fs = require('fs');
const path = __dirname;
const CANON = "https://stevenslegacystudios.github.io/Golden-State-Ryders-Gemma-4/";

/* --- pull RESTAURANTS array out of data.js --- */
const html = fs.readFileSync(path + '/data.js', 'utf8');
const RESTAURANTS = eval(html.match(/const RESTAURANTS\s*=\s*(\[[\s\S]*?\n\];)/)[1].replace(/;$/, ''));

/* --- helpers --- */
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYFULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function fmt(t){let h=Math.floor(t),m=Math.round((t-h)*60);const ap=h>=12?'pm':'am';let hh=h%12;if(hh===0)hh=12;return m===0?`${hh}${ap}`:`${hh}:${String(m).padStart(2,'0')}${ap}`;}
function hoursLine(r){
  return r.hours.map((d,i)=>`${DAY[i]} ${(!d||!d.length)?'closed':d.map(iv=>`${fmt(iv[0])}–${fmt(iv[1])}`).join(', ')}`).join(' · ');
}
function hm(t){let h=Math.floor(t),m=Math.round((t-h)*60);if(h>=24){h=23;m=59;}return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');}
function addrObj(a){const m=a.match(/^(.*),\s*Alameda,\s*CA\s*(\d{5})/);return {street:m?m[1]:a,zip:m?m[2]:''};}
function ohs(r){const out=[];r.hours.forEach((d,i)=>{(d||[]).forEach(iv=>out.push({"@type":"OpeningHoursSpecification","dayOfWeek":"https://schema.org/"+DAYFULL[i],"opens":hm(iv[0]),"closes":hm(iv[1])}));});return out;}
function restaurantLd(r){
  const a=addrObj(r.address);
  return {"@type":"Restaurant","name":r.name,...(r.img?{image:r.img}:{}),"servesCuisine":r.cuisine,"priceRange":r.price,
    "telephone":r.phone,"url":CANON+"#card-"+slug(r.name),
    "address":{"@type":"PostalAddress","streetAddress":a.street,"addressLocality":"Alameda","addressRegion":"CA","postalCode":a.zip,"addressCountry":"US"},
    "hasMenu":r.menuUrl,"acceptsReservations":/opentable|resy|reservation/i.test(r.reserve||'')?"True":"False",
    "openingHoursSpecification":ohs(r)};
}

/* --- page definitions --- */
const cuisines = [...new Set(RESTAURANTS.map(r=>r.cuisine))];
const cuisinePages = cuisines.map(c=>({
  file: slug(c)+'.html',
  h1: `${c} Restaurants in Alameda, CA`,
  title: `Best ${c} Restaurants in Alameda, CA — Menus, Hours & Open Now | Isola Eats`,
  desc: `The best ${c} restaurants in Alameda, California. See menus, photos, hours and who's open now, with one-tap call, directions and ordering. Updated June 2026.`,
  intro: `Looking for ${c.toLowerCase()} food in Alameda? Here are the Island's ${c.toLowerCase()} spots — with menus, prices, hours and live "open now" status. Tap any restaurant to call, get directions, or see the full live menu.`,
  match: r=>r.cuisine===c,
  emoji: ({Italian:'🍝',Mexican:'🌮',Thai:'🍜',Chinese:'🥟',Vietnamese:'🍲',Japanese:'🍣',Indian:'🍛',American:'🍔',Seafood:'🦞',Cafe:'🥐',Mediterranean:'🥙',Vegetarian:'🥗'})[c]||'🍽️'
}));
const featurePages = [
  {file:'waterfront.html', label:'Waterfront', emoji:'🌊', h1:'Waterfront Restaurants in Alameda, CA',
   title:'Waterfront Restaurants in Alameda, CA — Bay Views, Menus & Hours | Isola Eats',
   desc:"Alameda restaurants with waterfront and bay views. Menus, hours, open-now status and one-tap directions for dining on the water. Updated June 2026.",
   intro:"Alameda is an island — so eat on the water. These spots serve up bay and estuary views along with the meal. See menus, hours and who's open now.",
   match:r=>(r.cats||[]).includes('waterfront')},
  {file:'patio.html', label:'Patio & Outdoor', emoji:'🌿', h1:'Restaurants with Patios & Outdoor Dining in Alameda, CA',
   title:'Patio & Outdoor Dining in Alameda, CA — Menus & Hours | Isola Eats',
   desc:"Alameda restaurants with patios and outdoor seating. Menus, hours, open-now status and tap-to-call directions. Updated June 2026.",
   intro:"Eat outside on the Island. These Alameda restaurants offer patios or outdoor seating — here are menus, hours and live open-now status.",
   match:r=>(r.cats||[]).includes('patio')},
  {file:'breakfast.html', label:'Breakfast & Brunch', emoji:'🍳', h1:'Breakfast & Brunch in Alameda, CA',
   title:'Best Breakfast & Brunch in Alameda, CA — Menus & Hours | Isola Eats',
   desc:"The best breakfast and brunch spots in Alameda, California — diners, bakeries and cafes. Menus, hours, open-now and directions. Updated June 2026.",
   intro:"Start the day right on the Island. Alameda's breakfast and brunch spots — classic diners, bakeries and cafes — with menus, hours and open-now status.",
   match:r=>(r.cats||[]).includes('breakfast')},
  {file:'open-late.html', label:'Open Late', emoji:'🌙', h1:'Restaurants Open Late in Alameda, CA',
   title:'Restaurants Open Late in Alameda, CA — Late-Night Food, Menus & Hours | Isola Eats',
   desc:"Hungry late in Alameda? These restaurants stay open until 9:30pm or later. Menus, hours, open-now status and one-tap directions. Updated June 2026.",
   intro:"Late-night cravings on the Island? These Alameda spots serve until 9:30pm or later on at least some nights. Always check the live hours before you head out.",
   match:r=>r.hours.some(d=>(d||[]).some(iv=>iv[1]>=21.5))},
  {file:'family-friendly.html', label:'Family-Friendly', emoji:'👨‍👩‍👧', h1:'Family-Friendly Restaurants in Alameda, CA',
   title:'Family-Friendly Restaurants in Alameda, CA — Kid-Friendly Menus & Hours | Isola Eats',
   desc:"Family-friendly restaurants in Alameda, California — relaxed, kid-welcoming spots with hearty menus. Hours, open-now status and directions. Updated June 2026.",
   intro:"Feeding the whole crew on the Island? These Alameda restaurants are easygoing, family-owned or family-favorite spots. See menus, hours and who's open now.",
   match:r=>r.tags.some(t=>/family/i.test(t))},
  {file:'bars.html', label:'Bars & Cocktails', emoji:'🍸', h1:'Bars, Cocktails & Drinks in Alameda, CA',
   title:'Best Bars & Cocktail Restaurants in Alameda, CA — Menus & Hours | Isola Eats',
   desc:"Where to drink in Alameda, California — restaurants and bars with craft cocktails, tequila and wine lists. Hours, open-now status and directions. Updated June 2026.",
   intro:"Grab a drink on the Island. These Alameda restaurants and bars are known for craft cocktails, tequila or strong wine lists — with menus, hours and open-now status.",
   match:r=>r.tags.some(t=>/cocktail|tequila|wine|bar/i.test(t))}
].filter(f=>RESTAURANTS.some(f.match));

const allPages = [...cuisinePages, ...featurePages];

/* --- shared CSS (Island Edition brand) --- */
const CSS = `
  :root{--paper:#F6F1E7;--paper-raised:#FDFBF5;--ink:#191713;--ink-2:#5C564A;--hairline:#DCD2BF;
    --accent:#B4432F;--sea:#175E63;--gold:#A87F2E}
  body{margin:0;font-family:'Inter',system-ui,-apple-system,sans-serif;color:var(--ink);
    background:var(--paper);line-height:1.6;font-size:15px;-webkit-font-smoothing:antialiased}
  header{max-width:860px;margin:0 auto;padding:20px 20px 0;text-align:left}
  header .rule{border-top:1px solid var(--hairline)}
  header .rule2{border-top:1px solid var(--hairline);height:3px;border-bottom:1px solid var(--hairline);margin-top:14px}
  header .kick{font-family:'Spline Sans Mono',monospace;font-weight:500;font-size:11px;letter-spacing:.08em;
    text-transform:uppercase;color:var(--ink-2);padding:8px 0;border-bottom:1px solid var(--hairline)}
  header h1{margin:16px 0 0;font-family:'Fraunces',Georgia,serif;font-weight:900;font-size:clamp(30px,6vw,52px);
    letter-spacing:-.02em;line-height:1.05}
  header p{margin:8px 0 0;font-size:13px;font-weight:500;color:var(--ink-2);max-width:640px}
  header a.home{color:var(--accent);text-decoration:none;font-weight:600}
  main{max-width:860px;margin:0 auto;padding:22px 20px 50px}
  .nav{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 18px}
  .nav a{font-family:'Spline Sans Mono',monospace;font-weight:500;font-size:11px;letter-spacing:.05em;text-transform:uppercase;
    text-decoration:none;color:var(--ink-2);background:var(--paper-raised);border:1px solid var(--hairline);
    padding:7px 11px;border-radius:8px}
  .nav a:hover{color:var(--ink);border-color:var(--ink-2)}
  .r{background:var(--paper-raised);border:1px solid var(--hairline);border-radius:12px;padding:16px 18px;margin:14px 0}
  .r h2{margin:0;font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:22px;letter-spacing:-.01em;color:var(--ink)}
  .r h2 span{color:var(--ink-2);font-size:15px}
  .r .meta{font-family:'Spline Sans Mono',monospace;font-weight:500;font-size:11px;letter-spacing:.06em;
    text-transform:uppercase;color:var(--ink-2);margin:4px 0 8px}
  .r .desc{font-size:15px;color:var(--ink-2);margin:0 0 8px}
  .r .hrs{font-family:'Spline Sans Mono',monospace;font-weight:500;font-size:11px;color:var(--ink-2);margin:0 0 12px}
  .r .links{display:flex;flex-wrap:wrap;gap:8px;border-top:1px solid var(--hairline);padding-top:12px}
  .r .links a{font-size:13px;font-weight:600;text-decoration:none;padding:9px 13px;border-radius:8px;border:1px solid var(--hairline)}
  .a-call,.a-map{color:var(--sea)}.a-menu{background:var(--accent);border-color:var(--accent);color:#fff}
  .a-live{color:var(--ink-2)}
  .intro{font-size:16px;color:var(--ink);margin:0 0 6px}
  .back-cta{background:var(--accent);color:#fff;text-decoration:none;font-weight:600;padding:11px 18px;border-radius:8px;display:inline-block}
  footer{text-align:center;color:var(--ink-2);font-size:12px;padding:24px 18px;border-top:1px solid var(--hairline);margin-top:24px}
  footer a{color:var(--sea)}`;
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;900&family=Inter:wght@400;500;600&family=Spline+Sans+Mono:wght@500&display=swap" rel="stylesheet" />`;

function maps(a){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(a);}

function renderRestaurant(r){
  return `<article class="r">
    <h2>${esc(r.name)} <span style="color:#5a7d3c">${r.price}</span></h2>
    <p class="meta">★ ${r.rating} · ${esc(r.cuisine)} · ${esc(r.address)}</p>
    <p class="desc">${esc(r.desc)}</p>
    <p class="hrs"><strong>Hours:</strong> ${esc(hoursLine(r))}</p>
    <div class="links">
      <a class="a-call" href="tel:${r.phone}">📞 Call</a>
      <a class="a-map" href="${maps(r.address)}" target="_blank" rel="noopener">🗺️ Directions</a>
      <a class="a-menu" href="${esc(r.menuUrl)}" target="_blank" rel="noopener">📖 Menu</a>
      <a class="a-live" href="${CANON}#card-${slug(r.name)}">🟢 Live hours &amp; more →</a>
    </div>
  </article>`;
}

function navLinks(currentFile){
  const links = cuisinePages.map(p=>`<a href="${p.file}"${p.file===currentFile?' style="background:#0b6e8f;color:#fff"':''}>${p.emoji} ${esc(p.h1.replace(' Restaurants in Alameda, CA',''))}</a>`).join('');
  const feats = featurePages.map(p=>`<a href="${p.file}"${p.file===currentFile?' style="background:#0b6e8f;color:#fff"':''}>${p.emoji} ${esc(p.label)}</a>`).join('');
  return `<a href="index.html">🏠 All Restaurants</a>${links}${feats}`;
}

function buildPage(p){
  const list = RESTAURANTS.filter(p.match);
  const url = CANON + p.file;
  // unique, data-driven summary line (real content beats thin pages)
  const names = list.map(r=>r.name);
  const featuring = names.length
    ? `On this page: ${names.slice(0,-1).join(', ')}${names.length>1?' and '+names[names.length-1]:names[0]}.`
    : '';
  const priceLo = list.map(r=>r.price.length).sort((a,b)=>a-b)[0]||0;
  const ratingsAvg = list.length ? (list.reduce((s,r)=>s+parseFloat(r.rating),0)/list.length).toFixed(1) : '';
  const summary = list.length
    ? `We track ${list.length} ${list.length===1?'spot':'spots'} here, averaging ${ratingsAvg}★. Every listing shows the day's hours, a sample menu with prices, and one-tap call, directions and ordering — plus live "open now" status on the main guide.`
    : '';
  const itemList = {"@type":"ItemList","name":p.h1,"numberOfItems":list.length,
    "itemListElement":list.map((r,i)=>({"@type":"ListItem","position":i+1,"item":restaurantLd(r)}))};
  const breadcrumb = {"@type":"BreadcrumbList","itemListElement":[
    {"@type":"ListItem","position":1,"name":"Alameda Restaurants","item":CANON},
    {"@type":"ListItem","position":2,"name":p.h1,"item":url}]};
  const ld = {"@context":"https://schema.org","@graph":[itemList,breadcrumb]};
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="google-site-verification" content="IbxTYmalcBs3AUrqCtbfS_G3g_MGMsX9px7jC5zhjKY" />
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}" />
<link rel="canonical" href="${url}" />
<meta property="og:title" content="${esc(p.h1)} | Isola — Alameda Eats" />
<meta property="og:description" content="${esc(p.desc)}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=70" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23F6F1E7'/%3E%3Ctext x='32' y='46' text-anchor='middle' font-family='Georgia,serif' font-weight='900' font-size='42' fill='%23191713'%3EI%3C/text%3E%3Ccircle cx='47' cy='44' r='4' fill='%23B4432F'/%3E%3C/svg%3E" />
${FONTS}
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<header>
  <div class="kick">FROM ISOLA — ALAMEDA EATS · UPDATED JUNE 2026</div>
  <h1>${esc(p.h1)}</h1>
  <p>Part of <a class="home" href="index.html">Isola — Alameda Eats</a>, the Island's live restaurant guide — open-now status, menus and one-tap directions.</p>
  <div class="rule2"></div>
</header>
<main>
  <nav class="nav">${navLinks(p.file)}</nav>
  <p class="intro">${esc(p.intro)}</p>
  <p class="intro" style="font-size:.92rem">${esc(summary)}</p>
  <p style="color:#5b6f78;font-size:.85rem">${esc(featuring)}</p>
  ${list.map(renderRestaurant).join('')}
  <p style="margin-top:24px"><a href="index.html" class="back-cta">← See all Alameda restaurants (live open-now)</a></p>
</main>
<footer>
  Isola — Alameda Eats · <a href="about.html">About</a> · <a href="privacy.html">Privacy &amp; Disclosures</a><br>
  Hours &amp; menus are approximate — please confirm with the restaurant.
</footer>
</body>
</html>`;
}

/* --- write pages --- */
allPages.forEach(p=>{ fs.writeFileSync(path+'/'+p.file, buildPage(p)); });

/* --- regenerate sitemap.xml --- */
const urls = [CANON, CANON+'about.html', CANON+'privacy.html', ...allPages.map(p=>CANON+p.file)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u,i)=>`  <url><loc>${u}</loc><lastmod>2026-06-29</lastmod><changefreq>${i===0?'weekly':'monthly'}</changefreq><priority>${i===0?'1.0':'0.7'}</priority></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path+'/sitemap.xml', sitemap);

console.log('Generated '+allPages.length+' landing pages: '+allPages.map(p=>p.file).join(', '));
console.log('Sitemap now lists '+urls.length+' URLs.');
