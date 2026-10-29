import api from './api';

async function getUsers() {
  const { data } = await api.get('/users/admin/all');
  return data;
}

async function updateUser(id, updates) {
  const { data } = await api.put(`/users/admin/${id}`, updates);
  return data;
}

async function deleteUser(id) {
  const { data } = await api.delete(`/users/admin/${id}`);
  return data;
}

async function getStadiums() {
  const { data } = await api.get('/stadiums');
  return data;
}

// Sugerencias de Wikidata pendientes: { _id, draft }
async function getStadiumDrafts() {
  const { data } = await api.get('/stadiums/drafts');
  return data;
}

// Búsqueda de datos en Wikidata para todos los estadios: arranca en el servidor y se consulta el avance
async function startWikidataImport() {
  const { data } = await api.post('/stadiums/import-wikidata');
  return data;
}

async function getWikidataImport() {
  const { data } = await api.get('/stadiums/import-wikidata');
  return data;
}

async function getSuggestions() {
  const { data } = await api.get('/stadiums/suggestions');
  return data;
}

async function resolveSuggestion(id, action) {
  const { data } = await api.patch(`/stadiums/suggestions/${id}`, { action });
  return data;
}

async function uploadStadiumImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post('/stadiums/image', formData);
  return data.url;
}

async function createStadium(payload) {
  const { data } = await api.post('/stadiums', payload);
  return data;
}

async function updateStadium(id, payload) {
  const { data } = await api.put(`/stadiums/${id}`, payload);
  return data;
}

async function deleteStadium(id) {
  const { data } = await api.delete(`/stadiums/${id}`);
  return data;
}

async function getClubs() {
  const { data } = await api.get('/clubs');
  return data;
}

async function createClub(payload) {
  const { data } = await api.post('/clubs', payload);
  return data;
}

async function updateClub(id, payload) {
  const { data } = await api.put(`/clubs/${id}`, payload);
  return data;
}

async function deleteClub(id) {
  const { data } = await api.delete(`/clubs/${id}`);
  return data;
}

// Los filtros vacíos no se mandan
const withValues = (filters) => Object.fromEntries(Object.entries(filters).filter(([, value]) => value));

async function getAuditLogs({ page = 1, ...filters } = {}) {
  const { data } = await api.get('/audit', { params: { page, ...withValues(filters) } });
  return data;
}

async function getAuditActors() {
  const { data } = await api.get('/audit/actors');
  return data;
}

// CSV con los mismos filtros que la lista
async function exportAuditLogs(filters = {}) {
  const { data } = await api.get('/audit/export', { params: withValues(filters), responseType: 'blob' });
  return data;
}

// Resumen de actividad de un usuario: reseñas, denuncias hechas y recibidas, últimas reseñas
async function getUserActivity(id) {
  const { data } = await api.get(`/users/admin/${id}/activity`);
  return data;
}

const adminService = {
  getUsers, updateUser, deleteUser,
  getSuggestions, resolveSuggestion, startWikidataImport, getWikidataImport,
  getStadiums, getStadiumDrafts, uploadStadiumImage, createStadium, updateStadium, deleteStadium,
  getClubs, createClub, updateClub, deleteClub,
  getAuditLogs, getAuditActors, exportAuditLogs, getUserActivity,
};

export default adminService;
export {
  getUsers, updateUser, deleteUser,
  getSuggestions, resolveSuggestion,
  getStadiums, getStadiumDrafts, uploadStadiumImage, createStadium, updateStadium, deleteStadium,
  getClubs, createClub, updateClub, deleteClub,
  getAuditLogs, getAuditActors, exportAuditLogs, getUserActivity,
};
