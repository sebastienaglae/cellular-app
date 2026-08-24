import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';
import { PingSession, SpeedResult } from '../models';
import { HeatSample } from '../utils/heat';
import { signal } from '@angular/core';
import { BUNDLED_SPECTRUM, CountrySpectrum, mergeSpectrum, fetchFullSpectrum } from '../data/spectrum';

export interface AppSettings {
  devMode: boolean;
  pollMs: number;
  constantTestMin: number;
  constantTestEnabled: boolean;
  dlUrl: string;
  ulUrl: string;
  ooklaUrl: string;
  countryOverride: string;
  saveGeoWithTests: boolean;
  permsAsked: boolean;
  lang: '';
}

export const DEFAULT_SETTINGS: AppSettings = {
  devMode: false,
  pollMs: 3000,
  constantTestMin: 30,
  constantTestEnabled: false,
  dlUrl: 'https://speed.cloudflare.com/__down?bytes=104857600',
  ulUrl: 'https://speed.cloudflare.com/__up',
  ooklaUrl: 'https://www.speedtest.net',
  countryOverride: '',
  saveGeoWithTests: true,
  permsAsked: false,
  lang: '' as const
};

const K_SETTINGS = 'cs.settings.v1';
const K_TESTS = 'cs.tests.v1';
const K_PINGS = 'cs.pings.v1';
const K_SPECTRUM = 'cs.spectrum.custom.v1';
const K_HEAT = 'cs.heat.v1';

@Injectable({ providedIn: 'root' })
export class StoreService {
  /** When dev mode is on, history/pings shown & added are synthetic (real data untouched on disk). */
  isDev = false;
  private realTests: SpeedResult[] = [];
  private realPings: PingSession[] = [];
  private realHeat: HeatSample[] = [];
  settings$ = new BehaviorSubject<AppSettings>({ ...DEFAULT_SETTINGS });
  tests$ = new BehaviorSubject<SpeedResult[]>([]);
  pings$ = new BehaviorSubject<PingSession[]>([]);
  heat$ = new BehaviorSubject<HeatSample[]>([]);
  spectrumCustom$ = new BehaviorSubject<CountrySpectrum[]>([]);
  spectrumFull$ = new BehaviorSubject<CountrySpectrum[]>([]);

  async init(): Promise<void> {
    const [s, t, p, sp, ht] = await Promise.all([
      Preferences.get({ key: K_SETTINGS }),
      Preferences.get({ key: K_TESTS }),
      Preferences.get({ key: K_PINGS }),
      Preferences.get({ key: K_SPECTRUM }),
      Preferences.get({ key: K_HEAT })
    ]);
    if (s.value) {
      try {
        this.settings$.next({ ...DEFAULT_SETTINGS, ...JSON.parse(s.value) });
      } catch {}
    }
    if (t.value) {
      try {
        this.tests$.next(JSON.parse(t.value));
      } catch {}
    }
    if (p.value) {
      try {
        this.pings$.next(JSON.parse(p.value));
      } catch {}
    }
    if (sp.value) {
      try {
        this.spectrumCustom$.next(JSON.parse(sp.value));
      } catch {}
    }
    if (ht.value) {
      try {
        const parsedHeat = JSON.parse(ht.value);
        this.heat$.next(Array.isArray(parsedHeat) ? parsedHeat : []);
      } catch {}
    }
    // full offline dataset (spectrum-tracker.com scrape) ships as an asset
    fetchFullSpectrum().then(list => {
      if (list?.length) this.spectrumFull$.next(list);
    });
  }

  get settings(): AppSettings {
    return this.settings$.value;
  }

  private async safeSet(key: string, value: string): Promise<void> {
    // storage can fail (full disk, WebView storage reset) - keep memory state authoritative
    try {
      await Preferences.set({ key, value });
    } catch {}
  }

  async saveSettings(patch: Partial<AppSettings>): Promise<void> {
    const next = { ...this.settings$.value, ...patch };
    this.settings$.next(next);
    await this.safeSet(K_SETTINGS, JSON.stringify(next));
  }

  allSpectrum(): CountrySpectrum[] {
    // precedence: user import > full scraped DB > bundled sample
    let merged = mergeSpectrum(BUNDLED_SPECTRUM, this.spectrumFull$.value);
    if (this.spectrumCustom$.value.length) {
      merged = mergeSpectrum(merged, this.spectrumCustom$.value);
    }
    return merged;
  }

