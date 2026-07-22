/* ===========================================================
   build-pages.js — generates SEO landing pages from the
   RESTAURANTS data in data.js (one per cuisine + feature).
   Run:  node build-pages.js            → root Alameda pages (unchanged output)
         node build-pages.js <slug>     → pages into <slug>/ using <slug>/data.js
   City strings (name, locality, nickname, …) come from cities.json;
   the CITY object defaults to the root Alameda entry so root output
   is byte-identical to the pre-multi-city version.
   Re-run any time the data changes. Fully automated.
   =========================================================== */
const fs = require('fs');
const path = __dirname;
const { readRegistry, loadCity, loadRestaurants, escapeRegExp } = require('./city-lib');

/* --- which city are we building? (no arg = root Alameda) --- */
const CITY = loadCity(process.argv[2] || '');
const CANON = CITY.canon;
const OUT = CITY.dir;
if (!fs.existsSync(OUT + '/data.js')) {
  console.error(`Missing ${OUT}/data.js — create the city data first.`);
  process.exit(1);
}

/* --- pull RESTAURANTS array out of data.js --- */
const RESTAURANTS = loadRestaurants(OUT + '/data.js');

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
function addrRe(C){return new RegExp('^(.*),\\s*'+escapeRegExp(C.locality)+',\\s*'+C.state+'\\s*(\\d{5})');}
function addrObj(a,C){const m=a.match(addrRe(C));return {street:m?m[1]:a,zip:m?m[2]:''};}
function ohs(r){const out=[];r.hours.forEach((d,i)=>{(d||[]).forEach(iv=>out.push({"@type":"OpeningHoursSpecification","dayOfWeek":"https://schema.org/"+DAYFULL[i],"opens":hm(iv[0]),"closes":hm(iv[1])}));});return out;}
const PLACE_TYPE={'Bar & Lounge':'BarOrPub','Nightlife':'BarOrPub','Brewery':'Brewery',
  'Distillery & Winery':'Distillery','Attraction':'TouristAttraction','Games & Fun':'EntertainmentBusiness',
  'Movies & Shows':'MovieTheater','Golf & Mini Golf':'GolfCourse','Beach & Shoreline':'Beach',
  'Parks & Trails':'Park','Boating & Water':'SportsActivityLocation',
  'Convenience Store':'ConvenienceStore','Grocery & Deli':'GroceryStore'};
function restaurantLd(r,C){
  const a=addrObj(r.address,C);
  const isPlace=r.kind==='place';
  const base={"@type":isPlace?(PLACE_TYPE[r.cuisine]||'LocalBusiness'):'Restaurant',
    "name":r.name,...(r.img?{image:r.img}:{}),"priceRange":r.price,
    ...(r.phone?{"telephone":r.phone}:{}),"url":C.canon+"#card-"+slug(r.name),
    "address":{"@type":"PostalAddress","streetAddress":a.street,"addressLocality":C.locality,"addressRegion":C.state,"postalCode":a.zip,"addressCountry":"US"},
    "openingHoursSpecification":ohs(r)};
  if(!isPlace){
    base.servesCuisine=r.cuisine;
    if(r.menuUrl)base.hasMenu=r.menuUrl;
    base.acceptsReservations=/opentable|resy|reservation/i.test(r.reserve||'')?"True":"False";
  }
  return base;
}

/* --- page definitions (parameterized by city; Alameda defaults
       reproduce the original strings exactly) --- */
const PLACE_LABEL={'Bar & Lounge':'Bars & Lounges','Nightlife':'Nightlife','Brewery':'Breweries & Taprooms',
  'Distillery & Winery':'Distilleries & Wineries','Attraction':'Attractions & Museums',
  'Games & Fun':'Arcades, Games & Fun','Movies & Shows':'Movies, Comedy & Shows',
  'Golf & Mini Golf':'Golf & Mini Golf','Beach & Shoreline':'Beaches & Shoreline',
  'Parks & Trails':'Parks & Trails','Boating & Water':'Boating & Water Sports',
  'Convenience Store':'24-Hour Convenience Stores','Grocery & Deli':'Late-Night Grocery'};
