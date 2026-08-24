import { BandRow, NrRange, Rat } from '../models';

/**
 * Offline 3GPP band <-> ARFCN <-> frequency engine.
 * Sources: TS 36.101 (E-UTRA), TS 38.104/38.101 (NR), TS 45.005? (GERAN), 25.101 anchors (UTRA).
 * All computation is local - no network needed.
 */

// [band, dlLowMHz, eMin, eMax, ulLowMHz|null, ulEarfcnLow|null]
export const LTE_BANDS: BandRow[] = [
  [1, 2110, 0, 599, 1920, 18000],
  [2, 1930, 600, 1199, 1850, 18000],
  [3, 1805, 1200, 1949, 1710, 12000],
  [4, 2110, 1950, 2399, 1710, 31750],
  [5, 869, 2400, 2649, 824, 24000],
  [6, 875, 2650, 2749, 835, 24000],
  [7, 2620, 2750, 3449, 2500, 26500],
  [8, 925, 3450, 3799, 880, 3450],
  [9, 1844.9, 3800, 4149, 1749.9, null],
  [10, 2110, 4150, 4749, 1710, 38650],
  [11, 1475.9, 4750, 4949, 1427.9, null],
  [12, 729, 5010, 5179, 699, 50090],
  [13, 746, 5180, 5279, 777, 5180],
  [14, 758, 5280, 5379, 788, 5280],
  [17, 734, 5730, 5849, 704, 5730],
  [18, 860, 5850, 5999, 815, 5850],
  [19, 875, 6000, 6149, 830, 6000],
  [20, 791, 6150, 6449, 832, 24150],
  [21, 1495.9, 6450, 6599, 1447.9, null],
  [22, 3510, 6600, 7399, 3410, 6600],
  [23, 2180, 7500, 7699, 2000, null],
  [24, 1525, 7700, 8039, 1626.5, null],
  [25, 1930, 8040, 8689, 1850, 26040],
  [26, 859, 8690, 9039, 814, 8690],
  [27, 852, 9040, 9209, 807, 9040],
  [28, 758, 9210, 9659, 703, 9210],
  [29, 717, 9660, 9769, null, null],
  [30, 2350, 9770, 9869, 2305, 9770],
  [31, 462.5, 9870, 9919, 452.5, 9870],
  [32, 1452, 9920, 10359, null, null],
  [33, 1900, 36000, 36199, null, null],
  [34, 2010, 36200, 36349, null, null],
  [35, 1850, 36250, 36549, null, null],
  [36, 1930, 36650, 37249, null, null],
  [37, 1910, 37250, 37449, null, null],
  [38, 2570, 37750, 38249, null, null],
  [39, 1880, 38450, 38649, null, null],
  [40, 2300, 38650, 39649, null, null],
  [41, 2496, 39650, 41589, null, null],
  [42, 3400, 41590, 43589, null, null],
  [43, 3600, 43590, 45589, null, null],
  [44, 703, 45590, 46589, null, null],
  [45, 1447, 46590, 46789, null, null],
  [46, 5150, 46790, 54539, null, null],
  [47, 5855, 54540, 55239, null, null],
  [48, 3550, 55240, 56739, null, null],
  [49, 3550, 56740, 57739, null, null],
  [50, 1432, 57740, 58739, null, null],
  [51, 1427, 58740, 58839, null, null],
  [52, 3300, 58840, 59139, null, null],
  [53, 2483.5, 59140, 59389, null, null],
  [65, 2110, 65536, 66435, 1920, 131072],
  [66, 2110, 66436, 67335, 1710, 132632],
  [67, 738, 67336, 67535, null, null],
  [70, 1695, 68356, 68705, 1695, null],
  [71, 617, 68706, 69465, 663, 69936],
  [72, 461, 70596, 70795, null, null],
  [73, 450, 70816, 70915, null, null],
  [74, 1475, 69466, 69635, 1432.5, null],
  [85, 716, 70936, 71055, 698, null]
].map(r => ({ band: r[0], dlLow: r[1] as number, eMin: r[2], eMax: r[3], ulLow: r[4], ulElow: r[5] }));

const LTE_TDD = new Set([33,34,35,36,37,38,39,40,41,42,43,44,46,47,48,49,50,51,52,53]);
const LTE_SDL = new Set([29,32,45,67,72,73]);

