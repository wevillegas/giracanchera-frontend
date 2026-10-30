import logoIcon from '../assets/giracanchera-icono.svg';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronDown, Activity, MapPin, Star, Users, Flag, Wallet, Shield } from 'lucide-react';
import { C, rgba, DISPLAY_FONT, formatMoney } from '../theme';
import { isAdminRole } from '../utils/roles';
import statsService from '../services/statsService';
import Navbar from './Navbar';
import { Logo } from './ClubPicker';
import StadiumArt from './StadiumArt';
import AdminStatsView from './admin/AdminStatsView';
import AdminPagination, { paginate, clampPage } from './admin/AdminPagination';
import FilterDropdown from './admin/FilterDropdown';
import { useAuth } from '../context/AuthContext';

// Elementos por página de cada lista, para que no crezcan sin límite cuando haya más datos
const FANS_PAGE_SIZE = 10;
const EMPTY_CLUBS_PAGE_SIZE = 30;
const STADIUMS_PAGE_SIZE = 6; // grilla de 3 por 2
const RANKING_PAGE_SIZE = 5;
const PLACES_PAGE_SIZE = 8;
const NO_COUNTRY = '__none__';
const card = { backgroundColor: C.surface, border: `1px solid ${C.border}` };
const SILVER = '#C0C7D0';
const BRONZE = '#CD7F32';
// Cada puesto tiene su tamaño: el 1.º es el más grande, el 2.º intermedio y el 3.º el más chico
const PODIUM_SIZE = {
  1: { box: 'pt-6 pb-6 sm:pt-8 sm:pb-8', shield: 'w-16 h-16 sm:w-28 sm:h-28', fans: 'text-5xl sm:text-7xl', name: 'text-sm sm:text-lg' },
  2: { box: 'pt-5 pb-5 sm:pt-7 sm:pb-7', shield: 'w-14 h-14 sm:w-24 sm:h-24', fans: 'text-4xl sm:text-6xl', name: 'text-xs sm:text-base' },
  3: { box: 'pt-3.5 pb-3.5 sm:pt-5 sm:pb-5', shield: 'w-11 h-11 sm:w-[4.5rem] sm:h-[4.5rem]', fans: 'text-3xl sm:text-5xl', name: 'text-xs sm:text-sm' },
};

const Section = ({ title, subtitle, children }) => (
  <section className="mt-12">
    <h2 className="text-2xl sm:text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>{title}</h2>
    {subtitle && <p className="text-sm mt-2" style={{ color: C.muted }}>{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const Empty = () => <p className="text-sm" style={{ color: C.muted }}>Todavía no hay datos suficientes.</p>;
const fansLabel = (n) => `${n} ${n === 1 ? 'hincha' : 'hinchas'}`;

// Escudo del club en un tamaño que se achica en pantallas chicas; sin escudo, la inicial
function Shield2({ club, className }) {
  return club.logoUrl ? (
    <img src={club.logoUrl} alt="" className={`${className} object-contain drop-shadow-lg`} />
  ) : (
    <div className={`${className} rounded-full flex items-center justify-center font-semibold`} style={{ backgroundColor: C.border, color: C.bright }}>
      {club.name.charAt(0).toUpperCase()}
    </div>
  );
}

// Podio: el primero al centro y más grande, el segundo a su izquierda y el tercero a su derecha
function PodiumCard({ club, place }) {
  const first = place === 1;
  const size = PODIUM_SIZE[place];
  const accent = { 1: C.gold, 2: SILVER, 3: BRONZE }[place];
  return (
    <div
      className={`relative rounded-2xl text-center flex flex-col items-center justify-end px-2 sm:px-4 ${size.box}`}
      style={{ backgroundColor: C.surface, border: `1px solid ${first ? accent : C.border}`, boxShadow: first ? `0 0 40px ${rgba(accent, 0.18)}` : 'none' }}
    >
      <span
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: accent, color: C.bg, fontFamily: DISPLAY_FONT }}
      >
        {place}
      </span>
      <Shield2 club={club} className={size.shield} />
      <p className={`mt-3 leading-none ${size.fans}`} style={{ fontFamily: DISPLAY_FONT, color: accent }}>{club.fans}</p>
      <p className="text-xs mt-1" style={{ color: C.muted }}>{club.fans === 1 ? 'hincha' : 'hinchas'}</p>
      <p className={`mt-2 font-semibold leading-tight break-words ${size.name}`} style={{ color: C.bright }}>{club.name}</p>
    </div>
  );
}

// Fila del ranking con posición, escudo, nombre, barra proporcional y valor
function BarRow({ position, club, max }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: `1px solid ${C.border}` }}>
      <span className="w-6 text-center text-sm font-semibold shrink-0" style={{ color: C.muted }}>{position}</span>
      <Logo url={club.logoUrl} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold break-words" style={{ color: C.bright }}>{club.name}</p>
        <div className="h-1.5 rounded-full mt-2" style={{ backgroundColor: C.bg }}>
          <div className="h-full rounded-full" style={{ width: `${(club.fans / max) * 100}%`, backgroundColor: C.brandBright }} />
        </div>
      </div>
      <span className="text-sm font-semibold shrink-0" style={{ color: C.brandBright }}>{fansLabel(club.fans)}</span>
    </div>
  );
}

