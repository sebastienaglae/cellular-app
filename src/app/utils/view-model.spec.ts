import { describe, expect, it } from 'vitest';
import { fmtMbps, gaugeOffset, nicePeak, GAUGE_CIRCUMFERENCE } from './gauge';
import { levelForDbm } from './view';
import { colorForMbps } from './view';
import { pingStats } from './ping-stats';

describe('gauge view-model', () => {
  it('offset spans full circumference', () => {
    expect(gaugeOffset(0, 100)).toBe(GAUGE_CIRCUMFERENCE);
    expect(gaugeOffset(100, 100)).toBe(0);
  });

  it('clamps negative and overflowing values', () => {
    expect(gaugeOffset(-50, 100)).toBe(GAUGE_CIRCUMFERENCE);
    expect(gaugeOffset(500, 100)).toBe(0);
    expect(gaugeOffset(NaN, 100)).toBe(GAUGE_CIRCUMFERENCE);
  });

  it('never allows a peak below 50', () => {
    expect(gaugeOffset(10, 0)).toBeLessThan(GAUGE_CIRCUMFERENCE);
    expect(gaugeOffset(10, -5)).toBeLessThan(GAUGE_CIRCUMFERENCE);
  });

  it('nicePeak rounds observed up to 50-step ceiling with headroom', () => {
    expect(nicePeak(0)).toBe(100);
    expect(nicePeak(284)).toBe(350);
    expect(nicePeak(-3)).toBe(100);
  });

  it('fmtMbps picks sensible precision', () => {
    expect(fmtMbps(284.2)).toBe('284');
    expect(fmtMbps(42.56)).toBe('42.6');
    expect(fmtMbps(3.141)).toBe('3.14');
    expect(fmtMbps(null)).toBe('—');
    expect(fmtMbps(undefined)).toBe('—');
    expect(fmtMbps(NaN)).toBe('—');
  });
});

describe('signal level view-model', () => {
  it('maps dBm to 0-5 bars', () => {
    expect(levelForDbm(-50)).toBe(5);
    expect(levelForDbm(-70)).toBe(4);
    expect(levelForDbm(-80)).toBe(3);
    expect(levelForDbm(-90)).toBe(2);
    expect(levelForDbm(-100)).toBe(1);
    expect(levelForDbm(-115)).toBe(0);
  });

  it('treats missing values as no signal', () => {
    expect(levelForDbm(null)).toBe(0);
    expect(levelForDbm(undefined)).toBe(0);
    expect(levelForDbm(NaN)).toBe(0);
  });
});

describe('speed colour scale', () => {
  it('walks the warm ramp', () => {
    expect(colorForMbps(null)).toBe('#8a7f72');
    expect(colorForMbps(0.5)).toBe('#b64a33');
    expect(colorForMbps(5)).toBe('#c9603f');
    expect(colorForMbps(20)).toBe('#c98a2b');
    expect(colorForMbps(50)).toBe('#7fa650');
    expect(colorForMbps(500)).toBe('#4d7c4a');
  });
});

describe('ping statistics', () => {
  it('computes avg/min/max/jitter', () => {
    const s = pingStats([10, 12, 14]);
    expect(s.count).toBe(3);
    expect(s.avg).toBeCloseTo(12, 6);
    expect(s.min).toBe(10);
    expect(s.max).toBe(14);
    expect(s.jitter).toBeCloseTo(Math.sqrt(8 / 3), 6);
  });

  it('handles empty, single and invalid samples', () => {
    expect(pingStats([]).avg).toBeNull();
    const one = pingStats([5]);
    expect(one.avg).toBe(5);
    expect(one.jitter).toBe(0);
    const dirty = pingStats([10, NaN, Infinity, -1, 20]).count;
    expect(dirty).toBe(2); // only finite non-negative kept
  });
});
