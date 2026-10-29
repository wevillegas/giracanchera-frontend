import { useEffect, useState } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { C, DISPLAY_FONT } from '../../theme';
import adminService from '../../services/adminService';
import { fieldLabel, currentValue, displayValue } from '../../utils/suggestionFields';

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

// Correcciones que propusieron los usuarios: el admin las aprueba (se aplican al estadio) o las descarta
export default function AdminSuggestionsView({ onToast }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    adminService.getSuggestions()
      .then(setSuggestions)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  async function resolve(suggestion, action) {
    setBusyId(suggestion._id);
    try {
      const result = await adminService.resolveSuggestion(suggestion._id, action);
      setSuggestions((prev) => prev.filter((s) => s._id !== suggestion._id));
      onToast?.(result.message);
    } catch (err) {
      onToast?.(err.response?.data?.message || 'No pudimos completar la acción.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm" style={{ color: C.muted }}>Cargando correcciones...</p>;
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
        <AlertCircle size={15} /> No pudimos cargar las correcciones.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold" style={{ color: C.bright }}>Correcciones pendientes ({suggestions.length})</h2>
      {suggestions.length === 0 ? (
        <p className="text-sm py-8 text-center rounded-2xl" style={{ backgroundColor: C.surface, color: C.muted }}>No hay correcciones pendientes.</p>
      ) : suggestions.map((s) => {
        const manual = s.field === 'other';
        return (
          <div key={s._id} className="p-4 rounded-2xl space-y-2" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-base truncate" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>{s.stadium?.name || 'Estadio eliminado'}</span>
              <span className="text-xs shrink-0" style={{ color: C.muted }}>{formatDate(s.createdAt)}</span>
            </div>
            <p className="text-xs" style={{ color: C.muted }}>{fieldLabel(s.field)} · sugerido por @{s.author?.username || '...'}</p>
            <div className="p-3 rounded-xl space-y-1.5" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
              {!manual && (
                <p className="text-xs" style={{ color: C.muted }}>Hoy: <span style={{ color: C.bright }}>{currentValue(s.stadium, s.field)}</span></p>
              )}
              <p className="text-sm whitespace-pre-line break-words" style={{ color: C.brandBright }}>{manual ? s.value : `Propuesto: ${displayValue(s.field, s.value)}`}</p>
              {s.note && <p className="text-xs" style={{ color: C.muted }}>Fuente: {s.note}</p>}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => resolve(s, 'approve')}
                disabled={busyId === s._id || !s.stadium}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus disabled:opacity-40"
                style={{ backgroundColor: C.brand, color: C.bright }}
              >
                <Check size={13} /> {manual ? 'Marcar como resuelta' : 'Aprobar y aplicar'}
              </button>
              <button
                onClick={() => resolve(s, 'reject')}
                disabled={busyId === s._id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus disabled:opacity-40"
                style={{ border: `1px solid ${C.border}`, color: C.bright }}
              >
                <X size={13} /> Descartar
              </button>
            </div>
            {manual && <p className="text-xs" style={{ color: C.muted }}>Este tipo de corrección no se aplica sola: editá el estadio a mano y marcala como resuelta.</p>}
          </div>
        );
      })}
    </div>
  );
}
