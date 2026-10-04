import api from './api';

// Estos tres mandan FormData (multipart) armado por quien llama (VisitFormModal).
// No fijamos 'Content-Type' a mano: axios arma el boundary automáticamente a
// partir del FormData; fijarlo manualmente rompe el parseo en el backend.
async function createVisit(formData) {
  const { data } = await api.post('/visits', formData);
  return data;
}

async function updateVisit(visitId, formData) {
  const { data } = await api.put(`/visits/${visitId}`, formData);
  return data;
}

async function deleteVisit(visitId) {
  const { data } = await api.delete(`/visits/${visitId}`);
  return data;
}

async function getUserVisits(userId) {
  const { data } = await api.get(`/visits/user/${userId}`);
  return data;
}

async function getStadiumVisits(stadiumId) {
  const { data } = await api.get(`/visits/stadium/${stadiumId}`);
  return data;
}

async function toggleLike(visitId) {
  const { data } = await api.post(`/visits/${visitId}/like`);
  return data;
}

async function toggleSave(visitId) {
  const { data } = await api.post(`/visits/${visitId}/save`);
  return data;
}

async function reportVisit(visitId, reason) {
  const { data } = await api.post(`/visits/${visitId}/report`, { reason });
  return data;
}

async function getReports() {
  const { data } = await api.get('/visits/reports');
  return data;
}

async function resolveReport(reportId, action) {
  const { data } = await api.patch(`/visits/reports/${reportId}`, { action });
  return data;
}

async function getSavedVisits() {
  const { data } = await api.get('/visits/saved');
  return data;
}

async function getLikedVisits() {
  const { data } = await api.get('/visits/liked');
  return data;
}

const visitService = {
  reportVisit, getReports, resolveReport,
  createVisit, updateVisit, deleteVisit, getUserVisits, getStadiumVisits, toggleLike, toggleSave, getSavedVisits, getLikedVisits,
};

export default visitService;
export {
  reportVisit, getReports, resolveReport,
  createVisit, updateVisit, deleteVisit, getUserVisits, getStadiumVisits, toggleLike, toggleSave, getSavedVisits, getLikedVisits,
};
