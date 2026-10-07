import logoIcon from '../assets/giracanchera-icono.svg';
import { useEffect, useState } from 'react';
import { ChevronLeft, Activity, MapPin, Star, Users, Flag, Wallet, Shield } from 'lucide-react';
import { C, rgba, DISPLAY_FONT, formatMoney } from '../theme';
import { isAdminRole } from '../utils/roles';
import statsService from '../services/statsService';
import Navbar from './Navbar';
import { Logo } from './ClubPicker';
import AdminStatsView from './admin/AdminStatsView';
import { useAuth } from '../context/AuthContext';

const Section = ({ title, children }) => (
  <section className="mt-10">
    <h2 className="text-xl mb-3" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.03em' }}>{title}</h2>
    {children}
  </section>
);

const Empty = () => <p className="text-sm" style={{ color: C.muted }}>Todavía no hay datos suficientes.</p>;

// Fila con posición, nombre y un valor a la derecha
function RankRow({ position, title, subtitle, logoUrl, value, last }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: last ? 'none' : `1px solid ${C.border}` }}>
      <span className="w-6 text-center text-sm font-semibold shrink-0" style={{ color: C.muted }}>{position}</span>
      {logoUrl !== undefined && <Logo url={logoUrl} size={28} />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: C.bright }}>{title}</p>
        {subtitle && <p className="text-xs truncate" style={{ color: C.muted }}>{subtitle}</p>}
      </div>
      <span className="text-sm font-semibold shrink-0" style={{ color: C.brandBright }}>{value}</span>
    </div>
  );
}

export default function StatsView({ onBackToMap, navbarProps }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    statsService.getPublicStats()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  const totals = stats?.totals;
  const maxPlaceReviews = Math.max(1, ...(stats?.byPlace || []).map((p) => p.reviews));

  return (
    <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />
      <div className="max-w-3xl mx-auto px-4 pt-32 pb-10">
        <button onClick={onBackToMap} className="flex items-center gap-1.5 text-sm gc-focus gc-tap" style={{ color: C.muted }}>
          <ChevronLeft size={16} /> Mapa
        </button>

        <header
          className="relative mt-5 p-6 md:p-8 rounded-3xl overflow-hidden"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 85% 0%, ${rgba(C.brandBright, 0.18)}, transparent 60%)` }} />
          <div className="relative flex items-center gap-3">
            <img src={logoIcon} alt="" className="w-12 h-12 object-contain shrink-0" />
            <h1 className="text-4xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>Estadísticas</h1>
          </div>
          <p className="relative text-sm mt-2 max-w-md" style={{ color: C.muted }}>
            Lo que está pasando en la comunidad de GiraCanchera, con datos de todos los hinchas.
          </p>

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Estadios', value: totals?.stadiums, Icon: MapPin },
              { label: 'Reseñas', value: totals?.reviews, Icon: Star },
              { label: 'Puntaje promedio', value: totals ? `${totals.avgRating}/10` : undefined, Icon: Activity },
              { label: 'Gasto mediano', value: totals ? formatMoney(totals.avgExpense) : undefined, Icon: Wallet },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="flex flex-col items-center py-3 rounded-2xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                <span className="text-xl" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{value ?? '—'}</span>
                <span className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: C.muted }}>
                  <Icon size={11} /> {label}
                </span>
              </div>
            ))}
          </div>
          <div className="relative flex flex-wrap gap-x-5 gap-y-1 mt-4 text-xs" style={{ color: C.muted }}>
            <span className="flex items-center gap-1"><Shield size={12} /> {totals?.clubs ?? '—'} clubes</span>
            <span className="flex items-center gap-1"><Users size={12} /> {totals?.users ?? '—'} hinchas</span>
          </div>
        </header>

        {error && <p className="text-sm mt-6" style={{ color: C.muted }}>No pudimos cargar las estadísticas. Probá de nuevo más tarde.</p>}

        {stats && (
          <>
            <Section title="Estadios más reseñados">
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                {stats.topReviewed.length === 0 ? <div className="p-4"><Empty /></div> : stats.topReviewed.map((s, i) => (
                  <RankRow
                    key={s.id}
                    position={i + 1}
                    title={s.name}
                    subtitle={[s.placeLabel, s.clubName].filter(Boolean).join(' · ')}
                    logoUrl={s.clubLogoUrl || undefined}
                    value={`${s.reviews} reseñas`}
                    last={i === stats.topReviewed.length - 1}
                  />
                ))}
              </div>
            </Section>

            <Section title="Mejor puntuados">
              <p className="text-xs mb-2" style={{ color: C.muted }}>Estadios con al menos 3 reseñas.</p>
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                {stats.topRated.length === 0 ? <div className="p-4"><Empty /></div> : stats.topRated.map((s, i) => (
                  <RankRow
                    key={s.id}
                    position={i + 1}
                    title={s.name}
                    subtitle={`${s.reviews} reseñas`}
                    logoUrl={s.clubLogoUrl || undefined}
                    value={`${s.avgRating}/10`}
                    last={i === stats.topRated.length - 1}
                  />
                ))}
              </div>
            </Section>

            <Section title="Clubes con más reseñas">
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                {stats.topClubs.length === 0 ? <div className="p-4"><Empty /></div> : stats.topClubs.map((c, i) => (
                  <RankRow
                    key={c.name}
                    position={i + 1}
                    title={c.name}
                    subtitle={`${c.stadiums} ${c.stadiums === 1 ? 'estadio' : 'estadios'}`}
                    logoUrl={c.logoUrl || undefined}
                    value={`${c.reviews} reseñas`}
                    last={i === stats.topClubs.length - 1}
                  />
                ))}
              </div>
            </Section>

            <Section title="Por provincia y ciudad">
              <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                {stats.byPlace.length === 0 ? <Empty /> : stats.byPlace.map((p) => (
                  <div key={p.place}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5" style={{ color: C.bright }}><MapPin size={12} color={C.muted} /> {p.place}</span>
                      <span className="text-xs" style={{ color: C.muted }}>{p.stadiums} {p.stadiums === 1 ? 'estadio' : 'estadios'} · {p.reviews} reseñas</span>
                    </div>
                    <div className="h-1.5 rounded-full mt-1.5" style={{ backgroundColor: C.bg }}>
                      <div className="h-full rounded-full" style={{ width: `${(p.reviews / maxPlaceReviews) * 100}%`, backgroundColor: C.brandBright }} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {isAdminRole(user?.rol) && (
          <Section title="Analíticas internas">
            <AdminStatsView />
          </Section>
        )}

        <p className="flex items-center gap-1.5 text-xs mt-10" style={{ color: C.muted }}>
          <Flag size={11} /> Solo se muestran datos agregados. Tus datos personales no aparecen acá.
        </p>
      </div>
    </div>
  );
}