  async importSpectrumJson(text: string): Promise<number> {
    if (typeof text !== 'string' || text.length > 5_000_000) throw new Error('File too large (max 5 MB)');
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return 0; // invalid JSON - nothing imported, caller decides whether to surface
    }
    if (!Array.isArray(parsed)) parsed = (parsed as { countries?: unknown })?.countries || [];
    if (!Array.isArray(parsed)) return 0;
    const incoming: CountrySpectrum[] = (parsed as CountrySpectrum[])
      .filter((c: CountrySpectrum) => c && c.iso && Array.isArray(c.allocs))
      .map((c: CountrySpectrum) => ({
        iso: String(c.iso).toUpperCase(),
        name: c.name || c.iso,
        allocs: c.allocs.filter((a: SpectrumLike) => a && a.band).map(a => ({ band: String(a.band), ops: (a.ops || []).map(String) })),
        source: c.source || 'imported',
        updated: c.updated || ''
      }));
    const merged = mergeSpectrum(this.spectrumCustom$.value.length ? this.spectrumCustom$.value : [], incoming);
    await this.safeSet(K_SPECTRUM, JSON.stringify(merged.filter(m => m.source !== 'bundled sample (public knowledge)')));
    this.spectrumCustom$.next(merged);
    return incoming.length;
  }

  async addTest(r: SpeedResult): Promise<void> {
    if (this.isDev) {
      this.tests$.next([...this.tests$.value, r].slice(-500));
      return;
    }
    const list = [...this.tests$.value, r].slice(-500);
    this.tests$.next(list);
    await this.safeSet(K_TESTS, JSON.stringify(list));
  }

  async clearTests(): Promise<void> {
    this.tests$.next([]);
    await this.safeSet(K_TESTS, '[]');
  }

  async addHeat(samples: HeatSample | HeatSample[]): Promise<void> {
    const add = Array.isArray(samples) ? samples : [samples];
    const list = [...this.heat$.value, ...add].slice(-3000);
    this.heat$.next(list);
    if (this.isDev) return;
    await this.safeSet(K_HEAT, JSON.stringify(list));
  }

  async clearHeat(): Promise<void> {
    this.heat$.next([]);
    if (this.isDev) return;
    await this.safeSet(K_HEAT, '[]');
  }

  async addPing(s: PingSession): Promise<void> {
    if (this.isDev) {
      this.pings$.next([...this.pings$.value, s].slice(-100));
      return;
    }
    const list = [...this.pings$.value, s].slice(-100);
    this.pings$.next(list);
    await this.safeSet(K_PINGS, JSON.stringify(list));
  }

  async clearPings(): Promise<void> {
    this.pings$.next([]);
    await this.safeSet(K_PINGS, '[]');
  }

  /** Tokyo-based synthetic dataset for dev mode / screenshots. Real data untouched. */
  readonly devGeo = { lat: 35.6586, lon: 139.7454 };

  setDevMode(on: boolean): void {
    if (on === this.isDev) return;
    this.isDev = on;
    if (on) {
      this.realTests = this.tests$.value;
      this.realPings = this.pings$.value;
      this.realHeat = this.heat$.value;
      const now = Date.now();
      const g = this.devGeo;
      this.tests$.next([
        { id: 'd1', t: now - 3600e3, dlMbps: 284.2, ulMbps: 42.1, latencyMs: 18, jitterMs: 2.1, serverUrl: 'dev', geo: { lat: g.lat, lon: g.lon, acc: 12 }, tech: '5G-SA', operator: 'NTT Docomo', fake: true },
        { id: 'd2', t: now - 1800e3, dlMbps: 86.4, ulMbps: 23.8, latencyMs: 31, jitterMs: 4.4, serverUrl: 'dev', geo: { lat: g.lat + 0.010, lon: g.lon - 0.014, acc: 18 }, tech: 'LTE', operator: 'Rakuten', fake: true },
        { id: 'd3', t: now - 300e3, dlMbps: 412.9, ulMbps: 55.2, latencyMs: 14, jitterMs: 1.8, serverUrl: 'dev', geo: { lat: g.lat - 0.018, lon: g.lon + 0.031, acc: 9 }, tech: '5G-SA', operator: 'NTT Docomo', fake: true }
      ]);
      this.pings$.next([
        { id: 'dp1', t: now - 2400e3, host: '1.1.1.1', sent: 25, avgMs: 36.6, minMs: 31.2, maxMs: 47.2, jitterMs: 3.4, lossPct: 0, times: [36, 34, 41] },
        { id: 'dp2', t: now - 600e3, host: '8.8.8.8', sent: 20, avgMs: 210.4, minMs: 198, maxMs: 260, jitterMs: 12.1, lossPct: 0, times: [210, 205, 260] }
      ]);

      // synthetic signal survey: grid around the devGeo point with a weak spot
      const bands = ['n78', 'B3', 'B1', 'B7', 'n28'];
      const freqs: Record<string, number> = { n78: 3556, B3: 1850, B1: 2140.5, B7: 2680, n28: 763 };
      const heat: HeatSample[] = [];
      for (let gx = 0; gx < 9; gx++) {
        for (let gy = 0; gy < 9; gy++) {
          const dist = Math.hypot(gx - 4.2, gy - 4.6);
          const dbm = Math.round(-62 - dist * 7 - (gx % 3) * 4);
          const band = bands[(gx + gy) % bands.length];
          heat.push({
            lat: g.lat + (gy - 4) * 0.0022,
            lon: g.lon + (gx - 4) * 0.0027,
            dbm: Math.max(-118, dbm),
            band,
            tech: band.startsWith('n') ? 'NR' : 'LTE',
            t: now - (gx * 9 + gy) * 1000
          });
        }
      }
      this.heat$.next(heat);
    } else {
      this.tests$.next(this.realTests);
      this.pings$.next(this.realPings);
      this.heat$.next(this.realHeat);
    }
  }
}

interface SpectrumLike {
  band: string;
  ops: string[];
}