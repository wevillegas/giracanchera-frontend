import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Users, Star, MapPin, Images, Calendar, Ruler, Sprout, Activity, Share2, PenLine, Wallet } from 'lucide-react';
import { C, rgba, DISPLAY_FONT, formatMoney, sumExpenses } from '../theme';
import { useAuth } from '../context/AuthContext';
import visitService from '../services/visitService';
import { computeVisitStats, FEW_REVIEWS } from '../utils/visitStats';
import { nearbyStadiums } from '../utils/distance';
import { useLogoColors } from '../utils/logoColors';
import { stadiumPath } from '../utils/stadiumUrl';
import StadiumArt from './StadiumArt';
import PostcardViewer, { PostcardFront } from './Postcard';
import StarRow from './StarRow';
import ScoreDistribution from './ScoreDistribution';
import Navbar from './Navbar';
import SuggestionModal from './SuggestionModal';
import AdminPagination, { paginate, clampPage } from './admin/AdminPagination';

// Cantidad elegida para que la columna de reseñas llegue a la altura de la columna izquierda
const REVIEWS_PAGE_SIZE = 7;

// Corta la reseña en 3 líneas y pone "..." al final, como en las cards del perfil
const REVIEW_CLAMP = { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' };

function formatVisitDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

const SURFACE_LABEL = { natural: 'Césped natural', sintetico: 'Césped sintético', hibrido: 'Césped híbrido' };
const CONDITION_LABEL = { activo: 'Activo', en_obra: 'En obra', demolido: 'Demolido' };

// Datos de la ficha técnica; los que no tienen valor no se muestran
function techFacts(stadium) {
  const { length, width } = stadium.pitch || {};
  return [
    { Icon: Calendar, label: 'Inauguración', value: stadium.openedYear },
    { Icon: Ruler, label: 'Cancha', value: length && width ? `${length} × ${width} m` : null },
    { Icon: Sprout, label: 'Superficie', value: SURFACE_LABEL[stadium.surface] },
    { Icon: Activity, label: 'Estado', value: CONDITION_LABEL[stadium.condition] },
  ].filter((fact) => fact.value);
}

function initialsOf(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

function Avatar({ url, name, className }) {
  if (url) {
    return <img src={url} alt={name} className={`${className} rounded-full object-cover`} />;
  }
  return (
    <div className={`${className} rounded-full flex items-center justify-center text-xs font-semibold`} style={{ backgroundColor: C.border, color: C.bright }}>
      {initialsOf(name)}
    </div>
  );
}

export default function StadiumView({
  stadium, stadiums = [], onOpenStadium, expenseFields, cameFrom, onBack, onStartVisit, onToggleWishlist, onOpenVisit, onToast, navbarProps,
}) {
  const { user: me } = useAuth();
  const scrollRef = useRef(null);
  // La postal toma los colores del escudo; sin escudo (o sin poder leerlo) usa rojo y azul de correo aéreo
  const logoColors = useLogoColors(stadium.clubLogoUrl);
  const [postalA, postalB] = logoColors || ['#C8453B', '#2F5D9E'];
  const [stadiumReviews, setStadiumReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [suggestOpen, setSuggestOpen] = useState(false);
  // La foto elegida se guarda con el id del estadio: al cambiar de estadio vuelve sola a la portada
  const [photoPick, setPhotoPick] = useState({ id: stadium.id, index: 0 });
  const photoIndex = photoPick.id === stadium.id ? photoPick.index : 0;
  const setPhotoIndex = (index) => setPhotoPick({ id: stadium.id, index });
  // La pestaña también se guarda con el id del estadio: al cambiar de estadio vuelve a "Resumen"
  const [postalOpen, setPostalOpen] = useState(false);
  const [tabPick, setTabPick] = useState({ id: stadium.id, tab: 'resumen' });

  useEffect(() => {
    let cancelled = false;
    setReviewsLoading(true);
    visitService.getStadiumVisits(stadium.id)
      .then((data) => { if (!cancelled) setStadiumReviews(data); })
      .catch(() => { if (!cancelled) setStadiumReviews([]); })
      .finally(() => { if (!cancelled) setReviewsLoading(false); });
    return () => { cancelled = true; };
  }, [stadium.id]);

  // Propias primero, después las de otros usuarios; cada reseña aparece una sola vez
  const isMine = (r) => Boolean(me?._id) && r.user?._id === me._id;
  const myReviews = stadiumReviews.filter(isMine);
  const otherReviews = stadiumReviews.filter((r) => !isMine(r));
  const orderedReviews = [...myReviews, ...otherReviews];
  const reviewsPageSafe = clampPage(reviewsPage, orderedReviews.length, REVIEWS_PAGE_SIZE);
  const pageReviews = paginate(orderedReviews, reviewsPageSafe, REVIEWS_PAGE_SIZE);

  const stats = computeVisitStats(stadiumReviews);
  const photos = stadium.photos || [];
  const photo = photos[Math.min(photoIndex, photos.length - 1)];
  const goPhoto = (step) => setPhotoIndex((photoIndex + step + photos.length) % photos.length);
  const facts = techFacts(stadium).filter((fact) => fact.label !== 'Inauguración'); // la inauguración va en los datos clave
  const keyStats = [
    { Icon: Star, label: 'Puntuación', value: <>{stats.avg}<span className="text-xs font-normal" style={{ color: C.muted }}> / 10</span></>, extra: <StarRow rating={stats.starRating} size={13} /> },
    { Icon: Wallet, label: 'Gasto típico', value: stats.count > 0 ? formatMoney(sumExpenses(stats.medianExpenses), stats.currency) : '—' },
    stadium.openedYear && { Icon: Calendar, label: 'Inauguración', value: stadium.openedYear },
  ].filter(Boolean);

  // Sugerir una corrección pide sesión, igual que registrar una visita
  function openSuggestion() {
    if (!me) {
      onToast?.('Iniciá sesión para sugerir una corrección');
      return;
    }
    setSuggestOpen(true);
  }

  // En el celular abre el menú de compartir del sistema; en la compu copia el link
  async function share() {
    const url = `${window.location.origin}${stadiumPath(stadium.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: stadium.name, text: `Mirá ${stadium.name} en GiraCanchera`, url });
      } else {
        await navigator.clipboard.writeText(url);
        onToast?.('Link copiado');
      }
    } catch (error) {
      if (error.name !== 'AbortError') onToast?.('No pudimos compartir el link'); // AbortError: el usuario cerró el menú
    }
  }
  const nearby = nearbyStadiums(stadium, stadiums);
  const fewReviews = stats.count > 0 && stats.count < FEW_REVIEWS;
  const tabs = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'resenas', label: 'Reseñas', count: stats.count },
    (photos.length > 1 || stats.fanPhotos.length > 0) && { id: 'fotos', label: 'Fotos' },
    nearby.length > 0 && { id: 'cerca', label: 'Cerca' },
  ].filter(Boolean);
  const wanted = tabPick.id === stadium.id ? tabPick.tab : 'resumen';
  const tab = tabs.some((t) => t.id === wanted) ? wanted : 'resumen';

  const reviewCard = (r, mine) => {
    const author = mine ? 'Vos' : r.user?.username || 'Hincha anónimo';
    const avatarUser = mine ? me : r.user;
    return (
      <button key={r._id} onClick={() => onOpenVisit(r, stadium)} className="block w-full text-left p-4 rounded-2xl gc-focus gc-tap" style={{ backgroundColor: C.surface, border: `1px solid ${mine ? C.brandBright : C.border}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar url={avatarUser?.avatarUrl} name={avatarUser?.username || author} className="w-7 h-7" />
            <span className={`text-sm ${mine ? 'font-semibold' : 'font-medium'}`} style={{ color: mine ? C.brandBright : C.bright }}>{author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={12} fill={C.gold} color={C.gold} />
            <span className="text-xs font-medium" style={{ color: C.gold }}>{r.rating}/10</span>
          </div>
        </div>
        {r.reviewText && (
          <p className="text-sm mt-2 leading-snug break-words" style={{ color: C.muted, ...REVIEW_CLAMP }}>{r.reviewText}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs" style={{ color: C.muted }}>{formatVisitDate(r.visitDate)}</p>
          {r.images?.length > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }} title="Tiene fotos"><Images size={12} /> {r.images.length}</span>
          )}
        </div>
      </button>
    );
  };
  const card = { backgroundColor: C.surface, border: `1px solid ${C.border}` };
  const lastMine = [...myReviews].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))[0];
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />
      {/* Portada: la foto como postal a la izquierda y los datos principales a la derecha */}
      <div className="relative overflow-hidden" style={{ backgroundColor: C.surface }}>
        {photo && <img src={photo.url} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${rgba(C.bg, 0.6)}, ${rgba(C.bg, 0.25)} 45%, ${C.bg})` }} />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 25% 40%, ${rgba(postalA, 0.22)}, transparent 60%)` }} />
        <div className="relative max-w-5xl mx-auto px-4 pt-28 pb-10">
          <button onClick={() => onBack(cameFrom)} aria-label="Volver" className="w-9 h-9 rounded-full flex items-center justify-center gc-focus" style={{ backgroundColor: rgba(C.bg, 0.6) }}>
            <ChevronLeft size={18} color={C.bright} />
          </button>

          <div className="mt-5 grid gap-10 md:grid-cols-[1.1fr_1fr] items-center">
            {/* Postal: al tocarla se abre grande, con inclinación y dorso */}
            <div className="relative w-full max-w-xl mx-auto md:-rotate-1">
              <span aria-hidden="true" className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 rotate-2 z-10" style={{ backgroundColor: rgba(postalA, 0.55) }} />
              <div
                role="button"
                tabIndex={0}
                aria-label="Abrir la postal"
                onClick={() => setPostalOpen(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPostalOpen(true); } }}
                className="cursor-zoom-in transition-transform duration-200 hover:scale-[1.015] gc-focus rounded-md"
              >
                <PostcardFront
                  stadium={stadium}
                  photo={photo}
                  a={postalA}
                  b={postalB}
                  className="aspect-[8/7]"
                  photoOverlay={photos.length > 1 && [[-1, 'left-2', ChevronLeft, 'Foto anterior'], [1, 'right-2', ChevronRight, 'Foto siguiente']].map(([step, side, Icon, label]) => (
                    <button key={step} onClick={(e) => { e.stopPropagation(); goPhoto(step); }} aria-label={label} className={`absolute ${side} top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center gc-focus`} style={{ backgroundColor: rgba(C.bg, 0.6) }}>
                      <Icon size={18} color={C.bright} />
                    </button>
                  ))}
                  captionRight={photos.length > 1 && (
                    <div className="flex gap-1.5 shrink-0">
                      {photos.map((p, i) => (
                        <button key={p.url} onClick={(e) => { e.stopPropagation(); setPhotoIndex(i); }} aria-label={`Ver foto ${i + 1}`} className="w-2 h-2 rounded-full gc-focus" style={{ backgroundColor: i === photoIndex ? '#3B2F1E' : 'rgba(59,47,30,0.3)' }} />
                      ))}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Datos principales */}
            <div className="min-w-0">
              {stadium.status === 'visited' && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 mb-3 rounded-full text-xs font-semibold" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.brandBright }}>
                  <Check size={12} /> Tenés {myReviews.length} {myReviews.length === 1 ? 'reseña' : 'reseñas'}
                </div>
              )}
              {stadium.status === 'wishlist' && (
                <div className="inline-block px-2.5 py-1 mb-3 rounded-full text-xs font-semibold" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.gold }}>
                  En tu lista
                </div>
              )}
              <h1 className="text-5xl md:text-6xl leading-none break-words" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>{stadium.name}</h1>
              {stadium.nickname && <p className="text-xl italic mt-3" style={{ color: C.brandBright }}>“{stadium.nickname}”</p>}
              <div className="mt-6 space-y-4">
                {stadium.clubName && (
                  <div className="flex items-center gap-3.5 min-w-0">
                    {stadium.clubLogoUrl && <img src={stadium.clubLogoUrl} alt="" className="w-14 h-14 object-contain shrink-0" />}
                    <p className="text-2xl font-semibold leading-tight break-words" style={{ color: C.bright }}>{stadium.clubName}</p>
                  </div>
                )}
                <div className="flex items-start gap-3 text-lg leading-snug" style={{ color: C.muted }}>
                  <MapPin size={20} className="shrink-0 mt-0.5" /> <span className="break-words">{stadium.locationLabel}</span>
                </div>
                <div className="flex items-start gap-3 text-lg leading-snug" style={{ color: C.muted }}>
                  <Users size={20} className="shrink-0 mt-0.5" /> <span>{stadium.capacity.toLocaleString('es-AR')} espectadores</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones y datos clave */}
      <div className="max-w-5xl mx-auto px-4 pt-5">
        <div className="flex items-center gap-3">
          <button onClick={() => onStartVisit(stadium)} className="flex-1 py-3 rounded-xl font-semibold text-sm gc-focus" style={{ backgroundColor: C.brand, color: C.bright }}>
            Registrar visita
          </button>
          <button
            onClick={() => onToggleWishlist(stadium.id)}
            disabled={stadium.status === 'visited'}
            className="flex-1 py-3 rounded-xl font-semibold text-sm gc-focus"
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${stadium.status === 'visited' ? C.border : C.gold}`,
              color: stadium.status === 'visited' ? C.border : C.gold,
            }}
          >
            {stadium.status === 'wishlist' ? 'Quitar de la lista' : 'Visitaré próximamente'}
          </button>
          <button onClick={share} aria-label="Compartir estadio" title="Compartir" className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center gc-focus gc-tap" style={{ border: `1px solid ${C.border}`, color: C.bright }}>
            <Share2 size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3 mt-4">
          {keyStats.map(({ Icon, label, value, extra }) => (
            <div key={label} className="flex-1 min-w-[calc(50%-0.5rem)] md:min-w-0 rounded-2xl p-3 md:p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}><Icon size={13} /> {label}</div>
              <div className="text-2xl md:text-3xl font-semibold leading-none mt-2" style={{ color: label === 'Gasto típico' ? C.brandBright : C.bright }}>{value}</div>
              {extra && <div className="mt-2">{extra}</div>}
            </div>
          ))}
        </div>

        <div role="tablist" className="flex gap-1 mt-6 overflow-x-auto gc-hide-scrollbar" style={{ borderBottom: `1px solid ${C.border}` }}>
          {tabs.map(({ id, label, count }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTabPick({ id: stadium.id, tab: id })}
              className="px-4 py-2.5 text-sm font-semibold whitespace-nowrap gc-focus -mb-px"
              style={{ color: tab === id ? C.bright : C.muted, borderBottom: `2px solid ${tab === id ? C.brandBright : 'transparent'}` }}
            >
              {label}{count > 0 && <span className="ml-1.5 text-xs font-normal" style={{ color: C.muted }}>{count.toLocaleString('es-AR')}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'resumen' && (
          <>
          <div className="grid gap-4 md:grid-cols-2 items-stretch">
            <div className="space-y-4 min-w-0">
              {stadium.ownerType === 'province' && (
                <p className="text-sm" style={{ color: C.muted }}>{stadium.province ? `Propiedad de la provincia de ${stadium.province}` : `Propiedad de la ciudad de ${stadium.city}`}</p>
              )}
              {facts.length > 0 && (
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))` }}>
                  {facts.map(({ Icon, label, value }) => (
                    <div key={label} className="px-3 py-3 rounded-xl" style={card}>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}><Icon size={14} /> {label}</div>
                      <p className="text-sm font-semibold mt-1.5 break-words" style={{ color: C.bright }}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
              {stadium.history && (
                <div className="p-5 rounded-2xl" style={card}>
                  <h2 className="text-base font-semibold mb-2" style={{ color: C.bright }}>Historia</h2>
                  <p className="leading-relaxed whitespace-pre-line break-words" style={{ color: C.muted }}>{stadium.history}</p>
                </div>
              )}
              {stadium.otherUses.length > 0 && (
                <div className="p-5 rounded-2xl" style={card}>
                  <h2 className="text-base font-semibold mb-2.5" style={{ color: C.bright }}>Otros usos</h2>
                  <div className="flex flex-wrap gap-2">
                    {stadium.otherUses.map((use) => (
                      <span key={use} className="px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.bright }}>{use}</span>
                    ))}
                  </div>
                </div>
              )}
              {stadium.funFacts.length > 0 && (
                <div>
                  <h2 className="text-base font-semibold mb-2.5" style={{ color: C.bright }}>Datos curiosos</h2>
                  <div className="space-y-2.5">
                    {stadium.funFacts.map((fact, i) => (
                      <div key={fact} className="flex gap-3 p-3.5 rounded-xl" style={card}>
                        <span className="text-xl leading-none shrink-0" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{String(i + 1).padStart(2, '0')}</span>
                        <p className="text-sm break-words" style={{ color: C.muted }}>{fact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 min-w-0">
              <div className="p-5 rounded-2xl flex-[3_3_0%] flex flex-col" style={card}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold" style={{ color: C.bright }}>Gasto típico por visita</span>
                  <span className="text-sm font-semibold" style={{ color: C.brandBright }}>
                    {formatMoney(sumExpenses(stats.medianExpenses), stats.currency)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1 auto-rows-fr">
                  {expenseFields.map(({ key, label, Icon }) => (
                    <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                      <Icon size={14} color={C.muted} />
                      <div className="flex-1">
                        <p className="text-xs" style={{ color: C.muted }}>{label}</p>
                        <p className="text-sm font-medium" style={{ color: C.bright }}>{formatMoney(stats.medianExpenses[key], stats.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {stadium.location?.coordinates?.lat && (
                <div className="p-5 rounded-2xl flex-[7_7_0%] flex flex-col" style={card}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={14} color={C.muted} />
                    <span className="text-sm font-semibold" style={{ color: C.bright }}>Ubicación</span>
                  </div>
                  {stadium.locationLabel && (
                    <p className="text-sm mb-3" style={{ color: C.muted }}>{stadium.locationLabel}</p>
                  )}
                  <div className="relative flex-1 min-h-64 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                    <iframe
                      title={`Mapa de ${stadium.name}`}
                      src={`https://www.google.com/maps?q=${stadium.location.coordinates.lat},${stadium.location.coordinates.lng}&z=16&output=embed`}
                      className="absolute inset-0 w-full h-full block"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <button onClick={openSuggestion} className="mt-5 flex items-center gap-1.5 text-sm gc-focus gc-tap rounded-lg" style={{ color: C.muted }}>
                <PenLine size={14} /> ¿Algo está mal? Sugerir una corrección
              </button>
          </>
        )}

        {tab === 'resenas' && (
          <div className="grid gap-6 md:grid-cols-[320px_1fr] items-stretch">
            <div className="flex flex-col gap-4 min-w-0">
            {/* Puntuación de la comunidad */}
            <div className="p-4 rounded-2xl" style={card}>
              <div className="flex items-center gap-4">
                <div className="text-center shrink-0">
                  <span className="text-4xl" style={{ fontFamily: DISPLAY_FONT, color: C.gold }}>{stats.avg}</span>
                  <p className="text-xs" style={{ color: C.muted }}>/ 10</p>
                </div>
                <div className="flex-1">
                  <StarRow rating={stats.starRating} size={14} />
                  <p className="text-xs mt-1" style={{ color: C.muted }}>{stats.count.toLocaleString('es-AR')} reseñas de la comunidad</p>
                  {fewReviews && (
                    <p className="text-xs mt-0.5" style={{ color: C.gold }}>Basado en solo {stats.count} {stats.count === 1 ? 'reseña' : 'reseñas'}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <ScoreDistribution distribution={stats.distribution} />
              </div>
            </div>


            {/* Adelanto de las fotos de hinchas */}
            {stats.fanPhotos.length > 0 && (
              <div className="p-4 rounded-2xl" style={card}>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.bright }}><Images size={14} color={C.muted} /> Fotos de hinchas</span>
                  <button onClick={() => setTabPick({ id: stadium.id, tab: 'fotos' })} className="text-xs gc-focus rounded" style={{ color: C.brandBright }}>Ver todas</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {stats.fanPhotos.slice(0, 6).map(({ url, visit }) => (
                    <button key={url} onClick={() => onOpenVisit(visit, stadium)} aria-label="Ver la reseña de esta foto" className="aspect-square rounded-lg overflow-hidden gc-focus gc-tap">
                      <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tu última reseña, o una invitación a escribir la primera; ocupa el espacio que sobra para igualar la altura con la lista */}
            {lastMine ? (
              <div className="flex-1 flex flex-col gap-3">
                <button
                  onClick={() => onOpenVisit(lastMine, stadium)}
                  className="relative flex-1 flex flex-col overflow-hidden rounded-2xl text-left gc-focus gc-tap"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.brandBright}` }}
                >
                  {/* Portada: una foto de la reseña o, sin fotos, un fondo con el color y el escudo del club */}
                  <div className="relative h-36 shrink-0" style={{ background: `linear-gradient(135deg, ${rgba(postalA, 0.55)}, ${rgba(postalB, 0.25)})` }}>
                    {lastMine.images?.length > 0 ? (
                      <img src={lastMine.images[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      stadium.clubLogoUrl && <img src={stadium.clubLogoUrl} alt="" aria-hidden="true" className="absolute -right-4 -bottom-6 w-36 h-36 object-contain opacity-30 -rotate-12" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: `linear-gradient(to top, ${C.surface}, transparent)` }} />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: C.brand, color: C.bright }}>Tu última reseña</span>
                    {lastMine.images?.length > 0 && stadium.clubLogoUrl && (
                      <img src={stadium.clubLogoUrl} alt="" className="absolute top-3 right-3 w-11 h-11 object-contain drop-shadow-lg" />
                    )}
                  </div>
                  <div className="px-5 pb-5 flex-1 flex flex-col">
                    <div className="flex items-end justify-between gap-3 -mt-9 relative">
                      <div className="flex items-end gap-3 min-w-0">
                        <div className="p-1 rounded-full shrink-0" style={{ backgroundColor: C.surface }}>
                          <Avatar url={me?.avatarUrl} name={me?.username || 'Vos'} className="w-16 h-16" />
                        </div>
                        <div className="min-w-0 pb-1">
                          <p className="text-xl font-semibold leading-tight break-words" style={{ color: C.bright }}>{me?.username || 'Vos'}</p>
                          <p className="text-xs" style={{ color: C.muted }}>{formatVisitDate(lastMine.visitDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pb-1 shrink-0">
                        <Star size={18} fill={C.gold} color={C.gold} />
                        <span className="text-2xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.gold }}>{lastMine.rating}<span className="text-sm" style={{ color: C.muted }}>/10</span></span>
                      </div>
                    </div>
                    {lastMine.reviewText && (
                      <p className="text-sm mt-4 leading-relaxed break-words" style={{ color: C.muted, ...REVIEW_CLAMP, WebkitLineClamp: 5 }}>{lastMine.reviewText}</p>
                    )}
                    {lastMine.images?.length > 1 && (
                      <span className="flex items-center gap-1 text-xs mt-3" style={{ color: C.muted }}><Images size={12} /> {lastMine.images.length} fotos</span>
                    )}
                  </div>
                </button>
                <button onClick={() => onStartVisit(stadium)} className="py-2.5 rounded-xl font-semibold text-sm gc-focus" style={{ backgroundColor: C.brand, color: C.bright }}>
                  Registrar otra visita
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-2xl flex-1 flex flex-col items-center justify-center text-center gap-2" style={card}>
                <PenLine size={22} color={C.brandBright} />
                <p className="text-base font-semibold" style={{ color: C.bright }}>¿Estuviste en {stadium.name}?</p>
                <p className="text-sm" style={{ color: C.muted }}>Sumá tu reseña y ayudá a otros hinchas a planear su visita.</p>
                <button onClick={() => onStartVisit(stadium)} className="mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm gc-focus" style={{ backgroundColor: C.brand, color: C.bright }}>
                  Registrar visita
                </button>
              </div>
            )}
            </div>

            <div className="min-w-0">
              <div className="space-y-3">
                {reviewsLoading ? (
                  <p className="text-sm text-center py-4" style={{ color: C.muted }}>Cargando reseñas...</p>
                ) : (
                  pageReviews.map((r) => reviewCard(r, isMine(r)))
                )}
                {!reviewsLoading && stadiumReviews.length === 0 && (
                  <p className="text-sm text-center py-6" style={{ color: C.muted }}>
                    Aún no hay reseñas para este estadio. ¡Sé el primero!
                  </p>
                )}
              </div>
              {!reviewsLoading && (
                <AdminPagination page={reviewsPageSafe} total={orderedReviews.length} onChange={setReviewsPage} pageSize={REVIEWS_PAGE_SIZE} />
              )}
            </div>
          </div>
        )}

        {tab === 'fotos' && (
          <div className="space-y-8">
            {photos.length > 1 && (
              <div>
                <h2 className="text-base font-semibold mb-3" style={{ color: C.bright }}>Galería</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map((p, i) => (
                    <button
                      key={p.url}
                      onClick={() => { setPhotoIndex(i); scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      aria-label={`Ver foto ${i + 1} arriba`}
                      className="aspect-[4/3] rounded-xl overflow-hidden gc-focus gc-tap"
                      style={{ border: `2px solid ${i === photoIndex ? C.brandBright : 'transparent'}` }}
                    >
                      <img src={p.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {stats.fanPhotos.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold mb-3" style={{ color: C.bright }}><Images size={15} color={C.muted} /> Fotos de hinchas</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {stats.fanPhotos.map(({ url, visit }) => (
                    <button key={url} onClick={() => onOpenVisit(visit, stadium)} aria-label="Ver la reseña de esta foto" className="aspect-square rounded-xl overflow-hidden gc-focus gc-tap">
                      <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'cerca' && (
          <div>
            <h2 className="text-base font-semibold mb-3" style={{ color: C.bright }}>Estadios a menos de 100 km</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {nearby.map(({ stadium: near, km }) => (
                <button key={near.id} onClick={() => onOpenStadium(near)} className="text-left rounded-2xl overflow-hidden gc-focus gc-tap" style={card}>
                  <div className="relative h-32">
                    {near.imageUrl ? (
                      <img src={near.imageUrl} alt={near.name} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <StadiumArt tone={near.tone} uid={`near-${near.id}`} className="w-full h-full" />
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: rgba(C.bg, 0.75), color: C.brandBright }}>
                      {km < 1 ? '< 1 km' : `${Math.round(km)} km`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3">
                    {near.clubLogoUrl && <img src={near.clubLogoUrl} alt={near.clubName} loading="lazy" className="w-10 h-10 object-contain shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: C.bright }}>{near.name}</p>
                      <p className="text-xs truncate" style={{ color: C.muted }}>{near.clubName || near.locationLabel}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {postalOpen && <PostcardViewer stadium={stadium} photo={photo} a={postalA} b={postalB} onClose={() => setPostalOpen(false)} />}
      {suggestOpen && <SuggestionModal stadium={stadium} onClose={() => setSuggestOpen(false)} onToast={onToast} />}
    </div>
  );
}
