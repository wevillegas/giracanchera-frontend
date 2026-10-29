import api from './api';

// Estadísticas públicas de la comunidad (sin sesión)
async function getPublicStats() {
  const { data } = await api.get('/stats/public');
  return data;
}

// Analíticas internas (solo admin, con sesión)
async function getAdminStats(days = 30) {
  const { data } = await api.get('/stats/admin', { params: { days } });
  return data;
}

const statsService = { getPublicStats, getAdminStats };

export default statsService;
export { getPublicStats, getAdminStats };
