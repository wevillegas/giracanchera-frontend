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

async function addFriend(friendId) {
  const { data } = await api.post(`/users/friends/${friendId}`);
  return data;
}

const userService = {
  getProfile, updateProfile, toggleWantToVisit, getPublicProfile, searchUsers, addFriend,
};

export default userService;
export { getProfile, updateProfile, toggleWantToVisit, getPublicProfile, searchUsers, addFriend };
