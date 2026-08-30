export interface TraceHop {
  hop: number;
  ip: string | null;
  hostname: string | null;
  ms: number | null;
  asn: number | null;
  org: string | null;
  country: string | null;
  network: string | null;
}

export interface TraceEvent {
  done?: boolean;
  error?: string;
  hop?: TraceHop;
}
