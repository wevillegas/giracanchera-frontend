import ConfirmModal from '../ConfirmModal';
import { useEffect, useState } from 'react';
import { AlertCircle, Check, Trash2 } from 'lucide-react';
import { C, DISPLAY_FONT } from '../../theme';
import visitService from '../../services/visitService';

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

// Denuncias abiertas: el admin descarta la denuncia o quita la reseña
export default function AdminReportsView({ onToast }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    visitService.getReports()
      .then(setReports)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const [pendingRemove, setPendingRemove] = useState(null);

  function resolve(report, action) {
    if (action === 'remove_review') {
      setPendingRemove(report);
      return;
    }
    runResolve(report, action);
  }

  async function runResolve(report, action) {
    setBusyId(report._id);
    try {
      const result = await visitService.resolveReport(report._id, action);
      setReports((prev) => prev.filter((r) => (action === 'remove_review' ? r.visit?._id !== report.visit?._id : r._id !== report._id)));
      onToast?.(result.message);
    } catch (err) {
      onToast?.(err.response?.data?.message || 'No pudimos completar la acción.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm" style={{ color: C.muted }}>Cargando denuncias...</p>;
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
        <AlertCircle size={15} /> No pudimos cargar las denuncias.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold" style={{ color: C.bright }}>Denuncias abiertas ({reports.length})</h2>
      {reports.length === 0 ? (
        <p className="text-sm py-8 text-center rounded-2xl" style={{ backgroundColor: C.surface, color: C.muted }}>No hay denuncias abiertas.</p>
      ) : reports.map((r) => (
        <div key={r._id} className="p-4 rounded-2xl space-y-2" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-base truncate" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>{r.visit?.stadium?.name || 'Estadio'}</span>
            <span className="text-xs shrink-0" style={{ color: C.muted }}>{formatDate(r.createdAt)}</span>
          </div>
          <p className="text-xs" style={{ color: C.muted }}>Reseña de @{r.visit?.user?.username || '...'} · {r.visit?.rating}/10</p>
          <p className="text-sm leading-snug" style={{ color: C.bright }}>{r.visit?.reviewText?.trim() || 'Sin texto'}</p>
          <div className="p-3 rounded-xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
            <p className="text-xs" style={{ color: C.muted }}>Denunciada por @{r.reporter?.username || '...'}</p>
            <p className="text-sm mt-1" style={{ color: C.bright }}>{r.reason}</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => resolve(r, 'dismiss')}
              disabled={busyId === r._id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus disabled:opacity-40"
              style={{ border: `1px solid ${C.border}`, color: C.bright }}
            >
              <Check size={13} /> Descartar
            </button>
            <button
              onClick={() => resolve(r, 'remove_review')}
              disabled={busyId === r._id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus disabled:opacity-40"
              style={{ backgroundColor: '#f85149', color: C.bright }}
            >
              <Trash2 size={13} /> Eliminar reseña
            </button>
          </div>
        </div>
      ))}
      {pendingRemove && (
        <ConfirmModal
          danger
          title="¿Quitar esta reseña?"
          message="También se borran sus fotos y todas sus denuncias."
          confirmLabel="Quitar reseña"
          onConfirm={() => { const r = pendingRemove; setPendingRemove(null); runResolve(r, 'remove_review'); }}
          onCancel={() => setPendingRemove(null)}
        />
      )}
    </div>
  );
}
