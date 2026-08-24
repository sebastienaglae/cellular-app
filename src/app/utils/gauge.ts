/** Speed gauge view-model maths (SVG ring, r=86 -> circumference 540.35). */
export const GAUGE_CIRCUMFERENCE = 540;

export function gaugeOffset(mbps: number, peak: number): number {
  const max = Math.max(50, Number.isFinite(peak) ? peak : 50);
  const pct = Math.min(1, Math.max(0, Number.isFinite(mbps) ? mbps : 0) / max);
  return GAUGE_CIRCUMFERENCE * (1 - pct);
}

/** Round a live peak up to a stable, human-friendly gauge ceiling. */
export function nicePeak(observed: number): number {
  if (!Number.isFinite(observed) || observed <= 0) return 100;
  return Math.max(50, Math.ceil((observed * 1.15) / 50) * 50);
}

/** Compact Mbps label: 2 decimals <10, 1 decimal <100, integer above. */
export function fmtMbps(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  if (v >= 100) return v.toFixed(0);
  if (v >= 10) return v.toFixed(1);
  return v.toFixed(2);
}
