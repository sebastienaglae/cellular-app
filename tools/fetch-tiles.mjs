/**
 * Downloads a lightweight offline OSM basemap (zoom 0-4, whole world, 341 tiles)
 * into src/assets/tiles. Low detail by design - country/region context only.
 * Tiles (c) OpenStreetMap contributors, CC-BY-SA; attribution rendered on map.
 */
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const ZMIN = 0;
const ZMAX = 4;
const ROOT = 'src/assets/tiles';
// OSM-France community tile server - tolerant of small one-off bulk fetches
// (tile.openstreetmap.org 403-blocks them per usage policy).
const URL_TPL = 'https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';
const UA = 'CellScope-offline-map-builder/1.0 (one-off personal bundle, 341 tiles z0-4; contact via app repo)';

let ok = 0;
let skip = 0;
let fail = 0;

for (let z = ZMIN; z <= ZMAX; z++) {
  const n = 2 ** z;
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      const p = `${ROOT}/${z}/${x}/${y}.png`;
      if (existsSync(p)) {
        skip++;
        continue;
      }
      mkdirSync(dirname(p), { recursive: true });
      const url = URL_TPL.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
      let done = false;
      for (let t = 0; t < 3 && !done; t++) {
        try {
          const r = await fetch(url, { headers: { 'User-Agent': UA } });
          if (r.ok) {
            writeFileSync(p, Buffer.from(await r.arrayBuffer()));
            ok++;
            done = true;
          } else if (r.status === 404) {
            // ocean tiles may 404 on some servers - write 1px fallback
            writeFileSync(p, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
            ok++;
            done = true;
          } else {
            await new Promise(res => setTimeout(res, 800 * (t + 1)));
          }
        } catch {
          await new Promise(res => setTimeout(res, 800 * (t + 1)));
        }
      }
      if (!done) {
        fail++;
        console.error(`FAIL ${url}`);
      }
    }
  }
  console.log(`zoom ${z} done`);
}
console.log(`ok=${ok} skipped=${skip} failed=${fail}`);
if (fail > 0) process.exit(1);
