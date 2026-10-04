import { useState, useEffect } from 'react';
import { Ticket, UtensilsCrossed, Car, Bus } from 'lucide-react';
import { C, BODY_FONT } from './theme';
import { useAuth } from './context/AuthContext';
import stadiumService from './services/stadiumService';
import visitService from './services/visitService';
import userService from './services/userService';
import MapSection from './components/MapSection';
import ProfileView from './components/ProfileView';
import AboutView from './components/AboutView';
import StadiumView from './components/StadiumView';
import VisitView from './components/VisitView';
import StadiumModal from './components/StadiumModal';
import VisitFormModal from './components/VisitFormModal';
import StadiumPickerModal from './components/StadiumPickerModal';
import Toast from './components/Toast';
import BottomNav from './components/BottomNav';
import AdminView from './components/admin/AdminView';

const expenseFields = [
  { key: 'entradas', label: 'Entradas', Icon: Ticket },
  { key: 'comida', label: 'Comida', Icon: UtensilsCrossed },
  { key: 'estacionamiento', label: 'Estacionamiento', Icon: Car },
  { key: 'transporte', label: 'Transporte / otros', Icon: Bus },
];

export default function App() {
  const { token, user } = useAuth();
  const [view, setView] = useState('map'); // 'map' | 'profile' | 'stadium' | 'visit'
  const [cameFrom, setCameFrom] = useState('map');
  const [activeVisit, setActiveVisit] = useState(null);
  const [profileTarget, setProfileTarget] = useState(null); // id de otro usuario a mostrar en el perfil; null = el propio // { visit, stadium, from: 'profile' | 'stadium' }
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [stadiums, setStadiums] = useState([]);
  const [stadiumsLoading, setStadiumsLoading] = useState(true);
  const [stadiumsError, setStadiumsError] = useState(null);
  const [stadiumsVersion, setStadiumsVersion] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [visitsVersion, setVisitsVersion] = useState(0);
  const [activeStadium, setActiveStadium] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);
  const [sheet, setSheet] = useState(null); // 'stadium' | 'visit' | null
  const [toast, setToast] = useState('');
  const [flyTarget, setFlyTarget] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register'

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function loadStadiums({ silent } = {}) {
    if (!silent) {
      setStadiumsLoading(true);
      setStadiumsError(null);
    }
    return stadiumService.getAll()
      .then((data) => {
        setStadiums(data);
        setStadiumsVersion((v) => v + 1);
      })
      .catch((err) => { if (!silent) setStadiumsError(err); })
      .finally(() => { if (!silent) setStadiumsLoading(false); });
  }

  // Lleva de vuelta al mapa y refresca la lista de estadios (el admin puede haber
  // creado/editado/borrado estadios o clubes desde el panel en otra pestaña del flujo).
  function goToMap() {
    setView('map');
    loadStadiums({ silent: true });
  }

  useEffect(() => {
    loadStadiums();
  }, []);

  // Sincroniza el status local ('visited'/'wishlist') con los datos reales
  // del backend (visitas y wantToVisit del usuario), una vez que estadios y sesión están listos.
  useEffect(() => {
    if (!token || !user?._id || stadiums.length === 0) return;
    let cancelled = false;

    Promise.all([userService.getProfile(), visitService.getUserVisits(user._id)])
      .then(([profile, visits]) => {
        if (cancelled) return;
        const wishlistIds = new Set((profile.wantToVisit || []).map((s) => s._id || s));
        const visitedIds = new Set(visits.map((v) => v.stadium?._id).filter(Boolean));
        setStadiums((prev) => prev.map((s) => {
          if (visitedIds.has(s.id)) return { ...s, status: 'visited' };
          if (wishlistIds.has(s.id)) return { ...s, status: 'wishlist' };
          return s;
        }));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [token, user?._id, stadiumsVersion]);

  // Trae las reseñas reales del usuario (para el bloque "Vos" en StadiumView);
  // se re-corre cada vez que se crea/edita una visita (visitsVersion).
  useEffect(() => {
    if (!token || !user?._id) {
      setReviews([]);
      return;
    }
    let cancelled = false;
    visitService.getUserVisits(user._id)
      .then((visits) => {
        if (cancelled) return;
        setReviews(visits.map((v) => ({
          id: v._id,
          stadium: v.stadium?.name || '',
          rating: v.rating,
          excerpt: v.reviewText?.trim() || 'Sin reseña escrita todavía.',
          date: new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(v.visitDate)),
        })));
      })
      .catch(() => { if (!cancelled) setReviews([]); });
    return () => { cancelled = true; };
  }, [token, user?._id, visitsVersion]);

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

  function selectFilterFromElsewhere(f) {
    setFilter(f);
    goToMap();
  }

  function openStadium(s) {
    setActiveStadium(s);
    setSheet('stadium');
  }

  function selectSearchResult(s) {
    setQuery('');
    setFlyTarget({ id: s.id, lat: s.location.coordinates.lat, lng: s.location.coordinates.lng });
    openStadium(s);
  }

  // Limpia el usuario elegido al salir del perfil, para que el perfil propio vuelva a abrirse por defecto
  useEffect(() => {
    if (view !== 'profile') setProfileTarget(null);
  }, [view]);

  function openUserProfile(userId) {
    setProfileTarget(userId === user?._id ? null : userId);
    setView('profile');
  }

  function openStadiumPage(s, from) {
    setActiveStadium(s);
    setCameFrom(from);
    setSheet(null);
    setView('stadium');
  }

  function openStadiumFromId(id) {
    const match = stadiums.find((s) => s.id === id);
    if (!match) return;
    openStadiumPage(match, 'profile');
  }

  // Abre la página de una reseña. Desde el perfil el estadio viene poblado en la visita;
  // desde la página del estadio viene solo el id, así que usamos el estadio activo.
  function openVisit(visit, from, stadium = null) {
    const stadiumId = visit.stadium?._id || visit.stadium || stadium?.id;
    const match = stadiums.find((s) => s.id === stadiumId) || stadium || null;
    setActiveVisit({ visit, stadium: match, from });
    setView('visit');
  }

  function startVisit(s) {
    setActiveStadium(s);
    setEditingVisit(null);
    setSheet('visit');
  }

  function startEditVisit(visit) {
    setEditingVisit(visit);
    setActiveStadium(null);
    setSheet('visit');
  }

  // Editar desde la página de la reseña: no tocamos el estadio activo, así la página del estadio sigue disponible al volver
  function editVisitFromPage(visit) {
    setEditingVisit({ ...visit, stadium: activeVisit?.stadium ?? visit.stadium });
    setSheet('visit');
  }

  function closeSheet() {
    setSheet(null);
    setEditingVisit(null);
  }

  function applyWishlistStatus(id, status) {
    setStadiums((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    setActiveStadium((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  }

  async function toggleWishlist(id) {
    if (!token) {
      setAuthModal('login');
      return;
    }

    const target = stadiums.find((s) => s.id === id);
    if (!target || target.status === 'visited') return;

    const nextStatus = target.status === 'wishlist' ? 'none' : 'wishlist';
    applyWishlistStatus(id, nextStatus);

    try {
      await userService.toggleWantToVisit(id);
      setToast('Actualizamos tu lista de "Por visitar"');
    } catch {
      applyWishlistStatus(id, target.status);
      setToast('No pudimos actualizar tu lista. Probá de nuevo.');
    }
  }

  function handleVisitSaved(saved) {
    if (!editingVisit && activeStadium) {
      setStadiums((prev) => prev.map((s) => (s.id === activeStadium.id
        ? { ...s, status: 'visited', visits: (s.visits || 0) + 1 }
        : s)));
    }
    // Si la reseña editada es la que está abierta, refrescamos su página (conservando el estadio poblado)
    if (editingVisit && saved && activeVisit?.visit._id === editingVisit._id) {
      setActiveVisit((prev) => ({ ...prev, visit: { ...prev.visit, ...saved, stadium: prev.visit.stadium, user: prev.visit.user } }));
    }
    setToast(editingVisit ? '¡Visita actualizada!' : '¡Visita guardada!');
    setVisitsVersion((v) => v + 1);

    // Reseña nueva: abrimos su página por debajo; el formulario queda encima mostrando la confirmación
    // y se cierra con "Listo" (closeSheet). Al volver, regresa a la vista de origen.
    if (!editingVisit && saved) {
      const from = view === 'stadium' || view === 'profile' ? view : 'map';
      openVisit(saved, from, activeStadium);
    }
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
          onOpenUserProfile={openUserProfile}
          onOpenStadium={openStadium}
          searchResults={searchResults}
          onSelectSearchResult={selectSearchResult}
          flyTarget={flyTarget}
          onGoHome={goToMap}
          onOpenAdmin={() => setView('admin')}
          onOpenAbout={() => setView('about')}
          onAuthSuccess={setToast}
          authModal={authModal}
          onAuthModalChange={setAuthModal}
        />
      )}

      {view === 'about' && (
        <AboutView
          onBackToMap={goToMap}
          navbarProps={{
            query,
            onQueryChange: setQuery,
            filter,
            onFilterChange: selectFilterFromElsewhere,
            onOpenProfile: () => setView('profile'),
            onOpenUserProfile: openUserProfile,
            searchResults,
            onSelectSearchResult: selectSearchResult,
            onGoHome: goToMap,
            onOpenAdmin: () => setView('admin'),
            onOpenAbout: () => setView('about'),
            onAuthSuccess: setToast,
            authModal,
            onAuthModalChange: setAuthModal,
          }}
        />
      )}

      {view === 'profile' && (
        <ProfileView
          stadiums={stadiums}
          onBackToMap={goToMap}
          onOpenStadiumFromId={openStadiumFromId}
          onEditVisit={startEditVisit}
          onOpenVisit={(visit) => openVisit(visit, 'profile')}
          initialViewUserId={profileTarget}
          onToast={setToast}
          onOpenAbout={() => setView('about')}
          visitsVersion={visitsVersion}
          onRequireLogin={() => {
            goToMap();
            setAuthModal('login');
          }}
          navbarProps={{
            query,
            onQueryChange: setQuery,
            filter,
            onFilterChange: selectFilterFromElsewhere,
            onOpenProfile: () => setView('profile'),
            onOpenUserProfile: openUserProfile,
            searchResults,
            onSelectSearchResult: selectSearchResult,
            onGoHome: goToMap,
            onOpenAdmin: () => setView('admin'),
            onOpenAbout: () => setView('about'),
            onAuthSuccess: setToast,
            authModal,
            onAuthModalChange: setAuthModal,
          }}
        />
      )}

      {view === 'visit' && activeVisit && (
        <VisitView
          visit={activeVisit.visit}
          stadium={activeVisit.stadium}
          onBack={() => setView(activeVisit.from)}
          onOpenAuthor={(userId) => openUserProfile(userId)}
          onEditVisit={editVisitFromPage}
          onOpenStadium={activeVisit.stadium && activeVisit.from === 'profile' ? () => openStadiumPage(activeVisit.stadium, 'profile') : null}
          navbarProps={{
            query,
            onQueryChange: setQuery,
            filter,
            onFilterChange: selectFilterFromElsewhere,
            onOpenProfile: () => setView('profile'),
            onOpenUserProfile: openUserProfile,
            searchResults,
            onSelectSearchResult: selectSearchResult,
            onGoHome: goToMap,
            onOpenAdmin: () => setView('admin'),
            onOpenAbout: () => setView('about'),
            onAuthSuccess: setToast,
            authModal,
            onAuthModalChange: setAuthModal,
          }}
        />
      )}

      {view === 'admin' && user?.rol === 'admin' && (
        <AdminView
          onBackToMap={goToMap}
          onToast={setToast}
          navbarProps={{
            query,
            onQueryChange: setQuery,
            filter,
            onFilterChange: selectFilterFromElsewhere,
            onOpenProfile: () => setView('profile'),
            onOpenUserProfile: openUserProfile,
            searchResults,
            onSelectSearchResult: selectSearchResult,
            onGoHome: goToMap,
            onOpenAdmin: () => setView('admin'),
            onOpenAbout: () => setView('about'),
            onAuthSuccess: setToast,
            authModal,
            onAuthModalChange: setAuthModal,
          }}
        />
      )}

      {view === 'stadium' && activeStadium && (
        <StadiumView
          stadium={activeStadium}
          reviews={reviews}
          expenseFields={expenseFields}
          cameFrom={cameFrom}
          onBack={(target) => (target === 'map' ? goToMap() : setView(target))}
          onStartVisit={startVisit}
          onToggleWishlist={toggleWishlist}
          onOpenVisit={(visit, s) => openVisit(visit, 'stadium', s)}
          navbarProps={{
            query,
            onQueryChange: setQuery,
            filter,
            onFilterChange: selectFilterFromElsewhere,
            onOpenProfile: () => setView('profile'),
            onOpenUserProfile: openUserProfile,
            searchResults,
            onSelectSearchResult: selectSearchResult,
            onGoHome: goToMap,
            onOpenAdmin: () => setView('admin'),
            onOpenAbout: () => setView('about'),
            onAuthSuccess: setToast,
            authModal,
            onAuthModalChange: setAuthModal,
          }}
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

      {sheet === 'visit' && (activeStadium || editingVisit) && (
        <VisitFormModal
          stadium={activeStadium}
          editingVisit={editingVisit}
          expenseFields={expenseFields}
          onClose={closeSheet}
          onSaved={handleVisitSaved}
        />
      )}

      {pickerOpen && (
        <StadiumPickerModal
          stadiums={stadiums}
          onClose={() => setPickerOpen(false)}
          onSelect={(s) => {
            setPickerOpen(false);
            startVisit(s);
          }}
          onAddWishlist={(s) => {
            setPickerOpen(false);
            toggleWishlist(s.id);
          }}
        />
      )}

      <Toast message={toast} />

      <BottomNav
        view={view}
        onNavigateMap={goToMap}
        onNavigateProfile={() => setView('profile')}
        onQuickAddVisit={() => setPickerOpen(true)}
      />
    </div>
  );
}
