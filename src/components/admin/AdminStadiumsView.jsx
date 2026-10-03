import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, Plus, AlertCircle, Users } from 'lucide-react';
import { C, DISPLAY_FONT } from '../../theme';
import adminService from '../../services/adminService';
import StadiumFormModal from './StadiumFormModal';
import AdminPagination, { paginate, clampPage, filterFieldStyle } from './AdminPagination';

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}

export default function AdminStadiumsView({ onToast }) {
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formTarget, setFormTarget] = useState(null); // null closed | {} new | stadium editing
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    adminService.getStadiums()
      .then((data) => setStadiums(Array.isArray(data) ? data : data.stadiums ?? []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }

  const countries = useMemo(() => uniqueSorted(stadiums.map((s) => s.location?.country)), [stadiums]);
  const provinces = useMemo(() => uniqueSorted(stadiums.map((s) => s.location?.province)), [stadiums]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stadiums.filter((s) => {
      const matchesText = !q || [
        s.name, s.mainClub?.name, s.location?.city, s.location?.province, s.location?.country,
      ].some((field) => field?.toLowerCase().includes(q));
      const matchesCountry = !countryFilter || s.location?.country === countryFilter;
      const matchesProvince = !provinceFilter || s.location?.province === provinceFilter;
      return matchesText && matchesCountry && matchesProvince;
    });
  }, [stadiums, query, countryFilter, provinceFilter]);

  const currentPage = clampPage(page, filtered.length);
  const visible = paginate(filtered, currentPage);

  async function handleDelete(stadium) {
    if (!window.confirm(`¿Eliminar "${stadium.name}"? También se borrarán sus visitas registradas.`)) return;
    try {
      await adminService.deleteStadium(stadium._id);
      setStadiums((prev) => prev.filter((s) => s._id !== stadium._id));
      onToast?.('Estadio eliminado');
    } catch (err) {
      onToast?.(err.response?.data?.message || 'No pudimos eliminar el estadio.');
    }
  }

  function openCreate() {
    setFormTarget(null);
    setFormOpen(true);
  }

  function openEdit(stadium) {
    setFormTarget(stadium);
    setFormOpen(true);
  }

  function handleSaved(saved) {
    setStadiums((prev) => {
      const exists = prev.some((s) => s._id === saved._id);
      return exists ? prev.map((s) => (s._id === saved._id ? saved : s)) : [saved, ...prev];
    });
    onToast?.(formTarget ? 'Estadio actualizado' : 'Estadio creado');
  }

  if (loading) {
    return <p className="text-sm" style={{ color: C.muted }}>Cargando estadios...</p>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
        <AlertCircle size={15} /> No pudimos cargar los estadios.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: C.bright }}>Estadios ({stadiums.length})</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold gc-focus gc-tap"
          style={{ backgroundColor: C.brand, color: C.bright }}
        >
          <Plus size={15} /> Nuevo estadio
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Buscar por estadio, club, ciudad..."
          className="flex-1 min-w-[180px] px-3 py-2 rounded-xl text-sm outline-none gc-focus"
          style={filterFieldStyle}
        />
        <select
          value={provinceFilter}
          onChange={(e) => { setProvinceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-sm outline-none gc-focus"
          style={filterFieldStyle}
        >
          <option value="">Todas las provincias</option>
          {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={countryFilter}
          onChange={(e) => { setCountryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-sm outline-none gc-focus"
          style={filterFieldStyle}
        >
          <option value="">Todos los países</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        {visible.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ backgroundColor: C.surface, color: C.muted }}>
            {stadiums.length === 0 ? 'Todavía no hay estadios cargados.' : 'Ningún estadio coincide con los filtros.'}
          </p>
        ) : (
          visible.map((s, i) => (
            <div
              key={s._id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ backgroundColor: C.surface, borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}
            >
              {s.mainClub?.logoUrl ? (
                <img src={s.mainClub.logoUrl} alt={s.mainClub.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: C.brand, color: C.bright }}>
                  {s.mainClub?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate" style={{ color: C.bright }}>{s.name}</span>
                <span className="block text-xs truncate" style={{ color: C.muted }}>
                  {s.mainClub?.name || 'Sin club'} · {s.location?.city}, {s.location?.country}
                </span>
              </div>

              <span className="hidden sm:flex items-center gap-1 text-xs shrink-0" style={{ color: C.muted, fontFamily: DISPLAY_FONT }}>
                <Users size={12} /> {s.capacity?.toLocaleString('es-AR')}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(s)}
                  aria-label="Editar estadio"
                  className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap"
                  style={{ color: C.brandBright }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  aria-label="Eliminar estadio"
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
        <StadiumFormModal
          stadium={formTarget}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
