import { useEffect, useState } from 'react';
import { X, Check, Users, Wallet } from 'lucide-react';
import { C, rgba, DISPLAY_FONT, formatMoney, sumExpenses } from '../theme';
import visitService from '../services/visitService';
import { computeVisitStats } from '../utils/visitStats';
import StadiumArt from './StadiumArt';
import StarRow from './StarRow';

export default function StadiumModal({
  stadium, onClose, onOpenStadiumPage, onStartVisit, onToggleWishlist,
}) {
  const [visits, setVisits] = useState([]);

  useEffect(() => {
    let cancelled = false;
    visitService.getStadiumVisits(stadium.id)
      .then((data) => { if (!cancelled) setVisits(data); })
      .catch(() => { if (!cancelled) setVisits([]); });
    return () => { cancelled = true; };
  }, [stadium.id]);

  const stats = computeVisitStats(visits);
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.55) }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl overflow-y-auto gc-hide-scrollbar"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative h-36"
          style={{ cursor: 'pointer' }}
          onClick={() => onOpenStadiumPage(stadium, 'map')}
        >
          <StadiumArt tone={stadium.tone} uid={stadium.id} className="w-full h-full" />
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center gc-focus"
            style={{ backgroundColor: rgba(C.bg, 0.6) }}
          >
            <X size={16} color={C.bright} />
          </button>
          {stadium.status === 'visited' && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.brandBright }}>
              <Check size={12} /> Visitaste {stadium.visits} {stadium.visits === 1 ? 'vez' : 'veces'}
            </div>
          )}
          {stadium.status === 'wishlist' && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.gold }}>
              En tu lista
            </div>
          )}
        </div>

        <div className="p-5">
          <h2 className="text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>{stadium.name}</h2>
          <p className="text-sm mt-1" style={{ color: C.muted }}>{stadium.club} · {stadium.city}</p>

          <div className="flex items-center gap-1.5 mt-4">
            <Users size={15} color={C.muted} />
            <span className="text-sm" style={{ color: C.muted }}>{stadium.capacity.toLocaleString('es-AR')} espectadores</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <StarRow rating={stats.starRating} />
            <span className="text-sm font-medium" style={{ color: C.bright }}>{stats.avg}</span>
            <span className="text-sm" style={{ color: C.muted }}>({stats.count.toLocaleString('es-AR')} reseñas)</span>
          </div>

          {stats.count > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Wallet size={15} color={C.muted} />
              <span className="text-sm" style={{ color: C.muted }}>
                Gasto promedio: <span style={{ color: C.brandBright, fontWeight: 600 }}>{formatMoney(sumExpenses(stats.avgExpenses), stats.currency)}</span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => onStartVisit(stadium)}
              className="flex-1 py-3 rounded-xl font-semibold text-sm gc-focus"
              style={{ backgroundColor: C.brand, color: C.bright }}
            >
              Registrar visita
            </button>
            <button
              onClick={() => onToggleWishlist(stadium.id)}
              disabled={stadium.status === 'visited'}
              className="flex-1 py-3 rounded-xl font-semibold text-sm gc-focus"
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${stadium.status === 'visited' ? C.border : C.gold}`,
                color: stadium.status === 'visited' ? C.border : C.gold,
              }}
            >
              {stadium.status === 'wishlist' ? 'Quitar de la lista' : 'Visitaré próximamente'}
            </button>
          </div>

          <button
            onClick={() => onOpenStadiumPage(stadium, 'map')}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium gc-focus"
            style={{ backgroundColor: 'transparent', color: C.muted, border: `1px dashed ${C.border}` }}
          >
            Ver reseñas, puntuación y gastos promedio
          </button>
        </div>
      </div>
    </div>
  );
}
