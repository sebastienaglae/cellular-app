/**
 * Builds the offline spectrum database from spectrum-tracker.com's public
 * zone+band search API (complete tables, no auth required).
 *
 * Usage: node tools/scrape-spectrum.mjs [outFile]
 * Output: src/assets/data/spectrum-full.json
 * Data copyright spectrum-tracker.com ("share alike") - attribution kept in output.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const BASE = 'https://www.spectrum-tracker.com';
const API = `${BASE}/pages/fetch_data.php`;

const postJson = body =>
  fetch(API, { method: 'POST', body: new URLSearchParams(body) }).then(r => r.json());

async function postSearch(zone, band, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`${BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ Zone: zone, Spectrum_Band: band })
      });
      if (r.ok) return await r.text();
    } catch {}
    await new Promise(res => setTimeout(res, 1200 * (i + 1)));
  }
  throw new Error(`search failed ${zone}/${band}`);
}

function decode(s) {
  return s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}

const isoOverrides = {
  'united-states': 'US', 'united-kingdom': 'GB', 'south-korea': 'KR', 'hong-kong': 'HK',
  'czech-republic': 'CZ', 'dominican-republic': 'DO', 'bosnia-herzegovina': 'BA',
  'north-macedonia': 'MK', 'united-arab-emirates': 'AE', 'saudi-arabia': 'SA',
  'new-zealand': 'NZ', 'south-africa': 'ZA', 'ivory-coast': 'CI', 'sri-lanka': 'LK',
  'central-africa': '', congo: 'CG'
};
const KNOWN = new Map(Object.entries({
  argentina:'AR', canada:'CA', chile:'CL', colombia:'CO', ecuador:'EC', mexico:'MX', panama:'PA',
  peru:'PE', uruguay:'UY', albania:'AL', andorra:'AD', austria:'AT', belgium:'BE', bulgaria:'BG',
  croatia:'HR', cyprus:'CY', denmark:'DK', estonia:'EE', finland:'FI', france:'FR', germany:'DE',
  greece:'GR', hungary:'HU', iceland:'IS', ireland:'IE', italy:'IT', kosovo:'XK',
  liechtenstein:'LI', luxembourg:'LU', malta:'MT', montenegro:'ME', netherlands:'NL', norway:'NO',
  poland:'PL', portugal:'PT', romania:'RO', serbia:'RS', slovakia:'SK', slovenia:'SI', spain:'ES',
  sweden:'SE', switzerland:'CH', belarus:'BY', latvia:'LV', lithuania:'LT', moldova:'MD',
  russia:'RU', ukraine:'UA', armenia:'AM', azerbaijan:'AZ', bahrain:'BH', georgia:'GE',
  israel:'IL', jordan:'JO', kazakhstan:'KZ', kuwait:'KW', kyrgyzstan:'KG', lebanon:'LB', oman:'OM',
  qatar:'QA', turkey:'TR', uzbekistan:'UZ', australia:'AU', china:'CN', india:'IN', indonesia:'ID',
  japan:'JP', malaysia:'MY', mongolia:'MN', pakistan:'PK', singapore:'SG', thailand:'TH',
  vietnam:'VN', algeria:'DZ', botswana:'BW', egypt:'EG', namibia:'NA', nigeria:'NG', zambia:'ZM'
}));
function isoOf(slug) {
  const key = slug.toLowerCase().replace(/-/g, '-');
  return isoOverrides[key] || KNOWN.get(key) || '';
}
function nameOf(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\b(And|Of|The)\b/g, m => m.toLowerCase());
}

const zones = await postJson({ action: 'getZones' });
console.log('zones:', zones.map(z => z.Zone).join(', '));

/** slug -> {name, allocs: Map(band -> alloc[])} */
const countries = new Map();
let reqs = 0;

for (const { Zone: zone } of zones) {
  const bands = await postJson({ action: 'getSpectrumBands', Zone: zone });
  console.log(`${zone}: ${bands.length} layers`);
  const meta = new Map(bands.map(b => [b.Spectrum_Band, b]));

  for (const b of bands) {
    const band = b.Spectrum_Band;
    const html = await postSearch(zone, band);
    reqs++;
    // the results page contains ONE <tbody> PER COUNTRY - iterate all of them
    const tbRx = /<tbody[^>]*>([\s\S]*?)<\/tbody>/g;
    let tb;
    let rows = 0;
    while ((tb = tbRx.exec(html))) {
      const tbody = tb[1];
      const trRx = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
      let tr;
      while ((tr = trRx.exec(tbody))) {
        const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x => x[1]);
        if (tds.length < 7) continue;
        // first cell holds operator link "/Country/Operator"
        const hrefM = tds[0].match(/\/([A-Za-z][^/"\s>]*)\/([^>"\s]+)/);
        const countrySlug = hrefM ? hrefM[1] : null;
        if (!countrySlug) continue;
        const num = v => { const f = parseFloat(decode(v)); return isFinite(f) ? f : null; };
        const alloc = {
          op: decode(tds[0]),
          band,
          layer: meta.get(band)?.Frequency_Layer ?? null,
          duplex: meta.get(band)?.FDD_TDD ?? null,
          ul: [num(tds[1]), num(tds[2])],
          dl: [num(tds[3]), num(tds[4])],
          total: num(tds[5]),
          scope: decode(tds[6]) || null
        };
        if (!countries.has(countrySlug)) {
          countries.set(countrySlug, {
            iso: isoOf(countrySlug),
            slug: countrySlug,
            name: nameOf(countrySlug),
            source: 'spectrum-tracker.com',
            updated: new Date().toISOString().slice(0, 10),
            allocs: []
          });
        }
        countries.get(countrySlug).allocs.push(alloc);
        rows++;
      }
    }
    process.stdout.write(`.`);
    await new Promise(res => setTimeout(res, 350));
  }
  console.log('');
}

const out = [...countries.values()].sort((a, b) => a.name.localeCompare(b.name));
const outPath = process.argv[2] || 'src/assets/data/spectrum-full.json';
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify({ kind: 'cellscope-spectrum', version: 1, fetchedAt: new Date().toISOString(), requests: reqs, countries: out }, null, 1));
console.log(`wrote ${outPath}: ${out.length} countries, ${out.reduce((a, c) => a + c.allocs.length, 0)} allocations, ${reqs} requests`);