// NR-ARFCN ranges per band (FR1 + FR2). Derived from TS 38.104 channel raster tables.
// [band, nLow, nHigh, fr2?]
const NR_RAW: NrRange[] = [
  { band: 1, lo: 422000, hi: 434000 },
  { band: 2, lo: 386000, hi: 398000 },
  { band: 3, lo: 361000, hi: 376000 },
  { band: 5, lo: 173800, hi: 178800 },
  { band: 7, lo: 524000, hi: 538000 },
  { band: 8, lo: 185000, hi: 192000 },
  { band: 12, lo: 145800, hi: 149200 },
  { band: 14, lo: 151600, hi: 153600 },
  { band: 20, lo: 158200, hi: 164200 },
  { band: 24, lo: 305000, hi: 311800 },
  { band: 25, lo: 386000, hi: 399000 },
  { band: 26, lo: 171800, hi: 178800 },
  { band: 28, lo: 151600, hi: 160600 },
  { band: 29, lo: 143400, hi: 146400 },
  { band: 30, lo: 461000, hi: 464000 },
  { band: 34, lo: 402000, hi: 405000 },
  { band: 38, lo: 514000, hi: 524000 },
  { band: 39, lo: 376000, hi: 386000 },
  { band: 40, lo: 460000, hi: 480000 },
  { band: 41, lo: 499200, hi: 538000 },
  { band: 46, lo: 743333, hi: 795000 },
  { band: 48, lo: 636667, hi: 646667 },
  { band: 50, lo: 286400, hi: 303400 },
  { band: 51, lo: 285400, hi: 286400 },
  { band: 53, lo: 496700, hi: 499000 },
  { band: 65, lo: 422000, hi: 434000 },
  { band: 66, lo: 422000, hi: 440000 },
  { band: 70, lo: 339000, hi: 344000 },
  { band: 71, lo: 123400, hi: 133600 },
  { band: 74, lo: 295000, hi: 299200 },
  { band: 75, lo: 286400, hi: 303400 },
  { band: 76, lo: 285400, hi: 286400 },
  { band: 77, lo: 620000, hi: 680000 },
  { band: 78, lo: 620000, hi: 653333 },
  { band: 79, lo: 693334, hi: 733333 },
  { band: 85, lo: 143200, hi: 145600 },
  { band: 90, lo: 460000, hi: 480000 },
  { band: 91, lo: 285400, hi: 286400 },
  { band: 92, lo: 286400, hi: 303400 },
  { band: 93, lo: 285400, hi: 286400 },
  { band: 94, lo: 286400, hi: 303400 },
  { band: 102, lo: 795000, hi: 828333 },
  { band: 104, lo: 828333, hi: 875000 },
  { band: 257, lo: 2054167, hi: 2104166, fr2: true },
  { band: 258, lo: 2016667, hi: 2064166, fr2: true },
  { band: 259, lo: 2270834, hi: 2337499, fr2: true },
  { band: 260, lo: 2229167, hi: 2279166, fr2: true },
  { band: 261, lo: 2070834, hi: 2084999, fr2: true },
  { band: 262, lo: 2399167, hi: 2415833, fr2: true }
];

export const NR_RANGES = NR_RAW;

/** Exact NR frequency from NR-ARFCN (TS 38.104 section 5.4.2.1). */
export function nrArfcnToFreqMhz(n: number): number {
  if (n <= 599999) return n * 0.005;
  if (n <= 2016666) return 3000 + (n - 600000) * 0.015;
  return 24250.08 + (n - 2016667) * 0.06;
}

export function nrArfcnToBand(n: number): number | null {
  // NR band ranges nest by design (e.g. n78 inside n77); return the most
  // specific (narrowest) containing allocation.
  let best: NrRange | null = null;
  for (const r of NR_RANGES) {
    if (n >= r.lo && n <= r.hi) {
      if (!best || r.hi - r.lo < best.hi - best.lo) best = r;
    }
  }
  return best ? best.band : null;
}

export function nrBandFreqRange(band: number): { lo: number; hi: number } | null {
  const r = NR_RANGES.find(x => x.band === band);
  if (!r) return null;
  return { lo: nrArfcnToFreqMhz(r.lo), hi: nrArfcnToFreqMhz(r.hi) };
}

