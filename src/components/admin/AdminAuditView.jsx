import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { C } from '../../theme';
import adminService from '../../services/adminService';
import AdminPagination, { filterFieldStyle } from './AdminPagination';

const ENTITY_LABELS = {
  stadium: 'Estadio',
  club: 'Club',
  user: 'Usuario',
  visit: 'Reseña',
  report: 'Denuncia',
};

const ACTION_LABELS = { create: 'Alta', update: 'Edición', delete: 'Baja', resolve: 'Moderación' };

export default function AdminAuditView() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminService.getAuditLogs({ page, entity })
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
  }, [page, entity]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg font-semibold" style={{ color: C.bright }}>Auditoría ({total})</h2>
        <select
          value={entity}
          onChange={(e) => { setEntity(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-sm outline-none gc-focus"
          style={filterFieldStyle}
        >
          <option value="">Todo</option>
          {Object.entries(ENTITY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
          <AlertCircle size={15} /> No pudimos cargar la auditoría.
        </div>
      ) : loading ? (
        <p className="text-sm" style={{ color: C.muted }}>Cargando auditoría...</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          {logs.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ backgroundColor: C.surface, color: C.muted }}>
              Todavía no hay cambios registrados.
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
              {log.fields?.length > 0 && (
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
