import ConfirmModal from './ConfirmModal';
import { useEffect, useState } from 'react';
import { ChevronLeft, MapPin, Edit3, Users, UserPlus, Star, AlertCircle, Cake, CalendarDays, Landmark, Pencil, Trash2, Search, Check, X } from 'lucide-react';
import { C, rgba, DISPLAY_FONT, formatMoney } from '../theme';
import { isAdminRole } from '../utils/roles';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import visitService from '../services/visitService';
import StadiumArt from './StadiumArt';
import EditProfileModal from './EditProfileModal';
import PhotoLightbox from './PhotoLightbox';
import Navbar from './Navbar';
import AdminPagination, { paginate, clampPage } from './admin/AdminPagination';
import { useLogoColors } from '../utils/logoColors';

// Reseñas y estadios (visitados y por visitar) de a 6
const REVIEWS_PAGE_SIZE = 6;
const LIST_PAGE_SIZE = 8; // Me gusta, Guardadas, Seguidores y Seguidos
const STADIUMS_PAGE_SIZE = 6;
const PHOTOS_PAGE_SIZE = 8; // grilla de 2 por 4, igual que las reseñas
// En las pestañas Visitados y Por visitar se muestran de a 9
const STADIUMS_TAB_PAGE_SIZE = 9;

const TABS = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'resenas', label: 'Reseñas' },
  { key: 'fotos', label: 'Fotos' },
  { key: 'visitados', label: 'Visitados' },
  { key: 'porvisitar', label: 'Por visitar' },
  { key: 'seguidores', label: 'Seguidores' },
  { key: 'seguidos', label: 'Seguidos' },
];

// Las reseñas guardadas y las que tienen me gusta son privadas: solo las ve su dueño
const OWN_ONLY_TABS = [
  { key: 'estadisticas', label: 'Mis estadísticas' },
  { key: 'megusta', label: 'Me gusta' },
  { key: 'guardadas', label: 'Guardadas' },
];

const SPEND_LABELS = { ticket: 'Entradas', food: 'Comida', parking: 'Estacionamiento', transport: 'Transporte' };

// Tarjeta de un número en la vista de estadísticas personales
function StatTile({ label, value, className = '' }) {
  return (
    <div className={`relative overflow-hidden flex flex-col items-center justify-center text-center px-2 py-4 rounded-3xl min-h-[96px] ${className}`} style={{ ...cardStyle, backgroundImage: `radial-gradient(circle at 50% 0%, ${rgba(C.brandBright, 0.16)}, transparent 70%)` }}>
      <span className="text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{value}</span>
      <span className="text-[10px] uppercase tracking-widest mt-2 leading-tight" style={{ color: C.muted }}>{label}</span>
    </div>
  );
}

