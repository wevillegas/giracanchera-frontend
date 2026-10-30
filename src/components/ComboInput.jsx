import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { C, rgba } from '../theme';
import { plain } from '../utils/text';
import useDropUp from '../utils/useDropUp';

// Campo de texto con menú de sugerencias: se elige de la lista o se escribe un valor nuevo.
// options: lista de textos ya existentes. Teclado: escribir filtra, ↑ ↓ mueven, Enter elige, Esc cierra.
export default function ComboInput({ value, onChange, options, placeholder, required = false }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [navigated, setNavigated] = useState(false); // el usuario movió la selección con las flechas
  const ref = useRef(null);
  const listRef = useRef(null);
  const dropUp = useDropUp(open, ref, 300);

  const query = plain(value);
  const exact = options.some((o) => plain(o) === query);
  // Con un valor ya completo se muestran todas las opciones, para poder cambiarlo; si no, se filtra por lo escrito
  const shown = exact || !query ? options : options.filter((o) => plain(o).includes(query));
  // El aviso de "nuevo" solo aparece cuando nada coincide: mientras hay sugerencias, lo escrito es un prefijo de una existente
  const isNew = Boolean(query) && shown.length === 0;

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

  function pick(option) {
    onChange(option);
    setNavigated(false);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setNavigated(true);
      setActive((i) => Math.min(i + 1, shown.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setNavigated(true);
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && shown.length > 0 && (query || navigated) && (!exact || navigated)) {
      // Enter elige la sugerencia resaltada en vez de enviar el formulario; con el campo vacío o ya completo deja enviar
      e.preventDefault();
      pick(shown[Math.min(active, shown.length - 1)]);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative min-w-0">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setActive(0); setNavigated(false); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        required={required}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        className="w-full pl-3 pr-8 py-2.5 rounded-xl text-sm outline-none gc-focus"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen((v) => !v)}
        aria-label="Mostrar opciones"
        className="absolute right-0 top-0 h-full w-8 flex items-center justify-center"
      >
        <ChevronDown size={14} color={C.muted} />
      </button>

      {open && (shown.length > 0 || isNew) && (
        <div
          className={`absolute left-0 right-0 rounded-xl overflow-hidden z-10 ${dropUp ? 'bottom-full mb-1' : 'mt-1'}`}
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: `0 12px 24px ${rgba('#000000', 0.35)}` }}
        >
          <div ref={listRef} role="listbox" className="overflow-y-auto gc-hide-scrollbar" style={{ maxHeight: '200px' }}>
            {shown.map((o, i) => (
              <button
                key={o}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o)}
                className="w-full px-3 py-2 text-sm text-left truncate gc-focus"
                style={{ color: plain(o) === query ? C.brandBright : C.bright, backgroundColor: i === active ? rgba(C.brandBright, 0.12) : 'transparent' }}
              >
                {o}
              </button>
            ))}
          </div>
          {isNew && (
            <p className="px-3 py-2 text-xs" style={{ color: C.muted, borderTop: shown.length ? `1px solid ${C.border}` : 'none' }}>
              «{value.trim()}» es nuevo: se guarda como opción al crear el estadio.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
