import { useEffect, useState } from 'react';
import { AlertCircle, Download, ArrowRight } from 'lucide-react';
import { C } from '../../theme';
import adminService from '../../services/adminService';
import AdminPagination, { filterFieldStyle } from './AdminPagination';
import FilterDropdown from './FilterDropdown';

const ENTITY_LABELS = {
  stadium: 'Estadio',
  club: 'Club',
  user: 'Usuario',
  visit: 'Reseña',
  report: 'Denuncia',
  suggestion: 'Corrección',
};

const ACTION_LABELS = { create: 'Alta', update: 'Edición', delete: 'Baja', resolve: 'Moderación' };
const NO_FILTERS = { entity: '', action: '', actor: '', from: '', to: '' };

export default function AdminAuditView() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    adminService.getAuditActors().then(setActors).catch(() => setActors([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminService.getAuditLogs({ page, ...filters })
      .then((data) => {
        if (cancelled) return;
        setLogs(data.logs);
        setTotal(data.total);
        setPageSize(data.pageSize);
        setError(null);
      })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, filters]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };
  const hasFilters = Object.values(filters).some(Boolean);

  async function exportCsv() {
    setExporting(true);
    try {
      const blob = await adminService.exportAuditLogs(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'auditoria.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(new Error('export'));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg font-semibold" style={{ color: C.bright }}>Auditoría ({total})</h2>
        <button
          onClick={exportCsv}
          disabled={exporting || total === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold gc-focus gc-tap disabled:opacity-40"
          style={{ border: `1px solid ${C.brandBright}`, color: C.brandBright }}
        >
          <Download size={14} /> {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <FilterDropdown
          className="flex-1 min-w-[9rem] sm:flex-none"
          value={filters.entity}
          onChange={(v) => setFilter('entity', v)}
          ariaLabel="Filtrar por sección"
          options={[{ value: '', label: 'Toda sección' }, ...Object.entries(ENTITY_LABELS).map(([key, label]) => ({ value: key, label }))]}
        />
        <FilterDropdown
          className="flex-1 min-w-[9rem] sm:flex-none"
          value={filters.action}
          onChange={(v) => setFilter('action', v)}
          ariaLabel="Filtrar por acción"
          options={[{ value: '', label: 'Toda acción' }, ...Object.entries(ACTION_LABELS).map(([key, label]) => ({ value: key, label }))]}
        />
        <FilterDropdown
          className="flex-1 min-w-[9rem] sm:flex-none"
          value={filters.actor}
          onChange={(v) => setFilter('actor', v)}
          ariaLabel="Filtrar por administrador"
          options={[{ value: '', label: 'Todo administrador' }, ...actors.map((name) => ({ value: name, label: `@${name}` }))]}
        />
        <div className="flex gap-2 w-full sm:w-auto">
          {[['Desde', 'from', { max: filters.to || undefined }], ['Hasta', 'to', { min: filters.from || undefined }]].map(([label, key, limit]) => (
            <label key={key} className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 text-xs" style={{ color: C.muted }}>
              {label}
              <input type="date" value={filters[key]} {...limit} onChange={(e) => setFilter(key, e.target.value)} className="w-full min-w-0 px-3 py-2 rounded-xl text-sm outline-none gc-focus" style={{ ...filterFieldStyle, colorScheme: 'dark' }} />
            </label>
          ))}
        </div>
        {hasFilters && (
          <button onClick={() => { setFilters(NO_FILTERS); setPage(1); }} className="text-xs underline gc-focus rounded" style={{ color: C.muted }}>Limpiar filtros</button>
        )}
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
          <AlertCircle size={15} /> No pudimos completar la operación con la auditoría.
        </div>
      ) : loading ? (
        <p className="text-sm" style={{ color: C.muted }}>Cargando auditoría...</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          {logs.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ backgroundColor: C.surface, color: C.muted }}>
              {hasFilters ? 'Ningún cambio coincide con los filtros.' : 'Todavía no hay cambios registrados.'}
            </p>
          ) : logs.map((log, i) => (
            <div
              key={log._id}
              className="px-4 py-3"
              style={{ backgroundColor: C.surface, borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.brand, color: C.bright }}>
                  {ENTITY_LABELS[log.entity] ?? log.entity}
                </span>
                <span className="text-[10px]" style={{ color: C.muted }}>{ACTION_LABELS[log.action] ?? log.action}</span>
              </div>
              <p className="text-sm mt-1" style={{ color: C.bright }}>{log.summary}</p>
              {log.changes?.length > 0 ? (
                <div className="mt-1.5 space-y-1">
                  {log.changes.map((change) => (
                    <p key={change.field} className="flex flex-wrap items-center gap-x-1.5 text-xs" style={{ color: C.muted }}>
                      <span style={{ color: C.bright }}>{change.field}:</span>
                      <span className="line-through break-all" style={{ color: '#f85149' }}>{change.before || '(vacío)'}</span>
                      <ArrowRight size={11} />
                      <span className="break-all" style={{ color: C.brandBright }}>{change.after || '(vacío)'}</span>
                    </p>
                  ))}
                </div>
              ) : log.fields?.length > 0 && (
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>Campos: {log.fields.join(', ')}</p>
              )}
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                {log.actorUsername ? `@${log.actorUsername}` : 'Sistema'} · {new Date(log.createdAt).toLocaleString('es-AR')}
              </p>
            </div>
          ))}
        </div>
      )}

      <AdminPagination page={page} total={total} pageSize={pageSize} onChange={setPage} />
    </div>
  );
}
