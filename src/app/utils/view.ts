/** Shared view-model colour helpers (warm palette, theme-agnostic hex). */

export function levelForDbm(dbm: number | null | undefined): number {
  const v = typeof dbm === 'number' && Number.isFinite(dbm) ? dbm : null;
  if (v == null) return 0;
  if (v >= -60) return 5;
  if (v >= -75) return 4;
  if (v >= -85) return 3;
  if (v >= -95) return 2;
  if (v >= -105) return 1;
  return 0;
}

export function colorForMbps(v: number | null | undefined): string {
  if (v == null) return '#8a7f72';
  if (v >= 100) return '#4d7c4a';
  if (v >= 30) return '#7fa650';
  if (v >= 10) return '#c98a2b';
  if (v >= 3) return '#c9603f';
  return '#b64a33';
}