const PLACE_EMOJI={'Bar & Lounge':'🍹','Nightlife':'🎶','Brewery':'🍺','Distillery & Winery':'🥃',
  'Attraction':'🛳️','Games & Fun':'🕹️','Movies & Shows':'🎬','Golf & Mini Golf':'⛳',
  'Beach & Shoreline':'🏖️','Parks & Trails':'🌳','Boating & Water':'🛶',
  'Convenience Store':'🏪','Grocery & Deli':'🛒'};

function definePages(R, C){
  const N=C.name, ST=C.state, SF=C.stateFull, NICK=C.nick, ONPD=C.onpDisp;
  const isPlace = r => r.kind==='place';
  const cuisines = [...new Set(R.filter(r=>!isPlace(r)).map(r=>r.cuisine))];
  const cuisinePages = cuisines.map(c=>({
    file: slug(c)+'.html',
    h1: `${c} Restaurants in ${N}, ${ST}`,
    title: `Best ${c} Restaurants in ${N}, ${ST} — Menus, Hours & Open Now | Isola Eats`,
    desc: `The best ${c} restaurants in ${N}, ${SF}. See menus, photos, hours and who's open now, with one-tap call, directions and ordering. Updated July 2026.`,
    intro: `Looking for ${c.toLowerCase()} food in ${N}? Here are ${NICK}'s ${c.toLowerCase()} spots — with menus, prices, hours and live "open now" status. Tap any restaurant to call, get directions, or see the full live menu.`,
    match: r=>!isPlace(r)&&r.cuisine===c,
    emoji: ({Italian:'🍝',Mexican:'🌮',Thai:'🍜',Chinese:'🥟',Vietnamese:'🍲',Japanese:'🍣',Indian:'🍛',American:'🍔',Seafood:'🦞',Cafe:'🥐',Mediterranean:'🥙',Vegetarian:'🥗',"Fast Food":'🍟',Bakery:'🥯'})[c]||'🍽️'
  }));
  /* place-category pages: "Breweries in Alameda, CA", not "Brewery Restaurants..." */
  const placeCats = [...new Set(R.filter(isPlace).map(r=>r.cuisine))];
  const placePages = placeCats.map(c=>{
    const label=PLACE_LABEL[c]||c;
    return {
      file: slug(label)+'.html',
      h1: `${label} in ${N}, ${ST}`,
      title: `${label} in ${N}, ${ST} — Hours, What to Expect & Open Now | Isola`,
      desc: `The best ${label.toLowerCase()} in ${N}, ${SF} — with hours, live open-now status, highlights and one-tap directions. Updated July 2026.`,
      intro: `Looking for ${label.toLowerCase()} in ${N}? Here's what ${NICK} has — with hours, highlights and live "open now" status. Tap any spot for directions or the full details.`,
      match: r=>isPlace(r)&&r.cuisine===c,
      emoji: PLACE_EMOJI[c]||'🌟',
      place: true
    };
  });
  const featurePages = [
    {file:'waterfront.html', label:'Waterfront', emoji:'🌊', h1:`Waterfront Restaurants in ${N}, ${ST}`,
     title:`Waterfront Restaurants in ${N}, ${ST} — Bay Views, Menus & Hours | Isola Eats`,
     desc:`${N} restaurants with waterfront and bay views. Menus, hours, open-now status and one-tap directions for dining on the water. Updated July 2026.`,
     intro:`${N} is an island — so eat on the water. These spots serve up bay and estuary views along with the meal. See menus, hours and who's open now.`,
     match:r=>(r.cats||[]).includes('waterfront')},
    {file:'patio.html', label:'Patio & Outdoor', emoji:'🌿', h1:`Restaurants with Patios & Outdoor Dining in ${N}, ${ST}`,
     title:`Patio & Outdoor Dining in ${N}, ${ST} — Menus & Hours | Isola Eats`,
     desc:`${N} restaurants with patios and outdoor seating. Menus, hours, open-now status and tap-to-call directions. Updated July 2026.`,
     intro:`Eat outside ${ONPD}. These ${N} restaurants offer patios or outdoor seating — here are menus, hours and live open-now status.`,
     match:r=>(r.cats||[]).includes('patio')},
    {file:'breakfast.html', label:'Breakfast & Brunch', emoji:'🍳', h1:`Breakfast & Brunch in ${N}, ${ST}`,
     title:`Best Breakfast & Brunch in ${N}, ${ST} — Menus & Hours | Isola Eats`,
     desc:`The best breakfast and brunch spots in ${N}, ${SF} — diners, bakeries and cafes. Menus, hours, open-now and directions. Updated July 2026.`,
     intro:`Start the day right ${ONPD}. ${N}'s breakfast and brunch spots — classic diners, bakeries and cafes — with menus, hours and open-now status.`,
     match:r=>(r.cats||[]).includes('breakfast')},
    {file:'open-late.html', label:'Open Late', emoji:'🌙', h1:`Open Late in ${N}, ${ST}`,
     title:`Open Late in ${N}, ${ST} — Late-Night Food, Bars & Hours | Isola`,
     desc:`Out late in ${N}? These restaurants and bars stay open until 9:30pm or later — some until 2am. Hours, open-now status and one-tap directions. Updated July 2026.`,
     intro:`Late night ${ONPD}? These ${N} restaurants and bars serve until 9:30pm or later — a few pour until 2am. Always check the live hours before you head out.`,
     match:r=>r.hours.some(d=>(d||[]).some(iv=>iv[1]>=21.5))},
    {file:'after-hours.html', label:'After Hours', emoji:'🌙', h1:`Open After Midnight in ${N}, ${ST}`,
     title:`Food Open After Midnight in ${N}, ${ST} — Late-Night & 24-Hour Spots | Isola`,
     desc:`What's open after midnight in ${N}, ${SF} — late-night food, 24-hour spots and 2am bars, with verified hours and live open-now status. Updated July 2026.`,
     intro:`It's past midnight ${ONPD} and you're hungry. These are the only ${N} spots still serving after 12am — verified hours, live open-now status, and one-tap directions. Bookmark this one.`,
     match:r=>r.hours.some(d=>(d||[]).some(iv=>iv[1]>24||(iv[0]===0&&iv[1]===24)))},
    {file:'family-friendly.html', label:'Family-Friendly', emoji:'👨‍👩‍👧', h1:`Family-Friendly Things to Do & Eat in ${N}, ${ST}`,
     title:`Family-Friendly Restaurants & Things to Do in ${N}, ${ST} — Hours & Open Now | Isola`,
     desc:`Family-friendly restaurants and activities in ${N}, ${SF} — relaxed, kid-welcoming spots. Hours, open-now status and directions. Updated July 2026.`,
     intro:`Bringing the whole crew to ${NICK}? These ${N} spots — restaurants, parks, arcades and attractions — are easygoing and kid-welcoming. See hours and who's open now.`,
     match:r=>r.tags.concat(r.cats||[]).some(t=>/family|kid/i.test(t))},
    {file:'vegan-vegetarian.html', label:'Vegan & Vegetarian', emoji:'🌱', h1:`Vegan & Vegetarian Food in ${N}, ${ST}`,
     title:`Best Vegan & Vegetarian Restaurants in ${N}, ${ST} — Menus, Hours & Open Now | Isola`,
     desc:`Where to eat vegan and vegetarian in ${N}, ${SF} — plant-based restaurants and veg-friendly menus, with hours, prices and live open-now status. Updated July 2026.`,
     intro:`Eating plant-based ${ONPD}? These ${N} spots are fully vegetarian or have substantial, verified vegan and vegetarian menus — not just a token salad. Hours, prices and live open-now status included.`,
     match:r=>(r.cats||[]).includes('vegan')||r.cuisine==='Vegetarian'},
    {file:'date-night.html', label:'Date Night', emoji:'💫', h1:`Date Night Ideas in ${N}, ${ST}`,
     title:`Best Date Night Ideas in ${N}, ${ST} — Dinner, Drinks & Things to Do | Isola`,
     desc:`Date night in ${N}, ${SF} — romantic restaurants, cocktail lounges, sunset beaches and fun things to do, with hours and live open-now status. Updated July 2026.`,
     intro:`Planning a date ${ONPD}? Start with dinner or cocktails, then a sunset walk on the beach, a tiki bar, mini golf or a comedy show. Everything here is date-tested — with hours and live open-now status.`,
     match:r=>r.tags.concat(r.cats||[]).some(t=>/date/i.test(t))},
    {file:'bars.html', label:'Bars & Cocktails', emoji:'🍸', h1:`Bars, Cocktails & Drinks in ${N}, ${ST}`,
     title:`Best Bars & Cocktail Restaurants in ${N}, ${ST} — Menus & Hours | Isola Eats`,
     desc:`Where to drink in ${N}, ${SF} — restaurants and bars with craft cocktails, tequila and wine lists. Hours, open-now status and directions. Updated July 2026.`,
     intro:`Grab a drink ${ONPD}. These ${N} restaurants and bars are known for craft cocktails, tequila or strong wine lists — with menus, hours and open-now status.`,
     match:r=>r.tags.some(t=>/cocktail|tequila|wine|bar/i.test(t))}
  ].filter(f=>R.some(f.match));

  return {cuisinePages, placePages, featurePages, allPages:[...cuisinePages, ...placePages, ...featurePages]};
}

