import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';
import { PingSession, SpeedResult } from '../models';
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
  permsAsked: false
};

const K_SETTINGS = 'cs.settings.v1';
const K_TESTS = 'cs.tests.v1';
const K_PINGS = 'cs.pings.v1';
const K_SPECTRUM = 'cs.spectrum.custom.v1';

@Injectable({ providedIn: 'root' })
export class StoreService {
  settings$ = new BehaviorSubject<AppSettings>({ ...DEFAULT_SETTINGS });
  tests$ = new BehaviorSubject<SpeedResult[]>([]);
  pings$ = new BehaviorSubject<PingSession[]>([]);
  spectrumCustom$ = new BehaviorSubject<CountrySpectrum[]>([]);
  spectrumFull$ = new BehaviorSubject<CountrySpectrum[]>([]);

  async init(): Promise<void> {
    const [s, t, p, sp] = await Promise.all([
      Preferences.get({ key: K_SETTINGS }),
      Preferences.get({ key: K_TESTS }),
      Preferences.get({ key: K_PINGS }),
      Preferences.get({ key: K_SPECTRUM })
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
    const list = [...this.tests$.value, r].slice(-500);
    this.tests$.next(list);
    await this.safeSet(K_TESTS, JSON.stringify(list));
  }

  async clearTests(): Promise<void> {
    this.tests$.next([]);
    await this.safeSet(K_TESTS, '[]');
  }

  async addPing(s: PingSession): Promise<void> {
    const list = [...this.pings$.value, s].slice(-100);
    this.pings$.next(list);
    await this.safeSet(K_PINGS, JSON.stringify(list));
  }

  async clearPings(): Promise<void> {
    this.pings$.next([]);
    await this.safeSet(K_PINGS, '[]');
  }
}

interface SpectrumLike {
  band: string;
  ops: string[];
}
