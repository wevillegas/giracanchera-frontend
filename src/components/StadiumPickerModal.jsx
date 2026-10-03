import { useState } from 'react';
import { X, Search, Goal, Check, Star, SearchX } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';

function statusTone(status) {
  if (status === 'visited') return C.brandBright;
  if (status === 'wishlist') return C.gold;
  return C.muted;
}

export default function StadiumPickerModal({ stadiums, onClose, onSelect, onAddWishlist }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const results = q
    ? stadiums.filter((s) => s.name.toLowerCase().includes(q) || s.club.toLowerCase().includes(q))
    : stadiums;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.6) }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col gc-sheet"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <h2 className="text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>Elegí un estadio</h2>
            <p className="text-xs mt-1" style={{ color: C.muted }}>Registrá una visita o sumalo a tu lista</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap shrink-0" style={{ backgroundColor: C.surface }}>
            <X size={16} color={C.bright} />
          </button>
        </div>

        <div className="px-5">
          <div className="gc-search-box flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface }}>
            <Search size={15} color={C.muted} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar estadios o clubes..."
              className="bg-transparent outline-none text-sm flex-1 gc-focus"
              style={{ color: C.bright }}
            />
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto gc-hide-scrollbar space-y-2">
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8" style={{ color: C.muted }}>
              <SearchX size={22} />
              <p className="text-sm text-center">Sin resultados para "{query}"</p>
            </div>
          ) : (
            results.map((s) => (
              <div key={s.id} className="rounded-xl px-4 py-3 gc-tap" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-3">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: rgba(statusTone(s.status), 0.15) }}
                  >
                    <Goal size={16} color={statusTone(s.status)} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate" style={{ color: C.bright }}>{s.name}</span>
                    <span className="block text-xs truncate" style={{ color: C.muted }}>{s.club} · {s.city}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => onSelect(s)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold gc-focus gc-tap"
                    style={{ backgroundColor: C.brand, color: C.bright }}
                  >
                    <Check size={13} /> Registrar visita
                  </button>
                  <button
                    onClick={() => onAddWishlist(s)}
                    disabled={s.status === 'visited'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold gc-focus gc-tap"
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${s.status === 'visited' ? C.border : C.gold}`,
                      color: s.status === 'visited' ? C.border : C.gold,
                    }}
                  >
                    <Star size={13} /> {s.status === 'wishlist' ? 'Quitar de la lista' : 'Visitaré próximamente'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
