import { useEffect, useState } from 'react';
import { ChevronLeft, MapPin, Edit3, Users, UserPlus, Star, AlertCircle, Cake, CalendarDays, Landmark, Pencil, Trash2, Search, Check } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import visitService from '../services/visitService';
import StadiumArt from './StadiumArt';
import EditProfileModal from './EditProfileModal';
import Navbar from './Navbar';
import AdminPagination, { paginate, clampPage } from './admin/AdminPagination';
import { useLogoColors } from '../utils/logoColors';

// Reseñas y estadios (visitados y por visitar) de a 6
const REVIEWS_PAGE_SIZE = 6;
const STADIUMS_PAGE_SIZE = 6;

const TABS = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'resenas', label: 'Reseñas' },
  { key: 'visitados', label: 'Visitados' },
  { key: 'porvisitar', label: 'Por visitar' },
  { key: 'seguidores', label: 'Seguidores' },
  { key: 'seguidos', label: 'Seguidos' },
];

// Las reseñas guardadas y las que tienen me gusta son privadas: solo las ve su dueño
const OWN_ONLY_TABS = [
  { key: 'megusta', label: 'Me gusta' },
  { key: 'guardadas', label: 'Guardadas' },
];

// Card compacta de una reseña en listas privadas (guardadas, me gusta)
function VisitMiniCard({ visit, onOpen }) {
  return (
    <button
      onClick={() => onOpen(visit)}
      className="text-left p-3.5 rounded-2xl gc-focus gc-tap"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold truncate" style={{ color: C.bright }}>{visit.stadium?.name || 'Estadio'}</span>
        <span className="flex items-center gap-1 shrink-0">
          <Star size={12} fill={C.gold} color={C.gold} />
          <span className="text-xs font-medium" style={{ color: C.gold }}>{visit.rating}/10</span>
        </span>
      </div>
      <p className="text-xs mt-1" style={{ color: C.muted }}>
        de @{visit.user?.username || '...'} · {formatVisitDate(visit.visitDate)}
      </p>
      <p className="text-xs mt-2 leading-snug" style={{ color: C.muted, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {visit.reviewText?.trim() || 'Sin reseña escrita.'}
      </p>
    </button>
  );
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
    <div className="flex items-center justify-between pb-2 mb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
      <h2 className="text-xl font-semibold" style={{ color: C.bright }}>
        {children}{count !== undefined && <span className="font-normal" style={{ color: C.muted }}> {count}</span>}
      </h2>
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
      className="flex flex-col items-center text-center gap-2 p-3 rounded-2xl gc-focus gc-tap"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, ...background }}
    >
      {clubLogoUrl ? (
        <img src={clubLogoUrl} alt={club} className="w-16 h-16 object-contain" />
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
        <p className="text-sm font-semibold truncate" style={{ color: C.bright }}>{name}</p>
        {place && <p className="text-xs truncate" style={{ color: C.muted }}>{place}</p>}
      </div>
    </button>
  );
}

export default function ProfileView({
  stadiums, onBackToMap, onOpenStadiumFromId, onEditVisit, onOpenVisit, onToast,
  visitsVersion, onRequireLogin, navbarProps, initialViewUserId,
}) {
  const { token, user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(true);

  const [viewUserId, setViewUserId] = useState(initialViewUserId ?? null);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [viewedVisits, setViewedVisits] = useState([]);
  const [viewedLoading, setViewedLoading] = useState(false);

  const [tab, setTab] = useState('perfil');
  const [savedVisits, setSavedVisits] = useState([]);
  const [likedVisits, setLikedVisits] = useState([]);
  const [visitedPage, setVisitedPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [wishPage, setWishPage] = useState(1);

  useEffect(() => {
    if (!token) {
      onRequireLogin?.();
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
  }, [token, visitsVersion]);

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

  async function handleDeleteVisit(visitId) {
    if (!window.confirm('¿Eliminar esta visita de tu bitácora?')) return;
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

  if (!token) return null;

  if (loading) {
    return (
      <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
        <Navbar {...navbarProps} />
        <div className="max-w-5xl mx-auto px-4 pt-32 pb-6 animate-pulse">
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
  const visitedPageSafe = clampPage(visitedPage, visitedStadiumTiles.length, STADIUMS_PAGE_SIZE);
  const reviewsPageSafe = clampPage(reviewsPage, displayedVisits.length, REVIEWS_PAGE_SIZE);
  const wishPageSafe = clampPage(wishPage, wishlistStadiums.length, STADIUMS_PAGE_SIZE);

  const show = (key) => tab === 'perfil' || tab === key;

  if (!isOwn && viewedLoading) {
    return (
      <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
        <Navbar {...navbarProps} />
        <div className="max-w-5xl mx-auto px-4 pt-32 pb-6 flex items-center justify-center" style={{ color: C.muted }}>
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
      <div className="max-w-5xl mx-auto px-4 pt-32 pb-6">
        <button
          onClick={() => (isOwn ? onBackToMap() : setViewUserId(null))}
          className="flex items-center gap-1.5 text-sm mb-4 gc-focus gc-tap"
          style={{ color: C.muted }}
        >
          <ChevronLeft size={16} /> {isOwn ? 'Mapa' : 'Mi perfil'}
        </button>

        {/* Cabecera: avatar + nombre a la izquierda, estadísticas en fila a la derecha */}
        <header className="flex flex-col md:flex-row md:items-center gap-6 pb-6" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              {displayedProfile?.avatarUrl ? (
                <img src={displayedProfile.avatarUrl} alt={displayName} className="w-28 h-28 rounded-full object-cover" style={{ backgroundColor: C.surface }} />
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
                  style={{ backgroundColor: C.surface, border: `3px solid ${C.bg}` }}
                />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl truncate" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>
                {displayName}
              </h1>
              {displayedProfile?.username && (
                <p className="text-sm" style={{ color: C.muted }}>@{displayedProfile.username}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {isOwn ? (
                  <button
                    onClick={() => setEditOpen(true)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold gc-focus gc-tap flex items-center gap-1.5"
                    style={{ border: `1px solid ${C.border}`, color: C.bright }}
                  >
                    <Edit3 size={13} /> Editar perfil
                  </button>
                ) : (
                  <button
                    onClick={() => userService.toggleFollow(viewUserId).then(() => {
                      setProfile((p) => ({
                        ...p,
                        following: isFollowing
                          ? (p.following || []).filter((f) => (f._id || f) !== viewUserId)
                          : [...(p.following || []), viewUserId],
                      }));
                      onToast?.(isFollowing ? 'Dejaste de seguir' : '¡Ahora lo seguís!');
                    }).catch(() => onToast?.('No pudimos procesar la acción.'))}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold gc-focus gc-tap flex items-center gap-1.5"
                    style={{
                      backgroundColor: isFollowing ? 'transparent' : C.brand,
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

          <div className="grid grid-cols-4 gap-2 shrink-0">
            {stats.map(({ label, value, Icon, onClick }) => {
              const Tag = onClick ? 'button' : 'div';
              return (
                <Tag
                  key={label}
                  onClick={onClick}
                  className={`flex flex-col items-center px-4 py-3 rounded-2xl gc-focus ${onClick ? 'gc-tap' : ''}`}
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  <span className="text-2xl" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>{value}</span>
                  <span className="text-[10px] uppercase tracking-widest mt-0.5 flex items-center gap-1" style={{ color: C.muted }}>
                    <Icon size={10} /> {label}
                  </span>
                </Tag>
              );
            })}
          </div>
        </header>

        {/* Pestañas: "Perfil" muestra todo, las demás filtran */}
        <nav className="flex gap-1.5 overflow-x-auto gc-hide-scrollbar mt-6 pb-1">
          {[...TABS, ...(isOwn ? OWN_ONLY_TABS : [])].map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium gc-focus gc-tap"
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

        <div className="grid md:grid-cols-[1fr_280px] gap-8 mt-6 items-start">
          <main className="min-w-0 space-y-10">
            {show('resenas') && (
              <section>
                <SectionTitle count={displayedVisits.length}>Reseñas</SectionTitle>
                {displayedVisitsLoading ? (
                  <div className="grid grid-cols-2 gap-3 animate-pulse">
                    {[0, 1].map((i) => <div key={i} className="h-36 rounded-2xl" style={{ backgroundColor: C.surface }} />)}
                  </div>
                ) : displayedVisits.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>
                    {isOwn ? 'Todavía no registraste ninguna visita.' : 'Todavía no registró ninguna visita.'}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {paginate(displayedVisits, reviewsPageSafe, REVIEWS_PAGE_SIZE).map((v, i) => {
                        const stadiumId = v.stadium?._id;
                        return (
                          <div
                            key={v._id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onOpenVisit(v)}
                            onKeyDown={(e) => { if (e.key === 'Enter') onOpenVisit(v); }}
                            className="rounded-2xl overflow-hidden cursor-pointer gc-focus gc-tap"
                            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                          >
                            <div className="relative w-full h-36 overflow-hidden flex flex-col items-center justify-center gap-1.5 px-3">
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
                                    className="relative w-16 h-16 object-contain"
                                  />
                                  <span className="relative text-xs font-semibold truncate max-w-full" style={{ color: C.bright, textShadow: `0 1px 4px ${rgba(C.bg, 0.9)}` }}>
                                    {v.stadium.mainClub.name}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="p-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); stadiumId && onOpenStadiumFromId(stadiumId); }}
                                disabled={!stadiumId}
                                className="text-sm font-semibold truncate text-left w-full gc-focus"
                                style={{ color: C.bright, cursor: stadiumId ? 'pointer' : 'default' }}
                              >
                                {v.stadium?.name || 'Estadio'}
                              </button>
                              <div className="block w-full text-left">
                                <div className="flex items-center gap-1 mt-1">
                                  <Star size={12} fill={C.gold} color={C.gold} />
                                  <span className="text-xs font-medium" style={{ color: C.gold }}>{v.rating}/10</span>
                                  <span className="text-xs ml-auto" style={{ color: C.muted }}>{formatVisitDate(v.visitDate)}</span>
                                </div>
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
                    <div className="grid grid-cols-3 gap-3">
                      {paginate(visitedStadiumTiles, visitedPageSafe, STADIUMS_PAGE_SIZE).map((s) => (
                        <StadiumCard
                          key={s.id}
                          stadium={s}
                          onClick={() => onOpenStadiumFromId(s.id)}
                        />
                      ))}
                    </div>
                    <AdminPagination page={visitedPageSafe} total={visitedStadiumTiles.length} onChange={setVisitedPage} pageSize={STADIUMS_PAGE_SIZE} />
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
                    <div className="grid grid-cols-3 gap-3">
                      {paginate(wishlistStadiums, wishPageSafe, STADIUMS_PAGE_SIZE).map((s) => (
                        <StadiumCard
                          key={s.id}
                          stadium={s}
                          onClick={() => onOpenStadiumFromId(s.id)}
                        />
                      ))}
                    </div>
                    <AdminPagination page={wishPageSafe} total={wishlistStadiums.length} onChange={setWishPage} pageSize={STADIUMS_PAGE_SIZE} />
                  </>
                )}
              </section>
            )}

            {(tab === 'guardadas' || tab === 'megusta') && isOwn && (() => {
              const list = tab === 'guardadas' ? savedVisits : likedVisits;
              return (
                <section>
                  <SectionTitle count={list.length}>{tab === 'guardadas' ? 'Reseñas guardadas' : 'Reseñas que te gustaron'}</SectionTitle>
                  {list.length === 0 ? (
                    <p className="text-sm" style={{ color: C.muted }}>
                      {tab === 'guardadas' ? 'Todavía no guardaste ninguna reseña.' : 'Todavía no le diste me gusta a ninguna reseña.'}
                    </p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                      {list.map((v) => <VisitMiniCard key={v._id} visit={v} onOpen={onOpenVisit} />)}
                    </div>
                  )}
                </section>
              );
            })()}

            {tab === 'seguidores' && (
              <section>
                <SectionTitle count={followersList.length}>Seguidores</SectionTitle>
                {followersList.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>{isOwn ? 'Todavía no tenés seguidores.' : 'Todavía no tiene seguidores.'}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {followersList.map((f) => (
                      <button
                        key={f._id}
                        onClick={() => setViewUserId(f._id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full gc-focus gc-tap"
                        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                      >
                        {f.avatarUrl ? (
                          <img src={f.avatarUrl} alt={f.username} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: C.brand, color: C.bright }}>
                            {initialsOf(f.username || '?')}
                          </div>
                        )}
                        <span className="text-xs" style={{ color: C.bright }}>@{f.username || '...'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === 'seguidos' && (
              <section>
                <SectionTitle count={followingList.length}>Siguiendo</SectionTitle>
                {followingList.length === 0 ? (
                  <p className="text-sm" style={{ color: C.muted }}>{isOwn ? 'Todavía no seguís a nadie.' : 'Todavía no sigue a nadie.'}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {followingList.map((f) => (
                      <button
                        key={f._id || f}
                        onClick={() => setViewUserId(f._id || f)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full gc-focus gc-tap"
                        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                      >
                        {f.avatarUrl ? (
                          <img src={f.avatarUrl} alt={f.username} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: C.brand, color: C.bright }}>
                            {initialsOf(f.username || '?')}
                          </div>
                        )}
                        <span className="text-xs" style={{ color: C.bright }}>@{f.username || '...'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </main>

          <aside className="space-y-6 md:sticky md:top-32">
            <section>
              <h2 className="text-xl font-semibold pb-2 mb-3" style={{ color: C.bright, borderBottom: `1px solid ${C.border}` }}>Bio</h2>
              <p className="text-sm leading-relaxed" style={{ color: C.bright }}>{bio}</p>
            </section>

            {clubStadium && (
              <section>
                <h2 className="text-xl font-semibold pb-2 mb-3" style={{ color: C.bright, borderBottom: `1px solid ${C.border}` }}>Estadio del club</h2>
                <button
                  onClick={() => onOpenStadiumFromId(clubStadium.id)}
                  className="w-full text-left rounded-2xl overflow-hidden gc-focus gc-tap"
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
                    <p className="text-sm font-semibold" style={{ color: C.bright }}>{clubStadium.name}</p>
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
              <h2 className="text-xl font-semibold pb-2 mb-3" style={{ color: C.bright, borderBottom: `1px solid ${C.border}` }}>Datos</h2>
              <ul className="space-y-2 text-sm">
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
