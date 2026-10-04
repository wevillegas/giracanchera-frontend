import api from './api';

async function getProfile() {
  const { data } = await api.get('/users/profile');
  return data;
}

async function updateProfile({ bio, avatarFile, clubHincha }) {
  const formData = new FormData();
  if (bio !== undefined) formData.append('bio', bio);
  if (clubHincha !== undefined) formData.append('clubHincha', clubHincha ?? '');
  if (avatarFile) formData.append('avatar', avatarFile);

  const { data } = await api.put('/users/profile', formData);
  return data;
}

async function toggleWantToVisit(stadiumId) {
  const { data } = await api.post(`/users/want-to-visit/${stadiumId}`);
  return data;
}

async function getPublicProfile(userId) {
  const { data } = await api.get(`/users/${userId}`);
  return data;
}

async function searchUsers(username) {
  const { data } = await api.get('/users/search', { params: { username } });
  return data;
}

// Visitas anteriores a la app: se reemplaza la lista completa
async function setPreviousVisits(items) {
  const { data } = await api.put('/users/me/previous-visits', { items });
  return data;
}

// Estadísticas personales (solo el propio usuario)
async function getMyStats() {
  const { data } = await api.get('/users/me/stats');
  return data;
}

async function deleteAccount(password) {
  const { data } = await api.delete('/users/me', { data: { password } });
  return data;
}

async function toggleFollow(userId) {
  const { data } = await api.post(`/users/follow/${userId}`);
  return data;
}

const userService = {
  getMyStats,
  setPreviousVisits,
  deleteAccount,
  getProfile, updateProfile, toggleWantToVisit, getPublicProfile, searchUsers, toggleFollow,
};

export default userService;
export { getProfile, updateProfile, toggleWantToVisit, getPublicProfile, searchUsers, toggleFollow };
