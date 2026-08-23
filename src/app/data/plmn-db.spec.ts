import { describe, expect, it } from 'vitest';
import { lookupPlmn, searchPlmn } from './plmn-db';

describe('PLMN lookup', () => {
  it('resolves major operators', () => {
    expect(lookupPlmn('234', '30')?.name).toBe('EE');
    expect(lookupPlmn('262', '01')?.name).toBe('Telekom DE');
    expect(lookupPlmn('440', '10')?.name).toBe('NTT Docomo');
  });

  it('flags MVNOs with their host network', () => {
    const giffgaff = lookupPlmn('234', '33');
    expect(giffgaff?.name).toBe('Giffgaff');
    expect(giffgaff?.mvnoHost).toBe('O2 UK');

    const visible = lookupPlmn('311', '480');
    expect(visible?.name).toBe('Verizon');
    expect(visible?.mvnoHost).toBeUndefined();
  });

  it('attaches country info by MCC', () => {
    expect(lookupPlmn('262', '07')?.country).toBe('Germany');
    expect(lookupPlmn('505', '02')?.iso).toBe('AU');
  });

  it('returns padded-MNC fallbacks and null for empty input', () => {
    expect(lookupPlmn('', '')).toBeNull();
    // unknown PLMN still yields a structured result
    expect(lookupPlmn('999', '99')?.plmn).toBe('999-99');
  });
});

describe('PLMN search', () => {
  it('finds brands and numeric prefixes', () => {
    expect(searchPlmn('giffgaff').length).toBeGreaterThan(0);
    expect(searchPlmn('310260').some(r => r.name.includes('T-Mobile'))).toBe(true);
    expect(searchPlmn('zzzz').length).toBe(0);
  });
});
