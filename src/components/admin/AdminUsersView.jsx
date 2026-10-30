import ConfirmModal from '../ConfirmModal';
import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, Star, AlertCircle, Activity } from 'lucide-react';
import { C, DISPLAY_FONT } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import AdminUserEditModal from './AdminUserEditModal';
import UserActivityModal from './UserActivityModal';
import AdminPagination, { paginate, clampPage, filterFieldStyle } from './AdminPagination';
import FilterDropdown from './FilterDropdown';
import { isAdminRole } from '../../utils/roles';

function initialsOf(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

export default function AdminUsersView({ onToast }) {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [query, setQuery] = useState('');
  const [rolFilter, setRolFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [activityUser, setActivityUser] = useState(null);
  const [selected, setSelected] = useState(() => new Set()); // acciones masivas
  const [bulkDays, setBulkDays] = useState('7');
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminService.getUsers()
      .then((data) => { if (!cancelled) setUsers(data); })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const muted = Boolean(u.mutedUntil) && new Date(u.mutedUntil) > new Date();
      const matchesRol = rolFilter === 'all' || (rolFilter === 'muted' ? muted : (rolFilter === 'admin') === isAdminRole(u.rol));
      const matchesText = !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      return matchesRol && matchesText;
    });
  }, [users, query, rolFilter]);

  const currentPage = clampPage(page, filtered.length);
  const visible = paginate(filtered, currentPage);

  function handleDelete(user) {
    setPendingDelete(user);
  }

  async function confirmDelete(user) {
    setPendingDelete(null);
    try {
      await adminService.deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      onToast?.('Usuario eliminado');
    } catch (err) {
      onToast?.(err.response?.data?.message || 'No pudimos eliminar el usuario.');
    }
  }

  const toggleSelected = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Silencia (o levanta el silencio de) todos los seleccionados; cada uno se guarda por separado
  async function bulkMute(days) {
    setBulkBusy(true);
    const ids = [...selected];
    const results = await Promise.allSettled(ids.map((id) => adminService.updateUser(id, { mutedDays: days })));
    const updated = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    setUsers((prev) => prev.map((u) => updated.find((x) => x._id === u._id) ?? u));
    const failed = ids.length - updated.length;
    onToast?.(`${updated.length} ${updated.length === 1 ? 'usuario' : 'usuarios'} ${days === 0 ? 'con el silencio levantado' : 'silenciado(s)'}${failed ? `, ${failed} con error` : ''}`);
    setSelected(new Set());
    setBulkBusy(false);
  }

  // Un admin no puede tocar a otro admin (el back lo valida igual)
  // Un admin no toca a otros admins ni a superadmins; un superadmin toca a todos menos a otros superadmins
  const isLockedBy = (user) => {
    if (user._id === me?._id) return false;
    if (user.rol === 'superadmin') return true;
    return me?.rol !== 'superadmin' && user.rol === 'admin';
  };

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

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Buscar por usuario o email..."
          className="flex-1 min-w-[180px] px-3 py-2 rounded-xl text-sm outline-none gc-focus"
          style={filterFieldStyle}
        />
        <FilterDropdown
          className="flex-1 min-w-[9rem] sm:flex-none"
          value={rolFilter}
          onChange={(v) => { setRolFilter(v); setPage(1); }}
          ariaLabel="Filtrar por tipo de usuario"
          options={[{ value: 'all', label: 'Todos' }, { value: 'user', label: 'Usuarios' }, { value: 'admin', label: 'Admins' }, { value: 'muted', label: 'Silenciados' }]}
        />
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 mb-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.brandBright}` }}>
          <span className="text-sm font-semibold" style={{ color: C.bright }}>{selected.size} {selected.size === 1 ? 'seleccionado' : 'seleccionados'}</span>
          <FilterDropdown
            compact
            value={String(bulkDays)}
            onChange={setBulkDays}
            ariaLabel="Días de silencio"
            options={[1, 7, 30, 90].map((d) => ({ value: String(d), label: `${d} ${d === 1 ? 'día' : 'días'}` }))}
          />
          <button onClick={() => bulkMute(Number(bulkDays))} disabled={bulkBusy} className="px-3 py-1.5 rounded-lg text-xs font-semibold gc-focus disabled:opacity-40" style={{ backgroundColor: '#f85149', color: C.bright }}>Silenciar</button>
          <button onClick={() => bulkMute(0)} disabled={bulkBusy} className="px-3 py-1.5 rounded-lg text-xs font-semibold gc-focus disabled:opacity-40" style={{ border: `1px solid ${C.border}`, color: C.bright }}>Levantar silencio</button>
          <button onClick={() => setSelected(new Set())} className="text-xs ml-auto gc-focus rounded" style={{ color: C.muted }}>Cancelar</button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        {visible.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ backgroundColor: C.surface, color: C.muted }}>
            Ningún usuario coincide con los filtros.
          </p>
        ) : visible.map((user, i) => (
          <div
            key={user._id}
            className="flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: C.surface, borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}
          >
            <input
              type="checkbox"
              checked={selected.has(user._id)}
              onChange={() => toggleSelected(user._id)}
              disabled={user._id === me?._id || isLockedBy(user)}
              aria-label={`Seleccionar a @${user.username}`}
              className="w-4 h-4 shrink-0 accent-green-500 disabled:opacity-30"
            />
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
                {isAdminRole(user.rol) && (
                  user.rol === 'superadmin' ? (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: C.gold, color: C.bg }}>
                      <Star size={10} fill="currentColor" /> Superadmin
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: C.brand, color: C.bright }}>
                      <Star size={10} fill="currentColor" /> Admin
                    </span>
                  )
                )}
                {user._id === me?._id && (
                  <span className="text-[10px]" style={{ color: C.muted }}>(vos)</span>
                )}
                {user.mutedUntil && new Date(user.mutedUntil) > new Date() && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ border: '1px solid #f85149', color: '#f85149' }}>Silenciado</span>
                )}
              </div>
              <span className="block text-xs truncate" style={{ color: C.muted }}>{user.email}</span>
            </div>

            {user.clubHincha?.name && (
              user.clubHincha.logoUrl ? (
                <img src={user.clubHincha.logoUrl} alt={user.clubHincha.name} title={user.clubHincha.name} className="hidden sm:block w-7 h-7 object-contain shrink-0" />
              ) : (
                <span className="hidden sm:flex w-7 h-7 rounded-full items-center justify-center text-[11px] font-semibold shrink-0" title={user.clubHincha.name} style={{ backgroundColor: C.border, color: C.bright }}>
                  {user.clubHincha.name.charAt(0).toUpperCase()}
                </span>
              )
            )}

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActivityUser(user)}
                aria-label="Ver actividad"
                title="Ver actividad"
                className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap"
                style={{ color: C.muted }}
              >
                <Activity size={14} />
              </button>
              <button
                onClick={() => setEditingUser(user)}
                disabled={isLockedBy(user)}
                aria-label="Editar usuario"
                title={isLockedBy(user) ? 'No podés editar a otro administrador' : undefined}
                className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap disabled:opacity-30"
                style={{ color: C.brandBright }}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(user)}
                disabled={user._id === me?._id || isLockedBy(user)}
                aria-label="Eliminar usuario"
                title={isLockedBy(user) ? 'No podés eliminar a otro administrador' : undefined}
                className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap"
                style={{ color: user._id === me?._id || isLockedBy(user) ? C.border : '#f85149' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AdminPagination page={currentPage} total={filtered.length} onChange={setPage} />

      {pendingDelete && (
        <ConfirmModal
          danger
          title={`¿Eliminar a @${pendingDelete.username}?`}
          message="Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onConfirm={() => confirmDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {activityUser && <UserActivityModal user={activityUser} onClose={() => setActivityUser(null)} />}
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
