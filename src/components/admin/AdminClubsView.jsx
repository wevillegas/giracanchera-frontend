import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, AlertCircle, MapPin } from 'lucide-react';
import { C } from '../../theme';
import adminService from '../../services/adminService';
import ClubFormModal from './ClubFormModal';

export default function AdminClubsView({ onToast }) {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formTarget, setFormTarget] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

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

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        {clubs.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ backgroundColor: C.surface, color: C.muted }}>
            Todavía no hay clubes cargados.
          </p>
        ) : (
          clubs.map((club, i) => (
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
