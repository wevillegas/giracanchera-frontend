import { Search, MapPin } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';

const FILTERS = [
  { key: 'visited', label: 'Mis visitas' },
  { key: 'wishlist', label: 'Visitaré próximamente' },
  { key: 'all', label: 'Todos los estadios' },
];

export default function Navbar({ query, onQueryChange, filter, onFilterChange, onOpenProfile }) {
  return (
    <div
      className="absolute top-0 left-0 right-0 px-4 pt-4 pb-3"
      style={{ backgroundColor: rgba(C.bg, 0.55), backdropFilter: 'blur(12px)', borderBottom: `1px solid ${rgba(C.border, 0.6)}` }}
    >
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.brand }}>
            <MapPin size={18} color={C.bright} />
          </div>
          <span className="text-xl tracking-wide" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>GiraCanchera</span>
        </div>
        <div className="flex-1 flex items-center gap-2 rounded-full px-3 py-2" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <Search size={16} color={C.muted} />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar estadios o clubes..."
            className="bg-transparent outline-none text-sm flex-1 gc-focus"
            style={{ color: C.bright }}
          />
        </div>
        <button onClick={onOpenProfile} className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm gc-focus" style={{ backgroundColor: C.brand, color: C.bright }}>
          NC
        </button>
      </div>

      <div className="max-w-2xl mx-auto flex items-center gap-2 mt-3 overflow-x-auto gc-hide-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors gc-focus"
            style={{
              backgroundColor: filter === f.key ? C.brandBright : rgba(C.surface, 0.9),
              color: filter === f.key ? C.bg : C.muted,
              border: `1px solid ${filter === f.key ? C.brandBright : C.border}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
