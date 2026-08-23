/**
 * Builds the offline IP->ISP database (ipdb.bin.gz) from iptoasn.com TSV dumps.
 * Usage: node tools/build-ipdb.mjs
 * Inputs : tools/data/ip2asn-v4.tsv.gz, tools/data/ip2asn-v6.tsv.gz
 * Output : src/assets/data/ipdb.bin.gz (+ src/assets/data/ipdb.meta.json)
 * License: iptoasn.com data is PDDL (public domain).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { dirname } from 'node:path';

const MAGIC = 0x4c4f4349; // 'LOCI'
const VER = 1;

const v4 = loadTsvSafe('tools/data/ip2asn-v4.tsv.gz');
const v6 = loadTsvSafe('tools/data/ip2asn-v6.tsv.gz');
function loadTsvSafe(p) {
  return gunzipSync(readFileSync(p)).toString().trim().split('\n')
    .map(l => l.split('\t'))
    .filter(f => f.length >= 5 && f[4].trim() !== '');
}

// string interning
const orgMap = new Map(); // "asn|org" -> idx
const ccMap = new Map();
const orgs = []; // {asn, name}
const ccs = [];
function internOrg(asn, name) {
  const key = `${asn}|${name}`;
  if (!orgMap.has(key)) {
    orgMap.set(key, orgs.length);
    orgs.push({ asn: Number(asn), name });
  }
  return orgMap.get(key);
}
function internCc(cc) {
  if (!ccMap.has(cc)) {
    ccMap.set(cc, ccs.length);
    ccs.push(cc);
  }
  return ccMap.get(cc);
}

function ipv4ToU32(dotted) {
  const p = dotted.split('.').map(Number);
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}
function hexToBytes(h) {
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}
function expandV6(ip) {
  // returns 16 bytes
  let head = ip, tail = '';
  if (ip.includes('::')) {
    [head, tail] = ip.split('::');
  }
  const h = head ? head.split(':').filter(Boolean) : [];
  const t = tail ? tail.split(':').filter(Boolean) : [];
  const groups = new Array(8).fill(0);
  for (let i = 0; i < h.length; i++) groups[i] = parseInt(h[i], 16);
  for (let i = 0; i < t.length; i++) groups[7 - (t.length - 1 - i)] = parseInt(t[i], 16);
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 8; i++) {
    bytes[i * 2] = groups[i] >> 8;
    bytes[i * 2 + 1] = groups[i] & 0xff;
  }
  return bytes;
}

const n4 = v4.length;
const n6 = v6.length;

const v4Start = new Uint32Array(n4);
const v4End = new Uint32Array(n4);
const v4Meta = new Uint32Array(n4);

for (let i = 0; i < n4; i++) {
  const [s, e, asn, cc, org] = v4[i];
  v4Start[i] = ipv4ToU32(s);
  v4End[i] = ipv4ToU32(e);
  const oIdx = internOrg(asn, org);
  const cIdx = internCc(cc === '-' ? '--' : cc);
  v4Meta[i] = ((oIdx & 0xffffff) << 8) | (cIdx & 0xff);
}

const n6b = n6 * 9; // 4 words start + 4 words end + 1 word meta
const v6Buf = new Uint32Array(n6b);
const v6Recs = [];
for (let i = 0; i < n6; i++) {
  const [s, e, asn, cc, org] = v6[i];
  const sb = expandV6(s);
  const eb = expandV6(e);
  const oIdx = internOrg(asn, org);
  const cIdx = internCc(cc === '-' ? '--' : cc);
  const meta = ((oIdx & 0xffffff) << 8) | (cIdx & 0xff);
  v6Recs.push({ sb, eb, meta });
}
// TSV order is lexical, not numeric -> must sort numerically for binary search
v6Recs.sort((a, b) => {
  for (let k = 0; k < 16; k++) {
    if (a.sb[k] !== b.sb[k]) return a.sb[k] - b.sb[k];
  }
  return 0;
});
for (let i = 0; i < n6; i++) {
  const { sb, eb, meta } = v6Recs[i];
  const dvS = new DataView(sb.buffer);
  const dvE = new DataView(eb.buffer);
  const off = i * 9;
  v6Buf[off] = dvS.getUint32(0);
  v6Buf[off + 1] = dvS.getUint32(4);
  v6Buf[off + 2] = dvS.getUint32(8);
  v6Buf[off + 3] = dvS.getUint32(12);
  v6Buf[off + 4] = dvE.getUint32(0);
  v6Buf[off + 5] = dvE.getUint32(4);
  v6Buf[off + 6] = dvE.getUint32(8);
  v6Buf[off + 7] = dvE.getUint32(12);
  v6Buf[off + 8] = meta;
}
// v4 must be numerically sorted too (TSV already is, but enforce)
{
  const rows = [];
  for (let i = 0; i < n4; i++) rows.push([v4Start[i], v4End[i], v4Meta[i]]);
  rows.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2]));
  for (let i = 0; i < n4; i++) {
    v4Start[i] = rows[i][0]; v4End[i] = rows[i][1]; v4Meta[i] = rows[i][2];
  }
}

// string blob
const enc = new TextEncoder();
const ccOffsets = [];
let cursor = 0;
const chunks = [];
for (const cc of ccs) {
  const b = enc.encode(cc + '\0');
  ccOffsets.push(cursor);
  chunks.push(b);
  cursor += b.length;
}
const orgOffsetsAsn = [];
for (const o of orgs) {
  const b = enc.encode(o.name + '\0');
  orgOffsetsAsn.push({ off: cursor, asn: o.asn });
  chunks.push(b);
  cursor += b.length;
}
const blob = new Uint8Array(cursor);
let p = 0;
for (const ch of chunks) {
  blob.set(ch, p);
  p += ch.length;
}

const headerLen = 7 * 4 + ccs.length * 2 + orgs.length * 8;
const total =
  headerLen + blob.length +
  n4 * 12 +
  n6 * 36;
const buf = new ArrayBuffer(total);
const dv = new DataView(buf);
const u8 = new Uint8Array(buf);

let o = 0;
dv.setUint32(o, MAGIC); o += 4;
dv.setUint32(o, VER); o += 4;
dv.setUint32(o, n4); o += 4;
dv.setUint32(o, n6); o += 4;
dv.setUint32(o, ccs.length); o += 4;
dv.setUint32(o, orgs.length); o += 4;
dv.setUint32(o, blob.length); o += 4;
for (let i = 0; i < ccs.length; i++) { dv.setUint16(o, ccOffsets[i]); o += 2; }
for (let i = 0; i < orgs.length; i++) { dv.setUint32(o, orgOffsetsAsn[i].off); o += 4; dv.setUint32(o, orgOffsetsAsn[i].asn); o += 4; }
u8.set(blob, o); o += blob.length;
for (let i = 0; i < n4; i++) { dv.setUint32(o, v4Start[i]); o += 4; }
for (let i = 0; i < n4; i++) { dv.setUint32(o, v4End[i]); o += 4; }
for (let i = 0; i < n4; i++) { dv.setUint32(o, v4Meta[i]); o += 4; }
// v6 written element-wise too (big-endian) to match DataView reads at runtime
for (let i = 0; i < n6 * 9; i++) { dv.setUint32(o, v6Buf[i]); o += 4; }

const gz = gzipSync(Buffer.from(buf), { level: 9 });
const outPath = 'src/assets/data/ipdb.bin';
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, Buffer.from(buf));
// gz kept OUT of src/assets on purpose: aapt2 unpacks *.gz assets at packaging
// time which would collide with the raw .bin; gz is only for remote updates.
writeFileSync('tools/data/ipdb.bin.gz', gz);

const starlink = orgs.filter(x => x.asn === 14593 || /spacex|starlink/i.test(x.name));
writeFileSync(
  'src/assets/data/ipdb.meta.json',
  JSON.stringify({
    builtAt: new Date().toISOString(),
    source: 'iptoasn.com (PDDL)',
    v4Ranges: n4,
    v6Ranges: n6,
    orgs: orgs.length,
    countries: ccs.length,
    starlinkOrgCount: starlink.length,
    starlinkAsns: [...new Set(starlink.map(s => s.asn))]
  }, null, 2)
);
console.log(`v4=${n4} v6=${n6} orgs=${orgs.length} ccs=${ccs.length}`);
console.log(`raw=${(total / 1e6).toFixed(1)}MB gz=${(gz.length / 1e6).toFixed(1)}MB -> ${outPath}`);
