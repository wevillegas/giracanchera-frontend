import api from './api';

async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

async function register(userData) {
  const { data } = await api.post('/auth/register', userData);
  return data;
}

async function getProfile() {
  const { data } = await api.get('/auth/me');
  return data.user ?? data;
}

const authService = { login, register, getProfile };

export default authService;
export { login, register, getProfile };
