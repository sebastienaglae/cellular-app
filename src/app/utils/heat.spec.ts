import { describe, expect, it } from 'vitest';
import { bandColor, bandHue, dbmNorm, shouldSample, signalHeatCss, signalHeatRgb } from './heat';

describe('dbmNorm', () => {
  it('maps -110..-50 to 0..1 and clamps outside', () => {
    expect(dbmNorm(-110)).toBe(0);
    expect(dbmNorm(-80)).toBeCloseTo(0.5, 6);
    expect(dbmNorm(-50)).toBe(1);
    expect(dbmNorm(-140)).toBe(0);
    expect(dbmNorm(-10)).toBe(1);
    expect(dbmNorm(NaN)).toBe(0.5);
  });
});

describe('signalHeatRgb / signalHeatCss', () => {
  it('is red-ish when weak and green-ish when strong', () => {
    const weak = signalHeatRgb(-110);
    const strong = signalHeatRgb(-50);
    expect(weak[0]).toBeGreaterThan(weak[2]);   // red channel dominates
    expect(strong[1]).toBeGreaterThan(strong[0]); // green dominates
  });

  it('produces a valid css rgb string', () => {
    expect(signalHeatCss(-85)).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });

  it('is stable for the same input', () => {
    expect(signalHeatRgb(-95)).toEqual(signalHeatRgb(-95));
  });
});

describe('bandHue / bandColor', () => {
  it('is deterministic and distinct per band', () => {
    expect(bandHue('n78')).toBe(bandHue('n78'));
    expect(bandHue('B3')).not.toBe(bandHue('n78'));
    expect(bandHue('')).toBe(0);
  });

  it('bandColor returns an hsl string', () => {
    expect(bandColor('B7')).toMatch(/^hsl\(\d+, 62%, 52%\)$/);
  });
});

describe('shouldSample', () => {
  const here = { lat: 43.65, lon: 7.13 };
  it('always samples the first fix', () => {
    expect(shouldSample(null, here)).toBe(true);
  });

  it('skips when barely moved, samples beyond threshold', () => {
    const nearby = { lat: 43.65005, lon: 7.13 };     // ~5 m
    const far = { lat: 43.651, lon: 7.13 };          // ~110 m
    expect(shouldSample(here, nearby, 8)).toBe(false);
    expect(shouldSample(here, far, 8)).toBe(true);
  });
});
