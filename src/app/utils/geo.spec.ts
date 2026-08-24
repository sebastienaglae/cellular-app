import { describe, expect, it } from 'vitest';
import { haversineKm, movementText } from './geo';

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineKm(43.65, 7.13, 43.65, 7.13)).toBeCloseTo(0, 6);
  });

  it('matches known city distances within 1%', () => {
    // Paris -> Lyon ~ 392 km
    const d = haversineKm(48.8566, 2.3522, 45.764, 4.8357);
    expect(d).toBeGreaterThan(385);
    expect(d).toBeLessThan(400);
  });

  it('handles antimeridian and poles without NaN', () => {
    expect(Number.isFinite(haversineKm(0, 179.5, 0, -179.5))).toBe(true);
    expect(Number.isFinite(haversineKm(89.9, 0, -89.9, 180))).toBe(true);
  });

  it('rejects non-finite input', () => {
    expect(Number.isNaN(haversineKm(NaN, 0, 0, 0))).toBe(true);
    expect(Number.isNaN(haversineKm(1, Infinity, 0, 0))).toBe(true);
  });
});

describe('movementText', () => {
  it('returns null when either side is missing', () => {
    expect(movementText(null, { lat: 0, lon: 0 })).toBeNull();
    expect(movementText({ lat: 0, lon: 0 }, undefined)).toBeNull();
  });

  it('detects same spot under 50 m', () => {
    const a = { lat: 43.65, lon: 7.13 };
    const b = { lat: 43.6501, lon: 7.1301 };
    expect(movementText(a, b)).toMatch(/same spot/i);
  });

  it('formats metres and kilometres', () => {
    const a = { lat: 43.65, lon: 7.13 };
    const b = { lat: 43.66, lon: 7.13 }; // ~1.1 km north
    expect(movementText(a, b)).toMatch(/km from previous/);
    const c = { lat: 43.6508, lon: 7.13 }; // ~89 m
    expect(movementText(a, c)).toMatch(/m from previous/);
  });
});
