import { Injectable } from '@angular/core';
import { registerPlugin } from '@capacitor/core';
import {
  CapsRec, CellRec, PingResult, Rat, ServiceRec, SimRec, WifiRec
} from '../models';
import { resolveArfcn } from '../data/bands';

export interface RawCell {
  tech: string;
  registered: boolean;
  timestamp?: number;
  arfcn?: number | null;
  bands?: number[];
  pci?: number | null;
  cid?: number | null;
  tac?: number | null;
  mcc?: string | null;
  mnc?: string | null;
  bandwidthMhz?: number | null;
  rsrp?: number | null;
  rsrq?: number | null;
  rssi?: number | null;
  sinr?: number | null;
  dbm?: number | null;
  timingAdvance?: number | null;
}

interface CellInfoPluginApi {
  requestPermissions(): Promise<{ granted: boolean }>;
  checkPermissions(): Promise<{ location: boolean; phone: boolean }>;
  getAllCellInfo(): Promise<{ cells: RawCell[] }>;
  getServiceState(): Promise<{
    operatorName: string | null; operatorNumeric: string | null; isoCountry: string | null;
    roaming: boolean | null; dataTechInt: number; voiceRegState: number | null;
    dataRegState: number | null; nrAvailable: boolean; endc: boolean;
    carrierAggregation: boolean; ntn: boolean; iwlanPreferred?: boolean | null;
    isManualSelection: boolean | null;
    emergencyOnly: boolean | null;
  }>;
  getSimInfo(): Promise<{ sims: SimRec[] }>;
  getWifiInfo(): Promise<WifiRec>;
  getDeviceCapabilities(): Promise<CapsRec>;
  ping(opts: { host: string; count: number; size: number; timeoutSec: number }): Promise<PingResult & { raw?: string }>;
}

const stub = (): never => {
  throw new Error('CellInfo native plugin unavailable (run on Android build)');
};

const CellInfo = registerPlugin<CellInfoPluginApi>('CellInfo', {
  web: new Proxy({}, { get: () => stub })
});

export interface Snapshot {
  ts: number;
  fake: boolean;
  service: ServiceRec;
  cells: CellRec[];
  sims: SimRec[];
  wifi: WifiRec | null;
  caps: CapsRec | null;
}

export const TECH_BY_INT: { [k: number]: Rat } = {
  1: 'GSM', 2: 'GSM', 3: 'WCDMA', 4: 'CDMA', 5: 'CDMA', 6: 'CDMA', 7: 'CDMA',
  8: 'WCDMA', 9: 'WCDMA', 10: 'WCDMA', 11: 'GSM', 12: 'CDMA', 13: 'LTE',
  14: 'CDMA', 15: 'WCDMA', 16: 'TDSCDMA', 17: 'TDSCDMA', 18: 'IWLAN', 19: 'LTE', 20: 'NR'
};

export function normalizeTech(t: string): Rat {
  const up = (t || '').toUpperCase().trim();
  if (['NR', 'LTE', 'WCDMA', 'GSM', 'CDMA', 'TDSCDMA', 'IWLAN'].includes(up)) return up as Rat;
  return 'UNKNOWN';
}

/** Android NETWORK_TYPE_* -> human-facing radio family. */
export function dataTechLabel(int: number): Rat {
  return TECH_BY_INT[int] || 'UNKNOWN';
}

/** Pure mapper: raw native cell record -> view model. Exported for unit tests. */
export function mapRawCell(c: RawCell): CellRec {
  const tech = normalizeTech(c.tech);
  const info = resolveArfcn(tech, c.arfcn ?? null);
  const band = c.bands && c.bands.length ? c.bands[0] : info.band;
  const label =
    tech === 'NR' && band != null ? `n${band}` :
    tech === 'LTE' && band != null ? `B${band}` :
    info.bandLabel || '';
  return {
    tech,
    registered: !!c.registered,
    timestamp: c.timestamp || Date.now(),
    band: band ?? null,
    bands: c.bands || [],
    arfcn: c.arfcn ?? null,
    freqDlMhz: info.freqDlMhz,
    freqUlMhz: info.freqUlMhz,
    bandwidthMhz: c.bandwidthMhz ?? null,
    pci: c.pci ?? null,
    cid: c.cid ?? null,
    tac: c.tac ?? null,
    mcc: c.mcc ?? null,
    mnc: c.mnc ?? null,
    rsrp: c.rsrp ?? null,
    rsrq: c.rsrq ?? null,
    rssi: c.rssi ?? null,
    sinr: c.sinr ?? null,
    dbm: c.dbm ?? null,
    timingAdvance: c.timingAdvance ?? null,
    bandLabel: label
  };
}

/** Hostname / IPv4 / IPv6 characters only - blocks argument injection into ping. */
export function isValidPingHost(host: string): boolean {
  if (typeof host !== 'string') return false;
  const h = host.trim();
  if (!h || h.length > 253 || h.startsWith('-')) return false;
  return /^[\w.:\-]+$/.test(h);
}

@Injectable({ providedIn: 'root' })
export class NativeService {
  devMode = false;

