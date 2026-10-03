import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, Plus, AlertCircle, MapPin } from 'lucide-react';
import { C } from '../../theme';
import adminService from '../../services/adminService';
import ClubFormModal from './ClubFormModal';
import AdminPagination, { paginate, clampPage, filterFieldStyle } from './AdminPagination';

export default function AdminClubsView({ onToast }) {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formTarget, setFormTarget] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    adminService.getClubs()
      .then((data) => setClubs(Array.isArray(data) ? data : data.clubs ?? []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const loc = locationQuery.trim().toLowerCase();
    return clubs.filter((c) => {
      const matchesText = !q || c.name?.toLowerCase().includes(q) || c.shortName?.toLowerCase().includes(q);
      const matchesLocation = !loc || c.location?.toLowerCase().includes(loc);
      return matchesText && matchesLocation;
    });
  }, [clubs, query, locationQuery]);

  const currentPage = clampPage(page, filtered.length);
  const visible = paginate(filtered, currentPage);

  async function handleDelete(club) {
    if (!window.confirm(`¿Eliminar "${club.name}"?`)) return;
    try {
      await adminService.deleteClub(club._id);
      setClubs((prev) => prev.filter((c) => c._id !== club._id));
      onToast?.('Club eliminado');
    } catch (err) {
      onToast?.(err.response?.data?.message || 'No pudimos eliminar el club.');
    }
  }

  function openCreate() {
    setFormTarget(null);
    setFormOpen(true);
  }

  function openEdit(club) {
    setFormTarget(club);
    setFormOpen(true);
  }

  function handleSaved(saved) {
    setClubs((prev) => {
      const exists = prev.some((c) => c._id === saved._id);
      return exists ? prev.map((c) => (c._id === saved._id ? saved : c)) : [saved, ...prev];
    });
    onToast?.(formTarget ? 'Club actualizado' : 'Club creado');
  }

  if (loading) {
    return <p className="text-sm" style={{ color: C.muted }}>Cargando clubes...</p>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
        <AlertCircle size={15} /> No pudimos cargar los clubes.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: C.bright }}>Clubes ({clubs.length})</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold gc-focus gc-tap"
          style={{ backgroundColor: C.brand, color: C.bright }}
        >
          <Plus size={15} /> Nuevo club
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre o sigla..."
          className="flex-1 min-w-[180px] px-3 py-2 rounded-xl text-sm outline-none gc-focus"
          style={filterFieldStyle}
        />
        <input
          type="search"
          value={locationQuery}
          onChange={(e) => { setLocationQuery(e.target.value); setPage(1); }}
          placeholder="Ubicación (ciudad, provincia, país)..."
          className="flex-1 min-w-[180px] px-3 py-2 rounded-xl text-sm outline-none gc-focus"
          style={filterFieldStyle}
        />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        {visible.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ backgroundColor: C.surface, color: C.muted }}>
            {clubs.length === 0 ? 'Todavía no hay clubes cargados.' : 'Ningún club coincide con los filtros.'}
          </p>
        ) : (
          visible.map((club, i) => (
            <div
              key={club._id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ backgroundColor: C.surface, borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}
            >
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: C.brand, color: C.bright }}>
                  {club.shortName?.charAt(0)?.toUpperCase() || club.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate" style={{ color: C.bright }}>
                  {club.name}{club.shortName ? ` · ${club.shortName}` : ''}
                </span>
                {club.location && (
                  <span className="flex items-center gap-1 text-xs truncate" style={{ color: C.muted }}>
                    <MapPin size={11} /> {club.location}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(club)}
                  aria-label="Editar club"
                  className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap"
                  style={{ color: C.brandBright }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(club)}
                  aria-label="Eliminar club"
                  className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap"
                  style={{ color: '#f85149' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <AdminPagination page={currentPage} total={filtered.length} onChange={setPage} />

      {formOpen && (
        <ClubFormModal
          club={formTarget}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
