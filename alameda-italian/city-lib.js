/* ===========================================================
   city-lib.js — shared helpers for the multi-city generator.
   Used by build-city.js and build-pages.js. Reads cities.json
   (the city registry) and derives the display strings both
   scripts need. Root Alameda entry derives EXACTLY the strings
   that were previously hard-coded, so root output is unchanged.
   =========================================================== */
const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, 'cities.json');
const SITE = 'https://isolaguides.com/';
const STATE_FULL = { CA: 'California' };

function readRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

/* Proper-case an on_phrase for use in prose ("on the island" ->
   "on the Island", "in coronado" -> "in Coronado"). Rules:
   "island" is always capitalized (it's the brand noun), and any
   word that appears in the city name or locality gets that casing. */
function properPhrase(onPhrase, entry) {
  const proper = {};
  (entry.name + ' ' + (entry.locality || '')).split(/\s+/).forEach(w => {
    if (w) proper[w.toLowerCase()] = w;
  });
  proper['island'] = 'Island';
  return onPhrase.split(' ').map(w => proper[w.toLowerCase()] || w).join(' ');
}

/* Load a city entry by slug ('' or undefined = root) and derive fields. */
function loadCity(slug) {
  const reg = readRegistry();
  const entry = slug
    ? reg.find(c => c.slug === slug)
    : reg.find(c => c.root);
  if (!entry) throw new Error(`City slug "${slug}" not found in cities.json`);

  const isRoot = !!entry.root;
  const nick = entry.nickname;                        // "the Island" / "the Crown City"
  const nickNoun = nick.replace(/^the\s+/i, '');      // "Island" / "Crown City"
  const onp = entry.on_phrase;                        // "on the island" / "in coronado"
  return {
    ...entry,
    isRoot,
    dir: isRoot ? __dirname : path.join(__dirname, entry.slug),
    canon: isRoot ? SITE : SITE + entry.slug + '/',
    stateFull: STATE_FULL[entry.state] || entry.state,
    nick,                                             // "the Island"
    nickCap: nick.charAt(0).toUpperCase() + nick.slice(1),   // "The Island"
    nickNoun,                                         // "Island"
    nickNounUp: nickNoun.toUpperCase(),               // "ISLAND"
    onp,                                              // "on the island"
    onpDisp: properPhrase(onp, entry),                // "on the Island" / "in Coronado"
    onpUp: onp.toUpperCase(),                         // "ON THE ISLAND"
    nameUp: entry.name.toUpperCase(),
    /* relative prefix from a city page back to root-level shared pages */
    rootPrefix: isRoot ? '' : '../',
  };
}

/* Pull the RESTAURANTS array out of a data.js file (same trick
   build-pages.js always used). */
function loadRestaurants(dataJsPath) {
  const src = fs.readFileSync(dataJsPath, 'utf8');
  const m = src.match(/const RESTAURANTS\s*=\s*(\[[\s\S]*?\n\];)/);
  if (!m) throw new Error('Could not find RESTAURANTS array in ' + dataJsPath);
  return eval(m[1].replace(/;$/, ''));
}

const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { readRegistry, loadCity, loadRestaurants, slugify, escapeRegExp, SITE };
