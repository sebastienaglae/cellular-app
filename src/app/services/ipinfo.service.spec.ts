import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { IpInfoService, ipv4ToU32, ipv6ToBytes } from './ipinfo.service';

describe('IP parsers', () => {
  it('parses IPv4 to u32', () => {
    expect(ipv4ToU32('0.0.0.0')).toBe(0);
    expect(ipv4ToU32('1.2.3.4')).toBe((1 << 24 | 2 << 16 | 3 << 8 | 4) >>> 0);
    expect(ipv4ToU32('255.255.255.255')).toBe(4294967295);
    expect(ipv4ToU32('256.1.1.1')).toBeNull();
    expect(ipv4ToU32('not.an.ip')).toBeNull();
  });

  it('parses IPv6 forms', () => {
    const lo = ipv6ToBytes('::1')!;
    expect(lo[15]).toBe(1);
    expect(lo[0]).toBe(0);
    const cf = ipv6ToBytes('2606:4700::1111')!;
    expect([cf[0], cf[1], cf[2], cf[3]]).toEqual([0x26, 0x06, 0x47, 0x00]);
    expect(cf[14]).toBe(0x11);
    expect(ipv6ToBytes('9999::')).not.toBeNull(); // 0x9999 prefix is legal hex
    expect(ipv6ToBytes('gggg::')).toBeNull();
    expect(ipv6ToBytes('1.2.3.4')).toBeNull();
  });
});

describe('offline IP database', () => {
  let svc: IpInfoService;

  it('loads and parses the bundled binary', async () => {
    svc = new IpInfoService();
    const raw = readFileSync('src/assets/data/ipdb.bin');
    (svc as unknown as { parse(b: ArrayBuffer): void }).parse(
      raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer
    );
    expect(svc.isLoaded).toBe(true);
  });

  it('resolves well-known public ranges', () => {
    const cf = svc.lookup('1.1.1.0')!;
    expect(cf.asn).toBe(13335);
    expect(cf.org.toUpperCase()).toContain('CLOUDFLARE');
    expect(cf.cc).toBe('US');

    const google = svc.lookup('8.8.8.8')!;
    expect(google.asn).toBe(15169);
  });

  it('flags Starlink/SpaceX ranges', () => {
    // AS14593 SPACEX-STARLINK block seen in iptoasn dump
    const sl = svc.lookup('9.161.0.10')!;
    expect(sl.starlink).toBe(true);
    expect(sl.asn).toBe(14593);
  });

  it('returns null for private ranges and resolves IPv6', () => {
    expect(svc.lookup('192.168.1.1')).toBeNull();
    const cf6 = svc.lookup('2606:4700::1111')!;
    expect(cf6.asn).toBe(13335);
    expect(cf6.cc).toBe('US');
  });

  it('lists Starlink ranges', () => {
    const ranges = svc.starlinkRanges(5);
    expect(ranges.length).toBeGreaterThan(0);
    expect(ranges[0]).toMatch(/^\d+\.\d+\.\d+\.\d+ – /);
  });
});
