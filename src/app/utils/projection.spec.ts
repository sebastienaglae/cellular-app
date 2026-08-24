import { describe, expect, it } from 'vitest';
import { lonToWorld, latToWorld, worldToLon, worldToLat, worldSize, TILE_SIZE } from './projection';

describe('Web-Mercator projection', () => {
  it('worldSize doubles per zoom level', () => {
    expect(worldSize(0)).toBe(256);
    expect(worldSize(1)).toBe(512);
    expect(worldSize(4)).toBe(4096);
  });

  it('maps lon 0 to world centre', () => {
    expect(lonToWorld(0, 0)).toBe(TILE_SIZE / 2);
    expect(lonToWorld(0, 4)).toBe(TILE_SIZE * 16 / 2);
  });

  it('maps lon -180 to 0 and lon 180 to world edge', () => {
    expect(lonToWorld(-180, 0)).toBe(0);
    expect(lonToWorld(180, 0)).toBe(TILE_SIZE);
  });

  it('maps lat 0 to world centre (Mercator)', () => {
    expect(latToWorld(0, 0)).toBeCloseTo(TILE_SIZE / 2, 6);
  });

  it('roundtrips lon: worldToLon(lonToWorld(x)) = x', () => {
    for (const lon of [-180, -90, 0, 45, 179.9]) {
      for (const z of [0, 2, 4]) {
        expect(worldToLon(lonToWorld(lon, z), z)).toBeCloseTo(lon, 6);
      }
    }
  });

  it('roundtrips lat for non-polar values', () => {
    for (const lat of [-60, -30, 0, 30, 60]) {
      for (const z of [0, 3]) {
        expect(worldToLat(latToWorld(lat, z), z)).toBeCloseTo(lat, 4);
      }
    }
  });

  it('clamps extreme latitudes without NaN', () => {
    expect(Number.isFinite(latToWorld(85.05112878, 0))).toBe(true);
    expect(Number.isFinite(latToWorld(-85.05112878, 0))).toBe(true);
    expect(Number.isFinite(latToWorld(90, 0))).toBe(true); // clamped
    expect(Number.isFinite(latToWorld(-90, 0))).toBe(true); // clamped
  });

  it('known coordinate: Paris (48.8566, 2.3522) at z4', () => {
    const x = lonToWorld(2.3522, 4);
    const y = latToWorld(48.8566, 4);
    // z4 world is 4096px; Paris is roughly 50.7% from left, 34.4% from top
    expect(x / 4096).toBeCloseTo(0.507, 2);
    expect(y / 4096).toBeCloseTo(0.344, 2);
  });
});
