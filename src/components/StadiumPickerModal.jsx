import { useMemo, useState } from 'react';
import { X, Search, SearchX, Globe, MapPin, Building2, ChevronDown } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import { Logo } from './ClubPicker';
import StadiumArt from './StadiumArt';

// Valor interno para "sin provincia" (algunas ciudades, como CABA, no tienen provincia)
const NONE = '__none__';

const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

const matchesProvince = (stadium, province) => {
  if (!province) return true;
  return province === NONE ? !stadium.province : stadium.province === province;
};

function FilterSelect({ Icon, value, onChange, disabled, placeholder, options }) {
  return (
    <label
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl min-w-0 transition-opacity"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, opacity: disabled ? 0.45 : 1 }}
    >
      <Icon size={14} color={C.muted} className="shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-transparent outline-none text-sm flex-1 min-w-0 gc-focus disabled:cursor-not-allowed appearance-none"
        style={{ color: C.bright, colorScheme: 'dark' }}
      >
        <option value="" style={{ backgroundColor: C.surface }}>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ backgroundColor: C.surface }}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} color={C.muted} className="shrink-0" />
    </label>
  );
}

export default function StadiumPickerModal({ stadiums, onClose, onSelect, onAddWishlist, onOpenStadium }) {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');

  const countries = useMemo(() => uniqueSorted(stadiums.map((s) => s.country)), [stadiums]);

  const inCountry = useMemo(() => stadiums.filter((s) => s.country === country), [stadiums, country]);

  const provinceOptions = useMemo(() => {
    const names = uniqueSorted(inCountry.map((s) => s.province)).map((p) => ({ value: p, label: p }));
    if (inCountry.some((s) => !s.province)) names.push({ value: NONE, label: 'Sin provincia' });
    return names;
  }, [inCountry]);

  const cityOptions = useMemo(() => {
    const inProvince = inCountry.filter((s) => matchesProvince(s, province));
    return uniqueSorted(inProvince.map((s) => s.cityName)).map((c) => ({ value: c, label: c }));
  }, [inCountry, province]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stadiums.filter((s) => {
      if (country && s.country !== country) return false;
      if (!matchesProvince(s, province)) return false;
      if (city && s.cityName !== city) return false;
      if (q && !(s.name.toLowerCase().includes(q) || s.club.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [stadiums, country, province, city, query]);

  // Cada filtro depende del anterior: al cambiarlo se limpian los que siguen
  const changeCountry = (value) => { setCountry(value); setProvince(''); setCity(''); };
  const changeProvince = (value) => { setProvince(value); setCity(''); };

  const hasFilters = Boolean(country || query.trim());

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.6) }} onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-3xl overflow-hidden flex flex-col gc-modal"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-5 sm:px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 90% 0%, ${rgba(C.brandBright, 0.14)}, transparent 60%)` }} />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl sm:text-4xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>Elegí un estadio</h2>
              <p className="text-sm mt-2" style={{ color: C.muted }}>Registrá una visita o sumalo a tu lista de próximos</p>
            </div>
            <button onClick={onClose} aria-label="Cerrar" className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap shrink-0" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <X size={16} color={C.bright} />
            </button>
          </div>

          <div className="relative gc-search-box flex items-center gap-2 px-3 py-2.5 rounded-xl mt-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <Search size={15} color={C.muted} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar estadio o club..."
              className="bg-transparent outline-none text-sm flex-1 min-w-0 gc-focus"
              style={{ color: C.bright }}
            />
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <FilterSelect Icon={Globe} value={country} onChange={changeCountry} placeholder="Todos los países" options={countries.map((c) => ({ value: c, label: c }))} />
            <FilterSelect Icon={MapPin} value={province} onChange={changeProvince} disabled={!country} placeholder="Todas las provincias" options={provinceOptions} />
            <FilterSelect Icon={Building2} value={city} onChange={setCity} disabled={!province} placeholder="Todas las ciudades" options={cityOptions} />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 sm:px-6 pt-3 pb-1">
          <p className="text-xs" style={{ color: C.muted }}>{results.length} {results.length === 1 ? 'estadio' : 'estadios'}</p>
          {hasFilters && (
            <button
              onClick={() => { setQuery(''); changeCountry(''); }}
              className="text-xs font-medium gc-focus"
              style={{ color: C.brandBright }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="px-5 sm:px-6 pb-6 pt-2 overflow-y-auto gc-hide-scrollbar">
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10" style={{ color: C.muted }}>
              <SearchX size={22} />
              <p className="text-sm text-center">No hay estadios con esos filtros.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((s) => (
                // Tocar la tarjeta abre la ficha del estadio; los botones de abajo tienen su propia acción
                <div
                  key={s.id}
                  onClick={() => onOpenStadium(s)}
                  className="rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  <div className="relative h-28 shrink-0" style={{ backgroundColor: C.bg }}>
                    {s.imageUrl
                      ? <img src={s.imageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                      : <StadiumArt tone={s.tone} uid={`picker-${s.id}`} className="absolute inset-0 w-full h-full" />}
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${rgba(C.surface, 0.95)} 0%, transparent 70%)` }} />
                    {s.status === 'visited' && (
                      <span className="absolute top-2.5 left-2.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: rgba(C.bg, 0.75), color: C.brandBright }}>Visitado</span>
                    )}
                    {s.status === 'wishlist' && (
                      <span className="absolute top-2.5 left-2.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: rgba(C.bg, 0.75), color: C.gold }}>Próximo</span>
                    )}
                    <div className="absolute bottom-2 left-3 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: rgba(C.bg, 0.8), border: `1px solid ${C.border}` }}>
                      <Logo url={s.clubLogoUrl} size={34} />
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col">
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenStadium(s); }}
                      className="text-left text-base font-semibold leading-tight break-words rounded gc-focus"
                      style={{ color: C.bright }}
                    >
                      {s.name}
                    </button>
                    <p className="text-xs mt-1 break-words" style={{ color: C.muted }}>
                      {s.club || 'Sin club'} · {[s.cityName, s.province, s.country].filter(Boolean).join(', ')}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-auto pt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelect(s); }}
                        className="gc-action w-full gc-focus gc-tap"
                        style={{ backgroundColor: C.brand, color: C.bright }}
                      >
                        Registrar visita
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddWishlist(s); }}
                        disabled={s.status === 'visited'}
                        className="gc-action w-full gc-focus gc-tap disabled:opacity-40"
                        style={{
                          backgroundColor: 'transparent',
                          border: `1px solid ${s.status === 'wishlist' ? C.gold : C.border}`,
                          color: s.status === 'wishlist' ? C.gold : C.muted,
                        }}
                      >
                        {s.status === 'wishlist' ? 'Quitar de próximos' : 'Visitaré próximamente'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
