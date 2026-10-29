import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Users, Star, MapPin, Images, Calendar, Ruler, Sprout, Activity, Share2, PenLine } from 'lucide-react';
import { C, rgba, DISPLAY_FONT, formatMoney, sumExpenses } from '../theme';
import { useAuth } from '../context/AuthContext';
import visitService from '../services/visitService';
import { computeVisitStats, FEW_REVIEWS } from '../utils/visitStats';
import { nearbyStadiums } from '../utils/distance';
import { stadiumPath } from '../utils/stadiumUrl';
import StadiumArt from './StadiumArt';
import StarRow from './StarRow';
import ScoreDistribution from './ScoreDistribution';
import Navbar from './Navbar';
import SuggestionModal from './SuggestionModal';
import AdminPagination, { paginate, clampPage } from './admin/AdminPagination';

// Cantidad elegida para que la columna de reseñas llegue a la altura de la columna izquierda
const REVIEWS_PAGE_SIZE = 7;
const FAN_PHOTOS_SHOWN = 8;

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
  const [stadiumReviews, setStadiumReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [suggestOpen, setSuggestOpen] = useState(false);
  // La foto elegida se guarda con el id del estadio: al cambiar de estadio vuelve sola a la portada
  const [photoPick, setPhotoPick] = useState({ id: stadium.id, index: 0 });
  const photoIndex = photoPick.id === stadium.id ? photoPick.index : 0;
  const setPhotoIndex = (index) => setPhotoPick({ id: stadium.id, index });

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
  const facts = techFacts(stadium);

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
  return (
    <div className="flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />
      <div className="relative h-[calc(7rem+300px)] md:h-[calc(7rem+320px)] overflow-hidden" style={{ backgroundColor: C.surface }}>
        {photo ? (
          <>
            {/* Fondo: la misma foto desenfocada que llena el espacio sin verse estirada */}
            <img src={photo.url} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-60" />
            {/* Foto completa, sin recortar ni estirar */}
            <div className="absolute top-28 inset-x-0 bottom-0 flex items-center justify-center p-4 pb-8">
              <img src={photo.url} alt={stadium.name} className="max-w-full max-h-full object-contain rounded-xl" />
            </div>
            {photos.length > 1 && (
              <>
                {[[-1, 'left-3', ChevronLeft, 'Foto anterior'], [1, 'right-3', ChevronRight, 'Foto siguiente']].map(([step, side, Icon, label]) => (
                  <button key={step} onClick={() => goPhoto(step)} aria-label={label} className={`absolute ${side} top-[calc(50%+3.5rem)] -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center gc-focus`} style={{ backgroundColor: rgba(C.bg, 0.6) }}>
                    <Icon size={18} color={C.bright} />
                  </button>
                ))}
                <div className="absolute bottom-3 inset-x-0 z-10 flex justify-center gap-1.5">
                  {photos.map((p, i) => (
                    <button key={p.url} onClick={() => setPhotoIndex(i)} aria-label={`Ver foto ${i + 1}`} className="w-2 h-2 rounded-full gc-focus" style={{ backgroundColor: i === photoIndex ? C.bright : rgba(C.bright, 0.35) }} />
                  ))}
                </div>
              </>
            )}
            {photo.credit && (
              <p className="absolute bottom-3 left-4 z-10 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: rgba(C.bg, 0.6), color: C.muted }}>{photo.credit}</p>
            )}
            <div className="absolute inset-x-0 bottom-0 h-24" style={{ background: `linear-gradient(to top, ${C.bg}, transparent)` }} />
          </>
        ) : (
          <StadiumArt tone={stadium.tone} uid={`page-${stadium.id}`} className="w-full h-full" />
        )}
        <button onClick={() => onBack(cameFrom)} className="absolute top-20 md:top-32 left-4 w-9 h-9 rounded-full flex items-center justify-center gc-focus" style={{ backgroundColor: rgba(C.bg, 0.6) }}>
          <ChevronLeft size={18} color={C.bright} />
        </button>
        {stadium.status === 'visited' && (
          <div className="hidden min-[800px]:flex absolute top-32 right-4 px-2.5 py-1 rounded-full text-xs font-semibold items-center gap-1" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.brandBright }}>
            <Check size={12} /> Tenés {myReviews.length} {myReviews.length === 1 ? 'reseña' : 'reseñas'}
          </div>
        )}
        {stadium.status === 'wishlist' && (
          <div className="hidden min-[800px]:block absolute top-32 right-4 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.gold }}>
            En tu lista
          </div>
        )}
      </div>

      {/* Por debajo de 800px el cartel no entra sobre la foto: se muestra aparte, debajo */}
      {stadium.status === 'visited' && (
        <div className="min-[800px]:hidden px-4 pt-3 flex">
          <div className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.brandBright }}>
            <Check size={12} /> Tenés {myReviews.length} {myReviews.length === 1 ? 'reseña' : 'reseñas'}
          </div>
        </div>
      )}
      {stadium.status === 'wishlist' && (
        <div className="min-[800px]:hidden px-4 pt-3 flex">
          <div className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.gold }}>
            En tu lista
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-5 grid gap-8 md:grid-cols-[1fr_380px] items-start">
        <div className="min-w-0">
          <h1 className="text-4xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>{stadium.name}</h1>
          {stadium.nickname && (
            <p className="text-lg italic mt-1" style={{ color: C.brandBright }}>“{stadium.nickname}”</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {stadium.clubLogoUrl && (
              <img src={stadium.clubLogoUrl} alt={stadium.clubName} className="w-12 h-12 rounded-full object-cover shrink-0" style={{ backgroundColor: C.surface, border: `2px solid ${C.border}` }} />
            )}
            <div className="min-w-0">
              {stadium.clubName && (
                <p className="text-xl font-semibold truncate" style={{ color: C.bright }}>{stadium.clubName}</p>
              )}
              <p className="text-sm" style={{ color: C.muted }}>{stadium.locationLabel}</p>
              {stadium.ownerType === 'province' && (
                <p className="text-sm" style={{ color: C.muted }}>{stadium.province ? `Propiedad de la provincia de ${stadium.province}` : `Propiedad de la ciudad de ${stadium.city}`}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <Users size={15} color={C.muted} />
            <span className="text-sm" style={{ color: C.muted }}>{stadium.capacity.toLocaleString('es-AR')} espectadores</span>
          </div>

          <div className="flex items-center gap-3 mt-5">
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

          {/* Ficha técnica */}
          {facts.length > 0 && (
            <div className="mt-7 grid grid-cols-2 gap-3">
              {facts.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                  <Icon size={16} color={C.muted} />
                  <div>
                    <p className="text-xs" style={{ color: C.muted }}>{label}</p>
                    <p className="text-sm font-medium" style={{ color: C.bright }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Historia, datos curiosos y otros usos */}
          {(stadium.history || stadium.funFacts.length > 0 || stadium.otherUses.length > 0) && (
            <div className="mt-4 p-4 rounded-2xl space-y-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              {stadium.history && (
                <div>
                  <h2 className="text-sm font-semibold mb-1.5" style={{ color: C.bright }}>Historia</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-line break-words" style={{ color: C.muted }}>{stadium.history}</p>
                </div>
              )}
              {stadium.funFacts.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-1.5" style={{ color: C.bright }}>Datos curiosos</h2>
                  <ul className="list-disc pl-5 space-y-1 text-sm break-words" style={{ color: C.muted }}>
                    {stadium.funFacts.map((fact) => <li key={fact}>{fact}</li>)}
                  </ul>
                </div>
              )}
              {stadium.otherUses.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-1.5" style={{ color: C.bright }}>Otros usos</h2>
                  <div className="flex flex-wrap gap-2">
                    {stadium.otherUses.map((use) => (
                      <span key={use} className="px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.bright }}>{use}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Puntuación de la comunidad */}
          <div className="mt-7 p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
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

          {/* Gasto promedio */}
          <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: C.bright }}>Gasto típico por visita</span>
              <span className="text-sm font-semibold" style={{ color: C.brandBright }}>
                {formatMoney(sumExpenses(stats.medianExpenses), stats.currency)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
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

          {/* Fotos que subieron los hinchas en sus reseñas */}
          {stats.fanPhotos.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Images size={14} color={C.muted} />
                <span className="text-sm font-semibold" style={{ color: C.bright }}>Fotos de hinchas</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {stats.fanPhotos.slice(0, FAN_PHOTOS_SHOWN).map(({ url, visit }) => (
                  <button key={url} onClick={() => onOpenVisit(visit, stadium)} aria-label="Ver la reseña de esta foto" className="aspect-square rounded-lg overflow-hidden gc-focus gc-tap">
                    <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              {stats.fanPhotos.length > FAN_PHOTOS_SHOWN && (
                <p className="text-xs mt-2" style={{ color: C.muted }}>y {stats.fanPhotos.length - FAN_PHOTOS_SHOWN} más en las reseñas</p>
              )}
            </div>
          )}

          {/* Mapa con la ubicación del estadio */}
          {stadium.location?.coordinates?.lat && (
            <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} color={C.muted} />
                <span className="text-sm font-semibold" style={{ color: C.bright }}>Ubicación</span>
              </div>
              {stadium.locationLabel && (
                <p className="text-sm mb-3" style={{ color: C.muted }}>{stadium.locationLabel}</p>
              )}
              <div className="relative h-64 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
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

          <button onClick={openSuggestion} className="mt-4 flex items-center gap-1.5 text-sm gc-focus gc-tap rounded-lg" style={{ color: C.muted }}>
            <PenLine size={14} /> ¿Algo está mal? Sugerir una corrección
          </button>

          {/* Otros estadios a menos de 100 km */}
          {nearby.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: C.bright }}>Estadios cercanos</h2>
              <div className="space-y-2">
                {nearby.map(({ stadium: near, km }) => (
                  <button key={near.id} onClick={() => onOpenStadium(near)} className="w-full flex items-center gap-3 p-2 rounded-xl text-left gc-focus gc-tap" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                    {near.clubLogoUrl ? (
                      <img src={near.clubLogoUrl} alt={near.clubName} loading="lazy" className="w-12 h-12 rounded-full object-cover shrink-0" style={{ backgroundColor: C.surface, border: `2px solid ${C.border}` }} />
                    ) : (
                      <div className="w-12 h-12 rounded-full shrink-0" style={{ backgroundColor: C.border }} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: C.bright }}>{near.name}</p>
                      <p className="text-xs truncate" style={{ color: C.muted }}>{near.clubName || near.locationLabel}</p>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: C.brandBright }}>{km < 1 ? '< 1 km' : `${Math.round(km)} km`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reseñas: columna propia a la derecha */}
        <aside className="min-w-0">
          <h2 className="text-lg font-semibold mb-3" style={{ color: C.bright }}>Reseñas</h2>
          <div className="space-y-3">
            {pageReviews.filter(isMine).map((r) => (
              <button key={`mine-${r._id}`} onClick={() => onOpenVisit(r, stadium)} className="block w-full text-left p-3.5 rounded-2xl gc-focus gc-tap" style={{ backgroundColor: C.surface, border: `1px solid ${C.brandBright}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar url={me?.avatarUrl} name={me?.username || 'Vos'} className="w-6 h-6" />
                    <span className="text-sm font-semibold" style={{ color: C.brandBright }}>Vos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} fill={C.gold} color={C.gold} />
                    <span className="text-xs font-medium" style={{ color: C.gold }}>{r.rating}/10</span>
                  </div>
                </div>
                {r.reviewText && (
                  <p className="text-sm mt-1.5 leading-snug break-words" style={{ color: C.muted, ...REVIEW_CLAMP }}>{r.reviewText}</p>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs" style={{ color: C.muted }}>{formatVisitDate(r.visitDate)}</p>
                  {r.images?.length > 0 && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }} title="Tiene fotos"><Images size={12} /> {r.images.length}</span>
                  )}
                </div>
              </button>
            ))}
            {reviewsLoading ? (
              <p className="text-sm text-center py-4" style={{ color: C.muted }}>Cargando reseñas...</p>
            ) : (
              pageReviews.filter((r) => !isMine(r)).map((r) => {
                const author = r.user?.username || 'Hincha anónimo';
                return (
                  <button key={r._id} onClick={() => onOpenVisit(r, stadium)} className="block w-full text-left p-3.5 rounded-2xl gc-focus gc-tap" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar url={r.user?.avatarUrl} name={author} className="w-6 h-6" />
                        <span className="text-sm font-medium" style={{ color: C.bright }}>{author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} fill={C.gold} color={C.gold} />
                        <span className="text-xs font-medium" style={{ color: C.gold }}>{r.rating}/10</span>
                      </div>
                    </div>
                    {r.reviewText && (
                      <p className="text-sm mt-1.5 leading-snug break-words" style={{ color: C.muted, ...REVIEW_CLAMP }}>{r.reviewText}</p>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs" style={{ color: C.muted }}>{formatVisitDate(r.visitDate)}</p>
                      {r.images?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }} title="Tiene fotos"><Images size={12} /> {r.images.length}</span>
                      )}
                    </div>
                  </button>
                );
              })
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
        </aside>
      </div>
      {suggestOpen && <SuggestionModal stadium={stadium} onClose={() => setSuggestOpen(false)} onToast={onToast} />}
    </div>
  );
}
