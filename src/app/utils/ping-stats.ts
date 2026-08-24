/** Statistics for a set of ping round-trip times (ms). */
export interface PingStats {
  count: number;
  avg: number | null;
  min: number | null;
  max: number | null;
  jitter: number | null;
}

export function pingStats(times: number[]): PingStats {
  const clean = (times || []).filter(t => Number.isFinite(t) && t >= 0);
  if (!clean.length) {
    return { count: 0, avg: null, min: null, max: null, jitter: null };
  }
  const avg = clean.reduce((a, b) => a + b, 0) / clean.length;
  const jitter =
    clean.length < 2
      ? 0
      : Math.sqrt(clean.reduce((acc, x) => acc + (x - avg) ** 2, 0) / clean.length);
  return {
    count: clean.length,
    avg,
    min: Math.min(...clean),
    max: Math.max(...clean),
    jitter
  };
}
