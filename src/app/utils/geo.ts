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

/** Human summary of movement between two test locations. */
export function movementText(
  prev: { lat: number; lon: number } | null | undefined,
  cur: { lat: number; lon: number } | null | undefined
): string | null {
  if (!prev || !cur) return null;
  const km = haversineKm(prev.lat, prev.lon, cur.lat, cur.lon);
  if (!Number.isFinite(km)) return null;
  if (km < 0.05) return 'same spot as previous';
  if (km < 1) return `${(km * 1000).toFixed(0)} m from previous`;
  return `${km.toFixed(1)} km from previous`;
}
