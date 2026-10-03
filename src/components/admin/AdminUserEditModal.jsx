import { useEffect, useState } from 'react';
import { X, AlertCircle, Shield } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../../theme';
import adminService from '../../services/adminService';
import clubService from '../../services/clubService';

export default function AdminUserEditModal({ user, onClose, onSaved }) {
  const [nombre, setNombre] = useState(user.nombre || '');
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [rol, setRol] = useState(user.rol || 'user');
  const [clubId, setClubId] = useState(user.clubHincha?.id ?? user.clubHincha?._id ?? '');
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    clubService.getAll()
      .then((data) => { if (!cancelled) setClubs(data); })
      .catch(() => { if (!cancelled) setClubs([]); });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const updated = await adminService.updateUser(user._id, {
        nombre, username, email, rol, clubHincha: clubId,
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
        className="w-full max-w-md rounded-3xl overflow-y-auto gc-hide-scrollbar"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>Editar usuario</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap" style={{ backgroundColor: C.surface }}>
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
