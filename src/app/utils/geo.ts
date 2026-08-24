/** Great-circle distance between two WGS84 points, in kilometres. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return NaN;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export type Movement =
  | { kind: 'start' | 'same' | null }
  | { kind: 'm' | 'km'; n: number };

/** Structured movement between two test locations (translate via geo.* i18n keys). */
export function movementText(
  prev: { lat: number; lon: number } | null | undefined,
  cur: { lat: number; lon: number } | null | undefined
): Movement {
  if (!prev || !cur) return { kind: null };
  const km = haversineKm(prev.lat, prev.lon, cur.lat, cur.lon);
  if (!Number.isFinite(km)) return { kind: null };
  if (km < 0.05) return { kind: 'same' };
  if (km < 1) return { kind: 'm', n: Math.round(km * 1000) };
  return { kind: 'km', n: Number(km.toFixed(1)) };
}