// Card compacta de una reseña en listas privadas (guardadas, me gusta)
function VisitMiniCard({ visit, onOpen }) {
  return (
    <button
      onClick={() => onOpen(visit)}
      className="flex flex-col w-full h-full text-left p-4 rounded-3xl gc-focus gc-card"
      style={{ ...cardStyle, backgroundImage: `radial-gradient(circle at 100% 0%, ${rgba(C.gold, 0.1)}, transparent 55%)` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          {visit.stadium?.mainClub?.logoUrl && (
            <img src={visit.stadium.mainClub.logoUrl} alt={visit.stadium.mainClub.name} className="w-8 h-8 object-contain shrink-0" />
          )}
          <span className="text-lg leading-none truncate" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>{visit.stadium?.name || 'Estadio'}</span>
        </span>
        <span className="flex items-center gap-1 shrink-0 px-2 py-1 rounded-full" style={{ backgroundColor: rgba(C.gold, 0.14) }}>
          <Star size={12} fill={C.gold} color={C.gold} />
          <span className="text-xs font-medium" style={{ color: C.gold }}>{visit.rating}/10</span>
        </span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {visit.user?.avatarUrl ? (
          <img src={visit.user.avatarUrl} alt={visit.user.username} className="w-6 h-6 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0" style={{ backgroundColor: C.brand, color: C.bright }}>
            {initialsOf(visit.user?.username || '?')}
          </div>
        )}
        <p className="text-xs truncate" style={{ color: C.muted }}>
          @{visit.user?.username || '...'} · {formatVisitDate(visit.visitDate)}
        </p>
      </div>
      <p className="text-xs mt-auto pt-2 min-h-[3rem] leading-snug" style={{ color: C.muted, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {visit.reviewText?.trim() || 'Sin reseña escrita.'}
      </p>
    </button>
  );
}

// Card de un usuario en seguidores y seguidos: foto con escudo, nombre y biografía
function UserCard({ user, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="flex flex-col w-full h-full text-left p-4 rounded-3xl gc-focus gc-card"
      style={{ ...cardStyle, backgroundImage: `radial-gradient(circle at 100% 0%, ${rgba(C.brandBright, 0.14)}, transparent 55%)` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="w-14 h-14 rounded-full object-cover" style={{ border: `2px solid ${C.brandBright}` }} />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-base" style={{ backgroundColor: C.brand, color: C.bright }}>
              {initialsOf(user.username || '?')}
            </div>
          )}
          {user.clubHincha?.logoUrl && (
            <img
              src={user.clubHincha.logoUrl}
              alt={user.clubHincha.name}
              title={user.clubHincha.name}
              className="absolute -right-2 -bottom-2 w-8 h-8 p-1 rounded-full object-contain"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
            />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg leading-none truncate" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>@{user.username || '...'}</span>
            {user.followsViewer && (
              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: C.brand, color: C.bright }}>
                Te sigue
              </span>
            )}
          </div>
          {user.clubHincha?.name && (
            <p className="text-xs truncate mt-0.5" style={{ color: C.muted }}>{user.clubHincha.name}</p>
          )}
        </div>
      </div>
      {/* Altura exacta de dos líneas: así el corte nunca deja media línea pintada */}
      <p className="text-xs mt-3" style={{ color: C.muted, lineHeight: '1.4em', height: '2.8em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {user.bio?.trim() || 'Sin biografía.'}
      </p>
    </button>
  );
}

const cardStyle = { backgroundColor: C.surface, border: `1px solid ${C.border}` };

function AsideTitle({ children }) {
  return <h2 className="text-2xl sm:text-3xl leading-none pb-3 mb-3 box-content h-[2.25rem] flex items-end" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em', borderBottom: `1px solid ${C.border}` }}>{children}</h2>;
}

function initialsOf(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

function formatLongDate(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function formatVisitDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function SectionTitle({ children, count }) {
  return (
    <div className="flex items-baseline gap-3 pb-3 mb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
      <h2 className="text-2xl sm:text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>{children}</h2>
      {count !== undefined && (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: rgba(C.brandBright, 0.14), color: C.brandBright }}>{count}</span>
      )}
    </div>
  );
}

// Card de estadio: escudo del club arriba, nombre y provincia abajo
function StadiumCard({ stadium, onClick }) {
  const { name, province, city, country, clubLocation, clubLogoUrl, club, mainClubId } = stadium;
  // Lugar del club si lo tiene; si no, provincia (o ciudad) y país
  const place = clubLocation || [province || city, country].filter(Boolean).join(', ');
  const colors = useLogoColors(clubLogoUrl);
  // Degradado con los colores del escudo; una capa oscura encima mantiene legible el texto
  const background = colors
    ? { backgroundImage: `linear-gradient(${rgba(C.bg, 0.35)}, ${rgba(C.bg, 0.35)}), linear-gradient(135deg, ${rgba(colors[0], 0.8)}, ${rgba(colors[1], 0.8)})` }
    : {};
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center text-center gap-2 px-3 py-5 rounded-3xl gc-focus gc-card"
      style={{ ...cardStyle, ...background }}
    >
      {clubLogoUrl ? (
        <img src={clubLogoUrl} alt={club} className="w-20 h-20 object-contain drop-shadow-lg" />
      ) : mainClubId ? (
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: C.border, color: C.bright, fontFamily: DISPLAY_FONT }}>
          {initialsOf(club)}
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: C.border, color: C.muted }}>
          <Landmark size={26} />
        </div>
      )}
      <div className="w-full min-w-0">
        <p className="text-lg leading-tight truncate" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>{name}</p>
        {place && <p className="text-xs truncate" style={{ color: C.muted }}>{place}</p>}
      </div>
    </button>
  );
}

export default function ProfileView({
  stadiums, onBackToMap, onOpenStadiumFromId, onEditVisit, onOpenVisit, onToast,
  visitsVersion, onRequireLogin, navbarProps, initialViewUserId, openCount,
}) {
  const { user, loading: authLoading, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(true);

  const [viewUserId, setViewUserId] = useState(initialViewUserId ?? null);

  // Elegir otro usuario en el buscador estando ya en un perfil: el estado inicial no se vuelve a leer,
  // así que se sincroniza acá (sin recrear la vista, para que el buscador conserve su modo)
  useEffect(() => {
    setViewUserId(initialViewUserId ?? null);
    setTab('perfil');
  }, [initialViewUserId, openCount]);
  // Al pasar de un perfil a otro (o volver al propio) también se arranca en la pestaña Perfil
  useEffect(() => { setTab('perfil'); }, [viewUserId]);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [viewedVisits, setViewedVisits] = useState([]);
  const [viewedLoading, setViewedLoading] = useState(false);

  const [tab, setTab] = useState('perfil');
  const [photoOpen, setPhotoOpen] = useState(false);
  const [savedVisits, setSavedVisits] = useState([]);
  const [likedVisits, setLikedVisits] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [visitedPage, setVisitedPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [savedPage, setSavedPage] = useState(1);
  const [followersPage, setFollowersPage] = useState(1);
  const [followingPage, setFollowingPage] = useState(1);
  const [wishPage, setWishPage] = useState(1);
  const [photosPage, setPhotosPage] = useState(1);
  // Índice (en la lista completa de fotos) de la foto abierta en el visor; null = cerrado
  const [photoView, setPhotoView] = useState(null);

  useEffect(() => {
    // La sesión es una cookie: sin usuario (y con la sesión ya consultada) se pide iniciar sesión
    if (!user) {
      if (!authLoading) onRequireLogin?.();
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    userService.getProfile()
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, authLoading, visitsVersion]);

  useEffect(() => {
    if (!user?._id) return;

    let cancelled = false;
    setVisitsLoading(true);
    visitService.getUserVisits(user._id)
      .then((data) => { if (!cancelled) setVisits(data); })
      .catch(() => { if (!cancelled) setVisits([]); })
      .finally(() => { if (!cancelled) setVisitsLoading(false); });

    return () => { cancelled = true; };
  }, [user?._id, visitsVersion]);

  useEffect(() => {
    if (!viewUserId) {
      setViewedProfile(null);
      setViewedVisits([]);
      return;
    }

    let cancelled = false;
    setViewedLoading(true);
    Promise.all([
      userService.getPublicProfile(viewUserId),
      visitService.getUserVisits(viewUserId),
    ])
      .then(([profileData, visitsData]) => {
        if (cancelled) return;
        setViewedProfile(profileData);
        setViewedVisits(visitsData);
      })
      .catch(() => { if (!cancelled) onToast?.('No pudimos cargar ese perfil.'); })
      .finally(() => { if (!cancelled) setViewedLoading(false); });

    return () => { cancelled = true; };
  }, [viewUserId, onToast]);

  const [visitToDelete, setVisitToDelete] = useState(null);
  const [unfollowOpen, setUnfollowOpen] = useState(false);

  function toggleFollow() {
    const wasFollowing = (profile?.following || []).some((f) => (f._id || f) === viewUserId);
    setUnfollowOpen(false);
    userService.toggleFollow(viewUserId).then(() => {
      setProfile((p) => ({
        ...p,
        following: wasFollowing
          ? (p.following || []).filter((f) => (f._id || f) !== viewUserId)
          : [...(p.following || []), viewUserId],
      }));
      onToast?.(wasFollowing ? 'Dejaste de seguir' : '¡Ahora lo seguís!');
    }).catch(() => onToast?.('No pudimos procesar la acción.'));
  }

  function handleDeleteVisit(visitId) {
    setVisitToDelete(visitId);
  }

  async function confirmDeleteVisit(visitId) {
    setVisitToDelete(null);
    try {
      await visitService.deleteVisit(visitId);
      setVisits((prev) => prev.filter((v) => v._id !== visitId));
      onToast?.('Visita eliminada');
    } catch {
      onToast?.('No pudimos eliminar la visita. Probá de nuevo.');
    }
  }

  // Listas privadas: se cargan al abrir su pestaña, solo en el perfil propio.
  // Va antes de los returns tempranos para que el orden de hooks no cambie.
  // Al cambiar de pestaña vuelve a la primera página de la lista
  useEffect(() => { setSavedPage(1); setFollowersPage(1); setFollowingPage(1); }, [tab]);

  useEffect(() => {
    if (viewUserId || (tab !== 'guardadas' && tab !== 'megusta')) return undefined;
    let cancelled = false;
    const request = tab === 'guardadas' ? visitService.getSavedVisits() : visitService.getLikedVisits();
    const setList = tab === 'guardadas' ? setSavedVisits : setLikedVisits;
    request
      .then((data) => { if (!cancelled) setList(data); })
      .catch(() => { if (!cancelled) setList([]); });
    return () => { cancelled = true; };
  }, [tab, viewUserId]);

  // Estadísticas personales: se cargan al abrir la pestaña, solo en el perfil propio
  useEffect(() => {
    if (viewUserId || tab !== 'estadisticas') return undefined;
    let cancelled = false;
    userService.getMyStats()
      .then((data) => { if (!cancelled) setMyStats(data); })
      .catch(() => { if (!cancelled) setMyStats(false); });
    return () => { cancelled = true; };
  }, [tab, viewUserId]);

  // Colores del escudo del club del que es hincha, para el fondo de la cabecera (hook: va antes de los returns tempranos)
  const headerColors = useLogoColors((viewUserId ? viewedProfile : profile)?.clubHincha?.logoUrl);

  if (!user) return null;

  if (loading) {
    return (
      <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
        <Navbar {...navbarProps} />
        <div className="max-w-5xl mx-auto px-4 pt-24 sm:pt-32 pb-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full" style={{ backgroundColor: C.surface }} />
            <div className="h-6 w-40 rounded" style={{ backgroundColor: C.surface }} />
          </div>
          <div className="h-40 rounded-2xl mt-8" style={{ backgroundColor: C.surface }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex-1 overflow-hidden">
        <Navbar {...navbarProps} />
        <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ color: C.muted }}>
          <AlertCircle size={24} />
          <p>No pudimos cargar tu perfil.</p>
          <button
            onClick={onBackToMap}
            className="px-4 py-2 rounded-xl text-sm font-semibold gc-focus"
            style={{ backgroundColor: C.brand, color: C.bright }}
          >
            Volver al mapa
          </button>
        </div>
      </div>
    );
  }

  const isOwn = !viewUserId;

  const displayedProfile = isOwn ? profile : viewedProfile;
  const displayedVisits = isOwn ? visits : viewedVisits;
  const displayedVisitsLoading = isOwn ? visitsLoading : viewedLoading;
  const myFollowingIds = new Set((profile?.following || []).map((f) => f._id || f));
  const isFollowing = !isOwn && myFollowingIds.has(viewUserId);

  const visitedCount = displayedProfile?.visitedCount
    ?? new Set(displayedVisits.map((v) => v.stadium?._id).filter(Boolean)).size;
  const visitedStadiumIds = new Set((displayedProfile?.visitedStadiums || []).map((s) => s._id || s));
  // Orden por creación, la más nueva primero: visitados según su última reseña, por visitar según cuándo se agregó
  const lastVisitAt = new Map();
  displayedVisits.forEach((v) => {
    const id = v.stadium?._id;
    const t = new Date(v.createdAt).getTime();
    if (id && t > (lastVisitAt.get(id) ?? 0)) lastVisitAt.set(id, t);
  });
  const visitedStadiumTiles = stadiums
    .filter((s) => visitedStadiumIds.has(s.id))
    .sort((a, b) => (lastVisitAt.get(b.id) ?? 0) - (lastVisitAt.get(a.id) ?? 0));
  // wantToVisit se guarda con push: el último agregado es el último del arreglo
  const wantOrder = (displayedProfile?.wantToVisit || []).map((s) => String(s._id || s));
  const wishlistStadiums = stadiums
    .filter((s) => wantOrder.includes(s.id))
    .sort((a, b) => wantOrder.indexOf(b.id) - wantOrder.indexOf(a.id));
  const displayName = displayedProfile?.nombre || displayedProfile?.username || 'Sin nombre';
  const bio = displayedProfile?.bio?.trim() || (isOwn ? 'Todavía no escribiste una bio.' : 'Todavía no escribió una bio.');
  const club = displayedProfile?.clubHincha;
  const birthDate = formatLongDate(displayedProfile?.fechaNacimiento);
  const joinDate = formatLongDate(displayedProfile?.createdAt);
  const clubStadium = club ? stadiums.find((s) => s.mainClubId === club._id) : null;
  const followingList = displayedProfile?.following || [];
  const followersList = displayedProfile?.followers || [];
  const followersPageSafe = clampPage(followersPage, followersList.length, LIST_PAGE_SIZE);
  const followingPageSafe = clampPage(followingPage, followingList.length, LIST_PAGE_SIZE);
  const stadiumPageSize = tab === 'perfil' ? STADIUMS_PAGE_SIZE : STADIUMS_TAB_PAGE_SIZE;
  const visitedPageSafe = clampPage(visitedPage, visitedStadiumTiles.length, stadiumPageSize);
  const reviewsPageSafe = clampPage(reviewsPage, displayedVisits.length, REVIEWS_PAGE_SIZE);
  const wishPageSafe = clampPage(wishPage, wishlistStadiums.length, stadiumPageSize);
  // Todas las fotos que subió, cada una con la reseña (y el estadio) de la que sale; el autor es siempre este perfil
  const allPhotos = displayedVisits.flatMap((v) => (v.images || []).map((url) => ({ url, visit: { ...v, user: displayedProfile || v.user } })));
  const photosPageSafe = clampPage(photosPage, allPhotos.length, PHOTOS_PAGE_SIZE);

  const show = (key) => tab === 'perfil' || tab === key;

  if (!isOwn && viewedLoading) {
    return (
      <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
        <Navbar {...navbarProps} />
        <div className="max-w-5xl mx-auto px-4 pt-24 sm:pt-32 pb-6 flex items-center justify-center" style={{ color: C.muted }}>
          Cargando perfil...
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Estadios', value: visitedCount, Icon: MapPin, onClick: () => setTab('visitados') },
    { label: 'Reseñas', value: displayedVisits.length, Icon: Edit3, onClick: () => setTab('resenas') },
    { label: 'Seguidores', value: displayedProfile?.followersCount ?? 0, Icon: Users, onClick: () => setTab('seguidores') },
    { label: 'Seguidos', value: followingList.length, Icon: UserPlus, onClick: () => setTab('seguidos') },
  ];

  return (
    <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />

      {/* Visor de la foto de perfil: se cierra con la X o tocando afuera del círculo */}
      {photoOpen && displayedProfile?.avatarUrl && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center p-4 gc-overlay"
          style={{ backgroundColor: rgba('#000000', 0.75) }}
          onClick={() => setPhotoOpen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={displayedProfile.avatarUrl}
              alt={displayName}
              className="w-[min(80vw,20rem)] h-[min(80vw,20rem)] rounded-full object-cover"
              style={{ backgroundColor: C.surface, border: `2px solid ${C.border}` }}
            />
            <button
              type="button"
              onClick={() => setPhotoOpen(false)}
              aria-label="Cerrar foto"
              className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center gc-focus gc-tap"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
            >
              <X size={18} color={C.bright} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 pt-24 sm:pt-32 pb-6">
        <button
          onClick={() => (isOwn ? onBackToMap() : setViewUserId(null))}
          className="flex items-center gap-1.5 text-sm mb-4 gc-focus gc-tap"
          style={{ color: C.muted }}
        >
          <ChevronLeft size={16} /> {isOwn ? 'Mapa' : 'Mi perfil'}
        </button>

        {/* Cabecera: avatar + nombre a la izquierda, estadísticas en fila a la derecha */}
        <header className="relative flex flex-col md:flex-row md:items-center gap-6 rounded-3xl overflow-hidden p-5 sm:p-8" style={cardStyle}>
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: headerColors ? `linear-gradient(135deg, ${rgba(headerColors[0], 0.28)}, ${rgba(headerColors[1], 0.28)})` : `radial-gradient(circle at 85% 0%, ${rgba(C.brandBright, 0.22)}, transparent 55%), radial-gradient(circle at 0% 100%, ${rgba(C.gold, 0.1)}, transparent 50%)` }} />
          <div className="relative flex items-center gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              {displayedProfile?.avatarUrl ? (
                <button type="button" onClick={() => setPhotoOpen(true)} className="block rounded-full gc-focus gc-tap" aria-label="Ver foto de perfil">
                  <img src={displayedProfile.avatarUrl} alt={displayName} className="w-28 h-28 rounded-full object-cover" style={{ backgroundColor: C.surface }} />
                </button>
              ) : (
                <div className="w-28 h-28 rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: C.brand, color: C.bright, fontFamily: DISPLAY_FONT }}>
                  {initialsOf(displayName)}
                </div>
              )}
              {club?.logoUrl && (
                <img
                  src={club.logoUrl}
                  alt={`Hincha de ${club.name}`}
                  title={club.name}
                  className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full object-cover"
                  style={{ backgroundColor: C.surface, border: `3px solid ${C.surface}` }}
                />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl leading-none truncate" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>
                {displayName}
              </h1>
              {displayedProfile?.username && (
                <p className="text-sm mt-1.5" style={{ color: C.bright, opacity: 0.85, textShadow: `0 1px 4px ${rgba(C.bg, 0.8)}` }}>@{displayedProfile.username}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {isOwn ? (
                  <button
                    onClick={() => setEditOpen(true)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold gc-focus gc-tap flex items-center gap-1.5"
                    style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.bright }}
                  >
                    <Edit3 size={13} /> Editar perfil
                  </button>
                ) : (
                  <button
                    onClick={() => (isFollowing ? setUnfollowOpen(true) : toggleFollow())}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold gc-focus gc-tap flex items-center gap-1.5"
                    style={{
                      backgroundColor: isFollowing ? C.bg : C.brand,
                      border: isFollowing ? `1px solid ${C.border}` : 'none',
                      color: C.bright,
                    }}
                  >
                    {isFollowing ? <><Check size={13} /> Siguiendo</> : <><UserPlus size={13} /> Seguir</>}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto md:shrink-0">
            {stats.map(({ label, value, Icon, onClick }) => {
              const Tag = onClick ? 'button' : 'div';
              return (
                <Tag
                  key={label}
                  onClick={onClick}
                  className={`flex flex-col items-center px-2 sm:px-4 py-2.5 sm:py-3 rounded-2xl gc-focus min-w-0 ${onClick ? 'gc-tap' : ''}`}
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
                >
                  <span className="text-2xl sm:text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{value}</span>
                  <span className="text-[10px] uppercase tracking-widest mt-1.5 flex items-center gap-1 text-center" style={{ color: C.muted }}>
                    <Icon size={10} className="shrink-0" /> <span className="truncate">{label}</span>
                  </span>
                </Tag>
              );
            })}
          </div>
        </header>

        {/* Pestañas: "Perfil" muestra todo, las demás filtran */}
        <nav className="flex gap-2 overflow-x-auto gc-hide-scrollbar mt-5 pb-1">
          {[...TABS, ...(isOwn ? OWN_ONLY_TABS : [])].map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold gc-focus gc-tap"
                style={{
                  backgroundColor: active ? C.brandBright : rgba(C.surface, 0.9),
                  color: active ? C.bg : C.muted,
                  border: `1px solid ${active ? C.brandBright : C.border}`,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="grid md:grid-cols-[1fr_280px] gap-8 mt-8 items-start">
          <main className="min-w-0 space-y-10">
            {show('resenas') && (
              <section>
                <SectionTitle count={displayedVisits.length}>Reseñas</SectionTitle>
                {displayedVisitsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
                    {[0, 1].map((i) => <div key={i} className="h-36 rounded-2xl" style={{ backgroundColor: C.surface }} />)}
                  </div>
                ) : displayedVisits.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>
                    {isOwn ? 'Todavía no registraste ninguna visita.' : 'Todavía no registró ninguna visita.'}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {paginate(displayedVisits, reviewsPageSafe, REVIEWS_PAGE_SIZE).map((v, i) => {
                        const stadiumId = v.stadium?._id;
                        return (
                          <div
                            key={v._id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onOpenVisit(v)}
                            onKeyDown={(e) => { if (e.key === 'Enter') onOpenVisit(v); }}
                            className="rounded-3xl overflow-hidden cursor-pointer gc-focus gc-card"
                            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                          >
                            <div className="relative w-full h-40 overflow-hidden flex flex-col items-center justify-center gap-1.5 px-3">
                              <div aria-hidden="true" className="absolute inset-0 z-[1]" style={{ backgroundImage: `linear-gradient(transparent 40%, ${rgba(C.surface, 0.9)})` }} />
                              <span className="absolute z-[3] top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: rgba(C.bg, 0.75), color: C.gold }}>
                                <Star size={12} fill={C.gold} color={C.gold} /> {v.rating}/10
                              </span>
                              {v.stadium?.imageUrl ? (
                                <img src={v.stadium.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-sm scale-110" />
                              ) : (
                                <StadiumArt tone={i % 2 === 0 ? 'brand' : 'gold'} uid={v._id} className="absolute inset-0 w-full h-full" />
                              )}
                              {v.stadium?.mainClub?.logoUrl && (
                                <>
                                  <img
                                    src={v.stadium.mainClub.logoUrl}
                                    alt={v.stadium.mainClub.name}
                                    className="relative z-[2] w-16 h-16 object-contain"
                                  />
                                  <span className="relative z-[2] text-xs font-semibold truncate max-w-full" style={{ color: C.bright, textShadow: `0 1px 4px ${rgba(C.bg, 0.9)}` }}>
                                    {v.stadium.mainClub.name}
                                  </span>
                                </>
                              )}
                              {!v.stadium?.mainClub && (
                                <div className="relative text-center px-3 min-w-0 max-w-full" style={{ textShadow: `0 1px 4px ${rgba(C.bg, 0.9)}` }}>
                                  <p className="text-lg truncate" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>{v.stadium?.name || 'Estadio'}</p>
                                  <p className="text-xs truncate" style={{ color: C.bright }}>
                                    {[v.stadium?.location?.province || v.stadium?.location?.city, v.stadium?.location?.country].filter(Boolean).join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); stadiumId && onOpenStadiumFromId(stadiumId); }}
                                disabled={!stadiumId}
                                className="text-xl leading-none truncate text-left w-full gc-focus"
                                style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.02em', color: C.bright, cursor: stadiumId ? 'pointer' : 'default' }}
                              >
                                {v.stadium?.name || 'Estadio'}
                              </button>
                              <div className="block w-full text-left">
                                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: C.muted }}><CalendarDays size={11} /> {formatVisitDate(v.visitDate)}</p>
                                <p
                                  className="text-xs mt-2 leading-snug"
                                  style={{ color: C.muted, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                >
                                  {v.reviewText?.trim() || 'Sin reseña escrita todavía.'}
                                </p>
                              </div>
                              {isOwn && (
                                <div className="flex items-center gap-3 mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
                                  <button onClick={(e) => { e.stopPropagation(); onEditVisit(v); }} className="flex items-center gap-1 text-xs font-medium gc-focus" style={{ color: C.brandBright }}>
                                    <Pencil size={12} /> Editar
                                  </button>
                                  {visitToDelete === v._id && (
                                    <ConfirmModal
                                      danger
                                      title="¿Eliminar esta visita de tu bitácora?"
                                      message="Se borra solo de tu bitácora; la reseña no aparece más en tu perfil."
                                      confirmLabel="Eliminar"
                                      onConfirm={() => confirmDeleteVisit(visitToDelete)}
                                      onCancel={() => setVisitToDelete(null)}
                                    />
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteVisit(v._id); }} className="flex items-center gap-1 text-xs font-medium gc-focus" style={{ color: '#f85149' }}>
                                    <Trash2 size={12} /> Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <AdminPagination page={reviewsPageSafe} total={displayedVisits.length} onChange={setReviewsPage} pageSize={REVIEWS_PAGE_SIZE} />
                  </>
                )}
              </section>
            )}

            {show('visitados') && (
              <section>
                <SectionTitle count={visitedStadiumTiles.length}>Estadios visitados</SectionTitle>
                {visitedStadiumTiles.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>
                    {isOwn ? 'Todavía no visitaste ningún estadio.' : 'Todavía no visitó ningún estadio.'}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {paginate(visitedStadiumTiles, visitedPageSafe, stadiumPageSize).map((s) => (
                        <StadiumCard
                          key={s.id}
                          stadium={s}
                          onClick={() => onOpenStadiumFromId(s.id)}
                        />
                      ))}
                    </div>
                    <AdminPagination page={visitedPageSafe} total={visitedStadiumTiles.length} onChange={setVisitedPage} pageSize={stadiumPageSize} />
                  </>
                )}
              </section>
            )}

            {show('porvisitar') && (
              <section>
                <SectionTitle count={wishlistStadiums.length}>Por visitar</SectionTitle>
                {wishlistStadiums.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>
                    {isOwn ? 'Todavía no agregaste estadios a tu lista.' : 'Todavía no agregó estadios a su lista.'}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {paginate(wishlistStadiums, wishPageSafe, stadiumPageSize).map((s) => (
                        <StadiumCard
                          key={s.id}
                          stadium={s}
                          onClick={() => onOpenStadiumFromId(s.id)}
                        />
                      ))}
                    </div>
                    <AdminPagination page={wishPageSafe} total={wishlistStadiums.length} onChange={setWishPage} pageSize={stadiumPageSize} />
                  </>
                )}
              </section>
            )}

            {(tab === 'guardadas' || tab === 'megusta') && isOwn && (() => {
              const list = tab === 'guardadas' ? savedVisits : likedVisits;
              const savedPageSafe = clampPage(savedPage, list.length, LIST_PAGE_SIZE);
              return (
                <section>
                  <SectionTitle count={list.length}>{tab === 'guardadas' ? 'Reseñas guardadas' : 'Reseñas que te gustaron'}</SectionTitle>
                  {list.length === 0 ? (
                    <p className="text-sm" style={{ color: C.muted }}>
                      {tab === 'guardadas' ? 'Todavía no guardaste ninguna reseña.' : 'Todavía no le diste me gusta a ninguna reseña.'}
                    </p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                      {paginate(list, savedPageSafe, LIST_PAGE_SIZE).map((v) => <VisitMiniCard key={v._id} visit={v} onOpen={onOpenVisit} />)}
                    </div>
                  )}
                  {list.length > LIST_PAGE_SIZE && (
                    <AdminPagination page={savedPageSafe} total={list.length} onChange={setSavedPage} pageSize={LIST_PAGE_SIZE} />
                  )}
                </section>
              );
            })()}

            {tab === 'estadisticas' && isOwn && (
              <section>
                <SectionTitle>Mis estadísticas</SectionTitle>
                {myStats === null && <p className="text-sm" style={{ color: C.muted }}>Cargando estadísticas...</p>}
                {myStats === false && <p className="text-sm" style={{ color: C.muted }}>No pudimos cargar tus estadísticas.</p>}
                {myStats && myStats.visits === 0 && (
                  <p className="text-sm" style={{ color: C.muted }}>Todavía no registraste visitas. Cuando cargues una, vas a ver acá tus números.</p>
                )}
                {myStats && myStats.visits > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <StatTile label="Visitas" value={myStats.visits} />
                      <StatTile label="Estadios distintos" value={myStats.stadiums} />
                      <StatTile label="Puntaje promedio" value={`${myStats.avgRating}/10`} />
                      <StatTile label="Partidos cargados" value={myStats.matches} />
                      <StatTile
                        className="col-span-2 md:col-span-1"
                        label={myStats.clubMatches ? `Partidos de ${myStats.clubMatches.clubName}` : 'Partidos de tu club'}
                        value={myStats.clubMatches?.count ?? '—'}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-3 sm:p-5 rounded-3xl text-center" style={{ ...cardStyle, backgroundImage: `radial-gradient(circle at 50% 0%, ${rgba(C.gold, 0.12)}, transparent 60%)` }}>
                        <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: C.muted }}>Estadio favorito</p>
                        {myStats.favoriteStadium ? (
                          <div className="flex flex-col items-center">
                            {myStats.favoriteStadium.clubLogoUrl ? (
                              <img src={myStats.favoriteStadium.clubLogoUrl} alt={myStats.favoriteStadium.clubName} className="w-16 h-16 sm:w-24 sm:h-24 object-contain" />
                            ) : (
                              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: C.border, color: C.muted }}>
                                <Landmark size={22} />
                              </div>
                            )}
                            <p className="text-lg sm:text-2xl leading-none mt-3 max-w-full truncate" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>{myStats.favoriteStadium.name}</p>
                            {myStats.favoriteStadium.clubName && (
                              <p className="text-xs mt-0.5 truncate max-w-full" style={{ color: C.bright }}>{myStats.favoriteStadium.clubName}</p>
                            )}
                            <p className="text-xs mt-0.5 truncate max-w-full" style={{ color: C.muted }}>
                              {[myStats.favoriteStadium.city, myStats.favoriteStadium.province, myStats.favoriteStadium.country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold" style={{ color: C.bright }}>—</p>
                        )}
                        {myStats.favoriteStadium && (
                          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 pt-4 text-xs" style={{ color: C.muted, borderTop: `1px solid ${C.border}` }}>
                            <span><span style={{ color: C.bright }}>{myStats.favoriteStadium.visits}</span> {myStats.favoriteStadium.visits === 1 ? 'visita' : 'visitas'}</span>
                            {myStats.favoriteStadium.capacity != null && (
                              <span>Capacidad: <span style={{ color: C.bright }}>{Number(myStats.favoriteStadium.capacity).toLocaleString('es-AR')}</span></span>
                            )}
                          </div>
                        )}
                        {myStats.topMonth && (
                          <p className="text-xs mt-3" style={{ color: C.muted }}>Mes con más visitas: <span style={{ color: C.bright }}>{myStats.topMonth.month}</span> ({myStats.topMonth.visits})</p>
                        )}
                      </div>

                      <div className="p-3 sm:p-5 rounded-3xl text-center" style={{ ...cardStyle, backgroundImage: `radial-gradient(circle at 50% 0%, ${rgba(C.brandBright, 0.14)}, transparent 60%)` }}>
                        <p className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>Gasto total</p>
                        <p className="text-lg sm:text-2xl leading-none mt-2 mb-1" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{formatMoney(myStats.totalSpent)}</p>
                        <p className="text-xs mb-5" style={{ color: C.muted }}>Promedio por visita con gastos: {formatMoney(myStats.avgSpent)}</p>
                        <div className="space-y-3 text-left">
                          {Object.entries(SPEND_LABELS).map(([key, label]) => {
                            const value = myStats.spendByField[key] || 0;
                            const max = Math.max(1, ...Object.values(myStats.spendByField));
                            return (
                              <div key={key}>
                                <div className="flex justify-between text-xs" style={{ color: C.muted }}>
                                  <span>{label}</span>
                                  <span style={{ color: C.bright }}>{formatMoney(value)}</span>
                                </div>
                                <div className="h-1.5 rounded-full mt-1" style={{ backgroundColor: C.bg }}>
                                  <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: C.brandBright }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {isAdminRole(user?.rol) && (
                  <div className="mt-6 p-5 rounded-3xl flex flex-wrap items-center justify-between gap-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: C.bright }}>Analíticas de la plataforma</p>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>Usuarios, reseñas, denuncias y estadios de toda la comunidad.</p>
                    </div>
                    <button
                      onClick={() => navbarProps?.onOpenAdmin?.()}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus gc-tap shrink-0"
                      style={{ backgroundColor: C.brand, color: C.bright }}
                    >
                      Ver en el panel
                    </button>
                  </div>
                )}
                <p className="text-xs mt-6" style={{ color: C.muted }}>Estas estadísticas son privadas: solo las ves vos.</p>
              </section>
            )}

            {tab === 'fotos' && (
              <section>
                <SectionTitle count={allPhotos.length}>Fotos</SectionTitle>
                {displayedVisitsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
                    {[0, 1, 2].map((i) => <div key={i} className="h-48 rounded-3xl" style={{ backgroundColor: C.surface }} />)}
                  </div>
                ) : allPhotos.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>
                    {isOwn ? 'Todavía no subiste ninguna foto.' : 'Todavía no subió ninguna foto.'}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {paginate(allPhotos, photosPageSafe, PHOTOS_PAGE_SIZE).map(({ url, visit }, i) => {
                        const index = (photosPageSafe - 1) * PHOTOS_PAGE_SIZE + i;
                        const stadiumName = visit.stadium?.name || 'Estadio';
                        return (
                          <button
                            key={`${url}-${index}`}
                            onClick={() => setPhotoView(index)}
                            aria-label={`Abrir la foto de ${stadiumName}`}
                            className="flex flex-col text-left rounded-3xl overflow-hidden gc-focus gc-card"
                            style={cardStyle}
                          >
                            <div className="relative w-full h-40 overflow-hidden">
                              <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
                              <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: rgba(C.bg, 0.75), color: C.gold }}>
                                <Star size={11} fill={C.gold} color={C.gold} /> {visit.rating}/10
                              </span>
                            </div>
                            <div className="p-3 flex items-center gap-2.5 min-w-0">
                              {visit.stadium?.mainClub?.logoUrl && (
                                <img src={visit.stadium.mainClub.logoUrl} alt="" className="w-9 h-9 object-contain shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-lg leading-tight truncate" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>{stadiumName}</p>
                                <p className="text-xs truncate flex items-center gap-1" style={{ color: C.muted }}>
                                  <CalendarDays size={11} className="shrink-0" /> Reseña del {formatVisitDate(visit.visitDate)}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <AdminPagination page={photosPageSafe} total={allPhotos.length} onChange={setPhotosPage} pageSize={PHOTOS_PAGE_SIZE} />
                  </>
                )}
              </section>
            )}

            {tab === 'seguidores' && (
              <section>
                <SectionTitle count={followersList.length}>Seguidores</SectionTitle>
                {followersList.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>{isOwn ? 'Todavía no tenés seguidores.' : 'Todavía no tiene seguidores.'}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paginate(followersList, followersPageSafe, LIST_PAGE_SIZE).map((f) => (
                      <UserCard key={f._id} user={f} onOpen={() => setViewUserId(f._id)} />
                    ))}
                  </div>
                )}
                {followersList.length > LIST_PAGE_SIZE && (
                  <AdminPagination page={followersPageSafe} total={followersList.length} onChange={setFollowersPage} pageSize={LIST_PAGE_SIZE} />
                )}
              </section>
            )}

            {tab === 'seguidos' && (
              <section>
                <SectionTitle count={followingList.length}>Siguiendo</SectionTitle>
                {followingList.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>{isOwn ? 'Todavía no seguís a nadie.' : 'Todavía no sigue a nadie.'}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paginate(followingList, followingPageSafe, LIST_PAGE_SIZE).map((f) => (
                      <UserCard key={f._id || f} user={f} onOpen={() => setViewUserId(f._id || f)} />
                    ))}
                  </div>
                )}
                {followingList.length > LIST_PAGE_SIZE && (
                  <AdminPagination page={followingPageSafe} total={followingList.length} onChange={setFollowingPage} pageSize={LIST_PAGE_SIZE} />
                )}
              </section>
            )}
          </main>

          <aside className="space-y-6 md:sticky md:top-32">
            <section>
              <AsideTitle>Biografía</AsideTitle>
              <p className="text-sm leading-relaxed p-4 rounded-3xl" style={{ color: C.bright, ...cardStyle }}>{bio}</p>
            </section>

            {clubStadium && (
              <section>
                <AsideTitle>Estadio del club</AsideTitle>
                <button
                  onClick={() => onOpenStadiumFromId(clubStadium.id)}
                  className="w-full text-left rounded-3xl overflow-hidden gc-focus gc-card"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  <div className="relative">
                    {clubStadium.imageUrl ? (
                      <img src={clubStadium.imageUrl} alt={clubStadium.name} className="w-full h-36 object-cover" />
                    ) : (
                      <StadiumArt tone={clubStadium.tone} uid={clubStadium.id} className="w-full h-36" />
                    )}
                    {club?.logoUrl && (
                      <img
                        src={club.logoUrl}
                        alt={club.name}
                        title={club.name}
                        className="absolute bottom-2 left-2 w-11 h-11 rounded-full object-cover"
                        style={{ backgroundColor: C.surface, border: `3px solid ${C.bg}` }}
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-lg leading-tight" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>{clubStadium.name}</p>
                    <p className="text-xs mt-1" style={{ color: C.muted }}>{clubStadium.city}</p>
                    {clubStadium.capacity > 0 && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: C.muted }}>
                        <Users size={11} /> {clubStadium.capacity.toLocaleString('es-AR')} espectadores
                      </p>
                    )}
                  </div>
                </button>
              </section>
            )}

            <section>
              <AsideTitle>Datos</AsideTitle>
              <ul className="space-y-2.5 text-sm p-4 rounded-3xl" style={cardStyle}>
                {joinDate && (
                  <li className="flex items-center gap-2" style={{ color: C.muted }}><CalendarDays size={13} /> Se unió en {joinDate}</li>
                )}
                {birthDate && (
                  <li className="flex items-center gap-2" style={{ color: C.muted }}><Cake size={13} /> {birthDate}</li>
                )}
                {club && (
                  <li className="flex items-center gap-2" style={{ color: C.brandBright }}>
                    {club.logoUrl ? (
                      <img src={club.logoUrl} alt={club.name} className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <Star size={13} />
                    )}
                    Hincha de {club.name}
                  </li>
                )}
                {!birthDate && !club && !joinDate && (
                  <li style={{ color: C.muted }}>Sin datos cargados.</li>
                )}
              </ul>
            </section>
          </aside>
        </div>

      </div>

      {photoView !== null && (
        <PhotoLightbox
          photos={allPhotos}
          startIndex={photoView}
          onClose={() => setPhotoView(null)}
          onOpenVisit={(visit) => { setPhotoView(null); onOpenVisit(visit); }}
        />
      )}

      {unfollowOpen && (
        <ConfirmModal
          danger
          title={`¿Dejar de seguir a @${displayedProfile?.username || 'este usuario'}?`}
          message="Dejás de ver su actividad entre tus seguidos. Podés volver a seguirlo cuando quieras."
          confirmLabel="Dejar de seguir"
          onConfirm={toggleFollow}
          onCancel={() => setUnfollowOpen(false)}
        />
      )}

      {editOpen && (
        <EditProfileModal
          profile={profile}
          onAccountDeleted={logout}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            // merge: el endpoint de edición no devuelve visitedStadiums ni contadores
            setProfile((prev) => ({ ...prev, ...updated }));
            updateUser({ avatarUrl: updated.avatarUrl, bio: updated.bio, clubHincha: updated.clubHincha });
          }}
        />
      )}
    </div>
  );
}
