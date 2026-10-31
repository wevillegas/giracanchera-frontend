import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { C } from '../theme';

// Fila de pestañas que se desplaza de costado. Las flechas aparecen solo cuando hay pestañas fuera de la vista
// (en celular no: ahí se desliza con el dedo). La pestaña elegida (aria-selected) se trae a la vista al cambiar `active`.
export default function ScrollStrip({ active, className = '', children }) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  useEffect(() => {
    ref.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, [active]);

  const scrollBy = (direction) => ref.current.scrollBy({ left: direction * ref.current.clientWidth * 0.6, behavior: 'smooth' });
  const arrow = (side, Icon, label, direction) => (
    <button
      onClick={() => scrollBy(direction)}
      aria-label={label}
      className={`absolute ${side}-0 top-0 bottom-1 w-12 hidden sm:flex items-center ${side === 'left' ? 'justify-start' : 'justify-end'} z-10 gc-focus`}
      style={{ background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, ${C.bg} 55%, transparent)` }}
    >
      <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <Icon size={16} color={C.bright} />
      </span>
    </button>
  );

  return (
    <div className={`relative ${className}`}>
      {edges.left && arrow('left', ChevronLeft, 'Ver pestañas anteriores', -1)}
      <div ref={ref} onScroll={update} role="tablist" className="flex items-center gap-2 overflow-x-auto gc-hide-scrollbar pb-1">
        {children}
      </div>
      {edges.right && arrow('right', ChevronRight, 'Ver más pestañas', 1)}
    </div>
  );
}
