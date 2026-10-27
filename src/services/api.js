import axios from 'axios';

// Sin Content-Type fijo: axios ya pone 'application/json' para objetos planos,
// y deja que el navegador arme el boundary de multipart cuando el body es FormData
// (con un Content-Type fijo en 'application/json', axios serializaba los FormData
// como JSON y perdía el archivo adjunto).
// withCredentials: la sesión es una cookie httpOnly. En desarrollo y en Vercel la API se llama
// por /api (mismo origen: proxy de Vite / rewrite de Vercel), así la cookie no es de terceros.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// El middleware de auth del backend responde 401 con mensajes que empiezan
// "No autorizado" cuando la sesión falta/expiró/fue invalidada (distinto de un 401
// de un endpoint como "la contraseña actual no es correcta", que no debe cerrar sesión).
// /auth/me sin sesión también es 401: no hace falta avisar, el contexto ya lo toma como "sin usuario".
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message;
    if (error.response?.status === 401 && typeof message === 'string' && message.startsWith('No autorizado')) {
      window.dispatchEvent(new Event('gc:auth-expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
