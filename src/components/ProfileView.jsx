import { ChevronLeft, MapPin, Edit3, Users, UserPlus, Star } from 'lucide-react';
import { C, DISPLAY_FONT } from '../theme';
import StadiumArt from './StadiumArt';

export default function ProfileView({
  visitedCount, reviews, stadiums, profileMode, onToggleProfileMode, onBackToMap, onOpenStadiumFromName,
}) {
  return (
    <div className="flex-1 overflow-y-auto gc-hide-scrollbar">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <button onClick={onBackToMap} className="flex items-center gap-1.5 text-sm gc-focus" style={{ color: C.muted }}>
            <ChevronLeft size={16} /> Mapa
          </button>
          <button
            onClick={onToggleProfileMode}
            className="text-xs underline gc-focus"
            style={{ color: C.muted }}
          >
            {profileMode === 'own' ? 'Ver como perfil de un amigo' : 'Volver a mi perfil'}
          </button>
        </div>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: C.brand, color: C.bright, fontFamily: DISPLAY_FONT }}>
            NC
          </div>
          <h1 className="text-2xl mt-3" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>
            Nacho Cortez
          </h1>
          <p className="text-sm mt-1 max-w-xs" style={{ color: C.muted }}>
            Hincha de San Martín de Tucumán. Groundhopper del NOA, sumando canchas de a poco. ⚽
          </p>
          <div className="mt-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.brandBright }}>
            Hincha de San Martín de Tucumán
          </div>
          <button
            className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold gc-focus flex items-center gap-1.5"
            style={{
              backgroundColor: profileMode === 'own' ? 'transparent' : C.brand,
              border: profileMode === 'own' ? `1px solid ${C.border}` : 'none',
              color: C.bright,
            }}
          >
            {profileMode === 'own' ? <><Edit3 size={14} /> Editar perfil</> : <><UserPlus size={15} /> Agregar amigo</>}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-8">
          {[
            { label: 'Estadios', value: visitedCount, Icon: MapPin },
            { label: 'Reseñas', value: reviews.length, Icon: Edit3 },
            { label: 'Amigos', value: 34, Icon: Users },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="flex flex-col items-center py-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <span className="text-3xl" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{value}</span>
              <span className="text-xs mt-1 flex items-center gap-1" style={{ color: C.muted }}>
                <Icon size={12} /> {label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 px-1 text-xs" style={{ color: C.muted }}>
          <span>4 provincias recorridas</span>
          <span>$184.500 invertidos en total</span>
        </div>

        <h2 className="text-lg font-semibold mt-8 mb-3" style={{ color: C.bright }}>Bitácora</h2>
        <div className="grid grid-cols-2 gap-3">
          {reviews.map((r, i) => {
            const match = stadiums.find((s) => s.name === r.stadium);
            return (
              <div key={r.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <StadiumArt tone={i % 2 === 0 ? 'brand' : 'gold'} uid={r.id} className="w-full h-20" />
                <div className="p-3">
                  <button
                    onClick={() => onOpenStadiumFromName(r.stadium)}
                    disabled={!match}
                    className="text-sm font-semibold truncate text-left w-full gc-focus"
                    style={{ color: C.bright, cursor: match ? 'pointer' : 'default' }}
                  >
                    {r.stadium}
                  </button>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} fill={C.gold} color={C.gold} />
                    <span className="text-xs font-medium" style={{ color: C.gold }}>{r.rating}/10</span>
                    <span className="text-xs ml-auto" style={{ color: C.muted }}>{r.date}</span>
                  </div>
                  <p
                    className="text-xs mt-2 leading-snug"
                    style={{ color: C.muted, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {r.excerpt}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
