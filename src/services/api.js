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

// El middleware de auth del backend responde 401 con mensajes que empiezan
// "No autorizado" cuando el token falta/expiró/fue invalidado (distinto de un 401
// de un endpoint como "la contraseña actual no es correcta", que no debe cerrar sesión)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message;
    if (error.response?.status === 401 && typeof message === 'string' && message.startsWith('No autorizado')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('gc:auth-expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