const {cuisinePages, placePages, featurePages, allPages} = definePages(RESTAURANTS, CITY);

/* --- shared CSS (Island Edition brand) --- */
const CSS = `
  :root{--sky:#4FC3EA;--ocean:#0E86B0;--sea-deep:#075A78;--sand:#FAF3E3;--foam:#FFFFFF;
    --coral:#FF6B54;--sun:#FFB648;--ink:#123B4F;--ink-2:#4E7286;--hairline:#E7DCC4}
  body{margin:0;font-family:'Inter',system-ui,sans-serif;color:var(--ink);
    background:var(--sand);line-height:1.6;font-size:15.5px;-webkit-font-smoothing:antialiased}
  header{position:relative;color:#fff;text-align:left;overflow:hidden;padding:22px 20px 46px;
    background:radial-gradient(280px 280px at 85% -50px, rgba(255,214,130,.7), transparent 68%),
      linear-gradient(165deg,#8ADDF6 0%,#4FC3EA 35%,#0E86B0 78%,#075A78 100%)}
  header .inner{max-width:860px;margin:0 auto}
  header .rule,header .rule2{display:none}
  header .kick{display:inline-block;font-family:'Outfit',sans-serif;font-weight:700;font-size:11px;
    letter-spacing:.12em;text-transform:uppercase;background:rgba(255,255,255,.18);
    border:1px solid rgba(255,255,255,.35);padding:6px 13px;border-radius:999px;margin-bottom:10px}
  header h1{margin:6px 0 0;font-family:'Outfit',sans-serif;font-weight:800;
    font-size:clamp(28px,6vw,48px);letter-spacing:-.02em;line-height:1.08;text-shadow:0 2px 12px rgba(7,50,70,.3)}
  header p{margin:10px 0 0;font-size:14px;font-weight:500;max-width:640px;opacity:.97}
  header a.home{color:#FFD98F;text-decoration:none;font-weight:700}
  main{max-width:860px;margin:0 auto;padding:22px 20px 50px}
  .nav{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 18px}
  .nav a{font-family:'Outfit',sans-serif;font-weight:600;font-size:12px;letter-spacing:.03em;text-transform:uppercase;
    text-decoration:none;color:var(--ink);background:var(--foam);border:1px solid var(--hairline);
    padding:8px 13px;border-radius:999px;box-shadow:0 1px 3px rgba(8,57,81,.06)}
  .nav a:hover{border-color:var(--ocean);color:var(--ocean)}
  .r{background:var(--foam);border:0;border-radius:20px;padding:18px 20px;margin:14px 0;
    box-shadow:0 2px 6px rgba(8,57,81,.06),0 16px 36px -18px rgba(8,57,81,.2)}
  .r h2{margin:0;font-family:'Outfit',sans-serif;font-weight:800;font-size:21px;letter-spacing:-.01em;color:var(--ink)}
  .r h2 span{color:var(--ink-2);font-size:15px;font-weight:700}
  .r .meta{font-family:'Outfit',sans-serif;font-weight:600;font-size:12px;letter-spacing:.06em;
    text-transform:uppercase;color:var(--ocean);margin:5px 0 8px}
  .r .desc{font-size:14.5px;color:var(--ink-2);margin:0 0 8px}
  .r .hrs{font-weight:600;font-size:12px;color:var(--ink-2);margin:0 0 12px;font-variant-numeric:tabular-nums}
  .r .links{display:flex;flex-wrap:wrap;gap:8px;border-top:1px solid var(--hairline);padding-top:12px}
  .r .links a{font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;text-decoration:none;
    padding:10px 15px;border-radius:999px;border:1.5px solid var(--hairline)}
  .a-call,.a-map{color:var(--ocean)}.a-menu{background:linear-gradient(135deg,#FF6B54,#E85340);border-color:transparent;color:#fff}
  .a-live{color:var(--ink-2)}
  .intro{font-size:16px;color:var(--ink);margin:0 0 6px}
  .back-cta{background:linear-gradient(135deg,#FF6B54,#E85340);color:#fff;text-decoration:none;
    font-family:'Outfit',sans-serif;font-weight:700;padding:13px 22px;border-radius:999px;display:inline-block;
    box-shadow:0 4px 14px rgba(232,83,64,.35)}
  footer{text-align:center;color:var(--ink-2);font-size:12.5px;padding:24px 18px;border-top:1px solid var(--hairline);margin-top:24px}
  footer a{color:var(--ocean);font-weight:600}`;
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />`;

function maps(a){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(a);}

function renderRestaurant(r){
  const place=r.kind==='place';
  const mainUrl=r.menuUrl||r.website;
  const mainLink=mainUrl?`<a class="a-menu" href="${esc(mainUrl)}" target="_blank" rel="noopener">${place?'ℹ️ Details':'📖 Menu'}</a>`:'';
  return `<article class="r">
    <h2>${esc(r.name)} <span style="color:#5a7d3c">${r.price}</span></h2>
    <p class="meta">★ ${r.rating} · ${esc(r.cuisine)} · ${esc(r.address)}</p>
    <p class="desc">${esc(r.desc)}</p>
    <p class="hrs"><strong>Hours:</strong> ${esc(hoursLine(r))}</p>
    <div class="links">
      ${r.phone?`<a class="a-call" href="tel:${r.phone}">📞 Call</a>`:''}
      <a class="a-map" href="${maps(r.address)}" target="_blank" rel="noopener">🗺️ Directions</a>
      ${mainLink}
      <a class="a-live" href="${CANON}#card-${slug(r.name)}">🟢 Live hours &amp; more →</a>
    </div>
  </article>`;
}

function navLinks(currentFile){
  const links = cuisinePages.map(p=>`<a href="${p.file}"${p.file===currentFile?' style="background:#0b6e8f;color:#fff"':''}>${p.emoji} ${esc(p.h1.replace(` Restaurants in ${CITY.name}, ${CITY.state}`,''))}</a>`).join('');
  const places = placePages.map(p=>`<a href="${p.file}"${p.file===currentFile?' style="background:#0b6e8f;color:#fff"':''}>${p.emoji} ${esc(p.h1.replace(` in ${CITY.name}, ${CITY.state}`,''))}</a>`).join('');
  const feats = featurePages.map(p=>`<a href="${p.file}"${p.file===currentFile?' style="background:#0b6e8f;color:#fff"':''}>${p.emoji} ${esc(p.label)}</a>`).join('');
  return `<a href="index.html">🏠 The Whole ${CITY.nickNoun}</a>${links}${places}${feats}`;
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
    ? (p.place
      ? `We track ${list.length} ${list.length===1?'spot':'spots'} here, averaging ${ratingsAvg}★. Every listing shows the day's hours, what to expect with typical prices, and one-tap directions — plus live "open now" status on the main guide.`
      : `We track ${list.length} ${list.length===1?'spot':'spots'} here, averaging ${ratingsAvg}★. Every listing shows the day's hours, a sample menu with prices, and one-tap call, directions and ordering — plus live "open now" status on the main guide.`)
    : '';
  const itemList = {"@type":"ItemList","name":p.h1,"numberOfItems":list.length,
    "itemListElement":list.map((r,i)=>({"@type":"ListItem","position":i+1,"item":restaurantLd(r,CITY)}))};
  const breadcrumb = {"@type":"BreadcrumbList","itemListElement":[
    {"@type":"ListItem","position":1,"name":`Things to Do in ${CITY.name}`,"item":CANON},
    {"@type":"ListItem","position":2,"name":p.h1,"item":url}]};
  const ld = {"@context":"https://schema.org","@graph":[itemList,breadcrumb]};
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="google-site-verification" content="IbxTYmalcBs3AUrqCtbfS_G3g_MGMsX9px7jC5zhjKY" />
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9317623446575927" crossorigin="anonymous"></script>
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}" />
<link rel="canonical" href="${url}" />
<meta property="og:title" content="${esc(p.h1)} | Isola — ${esc(CITY.name)} Eats" />
<meta property="og:description" content="${esc(p.desc)}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=70" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230E86B0'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23FFB648'/%3E%3Cpath d='M8 42c6-5 11-5 17 0s11 5 17 0 8-4 14 0' stroke='white' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E" />
${FONTS}
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<header>
  <div class="inner">
  <div class="kick">FROM ISOLA — ${esc(CITY.nameUp)}'S ${esc(CITY.nickNounUp)} GUIDE · UPDATED JULY 2026</div>
  <h1>${esc(p.h1)}</h1>
  <p>Part of <a class="home" href="index.html">Isola</a>, ${esc(CITY.nick)}'s live guide to eat, drink &amp; do — open-now status, menus and one-tap directions.</p>
  </div>
