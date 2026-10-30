import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Shield } from 'lucide-react';
import { C, rgba } from '../theme';
import { plain } from '../utils/text';
import useDropUp from '../utils/useDropUp';

// Selector con escudo: un <select> nativo no puede mostrar imágenes.
// Se puede buscar escribiendo (también con el botón enfocado, sin abrirlo antes); ↑ ↓ mueven, Enter elige, Esc cierra.
// options: [{ value, label, logoUrl? }]
export default function ClubPicker({ value, onChange, options, placeholder = 'Elegí un club', disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const listRef = useRef(null);
  const buttonRef = useRef(null);
  const dropUp = useDropUp(open, ref, 340);
  const selected = options.find((o) => o.value === value);

  const q = plain(query);
  const shown = q ? options.filter((o) => plain(o.label).includes(q)) : options;

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function openWith(text = '') {
    setQuery(text);
    setActive(0);
    setOpen(true);
  }

  function pick(option) {
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  // Con el botón enfocado, escribir una letra abre la lista ya filtrada
  function onButtonKeyDown(e) {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
      e.preventDefault();
      openWith(e.key);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      openWith();
    }
  }

  function onSearchKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, shown.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault(); // no enviar el formulario que contiene el selector
      if (shown[active]) pick(shown[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    }
  }

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openWith())}
        onKeyDown={onButtonKeyDown}
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
          className={`absolute left-0 right-0 rounded-xl overflow-hidden z-10 ${dropUp ? 'bottom-full mb-1' : 'mt-1'}`}
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: `0 12px 24px ${rgba('#000000', 0.35)}` }}
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <Search size={13} color={C.muted} className="shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onSearchKeyDown}
              placeholder="Buscar..."
              aria-label="Buscar"
              autoComplete="off"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: C.bright, border: 'none' }}
            />
          </div>
          <div ref={listRef} role="listbox" className="overflow-y-auto gc-hide-scrollbar" style={{ maxHeight: '220px' }}>
            {shown.length === 0 && (
              <p className="px-3 py-2 text-sm" style={{ color: C.muted, borderTop: `1px solid ${C.border}` }}>Sin resultados</p>
            )}
            {shown.map((o, i) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left gc-focus"
                style={{
                  color: o.value === value ? C.brandBright : C.bright,
                  borderTop: `1px solid ${C.border}`,
                  backgroundColor: i === active ? rgba(C.brandBright, 0.12) : 'transparent',
                }}
              >
                <Logo url={o.logoUrl} />
                <span className="truncate">{o.label}</span>
              </button>
            ))}
          </div>
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
