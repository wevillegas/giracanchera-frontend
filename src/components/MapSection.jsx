import { C } from '../theme';
import Navbar from './Navbar';
import MapScreen from './MapScreen';

export default function MapSection({
  filteredStadiums, query, onQueryChange, filter, onFilterChange, onOpenProfile, onOpenStadium,
  searchResults, onSelectSearchResult, flyTarget, onOpenAbout, onAuthSuccess, authModal, onAuthModalChange,
}) {
  return (
    <div className="relative flex-1 overflow-hidden">
      <MapScreen stadiums={filteredStadiums} onOpenStadium={onOpenStadium} flyTarget={flyTarget} />

      {filteredStadiums.length === 0 && (
        <div
          className="absolute top-32 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-full text-sm"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
        >
          No encontramos estadios para "{query}" con este filtro.
        </div>
      )}

      <Navbar
        query={query}
        onQueryChange={onQueryChange}
        filter={filter}
        onFilterChange={onFilterChange}
        onOpenProfile={onOpenProfile}
        searchResults={searchResults}
        onSelectSearchResult={onSelectSearchResult}
        onOpenAbout={onOpenAbout}
        onAuthSuccess={onAuthSuccess}
        authModal={authModal}
        onAuthModalChange={onAuthModalChange}
      />
    </div>
  );
}
