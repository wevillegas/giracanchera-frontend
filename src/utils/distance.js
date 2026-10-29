const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

// Distancia en km entre dos puntos { lat, lng } sobre la esfera (fórmula de haversine)
export function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

const hasCoords = (s) => Number.isFinite(s.location?.coordinates?.lat) && Number.isFinite(s.location?.coordinates?.lng);

// Los estadios más cercanos a `stadium` dentro de `maxKm`, del más cerca al más lejos
export function nearbyStadiums(stadium, stadiums, { limit = 4, maxKm = 100 } = {}) {
  if (!hasCoords(stadium)) return [];
  return stadiums
    .filter((s) => s.id !== stadium.id && hasCoords(s))
    .map((s) => ({ stadium: s, km: distanceKm(stadium.location.coordinates, s.location.coordinates) }))
    .filter(({ km }) => km <= maxKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}
