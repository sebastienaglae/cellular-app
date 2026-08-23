import { describe, expect, it } from 'vitest';
import { bssidToOui, detectStarlink } from './starlink';

describe('OUI extraction', () => {
  it('normalizes separators and case', () => {
    expect(bssidToOui('f0:9f:c2:aa:bb:cc')).toBe('F0:9F:C2');
    expect(bssidToOui('F0-9F-C2-AA-BB-CC')).toBe('F0:9F:C2');
    expect(bssidToOui(null)).toBeNull();
  });
});

describe('Starlink detection scoring', () => {
  it('reports none without signals', () => {
    const v = detectStarlink({});
    expect(v.level).toBe('none');
    expect(v.score).toBe(0);
  });

  it('flags NTN API as strong signal', () => {
    const v = detectStarlink({ ntnFlag: true });
    expect(v.ntnFlag).toBe(true);
    expect(v.level).toBe('likely');
    expect(v.reasons[0]).toMatch(/non-terrestrial/i);
  });

  it('matches Starlink Wi-Fi SSIDs and SpaceX OUIs', () => {
    expect(detectStarlink({ wifiSsid: 'STARLINK-AB12' }).ssidMatch).toBe(true);
    expect(detectStarlink({ wifiBssid: 'f0:9f:c2:11:22:33' }).ouiMatch).toBe(true);
    const both = detectStarlink({ wifiSsid: 'STARLINK', wifiBssid: 'F0:9F:C2:00:00:01' });
    expect(both.score).toBe(90);
    expect(both.level).toBe('confirmed');
  });

  it('recognizes Direct-to-Cell partner PLMNs', () => {
    const v = detectStarlink({ operatorNumeric: '310260' });
    expect(v.dtcPartner).toBe('T-Mobile US');
    expect(v.level).toBe('possible');
  });

  it('combines to confirmed with NTN + partner + name', () => {
    const v = detectStarlink({ ntnFlag: true, operatorNumeric: '310260', operatorName: 'Starlink T-Mobile' });
    expect(v.level).toBe('confirmed');
  });
});
