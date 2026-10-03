import Navbar from './Navbar';
import MapScreen from './MapScreen';

export default function MapSection({
  filteredStadiums, query, onQueryChange, filter, onFilterChange, onOpenProfile, onOpenStadium,
  searchResults, onSelectSearchResult, flyTarget, onGoHome, onOpenAdmin, onOpenAbout, onAuthSuccess, authModal, onAuthModalChange,
}) {
  return (
    <div className="relative flex-1 overflow-hidden">
      <MapScreen stadiums={filteredStadiums} onOpenStadium={onOpenStadium} flyTarget={flyTarget} />

      <Navbar
        query={query}
        onQueryChange={onQueryChange}
        filter={filter}
        onFilterChange={onFilterChange}
        onOpenProfile={onOpenProfile}
        searchResults={searchResults}
        onSelectSearchResult={onSelectSearchResult}
        onGoHome={onGoHome}
        onOpenAdmin={onOpenAdmin}
        onOpenAbout={onOpenAbout}
        onAuthSuccess={onAuthSuccess}
        authModal={authModal}
        onAuthModalChange={onAuthModalChange}
      />
    </div>
  );
}
