import { useEffect, useState } from 'react';
import { Pencil, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { C, DISPLAY_FONT } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import AdminUserEditModal from './AdminUserEditModal';

function initialsOf(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

export default function AdminUsersView({ onToast }) {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    adminService.getUsers()
      .then((data) => { if (!cancelled) setUsers(data); })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleDelete(user) {
    if (!window.confirm(`¿Eliminar a @${user.username}? Esta acción no se puede deshacer.`)) return;
    try {
      await adminService.deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      onToast?.('Usuario eliminado');
    } catch (err) {
      onToast?.(err.response?.data?.message || 'No pudimos eliminar el usuario.');
    }
  }

  if (loading) {
    return <p className="text-sm" style={{ color: C.muted }}>Cargando usuarios...</p>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
        <AlertCircle size={15} /> No pudimos cargar los usuarios.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: C.bright }}>Usuarios ({users.length})</h2>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        {users.map((user, i) => (
          <div
            key={user._id}
            className="flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: C.surface, borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: C.brand, color: C.bright }}>
                {initialsOf(user.username || '?')}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate" style={{ color: C.bright }}>@{user.username}</span>
                {user.rol === 'admin' && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: C.brand, color: C.bright }}>
                    <ShieldCheck size={10} /> Admin
                  </span>
                )}
                {user._id === me?._id && (
                  <span className="text-[10px]" style={{ color: C.muted }}>(vos)</span>
                )}
              </div>
              <span className="block text-xs truncate" style={{ color: C.muted }}>{user.email}</span>
            </div>

            {user.clubHincha?.shortName && (
              <span className="hidden sm:block text-xs shrink-0" style={{ color: C.muted, fontFamily: DISPLAY_FONT }}>
                {user.clubHincha.shortName}
              </span>
            )}

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setEditingUser(user)}
                aria-label="Editar usuario"
                className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap"
                style={{ color: C.brandBright }}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(user)}
                disabled={user._id === me?._id}
                aria-label="Eliminar usuario"
                className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap"
                style={{ color: user._id === me?._id ? C.border : '#f85149' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingUser && (
        <AdminUserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)))}
        />
      )}
    </div>
  );
}