export function lteDuplexMode(band: number): 'FDD' | 'TDD' | 'SDL' {
  if (LTE_SDL.has(band)) return 'SDL';
  return LTE_TDD.has(band) ? 'TDD' : 'FDD';
}

export function earfcnToBand(earfcn: number): BandRow | null {
  for (const b of LTE_BANDS) {
    // ranges are defined independently; prefer exact containment
    if (earfcn >= b.eMin && earfcn <= b.eMax) return b;
  }
  return null;
}

export function earfcnToFreqDl(earfcn: number): number | null {
  const b = earfcnToBand(earfcn);
  if (!b) return null;
  return round1(b.dlLow + 0.1 * (earfcn - b.eMin));
}

export function earfcnToFreqUl(earfcn: number): number | null {
  const b = earfcnToBand(earfcn);
  if (!b || b.ulElow == null || b.ulLow == null) return null;
  const ulE = b.ulElow + (earfcn - b.eMin);
  return round1(b.ulLow + 0.1 * (ulE - b.ulElow));
}

/** GSM ARFCN -> DL frequency (TS 45.005 / 05.05). */
export function gsmArfcnToFreqMhz(a: number): number | null {
  if (a >= 0 && a <= 124 && a >= 1) return round1(935 + 0.2 * a);
  if (a >= 975 && a <= 1023) return round1(925 + 0.1 * (a - 975)); // E-GSM
  if (a >= 512 && a <= 885) return round1(1805 + 0.1 * (a - 512)); // DCS1800
  if (a >= 512 && a <= 810) return round1(1930 + 0.2 * (a - 512)); // PCS1900
  if (a >= 128 && a <= 251) return round1(869 + 0.2 * (a - 128)); // GSM850
  if (a >= 256 && a <= 304) return round1(935 + 0.2 * a); // R-GSM overlap
  return null;
}

/** UTRA (WCDMA) DL frequency: F = 0.2 MHz x UARFCN (TS 25.101). Lowest DL UARFCN is band VIII (2937). */
export function utraUarfcnToFreqMhz(u: number): number | null {
  if (!Number.isFinite(u) || u < 2937 || u > 16387) return null;
  return round1(0.2 * u);
}

export function bandLabel(rat: Rat, band: number | null): string {
  if (band == null) return '';
  if (rat === 'NR') return `n${band}`;
  if (rat === 'LTE') return `B${band}`;
  return `${band}`;
}

export function fmtMhz(f: number | null | undefined): string {
  if (f == null || !isFinite(f)) return '—';
  if (f >= 1000) return `${(f / 1000).toFixed(3)} GHz`;
  return `${f.toFixed(1)} MHz`;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export interface ArfcnInfo {
  freqDlMhz: number | null;
  freqUlMhz: number | null;
  band: number | null;
  bandLabel: string;
  duplex?: string;
}

/** Unified resolver used by the cells page for any technology. */
export function resolveArfcn(rat: Rat, arfcn: number | null): ArfcnInfo {
  if (arfcn == null) return { freqDlMhz: null, freqUlMhz: null, band: null, bandLabel: '' };
  switch (rat) {
    case 'NR': {
      const f = nrArfcnToFreqMhz(arfcn);
      const b = nrArfcnToBand(arfcn);
      return { freqDlMhz: round1(f), freqUlMhz: null, band: b, bandLabel: bandLabel('NR', b) };
    }
    case 'LTE': {
      const b = earfcnToBand(arfcn);
      return {
        freqDlMhz: earfcnToFreqDl(arfcn),
        freqUlMhz: earfcnToFreqUl(arfcn),
        band: b ? b.band : null,
        bandLabel: bandLabel('LTE', b ? b.band : null),
        duplex: b ? lteDuplexMode(b.band) : undefined
      };
    }
    case 'GSM':
      return { freqDlMhz: gsmArfcnToFreqMhz(arfcn), freqUlMhz: null, band: null, bandLabel: '' };
    case 'WCDMA':
      return { freqDlMhz: utraUarfcnToFreqMhz(arfcn), freqUlMhz: null, band: null, bandLabel: '' };
    default:
      return { freqDlMhz: null, freqUlMhz: null, band: null, bandLabel: '' };
  }
}
