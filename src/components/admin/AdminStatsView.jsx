import { useEffect, useState } from 'react';
import { AlertCircle, Users, Flag, MapPin, Star } from 'lucide-react';
import { C, DISPLAY_FONT } from '../../theme';
import statsService from '../../services/statsService';

// Barras simples: cada barra es un día o una semana, con su valor y, cada tanto, su fecha debajo
function Bars({ data, labelFor }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (data.length === 0) return <p className="text-sm" style={{ color: C.muted }}>Sin datos en este período.</p>;

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const peak = data.reduce((best, d) => (d.count > best.count ? d : best), data[0]);
  // Con muchas barras (ej. 30 días) no entran todas las fechas: mostramos solo algunas para no amontonar el texto
  const labelEvery = Math.ceil(data.length / 6);

  return (
    <div>
      <div className="flex items-end gap-1 h-32">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full min-w-0" title={`${labelFor(d.label)}: ${d.count}`}>
            {d.count > 0 && <span className="text-[9px] mb-0.5 leading-none" style={{ color: C.muted }}>{d.count}</span>}
            <div className="w-full rounded-t" style={{ height: `${(d.count / max) * 100}%`, minHeight: '3px', backgroundColor: C.brandBright }} />
          </div>
        ))}
      </div>
      <div className="flex items-start gap-1 mt-1">
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 text-center min-w-0">
            {i % labelEvery === 0 && (
              <span className="text-[8px] leading-tight block truncate" style={{ color: C.muted }}>{labelFor(d.label)}</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs mt-3" style={{ color: C.muted }}>
        Total: <span style={{ color: C.bright }}>{total}</span>
        {' · '}Pico: <span style={{ color: C.bright }}>{peak.count}</span> ({labelFor(peak.label)})
      </p>
    </div>
  );
}

// "2026-03-05" -> "5/3"; si no es una fecha válida, se muestra tal cual (ej. "Semana 12")
function formatShortDate(label) {
  const d = new Date(label);
  if (Number.isNaN(d.getTime())) return label;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const Card = ({ title, children }) => (
  <div className="p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
    <p className="text-xs uppercase tracking-widest mb-3" style={{ color: C.muted }}>{title}</p>
    {children}
  </div>
);

const Stat = ({ label, value, Icon }) => (
  <div className="flex flex-col items-center py-3 rounded-2xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
    <span className="text-xl" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{value ?? '—'}</span>
    <span className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: C.muted }}>
      <Icon size={11} /> {label}
    </span>
  </div>
);

export default function AdminStatsView() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    statsService.getAdminStats()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
        <AlertCircle size={15} /> No pudimos cargar las analíticas.
      </div>
    );
  }
  if (!stats) return <p className="text-sm" style={{ color: C.muted }}>Cargando analíticas...</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Usuarios" value={stats.users.total} Icon={Users} />
        <Stat label="Nuevos (7 días)" value={stats.users.new7} Icon={Users} />
        <Stat label="Reseñas (30 días)" value={stats.visits30} Icon={Star} />
        <Stat label="Denuncias abiertas" value={stats.reports.open} Icon={Flag} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Reseñas por día (últimos 30 días)">
          <Bars data={stats.visitsByDay} labelFor={formatShortDate} />
        </Card>
        <Card title="Usuarios nuevos por semana (últimas 8)">
          <Bars data={stats.usersByWeek} labelFor={formatShortDate} />
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Estadios">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between" style={{ color: C.bright }}><span className="flex items-center gap-1.5"><MapPin size={12} color={C.muted} /> Total</span><span>{stats.stadiums.total}</span></div>
            <div className="flex justify-between" style={{ color: C.bright }}><span>Sin foto</span><span>{stats.stadiums.noPhoto}</span></div>
            <div className="flex justify-between" style={{ color: C.bright }}><span>Sin dueño</span><span>{stats.stadiums.noOwner}</span></div>
            <div className="flex justify-between" style={{ color: C.bright }}><span>De la provincia o ciudad</span><span>{stats.stadiums.province}</span></div>
          </div>
        </Card>
        <Card title="Quién más reseña">
          {stats.topReviewers.length === 0 ? (
            <p className="text-sm" style={{ color: C.muted }}>Todavía no hay reseñas.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {stats.topReviewers.map((u, i) => (
                <div key={`${u.username}-${i}`} className="flex justify-between" style={{ color: C.bright }}>
                  <span>{i + 1}. @{u.username}</span>
                  <span style={{ color: C.muted }}>{u.reviews} reseñas</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Denuncias">
        <div className="flex gap-6 text-sm" style={{ color: C.bright }}>
          <span>Abiertas: <strong>{stats.reports.open}</strong></span>
          <span>Resueltas: <strong>{stats.reports.resolved}</strong></span>
        </div>
      </Card>
    </div>
  );
}
