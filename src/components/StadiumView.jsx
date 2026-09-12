import { ChevronLeft, Check, Users, Star } from 'lucide-react';
import { C, rgba, DISPLAY_FONT, formatMoney, sumExpenses } from '../theme';
import { COMMUNITY_REVIEWS } from '../data/stadiums';
import StadiumArt from './StadiumArt';
import StarRow from './StarRow';
import ScoreDistribution from './ScoreDistribution';

export default function StadiumView({
  stadium, reviews, expenseFields, cameFrom, onBack, onStartVisit, onToggleWishlist,
}) {
  return (
    <div className="flex-1 overflow-y-auto gc-hide-scrollbar">
      <div className="relative h-48">
        <StadiumArt tone={stadium.tone} uid={`page-${stadium.id}`} className="w-full h-full" />
        <button onClick={() => onBack(cameFrom)} className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center gc-focus" style={{ backgroundColor: rgba(C.bg, 0.6) }}>
          <ChevronLeft size={18} color={C.bright} />
        </button>
        {stadium.status === 'visited' && (
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.brandBright }}>
            <Check size={12} /> Visitaste {stadium.visits} {stadium.visits === 1 ? 'vez' : 'veces'}
          </div>
        )}
        {stadium.status === 'wishlist' && (
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.gold }}>
            En tu lista
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        <h1 className="text-4xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>{stadium.name}</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>{stadium.club} · {stadium.city}</p>
        <div className="flex items-center gap-1.5 mt-3">
          <Users size={15} color={C.muted} />
          <span className="text-sm" style={{ color: C.muted }}>{stadium.capacity.toLocaleString('es-AR')} espectadores</span>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button onClick={() => onStartVisit(stadium)} className="flex-1 py-3 rounded-xl font-semibold text-sm gc-focus" style={{ backgroundColor: C.brand, color: C.bright }}>
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

        {/* Puntuación de la comunidad */}
        <div className="mt-7 p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-4">
            <div className="text-center shrink-0">
              <span className="text-4xl" style={{ fontFamily: DISPLAY_FONT, color: C.gold }}>{stadium.communityAvg}</span>
              <p className="text-xs" style={{ color: C.muted }}>/ 10</p>
            </div>
            <div className="flex-1">
              <StarRow rating={stadium.rating} size={14} />
              <p className="text-xs mt-1" style={{ color: C.muted }}>{stadium.reviews.toLocaleString('es-AR')} reseñas de la comunidad</p>
            </div>
          </div>
          <div className="mt-4">
            <ScoreDistribution distribution={stadium.distribution} />
          </div>
        </div>

        {/* Gasto promedio */}
        <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: C.bright }}>Gasto promedio por visita</span>
            <span className="text-sm font-semibold" style={{ color: C.brandBright }}>
              {formatMoney(sumExpenses(stadium.avgExpenses), stadium.currency)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {expenseFields.map(({ key, label, Icon }) => (
              <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                <Icon size={14} color={C.muted} />
                <div className="flex-1">
                  <p className="text-xs" style={{ color: C.muted }}>{label}</p>
                  <p className="text-sm font-medium" style={{ color: C.bright }}>{formatMoney(stadium.avgExpenses[key], stadium.currency)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reseñas */}
        <h2 className="text-lg font-semibold mt-7 mb-3" style={{ color: C.bright }}>Reseñas</h2>
        <div className="space-y-3">
          {reviews.filter((r) => r.stadium === stadium.name).map((r) => (
            <div key={`mine-${r.id}`} className="p-3.5 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.brandBright}` }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: C.brandBright }}>Vos</span>
                <div className="flex items-center gap-1">
                  <Star size={12} fill={C.gold} color={C.gold} />
                  <span className="text-xs font-medium" style={{ color: C.gold }}>{r.rating}/10</span>
                </div>
              </div>
              <p className="text-sm mt-1.5 leading-snug" style={{ color: C.muted }}>{r.excerpt}</p>
              <p className="text-xs mt-1.5" style={{ color: C.muted }}>{r.date}</p>
            </div>
          ))}
          {(COMMUNITY_REVIEWS[stadium.id] || []).map((r) => (
            <div key={r.id} className="p-3.5 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: C.border, color: C.bright }}>
                    {r.author.charAt(0)}
                  </div>
                  <span className="text-sm font-medium" style={{ color: C.bright }}>{r.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} fill={C.gold} color={C.gold} />
                  <span className="text-xs font-medium" style={{ color: C.gold }}>{r.rating}/10</span>
                </div>
              </div>
              <p className="text-sm mt-1.5 leading-snug" style={{ color: C.muted }}>{r.excerpt}</p>
              <p className="text-xs mt-1.5" style={{ color: C.muted }}>{r.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
