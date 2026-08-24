import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, StoreService } from './store.service';

const store = new Map<string, string>();

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({ value: store.get(key) ?? null })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      store.set(key, value);
    })
  }
}));

describe('StoreService', () => {
  let svc: StoreService;

  beforeEach(async () => {
    store.clear();
    svc = new StoreService();
    await svc.init();
  });

  it('starts with defaults and empty history', () => {
    expect(svc.settings).toEqual(DEFAULT_SETTINGS);
    expect(svc.tests$.value).toEqual([]);
    expect(svc.pings$.value).toEqual([]);
  });

  it('merges saved settings over defaults', async () => {
    await svc.saveSettings({ devMode: true, pollMs: 5000 });
    const fresh = new StoreService();
    await fresh.init();
    expect(fresh.settings.devMode).toBe(true);
    expect(fresh.settings.pollMs).toBe(5000);
    expect(fresh.settings.ooklaUrl).toBe(DEFAULT_SETTINGS.ooklaUrl);
  });

  it('caps stored speed tests at 500 and pings at 100', async () => {
    for (let i = 0; i < 505; i++) {
      await svc.addTest({ id: `t${i}`, t: i, dlMbps: 1, ulMbps: null, latencyMs: null, jitterMs: null, serverUrl: '', geo: null, tech: null, operator: null });
    }
    expect(svc.tests$.value.length).toBe(500);
    expect(svc.tests$.value[0].id).toBe('t5');

    for (let i = 0; i < 105; i++) {
      await svc.addPing({ id: `p${i}`, t: i, host: 'h', sent: 1, avgMs: 1, minMs: 1, maxMs: 1, jitterMs: 0, lossPct: 0, times: [1] });
    }
    expect(svc.pings$.value.length).toBe(100);
    expect(svc.pings$.value[0].id).toBe('p5');
  });

  it('clears tests and pings', async () => {
    await svc.addTest({ id: 't', t: 1, dlMbps: 1, ulMbps: null, latencyMs: null, jitterMs: null, serverUrl: '', geo: null, tech: null, operator: null });
    await svc.addPing({ id: 'p', t: 1, host: 'h', sent: 1, avgMs: 1, minMs: 1, maxMs: 1, jitterMs: 0, lossPct: 0, times: [1] });
    await svc.clearTests();
    await svc.clearPings();
    expect(svc.tests$.value).toEqual([]);
    expect(svc.pings$.value).toEqual([]);
  });

  it('rejects oversized spectrum imports', async () => {
    await expect(svc.importSpectrumJson('x'.repeat(5_000_001))).rejects.toThrow(/too large/i);
  });

  it('imports valid spectrum payloads and ignores garbage', async () => {
    const n = await svc.importSpectrumJson(
      JSON.stringify([{ iso: 'zz', name: 'Testland', allocs: [{ band: 'n78', ops: ['Op'] }] }])
    );
    expect(n).toBe(1);
    const merged = svc.allSpectrum();
    expect(merged.find(c => c.iso === 'ZZ')?.name).toBe('Testland');

    expect(await svc.importSpectrumJson('not json')).toBe(0);
    expect(await svc.importSpectrumJson('{"random":true}')).toBe(0);
  });

  it('survives corrupted persisted JSON', async () => {
    store.set('cs.settings.v1', '{broken json');
    store.set('cs.tests.v1', 'nope');
    const fresh = new StoreService();
    await fresh.init();
    expect(fresh.settings).toEqual(DEFAULT_SETTINGS);
    expect(fresh.tests$.value).toEqual([]);
  });
});
