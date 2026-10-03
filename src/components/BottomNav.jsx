import { Home, Plus, User } from 'lucide-react';
import { C, rgba } from '../theme';

function NavItem({ active, onClick, Icon, label }) {
  return (
    <button onClick={onClick} className="relative flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl gc-focus gc-tap">
      <Icon size={20} color={active ? C.brandBright : C.muted} strokeWidth={active ? 2.3 : 2} />
      <span className="text-[11px] font-medium" style={{ color: active ? C.brandBright : C.muted }}>{label}</span>
      <span
        className="absolute -bottom-0.5 left-1/2 rounded-full"
        style={{
          width: 16,
          height: 3,
          backgroundColor: C.brandBright,
          transform: `translateX(-50%) scaleX(${active ? 1 : 0})`,
          transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </button>
  );
}

export default function BottomNav({ view, onNavigateMap, onNavigateProfile, onQuickAddVisit }) {
  return (
    <div className="relative z-[1000] shrink-0 px-4 pt-2.5 pb-3" style={{ backgroundColor: rgba(C.surface, 0.94), backdropFilter: 'blur(12px)', borderTop: `1px solid ${C.border}` }}>
      <div className="max-w-md mx-auto flex items-center justify-between">
        <NavItem active={view === 'map'} onClick={onNavigateMap} Icon={Home} label="Mapa" />

        <button
          onClick={onQuickAddVisit}
          aria-label="Registrar visita"
          className="rounded-full flex items-center justify-center gc-focus gc-tap shrink-0"
          style={{ width: 64, height: 64, marginTop: -40, backgroundColor: C.brand, border: `4px solid ${C.bg}`, boxShadow: `0 8px 22px ${rgba(C.brand, 0.6)}` }}
        >
          <Plus size={28} color={C.bright} strokeWidth={2.5} />
        </button>

        <NavItem active={view === 'profile'} onClick={onNavigateProfile} Icon={User} label="Perfil" />
      </div>
    </div>
  );
}
