import { describe, expect, it } from 'vitest';
import { computeHeatPoints, bandsSeen, avgRsrp, HeatMode } from './heatmap-vm';
import { HeatSample } from './heat';

const mk = (lat: number, lon: number, dbm: number | null, band: string | null, tech = 'LTE'): HeatSample => ({
  lat, lon, dbm, band, tech, t: Date.now()
});

describe('computeHeatPoints', () => {
  const samples = [
    mk(43.65, 7.13, -70, 'n78', 'NR'),
    mk(43.66, 7.14, -95, 'B3'),
    mk(43.67, 7.15, null, 'B7'),
  ];

  it('signal mode skips null-dbm samples', () => {
    const pts = computeHeatPoints(samples, 'signal', '');
    expect(pts.length).toBe(2);
  });

  it('band mode includes all samples', () => {
    const pts = computeHeatPoints(samples, 'band', '');
    expect(pts.length).toBe(3);
  });

  it('band filter narrows results', () => {
    const pts = computeHeatPoints(samples, 'band', 'n78');
    expect(pts.length).toBe(1);
    expect(pts[0].color).toContain('hsl(');
  });

  it('signal mode uses signalHeatCss colour', () => {
    const pts = computeHeatPoints(samples, 'signal', '');
    expect(pts[0].color).toMatch(/^rgb\(/);
  });

  it('radius differs by mode', () => {
    const signal = computeHeatPoints([samples[0]], 'signal', '');
    const band = computeHeatPoints([samples[0]], 'band', '');
    expect(signal[0].radius).toBe(24);
    expect(band[0].radius).toBe(18);
  });
});

describe('bandsSeen', () => {
  it('returns sorted unique band labels', () => {
    const samples = [mk(1, 1, -70, 'n78'), mk(2, 2, -80, 'B3'), mk(3, 3, -90, 'n78'), mk(4, 4, null, null)];
    expect(bandsSeen(samples)).toEqual(['B3', 'n78']);
  });

  it('returns empty for no samples', () => {
    expect(bandsSeen([])).toEqual([]);
  });
});

describe('avgRsrp', () => {
  it('computes average of non-null dbm values', () => {
    const samples = [mk(1, 1, -70, 'n78'), mk(2, 2, -90, 'B3'), mk(3, 3, null, 'B7')];
    expect(avgRsrp(samples)).toBeCloseTo(-80, 0);
  });

  it('returns null when all dbm are null', () => {
    expect(avgRsrp([mk(1, 1, null, 'B7')])).toBeNull();
  });
});
