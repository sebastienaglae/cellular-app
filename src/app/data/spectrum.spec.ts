import { describe, expect, it } from 'vitest';
import { BUNDLED_SPECTRUM, mergeSpectrum, spectrumForCountry } from './spectrum';

describe('spectrum dataset', () => {
  it('bundles a multi-country sample', () => {
    expect(BUNDLED_SPECTRUM.length).toBeGreaterThan(40);
    expect(BUNDLED_SPECTRUM.every(c => c.iso.length === 2 && c.allocs.length > 0)).toBe(true);
  });

  it('looks up countries case-insensitively', () => {
    expect(spectrumForCountry(BUNDLED_SPECTRUM, 'de')?.name).toBe('Germany');
    expect(spectrumForCountry(BUNDLED_SPECTRUM, null)).toBeNull();
  });

  it('merges imports over bundled entries by ISO code', () => {
    const imported = [{ iso: 'DE', name: 'Germany (full)', allocs: [{ band: 'n78', ops: ['Telekom'] }] }];
    const merged = mergeSpectrum(BUNDLED_SPECTRUM, imported as never);
    expect(merged.filter(c => c.iso === 'DE').length).toBe(1);
    expect(merged.find(c => c.iso === 'DE')?.name).toBe('Germany (full)');
    expect(merged.length).toBe(BUNDLED_SPECTRUM.length);
  });
});
