import { describe, expect, it } from 'vitest';
import {
  dataTechLabel,
  isValidPingHost,
  mapRawCell,
  normalizeTech,
  RawCell
} from './native.service';

describe('normalizeTech', () => {
  it('accepts known RATs case-insensitively', () => {
    expect(normalizeTech('nr')).toBe('NR');
    expect(normalizeTech(' LTE ')).toBe('LTE');
    expect(normalizeTech('Wcdma')).toBe('WCDMA');
  });

  it('maps unknown or empty tech to UNKNOWN', () => {
    expect(normalizeTech('')).toBe('UNKNOWN');
    expect(normalizeTech('5G')).toBe('UNKNOWN');
    expect(normalizeTech(undefined as unknown as string)).toBe('UNKNOWN');
  });
});

describe('dataTechLabel (Android NETWORK_TYPE_*)', () => {
  it('maps the full documented range', () => {
    expect(dataTechLabel(1)).toBe('GSM');      // GPRS
    expect(dataTechLabel(2)).toBe('GSM');      // EDGE
    expect(dataTechLabel(3)).toBe('WCDMA');    // UMTS
    expect(dataTechLabel(13)).toBe('LTE');
    expect(dataTechLabel(15)).toBe('WCDMA');   // HSPAP
    expect(dataTechLabel(17)).toBe('TDSCDMA');
    expect(dataTechLabel(18)).toBe('IWLAN');   // VoWiFi
    expect(dataTechLabel(19)).toBe('LTE');     // LTE_CA
    expect(dataTechLabel(20)).toBe('NR');      // NR / NR_SA
  });

  it('returns UNKNOWN for unmapped ints', () => {
    expect(dataTechLabel(0)).toBe('UNKNOWN');
    expect(dataTechLabel(999)).toBe('UNKNOWN');
    expect(dataTechLabel(-1)).toBe('UNKNOWN');
  });
});

describe('mapRawCell', () => {
  it('prefers OS-reported bands and builds NR labels', () => {
    const rec = mapRawCell({
      tech: 'NR', registered: true, arfcn: 633984, bands: [78],
      pci: 10, tac: 610, rsrp: -95, mcc: '208', mnc: '15'
    });
    expect(rec.tech).toBe('NR');
    expect(rec.band).toBe(78);
    expect(rec.bandLabel).toBe('n78');
    expect(rec.freqDlMhz).toBeCloseTo(3509.8, 1); // resolveArfcn rounds for display
    expect(rec.registered).toBe(true);
    expect(rec.mcc).toBe('208');
  });

  it('falls back to ARFCN-derived band when OS omits it', () => {
    const rec = mapRawCell({ tech: 'LTE', registered: false, arfcn: 3350 });
    expect(rec.band).toBe(7); // 3350 sits in B7 (2620-2690 MHz)
    expect(rec.bandLabel).toBe('B7');
    expect(rec.freqDlMhz).toBeCloseTo(2680, 1);
  });

  it('normalizes unknown tech and nulls missing metrics', () => {
    const rec = mapRawCell({ tech: 'weird', registered: false });
    expect(rec.tech).toBe('UNKNOWN');
    expect(rec.band).toBeNull();
    expect(rec.bandLabel).toBe('');
    expect(rec.rsrp).toBeNull();
    expect(rec.freqDlMhz).toBeNull();
    expect(rec.arfcn).toBeNull();
  });

  it('keeps registered false falsy-safe and defaults timestamp', () => {
    const rec = mapRawCell({ tech: 'GSM', registered: false, timestamp: 0 });
    expect(rec.registered).toBe(false);
    expect(rec.timestamp).toBeGreaterThan(0);
  });

  it('computes WCDMA frequency from UARFCN (F = 0.2 x N)', () => {
    const rec = mapRawCell({ tech: 'WCDMA', registered: true, arfcn: 10700 });
    expect(rec.freqDlMhz).toBeCloseTo(2140, 1);
  });
});

describe('isValidPingHost', () => {
  it('accepts legit hosts', () => {
    for (const h of ['1.1.1.1', 'example.com', '2606:4700::1', 'my-router.local', '192.168.0.1']) {
      expect(isValidPingHost(h), h).toBe(true);
    }
  });

  it('rejects injection and malformed input', () => {
    for (const h of ['-c', '1.1.1.1; rm -rf /', 'a b', '', '  ', '-help', 'x'.repeat(300)]) {
      expect(isValidPingHost(h), h).toBe(false);
    }
    expect(isValidPingHost(null as unknown as string)).toBe(false);
  });
});
