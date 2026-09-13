import api from './api';

const DEFAULT_EXPENSES = { entradas: 0, comida: 0, estacionamiento: 0, transporte: 0 };

function buildCityLabel(raw) {
  if (raw.city) return raw.city;
  const loc = raw.location || {};
  return [loc.city, loc.country].filter(Boolean).join(', ');
}

// Adapta la respuesta cruda del backend (con mainClub y location anidada)
// al shape que consume la UI, completando con defaults los campos que la API todavía no expone.
function normalizeStadium(raw) {
  const coords = raw?.location?.coordinates || {};
  return {
    id: raw.id ?? raw._id,
    name: raw.name,
    club: raw.club ?? raw.mainClub?.shortName ?? raw.mainClub?.name ?? '',
    city: buildCityLabel(raw),
    capacity: raw.capacity ?? 0,
    location: { coordinates: { lat: coords.lat, lng: coords.lng } },
    status: raw.status ?? 'none',
    visits: raw.visits ?? 0,
    tone: raw.tone ?? 'brand',
    rating: raw.rating ?? 0,
    reviews: raw.reviews ?? 0,
    communityAvg: raw.communityAvg ?? raw.rating ?? 0,
    distribution: raw.distribution ?? [0, 0, 0, 0, 0],
    currency: raw.currency ?? 'ARS',
    avgExpenses: raw.avgExpenses ?? DEFAULT_EXPENSES,
  };
}

async function getAll() {
  const { data } = await api.get('/stadiums');
  const list = Array.isArray(data) ? data : data.stadiums ?? [];
  return list.map(normalizeStadium);
}

async function getById(id) {
  const { data } = await api.get(`/stadiums/${id}`);
  return normalizeStadium(data.stadium ?? data);
}

const stadiumService = { getAll, getById };

export default stadiumService;
export { getAll, getById };
