import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

// La sesión vive en una cookie httpOnly que el navegador envía solo: el JS nunca ve el token.
// Para saber si hay sesión se le pregunta al servidor quién es (/auth/me).
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // El interceptor de api.js dispara esto cuando el backend rechaza la sesión
  // (expiró, se invalidó con logout en otra pestaña, etc.)
  useEffect(() => {
    const onAuthExpired = () => setUser(null);
    window.addEventListener('gc:auth-expired', onAuthExpired);
    return () => window.removeEventListener('gc:auth-expired', onAuthExpired);
  }, []);

  const loadProfile = useCallback(() => authService.getProfile().then(setUser), []);

  useEffect(() => {
    let cancelled = false;
    authService.getProfile()
      .then((profile) => { if (!cancelled) setUser(profile); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Tras entrar, se pide el perfil completo (el login devuelve uno reducido)
  const startSession = useCallback(async (data) => {
    setUser(data.user ?? null);
    await loadProfile().catch(() => {});
    return data;
  }, [loadProfile]);

  const login = useCallback(async (email, password) => startSession(await authService.login(email, password)), [startSession]);

  const register = useCallback(async (userData) => startSession(await authService.register(userData)), [startSession]);

  const logout = useCallback(() => {
    // Invalida la sesión en el servidor y borra la cookie; si falla (sin red), igual cerramos la sesión local
    authService.logout().catch(() => {});
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
}