  private async safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      return fallback;
    }
  }

  async checkPermissions(): Promise<{ location: boolean; phone: boolean }> {
    if (this.devMode) return { location: true, phone: true };
    return this.safe(() => CellInfo.checkPermissions(), { location: false, phone: false });
  }

  async requestPermissions(): Promise<boolean> {
    if (this.devMode) return true;
    return this.safe(async () => (await CellInfo.requestPermissions()).granted, false);
  }

  async snapshot(): Promise<Snapshot> {
    if (this.devMode) return this.fakeSnapshot();

    const [cellRes, svcRes, simRes, wifiRes, capsRes] = await Promise.all([
      this.safe(() => CellInfo.getAllCellInfo(), { cells: [] }),
      this.safe(
        () =>
          CellInfo.getServiceState().then(s => ({
            operatorName: s.operatorName,
            operatorNumeric: s.operatorNumeric,
            isoCountry: s.isoCountry,
            roaming: s.roaming,
            dataTech: TECH_BY_INT[s.dataTechInt] || ('UNKNOWN' as Rat),
            voiceRegState: s.voiceRegState,
            dataRegState: s.dataRegState,
            nrAvailable: s.nrAvailable,
            endc: s.endc,
            carrierAggregation: s.carrierAggregation,
            ntn: s.ntn,
            iwlanPreferred: !!s.iwlanPreferred,
            isManualSelection: s.isManualSelection,
            emergencyOnly: s.emergencyOnly
          })),
        {
          operatorName: null, operatorNumeric: null, isoCountry: null, roaming: null,
          dataTech: 'UNKNOWN' as Rat, voiceRegState: null, dataRegState: null,
          nrAvailable: false, endc: false, carrierAggregation: false, ntn: false,
          iwlanPreferred: false, isManualSelection: null, emergencyOnly: null
        }
      ),
      this.safe(() => CellInfo.getSimInfo(), { sims: [] }),
      this.safe(() => CellInfo.getWifiInfo(), null as unknown as WifiRec),
      this.safe(() => CellInfo.getDeviceCapabilities(), null as unknown as CapsRec)
    ]);

    const cells = (cellRes.cells || []).map(mapRawCell);
    const hasNr = cells.some(c => c.tech === 'NR');
    let nrMode: 'SA' | 'NSA' | null = null;
    if (hasNr && svcRes.dataTech === 'NR') nrMode = 'SA';
    else if (hasNr) nrMode = 'NSA';

    const service: ServiceRec = { ...svcRes, nrMode };
    return { ts: Date.now(), fake: false, service, cells, sims: simRes.sims || [], wifi: wifiRes, caps: capsRes };
  }

  async ping(host: string, count = 10, size = 56): Promise<PingResult> {
    const clean = (host || '').trim();
    if (!isValidPingHost(clean)) {
      return { ok: false, host: clean, times: [], error: 'Invalid host' };
    }
    if (this.devMode) return this.fakePing(clean);
    return this.safe(
      () => CellInfo.ping({ host: clean, count, size, timeoutSec: 3 }),
      { ok: false, host: clean, times: [], error: 'Native ping unavailable (web preview?)' }
    );
  }

  /* ------------------------- DEV MODE FAKE DATA ------------------------- */

  private rnd(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
  private ri(min: number, max: number): number {
    return Math.round(this.rnd(min, max));
  }

  private fakeSnapshot(): Snapshot {
    const roll = Math.random();
    const opNum = roll < 0.2 ? '310260' : ['26201', '23430', '20801', '40551', '50501'][this.ri(0, 4)];
    const dataTech: Rat = roll < 0.55 ? 'NR' : roll < 0.85 ? 'LTE' : 'WCDMA';
    const ntn = Math.random() < 0.25;

    const servingTech: Rat = ntn ? 'NR' : dataTech === 'NR' ? (Math.random() < 0.6 ? 'NR' : 'LTE') : dataTech;

    const mkArfcn = (t: Rat): number => {
      if (t === 'NR') return [633984, 646669, 429890, 512910, 364000][this.ri(0, 4)];
      if (t === 'LTE') return [1300, 3050, 6339, 9410, 1850, 2850][this.ri(0, 5)];
      if (t === 'WCDMA') return 10713;
      return 87;
    };

    const serving: CellRec = {
      tech: servingTech,
      registered: true,
      timestamp: Date.now(),
      ...this.resolveFake(mkArfcn(servingTech), servingTech),
      bandwidthMhz: servingTech === 'NR' ? [100, 60, 40, 20][this.ri(0, 3)] : [20, 15, 10][this.ri(0, 2)],
      pci: this.ri(0, 503),
      cid: this.ri(100000, 400000000),
      tac: this.ri(1, 60000),
      mcc: opNum.slice(0, 3),
      mnc: opNum.slice(3),
      rsrp: -Math.round(this.rnd(78, 118)),
      rsrq: -Math.round(this.rnd(6, 17)),
      rssi: -Math.round(this.rnd(55, 95)),
      sinr: Math.round(this.rnd(-2, 30)),
      dbm: -Math.round(this.rnd(60, 110)),
      timingAdvance: this.ri(1, 60)
    };

    const neighbors: CellRec[] = Array.from({ length: this.ri(2, 7) }).map((_, i) => {
      const t: Rat = Math.random() < 0.75 ? servingTech : Math.random() < 0.5 ? 'LTE' : 'NR';
      return {
        tech: t,
        registered: false,
        timestamp: Date.now(),
        ...this.resolveFake(mkArfcn(t), t),
        bandwidthMhz: null,
        pci: (serving.pci! + i * 17 + this.ri(1, 12)) % 504,
        cid: this.ri(100000, 400000000),
        tac: serving.tac,
        mcc: opNum.slice(0, 3),
        mnc: opNum.slice(3),
        rsrp: -Math.round(this.rnd(88, 128)),
        rsrq: -Math.round(this.rnd(8, 20)),
        rssi: -Math.round(this.rnd(70, 105)),
        sinr: Math.round(this.rnd(-5, 18)),
        dbm: -Math.round(this.rnd(70, 120)),
        timingAdvance: null
      };
    });

    const wifi: WifiRec = {
      ssid: Math.random() < 0.3 ? 'STARLINK-AB12' : `HomeNet-${this.ri(1000, 9999)}`,
      bssid: 'f0:9f:c2:' + [this.ri(16, 255), this.ri(16, 255), this.ri(16, 255)]
        .map(v => v.toString(16).padStart(2, '0')).join(':'),
      frequencyMhz: [2412, 2437, 5180, 5500, 5220][this.ri(0, 4)],
      channelWidthMhz: 80,
      linkSpeedMbps: this.ri(120, 1200),
      rssi: -Math.round(this.rnd(38, 78)),
      ipAddress: `192.168.1.${this.ri(2, 250)}`,
      gatewayIp: '192.168.1.1',
      standardGuess: null,
      bandLabel: null
    };

    const caps: CapsRec = {
      model: 'Pixel 8 Pro (FAKE)', manufacturer: 'Google', brand: 'google',
      device: 'husky', product: 'husky', hardware: 'tensor',
      androidVersion: '15', sdkInt: 35, securityPatch: '2025-06-05',
      radioVersion: 'g5300-250612-FAKE',
      phoneCount: 2, activeModemCount: 1, supportedRatMask: 983039,
      features: ['telephony', 'telephony.euicc', 'wifi', 'wifi.direct', 'location.gps', 'nfc'],
      networkCaps: { internet: true, validated: true, metered: false, roaming: false },
      linkDownKbps: this.ri(20000, 900000), linkUpKbps: this.ri(5000, 100000),
      dataEnabled: true
    };

    const service: ServiceRec = {
      operatorName: ntn ? 'T-Mobile Starlink' : ['Telekom DE', 'EE', 'Orange FR', 'Jio IN', 'Telstra AU'][this.ri(0, 4)],
      operatorNumeric: opNum,
      isoCountry: opNum.startsWith('310') ? 'us' : opNum.startsWith('262') ? 'de' : opNum.startsWith('234') ? 'gb' : opNum.startsWith('208') ? 'fr' : opNum.startsWith('405') ? 'in' : 'au',
      roaming: false,
      dataTech,
      voiceRegState: 0,
      dataRegState: 0,
      nrMode: hasFakeNr([serving, ...neighbors], dataTech),
      nrAvailable: true,
      endc: dataTech === 'LTE' && [serving, ...neighbors].some(c => c.tech === 'NR'),
      carrierAggregation: Math.random() < 0.4,
      ntn,
      iwlanPreferred: Math.random() < 0.35,
      isManualSelection: false,
      emergencyOnly: false
    };

    return { ts: Date.now(), fake: true, service, cells: [serving, ...neighbors], sims: [], wifi, caps };
  }

  private resolveFake(arfcn: number, t: Rat): {
    arfcn: number; band: number | null; bands: number[];
    freqDlMhz: number | null; freqUlMhz: number | null; bandLabel: string;
  } {
    const info = resolveArfcn(t, arfcn);
    return {
      arfcn,
      band: info.band,
      bands: info.band ? [info.band] : [],
      freqDlMhz: info.freqDlMhz,
      freqUlMhz: info.freqUlMhz,
      bandLabel: info.bandLabel
    };
  }

  private fakePing(host: string): PingResult {
    const base = this.rnd(8, 45);
    const times = Array.from({ length: 10 }).map(() => Math.max(2, base * Math.exp(this.rnd(-0.25, 0.35))));
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return {
      ok: true, host,
      transmitted: 10, received: 10, lossPct: 0,
      minMs: round(Math.min(...times)), avgMs: round(avg), maxMs: round(Math.max(...times)),
      jitterMs: round(Math.sqrt(times.reduce((a, t) => a + (t - avg) ** 2, 0) / times.length)),
      ttl: 57, times: times.map(round)
    };
  }
}

function hasFakeNr(cells: CellRec[], dataTech: Rat): 'SA' | 'NSA' | null {
  const hasNr = cells.some(c => c.tech === 'NR');
  if (!hasNr) return null;
  return dataTech === 'NR' ? 'SA' : 'NSA';
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}
