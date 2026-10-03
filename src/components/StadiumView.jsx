import { useEffect, useState } from 'react';
import { ChevronLeft, Check, Users, Star } from 'lucide-react';
import { C, rgba, DISPLAY_FONT, formatMoney, sumExpenses } from '../theme';
import { useAuth } from '../context/AuthContext';
import visitService from '../services/visitService';
import { computeVisitStats } from '../utils/visitStats';
import StadiumArt from './StadiumArt';
import StarRow from './StarRow';
import ScoreDistribution from './ScoreDistribution';
import Navbar from './Navbar';
import AdminPagination, { paginate, clampPage } from './admin/AdminPagination';

const REVIEWS_PAGE_SIZE = 5;

function formatVisitDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
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
  stadium, expenseFields, cameFrom, onBack, onStartVisit, onToggleWishlist, navbarProps,
}) {
  const { user: me } = useAuth();
  const [stadiumReviews, setStadiumReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);

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
  return (
    <div className="flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />
      <div className="relative h-[400px] md:h-[460px]">
        {stadium.imageUrl ? (
          <>
            <img src={stadium.imageUrl} alt={stadium.name} className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-24" style={{ background: `linear-gradient(to top, ${C.bg}, transparent)` }} />
          </>
        ) : (
          <StadiumArt tone={stadium.tone} uid={`page-${stadium.id}`} className="w-full h-full" />
        )}
        <button onClick={() => onBack(cameFrom)} className="absolute top-24 left-4 w-9 h-9 rounded-full flex items-center justify-center gc-focus" style={{ backgroundColor: rgba(C.bg, 0.6) }}>
          <ChevronLeft size={18} color={C.bright} />
        </button>
        {stadium.status === 'visited' && (
          <div className="absolute top-24 right-4 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.brandBright }}>
            <Check size={12} /> Tenés {myReviews.length} {myReviews.length === 1 ? 'reseña' : 'reseñas'}
          </div>
        )}
        {stadium.status === 'wishlist' && (
          <div className="absolute top-24 right-4 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: rgba(C.bg, 0.7), color: C.gold }}>
            En tu lista
          </div>
        )}
      </div>


      <div className="max-w-5xl mx-auto px-4 py-5 grid gap-8 md:grid-cols-[1fr_380px] items-start">
        <div className="min-w-0">
          <h1 className="text-4xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>{stadium.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            {stadium.clubLogoUrl && (
              <img src={stadium.clubLogoUrl} alt={stadium.clubName} className="w-12 h-12 rounded-full object-cover shrink-0" style={{ backgroundColor: C.surface, border: `2px solid ${C.border}` }} />
            )}
            <div className="min-w-0">
              {stadium.clubName && (
                <p className="text-xl font-semibold truncate" style={{ color: C.bright }}>{stadium.clubName}</p>
              )}
              <p className="text-sm" style={{ color: C.muted }}>{stadium.locationLabel}</p>
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
          </div>

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
              </div>
            </div>
            <div className="mt-4">
              <ScoreDistribution distribution={stats.distribution} />
            </div>
          </div>

          {/* Gasto promedio */}
          <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: C.bright }}>Gasto promedio por visita</span>
              <span className="text-sm font-semibold" style={{ color: C.brandBright }}>
                {formatMoney(sumExpenses(stats.avgExpenses), stats.currency)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {expenseFields.map(({ key, label, Icon }) => (
                <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                  <Icon size={14} color={C.muted} />
                  <div className="flex-1">
                    <p className="text-xs" style={{ color: C.muted }}>{label}</p>
                    <p className="text-sm font-medium" style={{ color: C.bright }}>{formatMoney(stats.avgExpenses[key], stats.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reseñas: columna propia a la derecha */}
        <aside className="min-w-0 md:sticky md:top-6 md:max-h-[calc(100vh-3rem)] md:overflow-y-auto gc-hide-scrollbar">
          <h2 className="text-lg font-semibold mb-3" style={{ color: C.bright }}>Reseñas</h2>
          <div className="space-y-3">
            {pageReviews.filter(isMine).map((r) => (
              <div key={`mine-${r._id}`} className="p-3.5 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.brandBright}` }}>
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
                  <p className="text-sm mt-1.5 leading-snug" style={{ color: C.muted }}>{r.reviewText}</p>
                )}
                <p className="text-xs mt-1.5" style={{ color: C.muted }}>{formatVisitDate(r.visitDate)}</p>
              </div>
            ))}
            {reviewsLoading ? (
              <p className="text-sm text-center py-4" style={{ color: C.muted }}>Cargando reseñas...</p>
            ) : (
              pageReviews.filter((r) => !isMine(r)).map((r) => {
                const author = r.user?.username || 'Hincha anónimo';
                return (
                  <div key={r._id} className="p-3.5 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
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
                      <p className="text-sm mt-1.5 leading-snug" style={{ color: C.muted }}>{r.reviewText}</p>
                    )}
                    <p className="text-xs mt-1.5" style={{ color: C.muted }}>{formatVisitDate(r.visitDate)}</p>
                  </div>
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
    </div>
  );
}