</header>
<main>
  <nav class="nav">${navLinks(p.file)}</nav>
  <p class="intro">${esc(p.intro)}</p>
  <p class="intro" style="font-size:.92rem">${esc(summary)}</p>
  <p style="color:#5b6f78;font-size:.85rem">${esc(featuring)}</p>
  ${list.map(renderRestaurant).join('')}
  <p style="margin-top:24px"><a href="index.html" class="back-cta">← See the whole ${esc(CITY.nickNoun)} (live open-now)</a></p>
</main>
<footer>
  Isola — ${esc(CITY.name)}'s ${esc(CITY.nickNoun)} Guide · <a href="${CITY.rootPrefix}about.html">About</a> · <a href="${CITY.rootPrefix}privacy.html">Privacy &amp; Disclosures</a><br>
  Hours &amp; menus are approximate — please confirm with the venue.
</footer>
</body>
</html>`;
}

/* --- write pages --- */
allPages.forEach(p=>{ fs.writeFileSync(OUT+'/'+p.file, buildPage(p)); });

/* --- regenerate sitemap.xml --- */
function sitemapXml(urls){
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u,i)=>`  <url><loc>${u}</loc><lastmod>2026-07-06</lastmod><changefreq>${i===0?'weekly':'monthly'}</changefreq><priority>${i===0?'1.0':'0.7'}</priority></url>`).join('\n')}
</urlset>
`;
}
let urls;
if (CITY.isRoot) {
  urls = [CANON, CANON+'about.html', CANON+'privacy.html', ...allPages.map(p=>CANON+p.file)];
  /* append city guides (cities.json) whose directories + data exist */
  readRegistry().filter(c=>!c.root && c.slug).forEach(c=>{
    const cityDataPath = path+'/'+c.slug+'/data.js';
    if (!fs.existsSync(cityDataPath)) return;               // city not built yet — skip
    const cCity = loadCity(c.slug);
    const cPages = definePages(loadRestaurants(cityDataPath), cCity).allPages;
    urls.push(cCity.canon, ...cPages.map(p=>cCity.canon+p.file));
  });
} else {
  urls = [CANON, ...allPages.map(p=>CANON+p.file)];
}
fs.writeFileSync(OUT+'/sitemap.xml', sitemapXml(urls));

console.log('Generated '+allPages.length+' landing pages: '+allPages.map(p=>p.file).join(', '));
console.log('Sitemap now lists '+urls.length+' URLs.');
