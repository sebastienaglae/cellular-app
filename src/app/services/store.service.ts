import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';
import { SpeedResult } from '../models';
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

export interface HistoryFile {
  kind: 'cellscope-history';
  version: 1;
  exportedAt: string;
  settings?: Partial<AppSettings>;
  tests: SpeedResult[];
  spectrum?: CountrySpectrum[];
}

const K_SETTINGS = 'cs.settings.v1';
const K_TESTS = 'cs.tests.v1';
const K_SPECTRUM = 'cs.spectrum.custom.v1';

@Injectable({ providedIn: 'root' })
export class StoreService {
  settings$ = new BehaviorSubject<AppSettings>({ ...DEFAULT_SETTINGS });
  tests$ = new BehaviorSubject<SpeedResult[]>([]);
  spectrumCustom$ = new BehaviorSubject<CountrySpectrum[]>([]);
  spectrumFull$ = new BehaviorSubject<CountrySpectrum[]>([]);

  async init(): Promise<void> {
    const [s, t, sp] = await Promise.all([
      Preferences.get({ key: K_SETTINGS }),
      Preferences.get({ key: K_TESTS }),
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

  async saveSettings(patch: Partial<AppSettings>): Promise<void> {
    const next = { ...this.settings$.value, ...patch };
    this.settings$.next(next);
    await Preferences.set({ key: K_SETTINGS, value: JSON.stringify(next) });
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
    let parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) parsed = parsed?.countries || [];
    const incoming: CountrySpectrum[] = parsed
      .filter((c: CountrySpectrum) => c && c.iso && Array.isArray(c.allocs))
      .map((c: CountrySpectrum) => ({
        iso: String(c.iso).toUpperCase(),
        name: c.name || c.iso,
        allocs: c.allocs.filter((a: SpectrumLike) => a && a.band).map(a => ({ band: String(a.band), ops: (a.ops || []).map(String) })),
        source: c.source || 'imported',
        updated: c.updated || ''
      }));
    const merged = mergeSpectrum(this.spectrumCustom$.value.length ? this.spectrumCustom$.value : [], incoming);
    await Preferences.set({ key: K_SPECTRUM, value: JSON.stringify(merged.filter(m => m.source !== 'bundled sample (public knowledge)')) });
    this.spectrumCustom$.next(merged);
    return incoming.length;
  }

  async addTest(r: SpeedResult): Promise<void> {
    const list = [...this.tests$.value, r].slice(-500);
    this.tests$.next(list);
    await Preferences.set({ key: K_TESTS, value: JSON.stringify(list) });
  }

  async clearTests(): Promise<void> {
    this.tests$.next([]);
    await Preferences.set({ key: K_TESTS, value: '[]' });
  }

  buildExport(includeSpectrum: boolean): HistoryFile {
    return {
      kind: 'cellscope-history',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: this.settings,
      tests: this.tests$.value,
      ...(includeSpectrum && this.spectrumCustom$.value.length ? { spectrum: this.spectrumCustom$.value } : {})
    };
  }

  async importHistory(text: string): Promise<{ tests: number; countries: number }> {
    const f: HistoryFile = JSON.parse(text);
    if (f.kind !== 'cellscope-history') throw new Error('Not a CellScope export');
    let tests = 0;
    let countries = 0;
    if (Array.isArray(f.tests) && f.tests.length) {
      const merged = [...f.tests, ...this.tests$.value].slice(-500);
      this.tests$.next(merged);
      await Preferences.set({ key: K_TESTS, value: JSON.stringify(merged) });
      tests = f.tests.length;
    }
    if (f.settings) {
      await this.saveSettings(f.settings);
    }
    if (f.spectrum?.length) {
      countries = await this.importSpectrumJson(JSON.stringify(f.spectrum));
    }
    return { tests, countries };
  }
}

interface SpectrumLike {
  band: string;
  ops: string[];
}
