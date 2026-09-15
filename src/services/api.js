import axios from 'axios';

// Sin Content-Type fijo: axios ya pone 'application/json' para objetos planos,
// y deja que el navegador arme el boundary de multipart cuando el body es FormData
// (con un Content-Type fijo en 'application/json', axios serializaba los FormData
// como JSON y perdía el archivo adjunto).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
