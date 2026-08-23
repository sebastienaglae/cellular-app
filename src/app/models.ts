export type Rat = 'NR' | 'LTE' | 'WCDMA' | 'GSM' | 'CDMA' | 'TDSCDMA' | 'IWLAN' | 'UNKNOWN';

export interface BandRow {
  band: number;
  dlLow: number;
  eMin: number;
  eMax: number;
  ulLow: number | null;
  ulElow: number | null;
}

export interface NrRange {
  band: number;
  lo: number;
  hi: number;
  fr2?: boolean;
}

export interface CellRec {
  tech: Rat;
  registered: boolean;
  timestamp: number;
  band: number | null;
  bands: number[];
  arfcn: number | null;
  freqDlMhz: number | null;
  freqUlMhz: number | null;
  bandwidthMhz: number | null;
  pci: number | null;
  cid: number | null;
  tac: number | null;
  enbId?: number | null;
  mcc: string | null;
  mnc: string | null;
  rsrp: number | null;
  rsrq: number | null;
  rssi: number | null;
  sinr: number | null;
  dbm: number | null;
  timingAdvance?: number | null;
  bandLabel: string;
}

export interface ServiceRec {
  operatorName: string | null;
  operatorNumeric: string | null;
  isoCountry: string | null;
  roaming: boolean | null;
  dataTech: Rat;
  voiceRegState: number | null;
  dataRegState: number | null;
  nrMode: 'SA' | 'NSA' | null;
  nrAvailable: boolean;
  endc: boolean;
  carrierAggregation: boolean;
  ntn: boolean;
  iwlanPreferred?: boolean | null;
  isManualSelection: boolean | null;
  emergencyOnly?: boolean | null;
}

export interface SimRec {
  subscriptionId: number;
  slotIndex: number;
  carrierName: string | null;
  displayName: string | null;
  mcc: string | null;
  mnc: string | null;
  isoCountry: string | null;
  isEmbedded: boolean;
  isOpportunistic: boolean;
  dataRoaming: boolean | null;
}

export interface WifiRec {
  ssid: string | null;
  bssid: string | null;
  frequencyMhz: number | null;
  channelWidthMhz: number | null;
  linkSpeedMbps: number | null;
  rssi: number | null;
  ipAddress: string | null;
  gatewayIp: string | null;
  standardGuess: string | null;
  bandLabel: string | null;
}

export interface CapsRec {
  model: string;
  manufacturer: string;
  brand: string;
  device: string;
  product: string;
  hardware: string | null;
  androidVersion: string;
  sdkInt: number;
  securityPatch: string | null;
  radioVersion: string;
  phoneCount: number;
  activeModemCount: number;
  supportedRatMask: number | null;
  features: string[];
  networkCaps: { [k: string]: boolean };
  linkDownKbps: number | null;
  linkUpKbps: number | null;
  dataEnabled: boolean | null;
}

export interface PingResult {
  ok: boolean;
  host: string;
  transmitted?: number;
  received?: number;
  lossPct?: number;
  minMs?: number | null;
  avgMs?: number | null;
  maxMs?: number | null;
  jitterMs?: number | null;
  ttl?: number | null;
  times: number[];
  error?: string;
  raw?: string;
}

export interface SpeedResult {
  id: string;
  t: number;
  dlMbps: number | null;
  ulMbps: number | null;
  latencyMs: number | null;
  jitterMs: number | null;
  serverUrl: string;
  geo?: { lat: number; lon: number; acc?: number } | null;
  tech?: string | null;
  operator?: string | null;
  fake?: boolean;
}
