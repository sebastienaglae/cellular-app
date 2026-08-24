/** Heatmap maths: signal colour ramp, band hues, survey sampling rule. */

export interface HeatSample {
  lat: number;
  lon: number;
  dbm: number | null;
  band: string | null;
  tech: string | null;
  t: number;
}

/** Normalize dBm (-110 weak .. -50 strong) to 0..1. */
export function dbmNorm(dbm: number): number {
  if (!Number.isFinite(dbm)) return 0.5;
  return Math.min(1, Math.max(0, (dbm + 110) / 60));
}

const STOPS: { at: number; c: [number, number, number] }[] = [
  { at: 0, c: [182, 66, 45] },    // weak: clay red
  { at: 0.35, c: [214, 116, 67] }, // terracotta
  { at: 0.6, c: [222, 178, 74] },  // amber
  { at: 1, c: [96, 158, 102] }     // strong: sage green
];

/** Interpolated heat RGB for a dBm reading. */
export function signalHeatRgb(dbm: number): [number, number, number] {
  const x = dbmNorm(dbm);
  for (let i = 1; i < STOPS.length; i++) {
    if (x <= STOPS[i].at) {
      const a = STOPS[i - 1];
      const b = STOPS[i];
      const f = (x - a.at) / (b.at - a.at);
      return [
        Math.round(a.c[0] + (b.c[0] - a.c[0]) * f),
        Math.round(a.c[1] + (b.c[1] - a.c[1]) * f),
        Math.round(a.c[2] + (b.c[2] - a.c[2]) * f)
      ];
    }
  }
  return STOPS[STOPS.length - 1].c;
}

export function signalHeatCss(dbm: number): string {
  const [r, g, b] = signalHeatRgb(dbm);
  return `rgb(${r},${g},${b})`;
}

/** Stable hue for a band label (n78 -> always same colour). */
export function bandHue(band: string): number {
  let h = 0;
  for (let i = 0; i < band.length; i++) {
    h = (h * 31 + band.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

export function bandColor(band: string): string {
  return `hsl(${bandHue(band)}, 62%, 52%)`;
}

/** Sample only when the receiver actually moved (or on first fix). */
export function shouldSample(
  last: { lat: number; lon: number } | null | undefined,
  cur: { lat: number; lon: number },
  minMeters = 8
): boolean {
  if (!last) return true;
  const dLat = ((cur.lat - last.lat) * Math.PI) / 180;
  const dLon = ((cur.lon - last.lon) * Math.PI) / 180;
  const midLat = ((cur.lat + last.lat) / 2) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(midLat) ** 2 * Math.sin(dLon / 2) ** 2;
  const meters = 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(a)));
  return meters >= minMeters;
}
