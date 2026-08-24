import { describe, expect, it } from 'vitest';
import { EXTRA_LANGS, EXTRA_LANG_NAMES } from './i18n-langs';

const ALL_LANG_CODES = ['es', 'de', 'it', 'pt', 'nl', 'zh', 'ko'];

describe('i18n dictionary integrity', () => {
  it('exposes a name for every extra language', () => {
    for (const code of ALL_LANG_CODES) {
      expect(EXTRA_LANG_NAMES[code], `missing name for ${code}`).toBeTruthy();
    }
    expect(Object.keys(EXTRA_LANG_NAMES).length).toBe(ALL_LANG_CODES.length);
  });

  it('every language has a non-empty dictionary', () => {
    for (const code of ALL_LANG_CODES) {
      const dict = EXTRA_LANGS[code];
      expect(dict, `${code} dict missing`).toBeDefined();
      expect(Object.keys(dict).length, `${code} dict too small`).toBeGreaterThan(50);
    }
  });

  it('no empty values in any dictionary', () => {
    for (const code of ALL_LANG_CODES) {
      for (const [key, value] of Object.entries(EXTRA_LANGS[code])) {
        expect(value.trim().length, `${code} empty value for "${key}"`).toBeGreaterThan(0);
      }
    }
  });

  it('no unresolved escape sequences in values', () => {
    for (const code of ALL_LANG_CODES) {
      for (const [key, value] of Object.entries(EXTRA_LANGS[code])) {
        expect(value, `${code} "${key}" contains \\`).not.toContain('\\');
      }
    }
  });

  it('key coverage parity: all languages cover the same core keys', () => {
    // Use the largest dictionary as reference
    const ref = EXTRA_LANGS.es;
    const refKeys = new Set(Object.keys(ref));
    for (const code of ALL_LANG_CODES) {
      const dict = EXTRA_LANGS[code];
      // Each language should cover at least 80% of the reference keys
      const covered = [...refKeys].filter(k => k in dict).length;
      const coverage = covered / refKeys.size;
      expect(coverage, `${code} coverage ${(coverage * 100).toFixed(0)}%`).toBeGreaterThan(0.8);
    }
  });
});
