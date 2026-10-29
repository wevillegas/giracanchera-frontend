import { useEffect, useMemo, useState } from 'react';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';
import { C } from '../../theme';
import adminService from '../../services/adminService';
import { SHARP_WIDTH } from '../../utils/photoQuality';
import AdminPagination, { paginate, clampPage, filterFieldStyle } from './AdminPagination';

const PAGE = 12;
const SHIELD_MIN_WIDTH = 200; // un escudo se ve en tamaños chicos: con menos de esto se nota borroso
const DANGER = '#f85149';
const asList = (data) => (Array.isArray(data) ? data : data?.stadiums ?? []);

const coverOf = (stadium) => stadium.photos?.[0]?.url || stadium.imageUrl || '';

function Badge({ color, children }) {
  return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ border: `1px solid ${color}`, color }}>{children}</span>;
}

// Tarjeta con la imagen, su ancho real (se mide al cargar) y el botón para reemplazarla
function MediaCard({ title, subtitle, url, minWidth, width, onMeasure, onReplace, busy, contain }) {
  const small = width !== undefined && width < minWidth;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${small || !url ? C.gold : C.border}` }}>
      <div className="relative aspect-video flex items-center justify-center" style={{ backgroundColor: C.bg }}>
        {url ? (
          <img
            src={url}
            alt={title}
            loading="lazy"
            onLoad={(e) => onMeasure(e.currentTarget.naturalWidth)}
            className={contain ? 'max-w-[70%] max-h-[80%] object-contain' : 'w-full h-full object-cover'}
          />
        ) : (
          <span className="text-xs" style={{ color: C.muted }}>Sin imagen</span>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {!url ? <Badge color={DANGER}>Sin imagen</Badge> : width !== undefined && (
            small ? <Badge color={C.gold}>Chica · {width} px</Badge> : <Badge color={C.brandBright}>{width} px</Badge>
          )}
        </div>
      </div>
      <div className="p-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: C.bright }}>{title}</p>
          {subtitle && <p className="text-xs truncate" style={{ color: C.muted }}>{subtitle}</p>}
        </div>
        <label
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 gc-focus gc-tap ${busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          style={{ border: `1px solid ${C.brandBright}`, color: C.brandBright }}
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />} {url ? 'Reemplazar' : 'Subir'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onReplace(file);
            }}
          />
        </label>
      </div>
    </div>
  );
}

export default function AdminMediaView({ onToast }) {
  const [kind, setKind] = useState('stadiums'); // 'stadiums' | 'clubs'
  const [stadiums, setStadiums] = useState(null);
  const [clubs, setClubs] = useState(null);
  const [failed, setFailed] = useState(false);
  const [widths, setWidths] = useState({}); // ancho real por id, a medida que cargan las imágenes
  const [busyId, setBusyId] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(''); // '' | 'missing' | 'small'
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminService.getStadiums(), adminService.getClubs()])
      .then(([s, c]) => { if (!cancelled) { setStadiums(asList(s)); setClubs(asList(c)); } })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  const measure = (key, width) => setWidths((prev) => (prev[key] === width ? prev : { ...prev, [key]: width }));

  async function replaceStadiumPhoto(stadium, file) {
    setBusyId(stadium._id);
    try {
      const photos = stadium.photos?.length ? stadium.photos : (stadium.imageUrl ? [{ url: stadium.imageUrl, credit: '' }] : []);
      const url = await adminService.uploadStadiumImage(file);
      const next = [{ url, credit: photos[0]?.credit || '' }, ...photos.slice(1)];
      const updated = await adminService.updateStadium(stadium._id, { photos: next });
      setStadiums((prev) => prev.map((s) => (s._id === stadium._id ? { ...s, photos: updated.photos, imageUrl: updated.imageUrl } : s)));
      setWidths((prev) => { const { [`s-${stadium._id}`]: _old, ...rest } = prev; return rest; });
      onToast?.(`Foto de ${stadium.name} actualizada`);
    } catch (err) {
      onToast?.(err.response?.data?.message || 'No pudimos reemplazar la foto.');
    } finally {
      setBusyId('');
    }
  }

  async function replaceClubLogo(club, file) {
    setBusyId(club._id);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const updated = await adminService.updateClub(club._id, formData);
      setClubs((prev) => prev.map((c) => (c._id === club._id ? { ...c, logoUrl: updated.logoUrl } : c)));
      setWidths((prev) => { const { [`c-${club._id}`]: _old, ...rest } = prev; return rest; });
      onToast?.(`Escudo de ${club.name} actualizado`);
    } catch (err) {
      onToast?.(err.response?.data?.message || 'No pudimos reemplazar el escudo.');
    } finally {
      setBusyId('');
    }
  }

  const items = kind === 'stadiums' ? stadiums : clubs;
  const keyOf = (item) => `${kind === 'stadiums' ? 's' : 'c'}-${item._id}`;
  const urlOf = (item) => (kind === 'stadiums' ? coverOf(item) : item.logoUrl || '');
  const minWidth = kind === 'stadiums' ? SHARP_WIDTH : SHIELD_MIN_WIDTH;

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const text = [item.name, item.mainClub?.name, item.location?.city].some((f) => f?.toLowerCase().includes(q));
      const url = kind === 'stadiums' ? coverOf(item) : item.logoUrl || '';
      const width = widths[`${kind === 'stadiums' ? 's' : 'c'}-${item._id}`];
      const matchesFilter = !filter || (filter === 'missing' ? !url : url && width !== undefined && width < minWidth);
      return (!q || text) && matchesFilter;
    });
  }, [items, query, filter, widths, kind, minWidth]);

  const counts = useMemo(() => {
    if (!items) return { missing: 0, small: 0 };
    return {
      missing: items.filter((item) => !urlOf(item)).length,
      small: items.filter((item) => widths[keyOf(item)] !== undefined && widths[keyOf(item)] < minWidth).length,
    };
    // urlOf y keyOf dependen solo de `kind`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, widths, kind, minWidth]);

  if (failed) return <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}><AlertCircle size={15} /> No pudimos cargar las imágenes.</div>;
  if (!items) return <p className="text-sm" style={{ color: C.muted }}>Cargando imágenes...</p>;

  const currentPage = clampPage(page, filtered.length, PAGE);
  const visible = paginate(filtered, currentPage, PAGE);
  const switchKind = (next) => { setKind(next); setFilter(''); setQuery(''); setPage(1); };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-lg font-semibold" style={{ color: C.bright }}>Fotos y escudos</h2>
        <div className="flex gap-2" role="group" aria-label="Tipo de imagen">
          {[['stadiums', `Estadios (${stadiums.length})`], ['clubs', `Escudos (${clubs.length})`]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => switchKind(key)}
              aria-pressed={kind === key}
              className="px-3.5 py-1.5 rounded-full text-sm font-medium gc-focus gc-tap"
              style={{ backgroundColor: kind === key ? C.brandBright : C.surface, color: kind === key ? C.bg : C.muted, border: `1px solid ${kind === key ? C.brandBright : C.border}` }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder={kind === 'stadiums' ? 'Buscar por estadio, club o ciudad...' : 'Buscar club...'}
          className="flex-1 min-w-[180px] px-3 py-2 rounded-xl text-sm outline-none gc-focus"
          style={filterFieldStyle}
        />
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} aria-label="Filtrar imágenes" className="px-3 py-2 rounded-xl text-sm outline-none gc-focus" style={filterFieldStyle}>
          <option value="">Todas</option>
          <option value="missing">Sin imagen ({counts.missing})</option>
          <option value="small">Chicas ({counts.small})</option>
        </select>
      </div>
      <p className="text-xs mb-4" style={{ color: C.muted }}>
        Se considera chica una {kind === 'stadiums' ? 'foto' : 'imagen'} de menos de {minWidth} px de ancho. El tamaño se mide al cargar cada imagen, así que el conteo de chicas crece a medida que recorres las páginas.
      </p>

      {visible.length === 0 ? (
        <p className="text-sm text-center py-8 rounded-2xl" style={{ backgroundColor: C.surface, color: C.muted }}>Ninguna imagen coincide con los filtros.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <MediaCard
              key={item._id}
              title={item.name}
              subtitle={kind === 'stadiums' ? (item.mainClub?.name || item.location?.city) : item.location}
              url={urlOf(item)}
              minWidth={minWidth}
              width={widths[keyOf(item)]}
              onMeasure={(w) => measure(keyOf(item), w)}
              busy={busyId === item._id}
              contain={kind === 'clubs'}
              onReplace={(file) => (kind === 'stadiums' ? replaceStadiumPhoto(item, file) : replaceClubLogo(item, file))}
            />
          ))}
        </div>
      )}

      <AdminPagination page={currentPage} total={filtered.length} onChange={setPage} pageSize={PAGE} />
    </div>
  );
}
