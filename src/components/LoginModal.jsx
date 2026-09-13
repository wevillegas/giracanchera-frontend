import { useState } from 'react';
import { X, Mail, Lock, AlertCircle } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function LoginModal({ onClose, onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'No pudimos iniciar sesión. Verificá tus credenciales.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-end justify-center gc-overlay" style={{ backgroundColor: rgba('#000000', 0.6) }} onClick={onClose}>
      <div
        className="gc-sheet w-full max-w-md rounded-t-3xl overflow-y-auto gc-hide-scrollbar"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderBottom: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>Iniciar sesión</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center gc-focus" style={{ backgroundColor: C.surface }}>
            <X size={16} color={C.bright} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-6 pt-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ backgroundColor: rgba('#f85149', 0.12), border: `1px solid ${rgba('#f85149', 0.4)}`, color: '#f85149' }}>
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Email</span>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <Mail size={15} color={C.muted} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="bg-transparent outline-none text-sm flex-1 gc-focus"
                style={{ color: C.bright }}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Contraseña</span>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <Lock size={15} color={C.muted} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent outline-none text-sm flex-1 gc-focus"
                style={{ color: C.bright }}
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-semibold text-sm gc-focus"
            style={{ backgroundColor: C.brand, color: C.bright, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="text-center text-sm" style={{ color: C.muted }}>
            ¿No tenés cuenta?{' '}
            <button type="button" onClick={onSwitchToRegister} className="font-semibold gc-focus" style={{ color: C.brandBright }}>
              Registrate
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
