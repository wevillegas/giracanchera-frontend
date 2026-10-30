import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';

function initialsOf(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

// Visor de fotos de hinchas: navega entre todas las fotos del estadio (flechas, teclado, deslizar)
// y muestra quién subió la que se está viendo
export default function PhotoLightbox({ photos, startIndex = 0, onClose, onOpenVisit }) {
  const [index, setIndex] = useState(startIndex);
  const touchX = useRef(null);
  const thumbsRef = useRef(null);
  const { url, visit } = photos[index];
  const author = visit?.user;

  const go = (step) => setIndex((i) => (i + step + photos.length) % photos.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  // La miniatura de la foto actual siempre queda a la vista
  useEffect(() => {
    thumbsRef.current?.children[index]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [index]);

  const arrow = (step, side, Icon, label) => photos.length > 1 && (
    <button
      onClick={() => go(step)}
      aria-label={label}
      className={`absolute ${side} top-1/2 -translate-y-1/2 w-11 h-11 rounded-full hidden sm:flex items-center justify-center gc-focus`}
      style={{ backgroundColor: rgba(C.bg, 0.7), border: `1px solid ${C.border}` }}
    >
      <Icon size={22} color={C.bright} />
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[1300] flex flex-col gc-overlay"
      style={{ backgroundColor: rgba('#000000', 0.92) }}
      role="dialog"
      aria-modal="true"
      aria-label="Foto de hincha"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {author?.avatarUrl ? (
            <img src={author.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: C.brand, color: C.bright, fontFamily: DISPLAY_FONT }}>
              {initialsOf(author?.username || '?')}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: C.bright }}>@{author?.username || 'usuario'}</p>
            <p className="text-xs truncate" style={{ color: C.muted }}>{visit?.stadium?.name ? `${visit.stadium.name} · ` : ''}{formatDate(visit?.visitDate)} · Foto {index + 1} de {photos.length}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 gc-focus gc-tap"
          style={{ backgroundColor: rgba(C.surface, 0.8), border: `1px solid ${C.border}` }}
        >
          <X size={18} color={C.bright} />
        </button>
      </div>

      <div
        className="relative flex-1 min-h-0 flex items-center justify-center px-4 sm:px-14"
        // Solo en celular (sin flechas): tocar fuera de la foto cierra el visor. En pantallas grandes no, para no cerrarlo por fallar una flecha
        onClick={(e) => { if (e.target === e.currentTarget && !window.matchMedia('(min-width: 640px)').matches) onClose(); }}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        {/* Las flechas van pegadas a la foto (no al borde de la pantalla) */}
        <div className="relative max-w-full">
          <img key={url} src={url} alt="" className="block max-w-full max-h-[calc(100dvh-17rem)] object-contain rounded-xl" />
          {arrow(-1, 'right-full mr-3', ChevronLeft, 'Foto anterior')}
          {arrow(1, 'left-full ml-3', ChevronRight, 'Foto siguiente')}
        </div>
      </div>

    <div className="flex items-center justify-center gap-2 px-4 pt-3">
      {onOpenVisit && (
      <button
        onClick={() => visit && onOpenVisit(visit)}
        className="gc-action px-4 rounded-xl text-sm font-semibold gc-focus gc-tap"
        style={{ backgroundColor: C.brand, color: C.bright }}
      >
        Ver la reseña completa
      </button>
      )}
      <button
        onClick={onClose}
        className="gc-action px-4 rounded-xl text-sm font-semibold gc-focus gc-tap flex items-center gap-1.5"
        style={{ border: `1px solid ${C.border}`, color: C.bright }}
      >
        <X size={16} /> Cerrar imagen
      </button>
    </div>

      {photos.length > 1 && (
        <div ref={thumbsRef} className="flex gap-2 overflow-x-auto gc-hide-scrollbar px-4 py-3 justify-start sm:justify-center">
          {photos.map((p, i) => (
            <button
              key={`${p.url}-${i}`}
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              className="w-14 h-14 rounded-lg overflow-hidden shrink-0 gc-focus"
              style={{ border: `2px solid ${i === index ? C.brandBright : 'transparent'}`, opacity: i === index ? 1 : 0.55 }}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
