import { useEffect, useRef, useState } from 'react';
import { X, Check, Users, Wallet, Plus } from 'lucide-react';
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

  // Móvil: se cierra arrastrando la foto hacia abajo
  const panelRef = useRef(null);
  const drag = useRef(null);
  const onDragStart = (e) => {
    if (e.pointerType === 'mouse' || window.innerWidth >= 640) return;
    drag.current = { y: e.clientY, dy: 0, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDragMove = (e) => {
    const d = drag.current;
    if (!d) return;
    d.dy = Math.max(0, e.clientY - d.y);
    if (d.dy > 6) d.moved = true;
    panelRef.current.style.transition = 'none';
    panelRef.current.style.transform = `translateY(${d.dy}px)`;
  };
  const onDragEnd = () => {
    const d = drag.current;
    if (!d) return;
    const el = panelRef.current;
    el.style.transition = 'transform 0.2s ease-out';
    if (d.dy > 110) {
      el.style.transform = 'translateY(100vh)';
      setTimeout(onClose, 180);
    } else {
      el.style.transform = '';
    }
    setTimeout(() => { drag.current = null; }, 0); // deja pasar el click que sigue al arrastre
  };

  const stats = computeVisitStats(visits);
  const visited = stadium.status === 'visited';
  const wishlisted = stadium.status === 'wishlist';
  const tiles = [
    { icon: Users, label: 'Capacidad', value: stadium.capacity.toLocaleString('es-AR') },
    { icon: Check, label: 'Tus visitas', value: visited ? stadium.visits : 0 },
    { icon: Wallet, label: 'Gasto típico', value: stats.count > 0 ? formatMoney(sumExpenses(stats.medianExpenses), stats.currency) : '—' },
  ];
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-5 sm:p-4 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.55) }} onClick={onClose}>
      <div
        ref={panelRef}
        className="w-full max-w-2xl rounded-3xl overflow-y-auto gc-hide-scrollbar gc-modal"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative h-52 sm:h-72 cursor-pointer"
          style={{ touchAction: 'pan-x' }}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          onClick={() => { if (!drag.current?.moved) onOpenStadiumPage(stadium, 'map'); }}
        >
          {stadium.imageUrl ? (
            <img src={stadium.imageUrl} alt={stadium.name} className="w-full h-full object-cover" />
          ) : (
            <StadiumArt tone={stadium.tone} uid={stadium.id} className="w-full h-full" />
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${C.surface} 0%, ${rgba(C.surface, 0.55)} 38%, transparent 70%)` }} />
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Cerrar"
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center gc-focus"
            style={{ backgroundColor: rgba(C.bg, 0.6) }}
          >
            <X size={18} color={C.bright} />
          </button>
          {visited && (
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.brandBright }}>
              <Check size={12} /> Visitaste {stadium.visits} {stadium.visits === 1 ? 'vez' : 'veces'}
            </div>
          )}
          {wishlisted && (
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.gold }}>
              En tu lista
            </div>
          )}
          <div className="absolute bottom-4 inset-x-5 flex items-end gap-3">
            {stadium.clubLogoUrl && <img src={stadium.clubLogoUrl} alt={stadium.clubName} className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0 drop-shadow-lg" />}
            <div className="min-w-0">
              <h2 className="text-3xl sm:text-4xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>{stadium.name}</h2>
              {stadium.clubName && <p className="text-sm font-semibold mt-1.5 truncate" style={{ color: C.bright }}>{stadium.clubName}</p>}
              <p className={`text-sm truncate ${stadium.clubName ? 'mt-0.5' : 'mt-1.5'}`} style={{ color: C.muted }}>{stadium.locationLabel}</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {stadium.ownerType === 'province' && (
            <p className="text-sm mb-4" style={{ color: C.muted }}>{stadium.province ? `Propiedad de la provincia de ${stadium.province}` : `Propiedad de la ciudad de ${stadium.city}`}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="rounded-2xl p-2.5 sm:p-3.5 " style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
              <div className="text-xs" style={{ color: C.muted }}>Puntuación</div>
              <div className="hidden sm:flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-semibold leading-none" style={{ color: C.bright }}>{stats.avg}</span>
                <span className="text-xs" style={{ color: C.muted }}>({stats.count.toLocaleString('es-AR')})</span>
              </div>
              <div className="mt-1.5 sm:mt-2"><StarRow rating={stats.starRating} /></div>
            </div>
            {tiles.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl p-2.5 sm:p-3.5" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}><Icon size={13} /> {label}</div>
                <div className="text-lg sm:text-2xl font-semibold leading-none mt-1 sm:mt-1.5 truncate" style={{ color: label === 'Gasto típico' && stats.count > 0 ? C.brandBright : C.bright }}>{value}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onStartVisit(stadium)}
            className="w-full mt-4 sm:mt-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 gc-focus"
            style={{ backgroundColor: C.brand, color: C.bright }}
          >
            <Plus size={18} /> Registrar visita
          </button>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => onToggleWishlist(stadium.id)}
              disabled={visited}
              className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 gc-focus"
              style={{ border: `1px solid ${visited ? C.border : C.gold}`, color: visited ? C.border : C.gold }}
            >
              {wishlisted ? 'Quitar de la lista' : 'Visitaré próximamente'}
            </button>
            <button
              onClick={() => onOpenStadiumPage(stadium, 'map')}
              className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 gc-focus"
              style={{ color: C.muted, border: `1px solid ${C.border}` }}
            >
              Ver ficha completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
