import { Home, Plus, User } from 'lucide-react';
import { C, rgba } from '../theme';

export default function BottomNav({ view, onNavigateMap, onNavigateProfile, onQuickAddVisit }) {
  return (
    <div className="shrink-0 px-4 py-3" style={{ backgroundColor: rgba(C.surface, 0.92), backdropFilter: 'blur(10px)', borderTop: `1px solid ${C.border}` }}>
      <div className="max-w-md mx-auto flex items-center justify-between">
        <button onClick={onNavigateMap} className="flex flex-col items-center gap-1 px-4 py-1 gc-focus">
          <Home size={20} color={view === 'map' ? C.brandBright : C.muted} />
          <span className="text-xs" style={{ color: view === 'map' ? C.brandBright : C.muted }}>Mapa</span>
        </button>
        <button
          onClick={onQuickAddVisit}
          className="w-12 h-12 -mt-6 rounded-full flex items-center justify-center gc-focus"
          style={{ backgroundColor: C.brand, boxShadow: `0 4px 16px ${rgba(C.brand, 0.5)}` }}
        >
          <Plus size={22} color={C.bright} />
        </button>
        <button onClick={onNavigateProfile} className="flex flex-col items-center gap-1 px-4 py-1 gc-focus">
          <User size={20} color={view === 'profile' ? C.brandBright : C.muted} />
          <span className="text-xs" style={{ color: view === 'profile' ? C.brandBright : C.muted }}>Perfil</span>
        </button>
      </div>
    </div>
  );
}
