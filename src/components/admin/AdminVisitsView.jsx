import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Trash2, Flag, Heart, Images, AlertCircle, Star } from 'lucide-react';
import { C, DISPLAY_FONT } from '../../theme';
import visitService from '../../services/visitService';
import AdminPagination, { filterFieldStyle } from './AdminPagination';
import FilterDropdown from './FilterDropdown';

const PAGE_SIZE = 15;
const RATING_RANGES = [
  { value: '', label: 'Todos los puntajes' },
  { value: '1-3', label: 'Puntaje 1 a 3' },
  { value: '4-6', label: 'Puntaje 4 a 6' },
  { value: '7-8', label: 'Puntaje 7 a 8' },
  { value: '9-10', label: 'Puntaje 9 a 10' },
];
const DANGER = '#f85149';

const formatDate = (value) => (value ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '');
const isMuted = (user) => user?.mutedUntil && new Date(user.mutedUntil) > new Date();

function Badge({ children, color }) {
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0" style={{ border: `1px solid ${color}`, color }}>{children}</span>;
}

export default function AdminVisitsView({ onToast }) {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState(''); // la consulta ya "asentada", para no pedir en cada tecla
  const [rating, setRating] = useState('');
  const [hidden, setHidden] = useState('');
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState(null); // { id, mode: 'hide' | 'delete' }
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [panelError, setPanelError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(() => {
    const [minRating, maxRating] = rating ? rating.split('-') : [];
    setLoading(true);
    visitService.adminListVisits({ page, q: search || undefined, minRating, maxRating, hidden: hidden || undefined })
      .then((result) => { setData(result); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [page, search, rating, hidden]);

  useEffect(() => { load(); }, [load]);

  function openPanel(id, mode) {
    setPanel({ id, mode });
    setReason('');
    setPanelError('');
  }

  async function run(action, successMessage) {
    setBusy(true);
    setPanelError('');
    try {
      await action();
      setPanel(null);
      onToast?.(successMessage);
      load();
    } catch (err) {
      setPanelError(err.response?.data?.message || 'No pudimos completar la acción.');
    } finally {
      setBusy(false);
    }
  }

  const unhide = (v) => run(() => visitService.setVisitHidden(v._id, false), 'Reseña visible de nuevo');
  const confirmPanel = (v) => (panel.mode === 'hide'
    ? run(() => visitService.setVisitHidden(v._id, true, reason.trim()), 'Reseña oculta')
    : run(() => visitService.adminDeleteVisit(v._id, reason.trim()), 'Reseña eliminada'));

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ color: C.bright }}>Reseñas ({data.total})</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por texto, usuario o estadio..."
          className="flex-1 min-w-[180px] px-3 py-2 rounded-xl text-sm outline-none gc-focus"
          style={filterFieldStyle}
        />
        <FilterDropdown
          className="flex-1 min-w-[9rem] sm:flex-none"
          value={rating}
          onChange={(v) => { setRating(v); setPage(1); }}
          ariaLabel="Filtrar por puntaje"
          options={RATING_RANGES}
        />
        <FilterDropdown
          className="flex-1 min-w-[9rem] sm:flex-none"
          value={hidden}
          onChange={(v) => { setHidden(v); setPage(1); }}
          ariaLabel="Filtrar por estado"
          options={[{ value: '', label: 'Visibles y ocultas' }, { value: 'false', label: 'Solo visibles' }, { value: 'true', label: 'Solo ocultas' }]}
        />
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}><AlertCircle size={15} /> No pudimos cargar las reseñas.</div>
      ) : loading && data.items.length === 0 ? (
        <p className="text-sm" style={{ color: C.muted }}>Cargando reseñas...</p>
      ) : data.items.length === 0 ? (
        <p className="text-sm py-8 text-center rounded-2xl" style={{ backgroundColor: C.surface, color: C.muted }}>Ninguna reseña coincide con los filtros.</p>
      ) : (
        <div className="space-y-3" style={{ opacity: loading ? 0.6 : 1 }}>
          {data.items.map((v) => (
            <div key={v._id} className="p-4 rounded-2xl space-y-2" style={{ backgroundColor: C.surface, border: `1px solid ${v.hidden ? C.gold : C.border}` }}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  {v.stadium?.clubLogoUrl && <img src={v.stadium.clubLogoUrl} alt={v.stadium.clubName || ''} title={v.stadium.clubName} className="w-8 h-8 object-contain shrink-0" />}
                  <span className="text-base truncate" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>{v.stadium?.name || 'Estadio eliminado'}</span>
                </span>
                <span className="text-xs shrink-0" style={{ color: C.muted }}>{formatDate(v.createdAt)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs" style={{ color: C.muted }}>
                <span>@{v.user?.username || 'usuario eliminado'}</span>
                <span className="flex items-center gap-1" style={{ color: C.gold }}><Star size={12} fill={C.gold} /> {v.rating}/10</span>
                <span className="flex items-center gap-1"><Heart size={12} /> {v.likesCount}</span>
                {v.imagesCount > 0 && <span className="flex items-center gap-1"><Images size={12} /> {v.imagesCount}</span>}
                {v.hidden && <Badge color={C.gold}>Oculta</Badge>}
                {v.reportCount > 0 && <Badge color={DANGER}><Flag size={10} className="inline -mt-0.5" /> {v.reportCount} {v.reportCount === 1 ? 'denuncia' : 'denuncias'}</Badge>}
                {isMuted(v.user) && <Badge color={DANGER}>Autor silenciado</Badge>}
              </div>
              <p className="text-sm leading-snug break-words [overflow-wrap:anywhere]" style={{ color: v.reviewText?.trim() ? C.bright : C.muted, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {v.reviewText?.trim() || 'Sin texto'}
              </p>
              {v.hidden && v.hiddenReason && <p className="text-xs" style={{ color: C.gold }}>Motivo: {v.hiddenReason}</p>}

              {panel?.id === v._id ? (
                <div className="p-3 rounded-xl space-y-2" style={{ backgroundColor: C.bg, border: `1px solid ${panel.mode === 'delete' ? DANGER : C.gold}` }}>
                  <p className="text-xs font-semibold" style={{ color: panel.mode === 'delete' ? DANGER : C.gold }}>
                    {panel.mode === 'delete' ? 'Eliminar esta reseña (no se puede deshacer)' : 'Ocultar esta reseña (se puede volver a mostrar)'}
                  </p>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value.slice(0, 300))}
                    rows={2}
                    placeholder="Motivo (obligatorio, queda en la auditoría)"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none gc-focus"
                    style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
                  />
                  {panelError && <p className="text-xs" style={{ color: DANGER }}>{panelError}</p>}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => confirmPanel(v)}
                      disabled={busy || reason.trim().length < 5}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus disabled:opacity-40"
                      style={{ backgroundColor: panel.mode === 'delete' ? DANGER : C.gold, color: C.bg }}
                    >
                      {busy ? 'Guardando...' : panel.mode === 'delete' ? 'Confirmar eliminación' : 'Confirmar'}
                    </button>
                    <button onClick={() => setPanel(null)} className="text-xs" style={{ color: C.muted }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  {v.hidden ? (
                    <button onClick={() => unhide(v)} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus disabled:opacity-40" style={{ border: `1px solid ${C.border}`, color: C.bright }}>
                      <Eye size={13} /> Mostrar de nuevo
                    </button>
                  ) : (
                    <button onClick={() => openPanel(v._id, 'hide')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus" style={{ border: `1px solid ${C.gold}`, color: C.gold }}>
                      <EyeOff size={13} /> Ocultar
                    </button>
                  )}
                  <button onClick={() => openPanel(v._id, 'delete')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus" style={{ border: `1px solid ${DANGER}`, color: DANGER }}>
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AdminPagination page={page} total={data.total} onChange={setPage} pageSize={PAGE_SIZE} />
    </div>
  );
}
