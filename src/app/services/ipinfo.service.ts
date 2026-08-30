import { Injectable, signal } from '@angular/core';

/**
 * Offline IP -> ISP/ASN/org lookups against a compact binary database built
 * from iptoasn.com (PDDL) by tools/build-ipdb.mjs and bundled as an asset.
 * Starlink ranges (AS14593 SPACEX-STARLINK) are flagged automatically.
 */

export interface IpInfo {
  org: string;
  asn: number | null;
  cc: string;
  starlink: boolean;
}

const NETWORK_LABELS: Array<{ test: RegExp; name: string }> = [
  { test: /starlink|spacex/i, name: 'Starlink' },
  { test: /cloudflare/i, name: 'Cloudflare' },
  { test: /google/i, name: 'Google' },
  { test: /amazon|aws/i, name: 'Amazon AWS' },
  { test: /microsoft|azure/i, name: 'Microsoft Azure' },
  { test: /akamai/i, name: 'Akamai' },
  { test: /\bntt\b|docomo/i, name: 'NTT' },
  { test: /softbank/i, name: 'SoftBank' },
  { test: /kddi/i, name: 'KDDI' },
  { test: /orange/i, name: 'Orange' },
  { test: /proxad/i, name: 'Free' },
  { test: /sfr/i, name: 'SFR' },
  { test: /bouygues/i, name: 'Bouygues Telecom' },
  { test: /vodafone/i, name: 'Vodafone' },
  { test: /deutsche telekom|telekom/i, name: 'Deutsche Telekom' },
  { test: /\bt-?mobile\b/i, name: 'T-Mobile' },
  { test: /\bat&t\b/i, name: 'AT&T' },
  { test: /verizon/i, name: 'Verizon' }
];

export function enrichIp(info: IpInfo): IpInfo & { networkName: string } {
  const match = NETWORK_LABELS.find(item => item.test.test(info.org));
  return { ...info, networkName: match?.name || info.org };
}

const MAGIC = 0x4c4f4349;

export function ipv4ToU32(ip: string): number | null {
  const p = ip.split('.');
  if (p.length !== 4) return null;
  let out = 0;
  for (const part of p) {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    out = ((out << 8) | n) >>> 0;
  }
  return out >>> 0;
}

export function ipv6ToBytes(ip: string): Uint8Array | null {
  if (!ip.includes(':')) return null;
  const clean = ip.split('%')[0];
  let h: string[];
  let t: string[];
  if (clean.includes('::')) {
    const parts = clean.split('::');
    if (parts.length > 2) return null;
    h = parts[0] ? parts[0].split(':') : [];
    t = parts[1] ? parts[1].split(':') : [];
  } else {
    h = clean.split(':');
    t = [];
  }
  if (h.length + t.length > 8 || (!clean.includes('::') && h.length !== 8)) return null;
  const groups = new Array<number>(8).fill(0);
  for (let i = 0; i < h.length; i++) {
    const v = parseInt(h[i], 16);
    if (isNaN(v) && h[i] !== '') return null;
    groups[i] = v || 0;
  }
  for (let i = 0; i < t.length; i++) {
    const v = parseInt(t[t.length - 1 - i], 16);
    if (isNaN(v)) return null;
    groups[7 - i] = v;
  }
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 8; i++) {
    bytes[i * 2] = groups[i] >> 8;
    bytes[i * 2 + 1] = groups[i] & 0xff;
  }
  return bytes;
}

@Injectable({ providedIn: 'root' })
export class IpInfoService {
  private dv: DataView | null = null;
  private blob: Uint8Array | null = null;
  private ccs: string[] = [];
  private orgs: { name: string; asn: number }[] = [];
  private n4 = 0;
  private n6 = 0;
  private v4StartOff = 0;
  private v4EndOff = 0;
  private v4MetaOff = 0;
  private v6Off = 0;
  readonly loading = signal(false);
  readonly loaded = signal(false);
  loadedAt: Date | null = null;

  get isLoaded(): boolean {
    return this.loaded();
  }

  /** Auto-load quietly; the caller decides whether missing data is important. */
  async ensureLoaded(): Promise<boolean> {
    try {
      await this.load();
      return this.loaded();
    } catch {
      return false;
    }
  }

