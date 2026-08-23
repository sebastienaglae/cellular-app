import { describe, expect, it } from 'vitest';
import {
  earfcnToBand,
  earfcnToFreqDl,
  earfcnToFreqUl,
  gsmArfcnToFreqMhz,
  lteDuplexMode,
  nrArfcnToBand,
  nrArfcnToFreqMhz,
  resolveArfcn
} from './bands';

describe('NR ARFCN math (TS 38.104)', () => {
  it('computes FR1 frequencies exactly', () => {
    expect(nrArfcnToFreqMhz(0)).toBe(0);
    expect(nrArfcnToFreqMhz(422000)).toBeCloseTo(2110, 3); // n1 low edge
    expect(nrArfcnToFreqMhz(600000)).toBe(3000); // raster boundary
    expect(nrArfcnToFreqMhz(633984)).toBeCloseTo(3509.76, 3); // classic n78 SSB example
    expect(nrArfcnToFreqMhz(2016667)).toBeCloseTo(24250.08, 2); // FR2 boundary
  });

  it('maps ARFCN to bands', () => {
    expect(nrArfcnToBand(422000)).toBe(1);
    expect(nrArfcnToBand(370000)).toBe(3);
    // n78 nests inside n77 -> narrowest allocation must win
    expect(nrArfcnToBand(633984)).toBe(78);
    expect(nrArfcnToBand(660000)).toBe(77); // above n78 ceiling, pure n77
    expect(nrArfcnToBand(2064167 + 10)).toBe(257); // FR2
    expect(nrArfcnToBand(9999999)).toBeNull();
  });
});

describe('LTE EARFCN table', () => {
  it('resolves common bands and DL frequencies', () => {
    expect(earfcnToBand(100)?.band).toBe(1);
    expect(earfcnToFreqDl(100)).toBeCloseTo(2120, 3);
    expect(earfcnToBand(2850)?.band).toBe(7);
    expect(earfcnToFreqDl(2850)).toBeCloseTo(2630, 3);
    expect(earfcnToBand(1300)?.band).toBe(3);
    expect(earfcnToFreqDl(8040)).toBeCloseTo(1930, 3); // B25 low edge
  });

  it('computes UL frequency for FDD bands with known offsets', () => {
    // B20: dl earfcn 6300 -> ul earfcn 24300 -> 832+15 = 847 MHz
    expect(earfcnToFreqUl(6300)).toBeCloseTo(847, 3);
    // SDL band has no UL
    expect(earfcnToFreqUl(9700)).toBeNull();
  });

  it('classifies duplex modes', () => {
    expect(lteDuplexMode(1)).toBe('FDD');
    expect(lteDuplexMode(41)).toBe('TDD');
    expect(lteDuplexMode(29)).toBe('SDL');
  });
});

describe('GSM ARFCN', () => {
  it('covers 900/1800/850/1900/E-GSM rasters', () => {
    expect(gsmArfcnToFreqMhz(1)).toBeCloseTo(935.2, 3);
    expect(gsmArfcnToFreqMhz(124)).toBeCloseTo(959.8, 3);
    expect(gsmArfcnToFreqMhz(512)).toBeCloseTo(1805, 3);
    expect(gsmArfcnToFreqMhz(975)).toBeCloseTo(925, 3);
    expect(gsmArfcnToFreqMhz(128)).toBeCloseTo(869, 3);
  });
});

describe('resolveArfcn unified API', () => {
  it('labels NR and LTE channels', () => {
    const nr = resolveArfcn('NR', 633984);
    expect(nr.bandLabel).toBe('n78');
    expect(nr.freqDlMhz).toBeCloseTo(3509.8, 1); // resolveArfcn rounds for display

    const lte = resolveArfcn('LTE', 2850);
    expect(lte.bandLabel).toBe('B7');
    expect(lte.duplex).toBe('FDD');
  });
});