// Fila con posición, nombre y un valor a la derecha
function RankRow({ position, title, subtitle, logoUrl, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: position === 1 ? 'none' : `1px solid ${C.border}` }}>
      <span className="w-6 text-center text-sm font-semibold shrink-0" style={{ color: C.muted }}>{position}</span>
      {logoUrl !== undefined && <Logo url={logoUrl} size={28} />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold break-words" style={{ color: C.bright }}>{title}</p>
        {subtitle && <p className="text-xs" style={{ color: C.muted }}>{subtitle}</p>}
      </div>
      <span className="text-sm font-semibold shrink-0" style={{ color: C.brandBright }}>{value}</span>
    </div>
  );
}

export default function StatsView({ onBackToMap, navbarProps }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);
  const [fansPage, setFansPage] = useState(1);
  const [fansCountry, setFansCountry] = useState('');
  const [showEmpty, setShowEmpty] = useState(false);
  const [emptyPage, setEmptyPage] = useState(1);
  const [stadiumsPage, setStadiumsPage] = useState(1);
  const [ratedPage, setRatedPage] = useState(1);
  const [placesPage, setPlacesPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    statsService.getPublicStats()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  const totals = stats?.totals;
  // Filtro por país ('' = todos, NO_COUNTRY = clubes sin estadio cargado); el podio y el ranking lo respetan
  const clubFans = stats?.clubFans || [];
  const fansCountries = [...new Set(clubFans.map((c) => c.country).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const hasNoCountry = clubFans.some((c) => !c.country);
  const inCountry = clubFans.filter((c) => {
    if (!fansCountry) return true;
    return fansCountry === NO_COUNTRY ? !c.country : c.country === fansCountry;
  });
  const withFans = inCountry.filter((c) => c.fans > 0);
  const withoutFans = inCountry.filter((c) => c.fans === 0);
  const podium = withFans.slice(0, 3);
  const rest = withFans.slice(3);
  const maxFans = Math.max(1, ...withFans.map((c) => c.fans));
  const clubsWithFans = clubFans.filter((c) => c.fans > 0).length;
  const topReviewed = stats?.topReviewed || [];
  const topRated = stats?.topRated || [];
  const byPlace = stats?.byPlace || [];
  const maxPlaceReviews = Math.max(1, ...byPlace.map((p) => p.reviews));
  // Página efectiva de cada lista: nunca pasa de la última aunque los datos cambien
  const pageOf = (page, total, size) => clampPage(page, total, size);
  const emptyPageNow = pageOf(emptyPage, withoutFans.length, EMPTY_CLUBS_PAGE_SIZE);
  const stadiumsPageNow = pageOf(stadiumsPage, topReviewed.length, STADIUMS_PAGE_SIZE);
  const ratedPageNow = pageOf(ratedPage, topRated.length, RANKING_PAGE_SIZE);
  const placesPageNow = pageOf(placesPage, byPlace.length, PLACES_PAGE_SIZE);

  const tiles = [
    { label: 'Hinchas', value: totals?.users, Icon: Users, big: true },
    { label: 'Clubes con hinchas', value: stats ? `${clubsWithFans} de ${totals.clubs}` : undefined, Icon: Shield },
    { label: 'Reseñas', value: totals?.reviews, Icon: Star },
    { label: 'Estadios', value: totals?.stadiums, Icon: MapPin },
  ];

  return (
    <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />
      <div className="max-w-5xl mx-auto px-4 pt-24 sm:pt-28 pb-10">
        <button onClick={onBackToMap} aria-label="Volver al mapa" className="w-9 h-9 rounded-full flex items-center justify-center gc-focus gc-tap" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <ChevronLeft size={18} color={C.bright} />
        </button>

        <header className="relative mt-4 sm:mt-5 rounded-3xl overflow-hidden p-6 sm:p-10" style={card}>
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 85% 0%, ${rgba(C.brandBright, 0.22)}, transparent 55%), radial-gradient(circle at 0% 100%, ${rgba(C.gold, 0.1)}, transparent 50%)` }} />
          <div className="relative flex items-center gap-4 sm:gap-5">
            <img src={logoIcon} alt="" className="w-14 h-14 sm:w-20 sm:h-20 object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-4xl sm:text-6xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>Estadísticas</h1>
              <p className="text-sm sm:text-base mt-2 max-w-xl" style={{ color: C.muted }}>Lo que está pasando en la comunidad de GiraCanchera, con datos de todos los hinchas.</p>
            </div>
          </div>

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {tiles.map(({ label, value, Icon, big }) => (
              <div key={label} className="rounded-2xl p-3.5 sm:p-4" style={{ backgroundColor: C.bg, border: `1px solid ${big ? C.brandBright : C.border}` }}>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}><Icon size={13} /> {label}</div>
                <p className="text-3xl sm:text-4xl leading-none mt-2" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{typeof value === 'number' ? value.toLocaleString('es-AR') : value ?? '—'}</p>
              </div>
            ))}
          </div>
          <div className="relative flex flex-wrap gap-x-6 gap-y-1.5 mt-4 text-sm" style={{ color: C.muted }}>
            <span className="flex items-center gap-1.5"><Activity size={14} /> Puntaje promedio: <strong style={{ color: C.bright }}>{totals ? `${totals.avgRating}/10` : '—'}</strong></span>
            <span className="flex items-center gap-1.5"><Wallet size={14} /> Gasto mediano por visita: <strong style={{ color: C.bright }}>{totals ? formatMoney(totals.avgExpense) : '—'}</strong></span>
          </div>
        </header>

        {error && <p className="text-sm mt-6" style={{ color: C.muted }}>No pudimos cargar las estadísticas. Probá de nuevo más tarde.</p>}

        {stats && (
          <>
            <Section title="Hinchas por club" subtitle="Cuántos hinchas se anotaron con cada club en su perfil.">
              {(fansCountries.length > 1 || hasNoCountry) && (
                <FilterDropdown
                  className="mb-5 inline-block"
                  value={fansCountry}
                  onChange={(v) => { setFansCountry(v); setFansPage(1); }}
                  ariaLabel="Filtrar por país"
                  options={[{ value: '', label: 'Todos los países' }, ...fansCountries.map((country) => ({ value: country, label: country })), ...(hasNoCountry ? [{ value: NO_COUNTRY, label: 'Sin país' }] : [])]}
                />
              )}

              {withFans.length === 0 ? (
                <div className="p-5 rounded-2xl" style={card}><Empty /></div>
              ) : (
                <>
                  {/* Orden visual: 2.º, 1.º, 3.º */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-3 max-w-3xl mx-auto">
                    {[podium[1], podium[0], podium[2]].map((club, i) => (club
                      ? <PodiumCard key={club.id} club={club} place={[2, 1, 3][i]} />
                      : <div key={`empty-${i}`} />))}
                  </div>

                  {rest.length > 0 && (
                    <>
                      <div className="rounded-2xl overflow-hidden mt-6" style={card}>
                        {paginate(rest, fansPage, FANS_PAGE_SIZE).map((club, i) => (
                          <BarRow key={club.id} position={4 + (fansPage - 1) * FANS_PAGE_SIZE + i} club={club} max={maxFans} />
                        ))}
                      </div>
                      <AdminPagination page={fansPage} total={rest.length} pageSize={FANS_PAGE_SIZE} onChange={setFansPage} />
                    </>
                  )}
                </>
              )}

              {withoutFans.length > 0 && (
                <div className="mt-5">
                  <button
                    onClick={() => { setShowEmpty((v) => !v); setEmptyPage(1); }}
                    aria-expanded={showEmpty}
                    className="flex items-center gap-1.5 text-sm gc-focus rounded-lg"
                    style={{ color: C.muted }}
                  >
                    <ChevronDown size={16} className={`transition-transform ${showEmpty ? 'rotate-180' : ''}`} />
                    {showEmpty ? 'Ocultar' : 'Ver'} los {withoutFans.length} clubes sin hinchas todavía
                  </button>
                  {showEmpty && (
                    <>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {paginate(withoutFans, emptyPageNow, EMPTY_CLUBS_PAGE_SIZE).map((club) => (
                          <span key={club.id} className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full text-xs" style={{ ...card, color: C.bright }}>
                            <Logo url={club.logoUrl} size={22} /> {club.name}
                          </span>
                        ))}
                      </div>
                      <AdminPagination page={emptyPageNow} total={withoutFans.length} pageSize={EMPTY_CLUBS_PAGE_SIZE} onChange={setEmptyPage} />
                    </>
                  )}
                </div>
              )}
            </Section>

            <Section title="Estadios más reseñados">
              {topReviewed.length === 0 ? <Empty /> : (
                <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paginate(topReviewed, stadiumsPageNow, STADIUMS_PAGE_SIZE).map((s, index) => {
                    const i = (stadiumsPageNow - 1) * STADIUMS_PAGE_SIZE + index; // puesto real, no el de la página
                    return (
                    <div key={s.id} className="rounded-2xl overflow-hidden flex flex-col" style={card}>
                      <div className="relative h-28 shrink-0" style={{ backgroundColor: C.bg }}>
                        {s.imageUrl
                          ? <img src={s.imageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                          : <StadiumArt tone="brand" uid={`stats-${s.id}`} className="absolute inset-0 w-full h-full" />}
                        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${rgba(C.surface, 0.95)} 0%, transparent 70%)` }} />
                        <span className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: i === 0 ? C.gold : rgba(C.bg, 0.8), color: i === 0 ? C.bg : C.bright, fontFamily: DISPLAY_FONT }}>{i + 1}</span>
                        {s.clubLogoUrl && (
                          <div className="absolute bottom-2 left-3 w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: rgba(C.bg, 0.8), border: `1px solid ${C.border}` }}>
                            <Logo url={s.clubLogoUrl} size={30} />
                          </div>
                        )}
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col">
                        <p className="text-base font-semibold leading-tight break-words" style={{ color: C.bright }}>{s.name}</p>
                        <p className="text-xs mt-1 break-words" style={{ color: C.muted }}>{[s.placeLabel, s.clubName].filter(Boolean).join(' · ')}</p>
                        <p className="mt-auto pt-3 text-2xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>
                          {s.reviews} <span className="text-xs" style={{ color: C.muted, fontFamily: 'inherit' }}>{s.reviews === 1 ? 'reseña' : 'reseñas'}</span>
                        </p>
                      </div>
                    </div>
                    );
                  })}
                </div>
                <AdminPagination page={stadiumsPageNow} total={topReviewed.length} pageSize={STADIUMS_PAGE_SIZE} onChange={setStadiumsPage} />
                </>
              )}
            </Section>

            <Section title="Mejor puntuados" subtitle="Estadios con al menos 3 reseñas.">
              <div className="rounded-2xl overflow-hidden" style={card}>
                {topRated.length === 0 ? <div className="p-4"><Empty /></div> : paginate(topRated, ratedPageNow, RANKING_PAGE_SIZE).map((s, i) => (
                  <RankRow
                    key={s.id}
                    position={(ratedPageNow - 1) * RANKING_PAGE_SIZE + i + 1}
                    title={s.name}
                    subtitle={`${s.reviews} reseñas`}
                    logoUrl={s.clubLogoUrl || undefined}
                    value={`${s.avgRating}/10`}
                  />
                ))}
              </div>
              <AdminPagination page={ratedPageNow} total={topRated.length} pageSize={RANKING_PAGE_SIZE} onChange={setRatedPage} />
            </Section>

            <Section title="Por provincia y ciudad">
              <div className="rounded-2xl p-4 sm:p-5 space-y-4" style={card}>
                {byPlace.length === 0 ? <Empty /> : paginate(byPlace, placesPageNow, PLACES_PAGE_SIZE).map((p) => (
                  <div key={p.place}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-1.5 min-w-0" style={{ color: C.bright }}><MapPin size={13} color={C.muted} className="shrink-0" /> {p.place}</span>
                      <span className="text-xs shrink-0" style={{ color: C.muted }}>{p.stadiums} {p.stadiums === 1 ? 'estadio' : 'estadios'} · {p.reviews} reseñas</span>
                    </div>
                    <div className="h-2 rounded-full mt-2" style={{ backgroundColor: C.bg }}>
                      <div className="h-full rounded-full" style={{ width: `${(p.reviews / maxPlaceReviews) * 100}%`, backgroundColor: C.brandBright }} />
                    </div>
                  </div>
                ))}
              </div>
              <AdminPagination page={placesPageNow} total={byPlace.length} pageSize={PLACES_PAGE_SIZE} onChange={setPlacesPage} />
            </Section>
          </>
        )}

        {isAdminRole(user?.rol) && (
          <Section title="Analíticas internas">
            <AdminStatsView />
          </Section>
        )}

        <p className="flex items-center gap-1.5 text-xs mt-12" style={{ color: C.muted }}>
          <Flag size={11} /> Solo se muestran datos agregados. Tus datos personales no aparecen acá.
        </p>
      </div>
    </div>
  );
}
