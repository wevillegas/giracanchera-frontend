import { useEffect, useState } from 'react';
import { X, AlertCircle, Star, EyeOff } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../../theme';
import adminService from '../../services/adminService';

const formatDate = (value) => (value ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '—');

function Stat({ label, value, warn }) {
  return (
    <div className="px-3 py-3 rounded-xl text-center" style={{ backgroundColor: C.bg, border: `1px solid ${warn ? '#f85149' : C.border}` }}>
      <p className="text-2xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: warn ? '#f85149' : C.bright }}>{value}</p>
      <p className="text-[11px] mt-1.5" style={{ color: C.muted }}>{label}</p>
    </div>
  );
}

// Qué hizo un usuario en la app, para decidir si hace falta moderarlo
export default function UserActivityModal({ user, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminService.getUserActivity(user._id)
      .then((result) => { if (!cancelled) setData(result); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [user._id]);

  const muted = user.mutedUntil && new Date(user.mutedUntil) > new Date();
  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.6) }} onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl overflow-y-auto gc-hide-scrollbar gc-modal"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <h2 className="text-3xl leading-none break-words" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>@{user.username}</h2>
            <p className="text-xs mt-1.5" style={{ color: C.muted }}>
              Miembro desde {formatDate(data?.user?.createdAt ?? user.createdAt)}
              {muted && <span className="ml-2" style={{ color: '#f85149' }}>· Silenciado hasta el {formatDate(user.mutedUntil)}</span>}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 gc-focus gc-tap" style={{ backgroundColor: C.surface }}>
            <X size={16} color={C.bright} />
          </button>
        </div>

        <div className="px-5 pb-6 pt-4 space-y-4">
          {error ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}><AlertCircle size={15} /> No pudimos cargar la actividad.</div>
          ) : !data ? (
            <p className="text-sm" style={{ color: C.muted }}>Cargando actividad...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat label="Reseñas" value={data.visits} />
                <Stat label="Puntaje promedio" value={data.avgRating ?? '—'} />
                <Stat label="Denuncias recibidas" value={data.reportsReceived} warn={data.reportsReceived > 1} />
                <Stat label="Denuncias hechas" value={data.reportsMade} />
              </div>
              {data.hidden > 0 && (
                <p className="flex items-center gap-1.5 text-xs" style={{ color: C.gold }}><EyeOff size={12} /> {data.hidden} {data.hidden === 1 ? 'reseña oculta' : 'reseñas ocultas'} por moderación</p>
              )}

              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: C.bright }}>Últimas reseñas</h3>
                {data.lastVisits.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>Todavía no escribió reseñas.</p>
                ) : (
                  <div className="space-y-2">
                    {data.lastVisits.map((v) => (
                      <div key={v._id} className="p-3 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${v.hidden ? C.gold : C.border}` }}>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium truncate" style={{ color: C.bright }}>{v.stadium?.name || 'Estadio eliminado'}</span>
                          <span className="flex items-center gap-1 shrink-0 text-xs" style={{ color: C.gold }}><Star size={11} fill={C.gold} /> {v.rating}/10</span>
                        </div>
                        <p className="text-xs mt-1 break-words [overflow-wrap:anywhere]" style={{ color: C.muted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {v.reviewText?.trim() || 'Sin texto'}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: C.muted }}>{formatDate(v.createdAt)}{v.hidden ? ' · oculta' : ''}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