  async load(): Promise<void> {
    if (this.loaded() || this.loading()) return;
    this.loading.set(true);
    try {
      // bundled as raw .bin (aapt2 transparently unpacks *.gz assets, breaking .gz paths)
      let res = await fetch('assets/data/ipdb.bin');
      if (!res.ok) {
        res = await fetch('assets/data/ipdb.bin.gz');
        if (res.ok) {
          const buf = await this.gunzip(await res.arrayBuffer());
          this.parse(buf);
          this.loadedAt = new Date();
          this.loaded.set(true);
          return;
        }
      }
      if (!res.ok) throw new Error(`asset missing (${res.status})`);
      this.parse(await res.arrayBuffer());
      this.loadedAt = new Date();
      this.loaded.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private async gunzip(input: ArrayBuffer): Promise<ArrayBuffer> {
    const DS = (globalThis as { DecompressionStream?: typeof DecompressionStream }).DecompressionStream;
    if (!DS) throw new Error('DecompressionStream unavailable');
    const stream = new Blob([input]).stream().pipeThrough(new DS('gzip'));
    return await new Response(stream).arrayBuffer();
  }

  private parse(buf: ArrayBuffer): void {
    const dv = new DataView(buf);
    if (dv.getUint32(0) !== MAGIC) throw new Error('bad ipdb magic');
    // ver @4
    this.n4 = dv.getUint32(8);
    this.n6 = dv.getUint32(12);
    const nCc = dv.getUint32(16);
    const nOrg = dv.getUint32(20);
    const blobLen = dv.getUint32(24);

    let o = 28;
    const ccOffsets: number[] = [];
    for (let i = 0; i < nCc; i++, o += 2) ccOffsets.push(dv.getUint16(o));
    const orgTable: { off: number; asn: number }[] = [];
    for (let i = 0; i < nOrg; i++, o += 8) orgTable.push({ off: dv.getUint32(o), asn: dv.getUint32(o + 4) });

    const u8 = new Uint8Array(buf);
    const blobStart = o;
    this.blob = u8.subarray(blobStart, blobStart + blobLen);

    const readCStr = (off: number): string => {
      let end = off;
      while (end < this.blob!.length && this.blob![end] !== 0) end++;
      return new TextDecoder().decode(this.blob!.subarray(off, end));
    };
    this.ccs = ccOffsets.map(readCStr);
    this.orgs = orgTable.map(t => ({ name: readCStr(t.off), asn: t.asn }));

    o += blobLen;
    this.v4StartOff = o;
    this.v4EndOff = o + this.n4 * 4;
    this.v4MetaOff = this.v4EndOff + this.n4 * 4;
    this.v6Off = this.v4MetaOff + this.n4 * 4;
    this.dv = dv;
    this.loaded.set(true);
  }

  lookup(ip: string): IpInfo | null {
    if (!this.dv) return null;
    const v4 = ipv4ToU32(ip);
    let info: IpInfo | null = null;
    if (v4 != null) {
      const idx = this.findV4(v4);
      info = idx < 0 ? null : this.infoFromMeta(this.meta4(idx));
    } else {
      const b6 = ipv6ToBytes(ip);
      if (b6 != null) {
        const idx = this.findV6(b6);
        info = idx < 0 ? null : this.infoFromMeta(this.dv!.getUint32(this.v6Off + idx * 36 + 32));
      }
    }
    // iptoasn marks IANA-reserved/special blocks with ASN 0 ("Not routed")
    if (info && info.asn === 0) return null;
    return info;
  }

  /** All Starlink/SpaceX public ranges as "from - to" strings (v4). */
  starlinkRanges(limit = 40): string[] {
    if (!this.dv) return [];
    const out: string[] = [];
    const fmt = (v: number) => [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
    for (let i = 0; i < this.n4 && out.length < limit * 3; i++) {
      const info = this.infoFromMeta(this.meta4(i));
      if (info.starlink) out.push(`${fmt(this.start4(i))} – ${fmt(this.end4(i))}`);
    }
    return out.slice(0, limit);
  }

  private findV6(key: Uint8Array): number {
    let lo = 0;
    let hi = this.n6 - 1;
    let ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.cmp6(key, 0, this.v6Off + mid * 36) >= 0) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    // overlapping announcements exist: walk back through candidates
    let i = ans;
    let guard = 0;
    while (i >= 0 && guard++ < 512) {
      const recOff = this.v6Off + i * 36;
      if (this.cmp6(key, 0, recOff) < 0) break;
      if (this.cmp6(key, 0, recOff + 16) <= 0) return i;
      i--;
    }
    return -1;
  }

  private findV4(key: number): number {
    // kept simple (ranges sorted, minimal overlap); caller falls through to v4 meta check
    const dv = this.dv!;
    let lo = 0;
    let hi = this.n4 - 1;
    let ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (dv.getUint32(this.v4StartOff + mid * 4) <= key) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    let i = ans;
    let guard = 0;
    while (i >= 0 && guard++ < 512) {
      if (key <= dv.getUint32(this.v4EndOff + i * 4)) return i;
      i--;
    }
    return -1;
  }

  private cmp6(a: Uint8Array, aOff: number, bOff: number): number {
    const dv = this.dv!;
    for (let k = 0; k < 4; k++) {
      const av = ((a[aOff + k * 4] << 24) | (a[aOff + k * 4 + 1] << 16) | (a[aOff + k * 4 + 2] << 8) | a[aOff + k * 4 + 3]) >>> 0;
      const bv = dv.getUint32(bOff + k * 4);
      if (av !== bv) return av < bv ? -1 : 1;
    }
    return 0;
  }

  private start4(i: number): number {
    return this.dv!.getUint32(this.v4StartOff + i * 4);
  }
  private end4(i: number): number {
    return this.dv!.getUint32(this.v4EndOff + i * 4);
  }
  private meta4(i: number): number {
    return this.dv!.getUint32(this.v4MetaOff + i * 4);
  }
  private infoFromMeta(meta: number): IpInfo {
    const orgIdx = meta >>> 8;
    const ccIdx = meta & 0xff;
    const org = this.orgs[orgIdx];
    return {
      org: org?.name ?? '?',
      asn: org?.asn ?? null,
      cc: this.ccs[ccIdx] ?? '--',
      starlink: !!org && (org.asn === 14593 || /spacex|starlink/i.test(org.name))
    };
  }

  /** Public IP requires internet (the ONLY online feature besides speed tests). */
  async publicIp(timeoutMs = 6000): Promise<string | null> {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), timeoutMs);
      const r = await fetch('https://api.ipify.org?format=json', { signal: ctl.signal, cache: 'no-store' });
      clearTimeout(t);
      const j = await r.json();
      if (j?.ip) return String(j.ip);
    } catch {}
    try {
      const r2 = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { cache: 'no-store' });
      const txt = await r2.text();
      const m = txt.match(/^ip=(.+)$/m);
      return m ? m[1].trim() : null;
    } catch {
      return null;
    }
  }
}
