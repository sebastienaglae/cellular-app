/** Pure view-model logic extracted from HeatmapPage for unit testing. */

import { bandColor, signalHeatCss, HeatSample } from './heat';

export type HeatMode = 'signal' | 'band';

export function computeHeatPoints(
  samples: HeatSample[],
  mode: HeatMode,
  bandFilter: string
): { lat: number; lon: number; color: string; radius: number }[] {
  return samples
    .filter(s => (mode === 'signal' ? s.dbm != null : true))
    .filter(s => !bandFilter || s.band === bandFilter)
    .map(s => ({
      lat: s.lat,
      lon: s.lon,
      color: mode === 'signal' && s.dbm != null ? signalHeatCss(s.dbm) : bandColor(s.band || s.tech || '?'),
      radius: mode === 'signal' ? 24 : 18
    }));
}

export function bandsSeen(samples: HeatSample[]): string[] {
  return [...new Set(samples.map(s => s.band).filter((b): b is string => !!b))].sort();
}

export function avgRsrp(samples: HeatSample[]): number | null {
  const vals = samples.map(s => s.dbm).filter((v): v is number => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}
