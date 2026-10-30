import { useRef, useState } from 'react';
import { Globe, CheckCircle2, Star } from 'lucide-react';
import { C, rgba } from '../theme';
import useClickOutside from '../utils/useClickOutside';

// Los colores son los mismos de los pines del mapa: verde = visitado, dorado = próximamente
export const OPTIONS = [
  { key: 'all', label: 'Todos', Icon: Globe, color: C.brandBright },
  { key: 'visited', label: 'Mis visitas', Icon: CheckCircle2, color: C.brandBright },
  { key: 'wishlist', label: 'Próximamente', Icon: Star, color: C.gold },
];

const tint = (option, active) => ({
  backgroundColor: active ? rgba(option.color, 0.16) : 'transparent',
  color: active ? option.color : C.muted,
  boxShadow: active ? `inset 0 0 0 1px ${rgba(option.color, 0.55)}` : 'none',
});

// Interruptor de tres opciones: la elegida muestra su nombre, las otras quedan como íconos
export function FilterPills({ filter, onChange, className = '' }) {
  return (
    <div role="radiogroup" aria-label="Filtrar estadios" className={`flex items-center gap-0.5 p-1 rounded-full ${className}`} style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      {OPTIONS.map((option) => {
        const active = option.key === filter;
        return (
          <button
            key={option.key}
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.key)}
            className="h-7 flex items-center px-2 rounded-full text-xs font-semibold gc-focus gc-tap"
            style={tint(option, active)}
          >
            <option.Icon size={15} />
            <span
              className="grid transition-[grid-template-columns,opacity] duration-300 ease-out motion-reduce:transition-none"
              style={{ gridTemplateColumns: active ? '1fr' : '0fr', opacity: active ? 1 : 0 }}
            >
              <span className="overflow-hidden whitespace-nowrap pl-1.5">{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Interruptor de un toque: la opción elegida se "abre" y muestra su nombre, las otras quedan como íconos.
// En pantallas chicas es un solo botón que despliega las tres opciones.
export default function FilterSwitch({ filter, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, open, () => setOpen(false));
  const current = OPTIONS.find((o) => o.key === filter) ?? OPTIONS[0];

  return (
    <div ref={ref} className="relative shrink-0 z-[1000]">
      {/* Pantallas medianas y grandes: interruptor siempre a la vista */}
      <FilterPills filter={filter} onChange={onChange} className="hidden sm:flex" />

      {/* Celular: un botón con el filtro actual que despliega las opciones */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Filtrar estadios: ${current.label}`}
        aria-expanded={open}
        className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full gc-focus gc-tap"
        style={{ ...tint(current, true), border: `1px solid ${C.border}` }}
      >
        <current.Icon size={17} />
      </button>
      {open && (
        <div className="sm:hidden absolute right-0 mt-2 w-52 p-1.5 rounded-2xl space-y-1" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: `0 12px 24px ${rgba('#000000', 0.35)}` }}>
          {OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => { setOpen(false); onChange(option.key); }}
              className="w-full h-10 flex items-center gap-2.5 px-3 rounded-xl text-sm font-semibold text-left gc-focus gc-tap"
              style={tint(option, option.key === filter)}
            >
              <option.Icon size={16} /> {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
