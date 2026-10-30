import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { C, rgba } from '../../theme';
import useClickOutside from '../../utils/useClickOutside';
import useDropUp from '../../utils/useDropUp';
import { filterFieldStyle } from './AdminPagination';

const LIST_HEIGHT = 240;

// Filtro desplegable propio: a diferencia del <select> nativo, su lista siempre queda dentro de la pantalla
// (abre hacia arriba cuando abajo no hay lugar). options: [{ value, label }]; la opción con value '' es la de "sin filtro".
export default function FilterDropdown({ value, onChange, options, disabled = false, ariaLabel, className = '', Icon, compact = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, open, () => setOpen(false));
  const dropUp = useDropUp(open, ref, LIST_HEIGHT + 24);
  // Si el botón está en la mitad derecha de la pantalla, la lista se alinea a su borde derecho para no salirse por el costado
  const [alignRight, setAlignRight] = useState(false);
  const [maxWidth, setMaxWidth] = useState(undefined); // espacio horizontal real disponible para la lista
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const { left, right } = ref.current.getBoundingClientRect();
    const toRight = left > window.innerWidth / 2;
    setAlignRight(toRight);
    setMaxWidth(Math.max(right - left, toRight ? right - 12 : window.innerWidth - left - 12));
  }, [open]);
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={ref} className={`relative ${className}`} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 text-left outline-none gc-focus disabled:opacity-40 ${compact ? 'px-2.5 py-1.5 rounded-lg text-xs' : 'px-3 py-2 rounded-xl text-sm'}`}
        style={filterFieldStyle}
      >
        {Icon && <Icon size={14} color={C.muted} className="shrink-0" />}
        <span className="truncate flex-1">{selected?.label}</span>
        <ChevronDown size={14} color={C.muted} className="shrink-0" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute ${alignRight ? 'right-0' : 'left-0'} min-w-full w-max rounded-xl overflow-y-auto gc-hide-scrollbar z-30 ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
          style={{ maxHeight: LIST_HEIGHT, maxWidth, backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: `0 12px 24px ${rgba('#000000', 0.35)}` }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left gc-focus ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
              style={{ color: o.value === value ? C.brandBright : C.bright, backgroundColor: o.value === value ? rgba(C.brandBright, 0.12) : 'transparent' }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
