import logoIcon from '../assets/giracanchera-icono.svg';
import { useState } from 'react';
import { X, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function LoginModal({ onClose, onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [welcomeName, setWelcomeName] = useState(null); // se llena al iniciar sesión: muestra la confirmación

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(email, password);
      setWelcomeName(data.user?.nombre || data.user?.username || '');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'No pudimos iniciar sesión. Verificá tus credenciales.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.6) }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl overflow-y-auto gc-hide-scrollbar"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {welcomeName !== null ? (
          <div className="px-5 pb-6 pt-8 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: rgba(C.brandBright, 0.12) }}>
              <CheckCircle2 size={22} color={C.brandBright} />
            </div>
            <h2 className="text-3xl leading-none mt-4" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>
              {welcomeName ? `¡Hola, ${welcomeName}!` : '¡Sesión iniciada!'}
            </h2>
            <p className="text-sm mt-2" style={{ color: C.muted }}>Ya podés registrar visitas y seguir a otros hinchas.</p>
            <button
              onClick={onClose}
              className="w-full mt-6 py-3.5 rounded-xl font-semibold text-sm gc-focus gc-tap"
              style={{ backgroundColor: C.brand, color: C.bright }}
            >
              Continuar
            </button>
          </div>
        ) : (
        <>
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2.5">
            <img src={logoIcon} alt="" className="w-8 h-8 object-contain shrink-0" />
            <h2 className="text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>Iniciar sesión</h2>
          </div>
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
            <div className="gc-search-box flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface }}>
              <Mail size={15} color={C.muted} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="bg-transparent outline-none text-sm flex-1 min-w-0"
                style={{ color: C.bright }}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Contraseña</span>
            <div className="gc-search-box flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface }}>
              <Lock size={15} color={C.muted} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent outline-none text-sm flex-1 min-w-0"
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
        </>
        )}
      </div>
    </div>
  );
}
