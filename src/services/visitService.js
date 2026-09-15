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

const visitService = { createVisit, updateVisit, deleteVisit, getUserVisits, getStadiumVisits };

export default visitService;
export { createVisit, updateVisit, deleteVisit, getUserVisits, getStadiumVisits };
