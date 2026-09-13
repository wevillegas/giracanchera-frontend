import { useState, useEffect } from 'react';
import { Ticket, UtensilsCrossed, Car, Bus } from 'lucide-react';
import { C, BODY_FONT } from './theme';
import { INITIAL_REVIEWS } from './data/stadiums';
import stadiumService from './services/stadiumService';
import MapSection from './components/MapSection';
import ProfileView from './components/ProfileView';
import StadiumView from './components/StadiumView';
import StadiumModal from './components/StadiumModal';
import VisitFormModal from './components/VisitFormModal';
import Toast from './components/Toast';
import BottomNav from './components/BottomNav';

const expenseFields = [
  { key: 'entradas', label: 'Entradas', Icon: Ticket },
  { key: 'comida', label: 'Comida', Icon: UtensilsCrossed },
  { key: 'estacionamiento', label: 'Estacionamiento', Icon: Car },
  { key: 'transporte', label: 'Transporte / otros', Icon: Bus },
];

const emptyVisit = { date: '', times: 1, score: 8, review: '', entradas: '', comida: '', estacionamiento: '', transporte: '' };

export default function App() {
  const [view, setView] = useState('map'); // 'map' | 'profile' | 'stadium'
  const [cameFrom, setCameFrom] = useState('map');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [stadiums, setStadiums] = useState([]);
  const [stadiumsLoading, setStadiumsLoading] = useState(true);
  const [stadiumsError, setStadiumsError] = useState(null);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [activeStadium, setActiveStadium] = useState(null);
  const [sheet, setSheet] = useState(null); // 'stadium' | 'visit' | null
  const [profileMode, setProfileMode] = useState('own');
  const [toast, setToast] = useState('');
  const [saved, setSaved] = useState(false);
  const [visit, setVisit] = useState(emptyVisit);
  const [flyTarget, setFlyTarget] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    stadiumService.getAll()
      .then((data) => { if (!cancelled) setStadiums(data); })
      .catch((err) => { if (!cancelled) setStadiumsError(err); })
      .finally(() => { if (!cancelled) setStadiumsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filteredStadiums = stadiums.filter((s) => {
    const matchesFilter = filter === 'all' ? true : s.status === filter;
    const q = query.toLowerCase();
    const matchesQuery = s.name.toLowerCase().includes(q) || s.club.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  const searchResults = query.trim()
    ? stadiums.filter((s) => {
        const q = query.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.club.toLowerCase().includes(q);
      })
    : [];

  const visitedCount = stadiums.filter((s) => s.status === 'visited').length;
  const totalGasto = ['entradas', 'comida', 'estacionamiento', 'transporte']
    .reduce((sum, k) => sum + (Number(visit[k]) || 0), 0);

  function openStadium(s) {
    setActiveStadium(s);
    setSheet('stadium');
  }

  function selectSearchResult(s) {
    setQuery('');
    setFlyTarget({ id: s.id, lat: s.location.coordinates.lat, lng: s.location.coordinates.lng });
    openStadium(s);
  }

  function openStadiumPage(s, from) {
    setActiveStadium(s);
    setCameFrom(from);
    setSheet(null);
    setView('stadium');
  }

  function openStadiumFromName(name) {
    const match = stadiums.find((s) => s.name === name);
    if (!match) return;
    openStadiumPage(match, 'profile');
  }

  function startVisit(s) {
    setActiveStadium(s);
    setSheet('visit');
    setSaved(false);
  }

  function closeSheet() {
    setSheet(null);
    setSaved(false);
    setVisit(emptyVisit);
  }

  function toggleWishlist(id) {
    setStadiums((prev) => prev.map((s) => {
      if (s.id !== id || s.status === 'visited') return s;
      return { ...s, status: s.status === 'wishlist' ? 'none' : 'wishlist' };
    }));
    setActiveStadium((prev) => (prev && prev.id === id
      ? { ...prev, status: prev.status === 'wishlist' ? 'none' : 'wishlist' }
      : prev));
    setToast('Actualizamos tu lista de "Por visitar"');
  }

  function saveVisit() {
    setStadiums((prev) => prev.map((s) => (s.id === activeStadium.id
      ? { ...s, status: 'visited', visits: (s.visits || 0) + 1 }
      : s)));

    let dateLabel = 'Hoy';
    if (visit.date) {
      const d = new Date(`${visit.date}T00:00:00`);
      dateLabel = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    }
    setReviews((prev) => [
      { id: Date.now(), stadium: activeStadium.name, rating: visit.score, excerpt: visit.review || 'Sin reseña escrita todavía.', date: dateLabel },
      ...prev,
    ]);
    setSaved(true);
  }

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col" style={{ backgroundColor: C.bg, fontFamily: BODY_FONT, color: C.bright }}>
      {view === 'map' && stadiumsLoading && (
        <div className="flex-1 flex items-center justify-center" style={{ color: C.muted }}>
          Cargando estadios...
        </div>
      )}

      {view === 'map' && !stadiumsLoading && stadiumsError && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ color: C.muted }}>
          <p>No pudimos conectar con la API de GiraCanchera.</p>
          <button
            onClick={() => {
              setStadiumsLoading(true);
              setStadiumsError(null);
              stadiumService.getAll()
                .then(setStadiums)
                .catch(setStadiumsError)
                .finally(() => setStadiumsLoading(false));
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold gc-focus"
            style={{ backgroundColor: C.brand, color: C.bright }}
          >
            Reintentar
          </button>
        </div>
      )}

      {view === 'map' && !stadiumsLoading && !stadiumsError && (
        <MapSection
          filteredStadiums={filteredStadiums}
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          onOpenProfile={() => setView('profile')}
          onOpenStadium={openStadium}
          searchResults={searchResults}
          onSelectSearchResult={selectSearchResult}
          flyTarget={flyTarget}
        />
      )}

      {view === 'profile' && (
        <ProfileView
          visitedCount={visitedCount}
          reviews={reviews}
          stadiums={stadiums}
          profileMode={profileMode}
          onToggleProfileMode={() => setProfileMode((m) => (m === 'own' ? 'friend' : 'own'))}
          onBackToMap={() => setView('map')}
          onOpenStadiumFromName={openStadiumFromName}
        />
      )}

      {view === 'stadium' && activeStadium && (
        <StadiumView
          stadium={activeStadium}
          reviews={reviews}
          expenseFields={expenseFields}
          cameFrom={cameFrom}
          onBack={setView}
          onStartVisit={startVisit}
          onToggleWishlist={toggleWishlist}
        />
      )}

      {sheet === 'stadium' && activeStadium && (
        <StadiumModal
          stadium={activeStadium}
          onClose={closeSheet}
          onOpenStadiumPage={openStadiumPage}
          onStartVisit={startVisit}
          onToggleWishlist={toggleWishlist}
        />
      )}

      {sheet === 'visit' && activeStadium && (
        <VisitFormModal
          stadium={activeStadium}
          visit={visit}
          setVisit={setVisit}
          saved={saved}
          totalGasto={totalGasto}
          expenseFields={expenseFields}
          onClose={closeSheet}
          onSave={saveVisit}
        />
      )}

      <Toast message={toast} />

      <BottomNav
        view={view}
        onNavigateMap={() => setView('map')}
        onNavigateProfile={() => setView('profile')}
        onQuickAddVisit={() => {
          if (activeStadium) {
            startVisit(activeStadium);
          } else {
            setView('map');
            setToast('Tocá un estadio en el mapa para registrar tu visita');
          }
        }}
      />
    </div>
  );
}
