import { useEffect, useMemo, useState } from 'react';
import { Flag, PenLine, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { C, DISPLAY_FONT } from '../../theme';
import adminService from '../../services/adminService';
import visitService from '../../services/visitService';
import { fichaChecks } from '../../utils/fichaChecks';

const LIST_SIZE = 8;

const card = { backgroundColor: C.surface, border: `1px solid ${C.border}` };
const asList = (data) => (Array.isArray(data) ? data : data?.stadiums ?? []);

// Cada pedido falla por separado: si uno no responde, los demás números igual se ven
async function loadOverview() {
  const [stadiums, suggestions, drafts, reports] = await Promise.allSettled([
    adminService.getStadiums(),
    adminService.getSuggestions(),
    adminService.getStadiumDrafts(),
    visitService.getReports(),
  ]);
  const value = (result) => (result.status === 'fulfilled' ? asList(result.value) : null);
  return {
    stadiums: value(stadiums),
    suggestions: value(suggestions),
    drafts: value(drafts),
    reports: value(reports)?.filter((r) => r.status !== 'resolved') ?? null,
  };
}

function PendingCard({ Icon, label, count, goLabel, onClick }) {
  const pending = count > 0;
  return (
    <button onClick={onClick} className="text-left px-3 py-2.5 sm:p-4 rounded-2xl flex items-center gap-3 sm:block gc-focus gc-tap" style={{ ...card, border: `1px solid ${pending ? C.gold : C.border}` }}>
      <div className="hidden sm:flex items-center justify-between">
        <Icon size={16} color={pending ? C.gold : C.muted} />
        <ChevronRight size={14} color={C.muted} />
      </div>
      <p className="text-3xl sm:text-4xl leading-none sm:mt-3 shrink-0 min-w-[2ch] text-center sm:text-left" style={{ fontFamily: DISPLAY_FONT, color: pending ? C.gold : C.bright }}>{count ?? '—'}</p>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold sm:mt-1.5" style={{ color: C.bright }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: pending ? C.gold : C.muted }}>
          {count === null ? 'No se pudo cargar' : pending ? goLabel : 'Todo al día'}
        </p>
      </div>
      <ChevronRight size={14} color={C.muted} className="sm:hidden shrink-0" />
    </button>
  );
}

export default function AdminOverviewView({ onGo, onEditStadium }) {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState(''); // etiqueta de lo que falta, para filtrar la lista

  useEffect(() => {
    let cancelled = false;
    loadOverview().then((result) => { if (!cancelled) setData(result); });
    return () => { cancelled = true; };
  }, []);

  const ficha = useMemo(() => {
    if (!data?.stadiums) return null;
    const rows = data.stadiums.map((s) => {
      const checks = fichaChecks(s);
      return { stadium: s, missing: checks.filter(([, ok]) => !ok).map(([label]) => label), total: checks.length };
    });
    const totalChecks = rows.reduce((sum, r) => sum + r.total, 0);
    const doneChecks = rows.reduce((sum, r) => sum + r.total - r.missing.length, 0);
    const byLabel = {};
    rows.forEach((r) => r.missing.forEach((label) => { byLabel[label] = (byLabel[label] || 0) + 1; }));
    return {
      rows: rows.filter((r) => r.missing.length > 0).sort((a, b) => b.missing.length - a.missing.length),
      complete: rows.filter((r) => r.missing.length === 0).length,
      count: rows.length,
      percent: totalChecks ? Math.round((doneChecks / totalChecks) * 100) : 100,
      byLabel: Object.entries(byLabel).sort((a, b) => b[1] - a[1]),
    };
  }, [data]);

  if (!data) return <p className="text-sm text-center py-10" style={{ color: C.muted }}>Cargando resumen...</p>;

  const visible = ficha ? ficha.rows.filter((r) => !filter || r.missing.includes(filter)) : [];
  const count = (list) => (list ? list.length : null);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: C.bright }}>Pendiente de revisar</h2>
        <div className="grid gap-2 sm:gap-3 sm:grid-cols-3">
          <PendingCard Icon={Flag} label="Denuncias abiertas" count={count(data.reports)} goLabel="Revisar denuncias" onClick={() => onGo('reports')} />
          <PendingCard Icon={PenLine} label="Correcciones sugeridas" count={count(data.suggestions)} goLabel="Revisar correcciones" onClick={() => onGo('suggestions')} />
          <PendingCard Icon={Sparkles} label="Borradores de Wikidata" count={count(data.drafts)} goLabel="Revisar en Estadios" onClick={() => onGo('stadiums')} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: C.bright }}>Fichas de estadios por completar</h2>
        {!ficha ? (
          <p className="text-sm" style={{ color: C.muted }}>No se pudieron cargar los estadios.</p>
        ) : (
          <div className="p-4 rounded-2xl" style={card}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{ficha.percent}%</p>
                <p className="text-xs mt-1.5" style={{ color: C.muted }}>{ficha.complete} de {ficha.count} fichas completas</p>
              </div>
              <div className="flex-1 max-w-xs h-2 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: C.bg }}>
                <div className="h-full rounded-full" style={{ width: `${ficha.percent}%`, backgroundColor: C.brandBright }} />
              </div>
            </div>

            {ficha.byLabel.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {ficha.byLabel.map(([label, n]) => (
                  <button
                    key={label}
                    onClick={() => setFilter(filter === label ? '' : label)}
                    aria-pressed={filter === label}
                    className="px-2.5 py-1 rounded-full text-xs font-medium gc-focus"
                    style={{
                      backgroundColor: filter === label ? C.brandBright : 'transparent',
                      color: filter === label ? C.bg : C.muted,
                      border: `1px solid ${filter === label ? C.brandBright : C.border}`,
                    }}
                  >
                    Sin {label.toLowerCase()} · {n}
                  </button>
                ))}
              </div>
            )}

            {visible.length === 0 ? (
              <p className="flex items-center gap-1.5 text-sm mt-4" style={{ color: C.brandBright }}><CheckCircle2 size={14} /> No hay estadios para completar.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {visible.slice(0, LIST_SIZE).map(({ stadium, missing, total }) => (
                  <div key={stadium._id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: C.bright }}>{stadium.name}</p>
                      <p className="text-xs truncate" style={{ color: C.muted }}>
                        {total - missing.length}/{total} · Falta: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ` y ${missing.length - 3} más` : ''}
                      </p>
                    </div>
                    <button onClick={() => onEditStadium(stadium._id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 gc-focus gc-tap" style={{ border: `1px solid ${C.brandBright}`, color: C.brandBright }}>
                      Completar
                    </button>
                  </div>
                ))}
                {visible.length > LIST_SIZE && (
                  <button onClick={() => onGo('stadiums')} className="text-xs gc-focus rounded" style={{ color: C.muted }}>
                    y {visible.length - LIST_SIZE} más · ver todos en Estadios
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
