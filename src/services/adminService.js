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

const adminService = {
  getUsers, updateUser, deleteUser,
  getStadiums, createStadium, updateStadium, deleteStadium,
  getClubs, createClub, updateClub, deleteClub,
};

export default adminService;
export {
  getUsers, updateUser, deleteUser,
  getStadiums, createStadium, updateStadium, deleteStadium,
  getClubs, createClub, updateClub, deleteClub,
};
