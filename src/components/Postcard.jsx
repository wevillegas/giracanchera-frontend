import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import StadiumArt from './StadiumArt';

const PAPER = '#F4EDDC';
const INK = '#3B2F1E';
const INK_SOFT = '#7A6A52';
const TILT_DEGREES = 12;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Marco común del frente y el dorso: borde de correo aéreo con los colores del club y papel crema
function Frame({ a, b, className = '', children }) {
  return (
    <div
      className={`p-[5px] sm:p-[7px] rounded-md ${className}`}
      style={{
        background: `repeating-linear-gradient(135deg, ${a} 0 14px, ${PAPER} 14px 28px, ${b} 28px 42px, ${PAPER} 42px 56px)`,
        boxShadow: '0 20px 45px rgba(0,0,0,0.5)',
      }}
    >
      <div className="h-full flex flex-col p-2 sm:p-3 pb-3 sm:pb-4 rounded-[3px]" style={{ backgroundColor: PAPER }}>{children}</div>
    </div>
  );
}

// Sello con el escudo del club
function Stamp({ logoUrl, a, className = '' }) {
  return (
    <div className={`p-1 rotate-3 ${className}`} style={{ backgroundColor: PAPER, outline: `2px dashed ${rgba(a, 0.7)}`, outlineOffset: '-3px', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>
      {logoUrl
        ? <img src={logoUrl} alt="" className="w-full aspect-square object-contain" />
        : <div className="w-full aspect-square flex items-center justify-center text-xs font-bold" style={{ color: a }}>GC</div>}
    </div>
  );
}

export function PostcardFront({ stadium, photo, a, b, className = '', photoOverlay = null, captionRight = null }) {
  return (
    <Frame a={a} b={b} className={className}>
      <div className="relative flex-1 min-h-0 overflow-hidden rounded-sm" style={{ border: '1px solid rgba(0,0,0,0.2)', backgroundColor: C.surface }}>
        {photo ? (
          <img src={photo.url} alt={stadium.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <StadiumArt tone={stadium.tone} uid={`postal-${stadium.id}`} className="absolute inset-0 w-full h-full" />
        )}
        {photoOverlay}
        {stadium.clubLogoUrl && <Stamp logoUrl={stadium.clubLogoUrl} a={a} className="absolute top-2 right-2 w-11 sm:w-14" />}
      </div>
      <div className="flex items-center justify-between gap-3 mt-2 sm:mt-3 px-1">
        <div className="min-w-0">
          <p className="text-base sm:text-xl leading-none truncate" style={{ fontFamily: DISPLAY_FONT, color: INK }}>Saludos desde {stadium.city || stadium.name}</p>
          {photo?.credit && <p className="text-[11px] mt-1 truncate" style={{ color: INK_SOFT }}>{photo.credit}</p>}
        </div>
        {captionRight}
      </div>
    </Frame>
  );
}

// Dorso: el resumen del estadio escrito como en una postal, con sello y matasellos a la derecha
export function PostcardBack({ stadium, a, b, className = '' }) {
  const rows = [
    ['Nombre', stadium.name],
    ['Club', stadium.clubName],
    ['Lugar', stadium.locationLabel],
    ['Espectadores', stadium.capacity ? Number(stadium.capacity).toLocaleString('es-AR') : null],
    ['Fundación', stadium.openedYear],
  ].filter(([, value]) => value);
  return (
    <Frame a={a} b={b} className={className}>
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_4.5rem] sm:grid-cols-[1.7fr_1fr] gap-3 sm:gap-5">
        <div className="min-w-0 flex flex-col justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: a }}>Resumen del estadio</p>
          {rows.map(([label, value]) => (
            <div key={label} className="pb-0.5" style={{ borderBottom: `1px dashed ${rgba(INK, 0.35)}` }}>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider" style={{ color: INK_SOFT }}>{label}</p>
              <p className="text-base sm:text-xl leading-tight break-words" style={{ fontFamily: DISPLAY_FONT, color: INK }}>{value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-end justify-between pl-3 sm:pl-5" style={{ borderLeft: `1px solid ${rgba(INK, 0.25)}` }}>
          <Stamp logoUrl={stadium.clubLogoUrl} a={a} className="w-14 sm:w-20" />
          <div className="hidden sm:flex items-center justify-center w-24 h-24 -rotate-12 rounded-full text-center" style={{ border: `2px solid ${rgba(a, 0.6)}`, color: rgba(a, 0.85) }}>
            <div className="text-[9px] font-bold uppercase tracking-widest leading-tight">
              GiraCanchera<br /><span className="text-[11px]">{stadium.city || 'Estadio'}</span><br />★ ★ ★
            </div>
          </div>
          <div className="w-full space-y-3 pb-1">
            {[0, 1, 2].map((i) => <div key={i} className="h-px w-full" style={{ backgroundColor: rgba(INK, 0.35) }} />)}
          </div>
        </div>
      </div>
    </Frame>
  );
}

// Postal abierta: se inclina siguiendo el cursor, con un brillo que lo acompaña (como las portadas de álbum de Spotify),
// y al tocarla se da vuelta para mostrar el dorso.
export default function PostcardViewer({ stadium, photo, a, b, onClose }) {
  const [flipped, setFlipped] = useState(false);
  const tiltRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onMove = (e) => {
    if (reducedMotion()) return;
    const el = tiltRef.current;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.transition = 'transform 0.1s ease-out';
    el.style.transform = `rotateX(${(0.5 - py) * 2 * TILT_DEGREES}deg) rotateY(${(px - 0.5) * 2 * TILT_DEGREES}deg)`;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  };
  const onLeave = () => {
    const el = tiltRef.current;
    el.style.transition = 'transform 0.5s ease-out';
    el.style.transform = '';
  };

  const face = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' };
  const glare = (
    <div
      aria-hidden="true"
      className="absolute inset-0 rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: 'radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.32), transparent 55%)', mixBlendMode: 'soft-light' }}
    />
  );
  const size = 'w-full h-full';
  return (
    <div className="fixed inset-0 z-[1400] flex flex-col items-center justify-center p-5 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.78) }} onClick={onClose}>
      <button onClick={onClose} aria-label="Cerrar" className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center gc-focus" style={{ backgroundColor: rgba(C.bg, 0.7) }}>
        <X size={20} color={C.bright} />
      </button>

      <div className="w-full gc-modal" style={{ perspective: '1400px', maxWidth: 'min(48rem, calc((100dvh - 8rem) * 1.3))' }} onClick={(e) => e.stopPropagation()}>
        <div
          ref={tiltRef}
          className="group relative w-full aspect-[4/3] sm:aspect-[3/2] cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Mostrar el frente de la postal' : 'Dar vuelta la postal'}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); } }}
        >
          <div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none', transition: `transform ${reducedMotion() ? 0 : 0.7}s cubic-bezier(0.4, 0.2, 0.2, 1)` }}
          >
            <div className="absolute inset-0" style={face}>
              <PostcardFront stadium={stadium} photo={photo} a={a} b={b} className={size} />
              {glare}
            </div>
            <div className="absolute inset-0" style={{ ...face, transform: 'rotateY(180deg)' }}>
              <PostcardBack stadium={stadium} a={a} b={b} className={size} />
              {glare}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm" style={{ color: C.muted }}>Mové el cursor para inclinarla · tocala para darla vuelta</p>
    </div>
  );
}
