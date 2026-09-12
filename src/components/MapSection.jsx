import { C, rgba } from '../theme';
import Navbar from './Navbar';
import Pin from './Pin';

export default function MapSection({
  filteredStadiums, query, onQueryChange, filter, onFilterChange, onOpenProfile, onOpenStadium,
}) {
  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: C.bg,
          backgroundImage: `radial-gradient(circle at 20% 28%, ${rgba(C.brand, 0.28)} 0, transparent 42%), radial-gradient(circle at 82% 68%, ${rgba(C.brand, 0.2)} 0, transparent 45%), linear-gradient(${rgba(C.border, 0.5)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(C.border, 0.5)} 1px, transparent 1px)`,
          backgroundSize: 'auto, auto, 34px 34px, 34px 34px',
        }}
      >
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 0.07 }}>
          <line x1="50" y1="0" x2="50" y2="100" stroke={C.bright} strokeWidth="0.3" />
          <circle cx="50" cy="50" r="12" fill="none" stroke={C.bright} strokeWidth="0.3" />
        </svg>
        {filteredStadiums.map((s) => (
          <Pin key={s.id} stadium={s} onClick={onOpenStadium} />
        ))}
        {filteredStadiums.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm" style={{ color: C.muted }}>
            No encontramos estadios para "{query}" con este filtro.
          </div>
        )}
      </div>

      <Navbar
        query={query}
        onQueryChange={onQueryChange}
        filter={filter}
        onFilterChange={onFilterChange}
        onOpenProfile={onOpenProfile}
      />
    </div>
  );
}
