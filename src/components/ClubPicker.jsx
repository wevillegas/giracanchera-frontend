import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Shield } from 'lucide-react';
import { C, rgba } from '../theme';

// Selector con escudo: un <select> nativo no puede mostrar imágenes.
// options: [{ value, label, logoUrl? }]
export default function ClubPicker({ value, onChange, options, placeholder = 'Elegí un club', disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left gc-focus disabled:cursor-not-allowed"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: selected ? C.bright : C.muted }}
      >
        <Logo url={selected?.logoUrl} />
        <span className="flex-1 min-w-0 truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} color={C.muted} className="shrink-0" />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-xl overflow-y-auto gc-hide-scrollbar z-10"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, maxHeight: '240px', boxShadow: `0 12px 24px ${rgba('#000000', 0.35)}` }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left gc-focus"
              style={{ color: o.value === value ? C.brandBright : C.bright, borderTop: `1px solid ${C.border}` }}
            >
              <Logo url={o.logoUrl} />
              <span className="truncate">{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Escudo chico; si el club no tiene imagen, un ícono neutro
export function Logo({ url, size = 20 }) {
  if (url) {
    return <img src={url} alt="" className="shrink-0 object-contain" style={{ width: size, height: size }} />;
  }
  return <Shield size={size - 4} color={C.muted} className="shrink-0" />;
}
