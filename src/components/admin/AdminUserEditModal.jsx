import ConfirmModal from '../ConfirmModal';
import { useEffect, useState } from 'react';
import { X, AlertCircle, Shield, KeyRound, Copy, Check } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../../theme';
import adminService from '../../services/adminService';
import clubService from '../../services/clubService';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdmin } from '../../utils/roles';

export default function AdminUserEditModal({ user, onClose, onSaved }) {
  const { user: me } = useAuth();
  const [nombre, setNombre] = useState(user.nombre || '');
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [rol, setRol] = useState(user.rol || 'user');
  const [clubId, setClubId] = useState(user.clubHincha?.id ?? user.clubHincha?._id ?? '');
  const [clubs, setClubs] = useState([]);
  const [muteDays, setMuteDays] = useState(''); // '' no cambia la sanción; '0' la levanta
  const mutedNow = user.mutedUntil && new Date(user.mutedUntil) > new Date();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    clubService.getAll()
      .then((data) => { if (!cancelled) setClubs(data); })
      .catch(() => { if (!cancelled) setClubs([]); });
    return () => { cancelled = true; };
  }, []);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // Reiniciar la contraseña: mismos límites que el backend (no la propia, no un superadmin, un admin solo si soy superadmin)
  const canResetPassword = user._id !== me?._id && user.rol !== 'superadmin' && (user.rol !== 'admin' || isSuperAdmin(me?.rol));
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);

  async function resetPassword() {
    setError('');
    setResetting(true);
    try {
      const { tempPassword: password } = await adminService.resetUserPassword(user._id);
      setTempPassword(password);
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos reiniciar la contraseña.');
    } finally {
      setResetting(false);
    }
  }

  function copyPassword() {
    navigator.clipboard?.writeText(tempPassword).then(() => setCopied(true)).catch(() => {});
  }

  function handleSubmit(e) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  async function save() {
    setError('');
    setSubmitting(true);
    try {
      const updated = await adminService.updateUser(user._id, {
        nombre, username, email, rol, clubHincha: clubId,
        ...(muteDays !== '' && { mutedDays: Number(muteDays) }),
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos guardar los cambios.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.6) }} onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-3xl overflow-y-auto gc-hide-scrollbar"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, maxHeight: '94vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>Editar usuario</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap" style={{ backgroundColor: C.surface }}>
            <X size={16} color={C.bright} />
          </button>
        </div>

        {resetConfirmOpen && (
          <ConfirmModal
            danger
            title={`¿Reiniciar la contraseña de @${user.username}?`}
            message="Se genera una contraseña temporal y se cierran sus sesiones abiertas. La contraseña actual deja de funcionar."
            confirmLabel="Reiniciar contraseña"
            onConfirm={() => { setResetConfirmOpen(false); resetPassword(); }}
            onCancel={() => setResetConfirmOpen(false)}
          />
        )}
        {confirmOpen && (
          <ConfirmModal
            title="¿Guardar cambios de este usuario?"
            message="Vas a modificar los datos y el rol de este usuario."
            confirmLabel="Guardar cambios"
            onConfirm={() => { setConfirmOpen(false); save(); }}
            onCancel={() => setConfirmOpen(false)}
          />
        )}
        <form onSubmit={handleSubmit} className="px-5 pb-6 pt-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ backgroundColor: rgba('#f85149', 0.12), border: `1px solid ${rgba('#f85149', 0.4)}`, color: '#f85149' }}>
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Usuario</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Rol</span>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright, colorScheme: 'dark' }}
            >
              <option value="user" style={{ backgroundColor: C.surface }}>Usuario</option>
              <option value="admin" style={{ backgroundColor: C.surface }}>Administrador</option>
              {(isSuperAdmin(me?.rol) || rol === 'superadmin') && (
                <option value="superadmin" style={{ backgroundColor: C.surface }}>Superadministrador</option>
              )}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Club del que es hincha</span>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <Shield size={15} color={C.muted} />
              <select
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                className="bg-transparent outline-none text-sm flex-1 gc-focus"
                style={{ color: C.bright, colorScheme: 'dark' }}
              >
                <option value="" style={{ backgroundColor: C.surface }}>Sin club</option>
                {clubs.map((club) => (
                  <option key={club.id ?? club._id} value={club.id ?? club._id} style={{ backgroundColor: C.surface }}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          {user._id !== me?._id && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: C.muted }}>Silenciar (no puede publicar ni editar reseñas)</span>
              {mutedNow && (
                <span className="text-xs" style={{ color: '#f85149' }}>Silenciado hasta el {new Date(user.mutedUntil).toLocaleDateString('es-AR')}</span>
              )}
              <select
                value={muteDays}
                onChange={(e) => setMuteDays(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright, colorScheme: 'dark' }}
              >
                <option value="" style={{ backgroundColor: C.surface }}>{mutedNow ? 'Mantener la sanción actual' : 'Sin sanción'}</option>
                {mutedNow && <option value="0" style={{ backgroundColor: C.surface }}>Levantar el silencio</option>}
                {[1, 7, 30, 90].map((d) => (
                  <option key={d} value={d} style={{ backgroundColor: C.surface }}>Silenciar {d} {d === 1 ? 'día' : 'días'}</option>
                ))}
              </select>
            </label>
          )}

          {canResetPassword && (
            <div className="flex flex-col gap-2 p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: C.muted }}><KeyRound size={13} /> Contraseña</span>
              {tempPassword ? (
                <>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-base tracking-wider select-all break-all" style={{ backgroundColor: C.bg, border: `1px solid ${C.brandBright}`, color: C.bright }}>
                      {tempPassword}
                    </code>
                    <button type="button" onClick={copyPassword} aria-label="Copiar contraseña" className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center gc-focus gc-tap" style={{ backgroundColor: C.brand }}>
                      {copied ? <Check size={16} color={C.bright} /> : <Copy size={16} color={C.bright} />}
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                    Pasásela a @{user.username} por un medio privado. <strong style={{ color: C.bright }}>Se muestra una sola vez.</strong> Al entrar,
                    que la cambie por una propia desde Editar perfil.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                    Si olvidó su contraseña, generá una temporal para pasársela. Sus sesiones abiertas se cierran.
                  </p>
                  <button
                    type="button"
                    onClick={() => setResetConfirmOpen(true)}
                    disabled={resetting}
                    className="self-start px-4 py-2 rounded-xl text-sm font-semibold gc-focus gc-tap disabled:opacity-50"
                    style={{ border: `1px solid ${C.border}`, color: C.bright }}
                  >
                    {resetting ? 'Reiniciando...' : 'Reiniciar contraseña'}
                  </button>
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-semibold text-sm gc-focus gc-tap"
            style={{ backgroundColor: C.brand, color: C.bright, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
