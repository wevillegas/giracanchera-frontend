import ConfirmModal from './ConfirmModal';
import { Fragment, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, CalendarDays, Trophy, Ticket, UtensilsCrossed, Car, Bus, Images, MapPin, Pencil, Heart, Bookmark, Flag, Trash2 } from 'lucide-react';
import { C, rgba, DISPLAY_FONT, formatMoney, sumExpenses } from '../theme';
import { useAuth } from '../context/AuthContext';
import { isAdminRole } from '../utils/roles';
import visitService from '../services/visitService';
import userService from '../services/userService';
import clubService from '../services/clubService';
import { Logo } from './ClubPicker';
import StarRow from './StarRow';
import PostcardViewer, { PostcardFront } from './Postcard';
import { useLogoColors } from '../utils/logoColors';
import Navbar from './Navbar';

const EXPENSE_ROWS = [
  { key: 'ticket', label: 'Entradas', Icon: Ticket },
  { key: 'food', label: 'Comida', Icon: UtensilsCrossed },
  { key: 'parking', label: 'Estacionamiento', Icon: Car },
  { key: 'transport', label: 'Transporte / otros', Icon: Bus },
];

function formatLongDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

// Visor de fotos dentro de la app: navegación con flechas/teclado, cierra con Esc o clic en el fondo.
function PhotoModal({ images, index, alt, onIndexChange, onClose }) {
  const hasMany = images.length > 1;
  const touchStartX = useRef(null);
  const wheelLocked = useRef(false);
  const [direction, setDirection] = useState('right');

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (hasMany && e.key === 'ArrowRight') { setDirection('right'); onIndexChange((index + 1) % images.length); }
      if (hasMany && e.key === 'ArrowLeft') { setDirection('left'); onIndexChange((index - 1 + images.length) % images.length); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, images.length, hasMany, onIndexChange, onClose]);

  function goNext() { setDirection('right'); onIndexChange((index + 1) % images.length); }
  function goPrev() { setDirection('left'); onIndexChange((index - 1 + images.length) % images.length); }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (!hasMany || touchStartX.current == null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(diff) < 50) return;
    if (diff < 0) goNext(); else goPrev();
  }
  // Nota: goNext/goPrev ya fijan la dirección de la animación
  // Soporta scroll horizontal del mouse/trackpad para cambiar de foto (desktop y responsive)
  function handleWheel(e) {
    if (!hasMany || wheelLocked.current) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 30) return;
    wheelLocked.current = true;
    if (delta > 0) goNext(); else goPrev();
    setTimeout(() => { wheelLocked.current = false; }, 350);
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      style={{ backgroundColor: rgba(C.bg, 0.92) }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      role="dialog"
      aria-modal="true"
    >
      <img
        key={index}
        src={images[index]}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className={`max-w-full max-h-[85vh] object-contain rounded-xl ${direction === 'right' ? 'gc-slide-right' : 'gc-slide-left'}`}
      />
      <button onClick={onClose} aria-label="Cerrar" className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center gc-focus" style={{ backgroundColor: rgba(C.surface, 0.45) }}>
        <X size={18} color={C.bright} />
      </button>
      {hasMany && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Foto anterior"
            className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center gc-focus"
            style={{ backgroundColor: rgba(C.surface, 0.45) }}
          >
            <ChevronLeft size={18} color={C.bright} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Foto siguiente"
            className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center gc-focus"
            style={{ backgroundColor: rgba(C.surface, 0.45) }}
          >
            <ChevronRight size={18} color={C.bright} />
          </button>
          <span className="absolute bottom-4 text-xs" style={{ color: C.muted }}>{index + 1} / {images.length}</span>
        </>
      )}
    </div>
  );
}

export default function VisitView({ visit, stadium: stadiumData, onBack, onOpenStadium, onEditVisit, onDeleteVisit, onAdminDeleteVisit, onOpenAuthor, navbarProps }) {
  const { user: me } = useAuth();
  const [photoIndex, setPhotoIndex] = useState(null);
  // La visita trae el usuario poblado (desde la página del estadio) o solo el id (desde el perfil)
  const authorId = typeof visit.user === 'string' ? visit.user : visit.user?._id;
  const isOwn = Boolean(me?._id) && authorId === me._id;
  // Usuario poblado (desde el estadio o el perfil); sin poblar solo queda el id
  const author = typeof visit.user === 'object' ? visit.user : null;

  // Me gusta y guardar: solo para reseñas de otros usuarios, y con sesión iniciada
  const socialEnabled = Boolean(me?._id) && !isOwn;
  const [liked, setLiked] = useState(() => (visit.likes || []).some((id) => String(id) === String(me?._id)));
  const [likesCount, setLikesCount] = useState(() => (visit.likes || []).length);
  const [saved, setSaved] = useState(false);
  const [socialError, setSocialError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportDone, setReportDone] = useState('');
  const [adminDeleteOpen, setAdminDeleteOpen] = useState(false);
  const [adminDeleteReason, setAdminDeleteReason] = useState('');
  const [adminDeleteError, setAdminDeleteError] = useState('');
  const [adminDeleting, setAdminDeleting] = useState(false);
  const [ownDeleteOpen, setOwnDeleteOpen] = useState(false);
  const canAdminDelete = Boolean(onAdminDeleteVisit) && isAdminRole(me?.rol) && !isOwn;

  async function handleAdminDelete() {
    const reason = adminDeleteReason.trim();
    if (reason.length < 5) {
      setAdminDeleteError('Escribí un motivo de al menos 5 caracteres.');
      return;
    }
    setAdminDeleting(true);
    setAdminDeleteError('');
    try {
      await onAdminDeleteVisit(visit, reason);
    } catch (err) {
      setAdminDeleteError(err.response?.data?.message || 'No pudimos eliminar la reseña. Probá de nuevo.');
      setAdminDeleting(false);
    }
  }

  // Escudos de los clubes del partido (la visita guarda solo el nombre)
  const [logoByName, setLogoByName] = useState({});
  useEffect(() => {
    let cancelled = false;
    clubService.getAll()
      .then((data) => { if (!cancelled) setLogoByName(Object.fromEntries(data.map((c) => [c.name, c.logoUrl]))); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!socialEnabled) return undefined;
    let cancelled = false;
    userService.getProfile()
      .then((profile) => {
        if (!cancelled) setSaved((profile.savedVisits || []).some((id) => String(id?._id ?? id) === String(visit._id)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [socialEnabled, visit._id]);

  async function handleToggleLike() {
    setSocialError('');
    try {
      const result = await visitService.toggleLike(visit._id);
      setLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch (err) {
      setSocialError(err.response?.data?.message || 'No pudimos registrar el me gusta.');
    }
  }

  async function handleReport() {
    setSocialError('');
    try {
      const result = await visitService.reportVisit(visit._id, reportText.trim());
      setReportDone(result.message);
      setReportOpen(false);
      setReportText('');
    } catch (err) {
      setSocialError(err.response?.data?.message || 'No pudimos enviar la denuncia.');
    }
  }

  async function handleToggleSave() {
    setSocialError('');
    try {
      const result = await visitService.toggleSave(visit._id);
      setSaved(result.saved);
    } catch (err) {
      setSocialError(err.response?.data?.message || 'No pudimos guardar la reseña.');
    }
  }
  const stadium = stadiumData || visit.stadium || {};
  const match = visit.matchDetails || {};
  const expenses = visit.expenses || {};
  const currency = expenses.currency || 'ARS';
  const hasMatch = match.homeTeam || match.awayTeam || match.score;
  const images = visit.images || [];

  const logoColors = useLogoColors(stadium.clubLogoUrl);
  const [postalA, postalB] = logoColors || ['#C8453B', '#2F5D9E'];
  // La postal es la del estadio (igual que en su ficha), no la de la reseña
  const stadiumPhotos = stadium.photos?.length ? stadium.photos : (stadium.imageUrl ? [{ url: stadium.imageUrl, credit: '' }] : []);
  const [stadiumPhotoIndex, setStadiumPhotoIndex] = useState(0);
  const [postalOpen, setPostalOpen] = useState(false);
  const stadiumPhoto = stadiumPhotos[Math.min(stadiumPhotoIndex, stadiumPhotos.length - 1)];
  const goStadiumPhoto = (step) => setStadiumPhotoIndex((stadiumPhotoIndex + step + stadiumPhotos.length) % stadiumPhotos.length);
  const authorName = isOwn ? 'Vos' : author?.username;

  return (
    <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />

      {/* Portada: la foto de la reseña como postal y, a la derecha, quién la escribió y cómo puntuó */}
      <div className="relative overflow-hidden" style={{ backgroundColor: C.surface }}>
        {stadiumPhoto && <img src={stadiumPhoto.url} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${rgba(C.bg, 0.6)}, ${rgba(C.bg, 0.25)} 45%, ${C.bg})` }} />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 25% 40%, ${rgba(postalA, 0.22)}, transparent 60%)` }} />
        <div className="relative max-w-5xl mx-auto px-4 pt-28 pb-10">
          <button onClick={onBack} aria-label="Volver" className="w-9 h-9 rounded-full flex items-center justify-center gc-focus" style={{ backgroundColor: rgba(C.bg, 0.6) }}>
            <ChevronLeft size={18} color={C.bright} />
          </button>

          <div className="mt-5 grid gap-10 md:grid-cols-2 items-center">
            {/* Postal del estadio: la misma de su ficha; las fotos de la reseña van más abajo, en su sección */}
            <div className="relative w-full max-w-xl mx-auto md:-rotate-1">
              <span aria-hidden="true" className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 rotate-2 z-10" style={{ backgroundColor: rgba(postalA, 0.55) }} />
              <div
                role="button"
                tabIndex={0}
                aria-label="Abrir la postal"
                onClick={() => setPostalOpen(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPostalOpen(true); } }}
                className="cursor-zoom-in transition-transform duration-200 hover:scale-[1.015] gc-focus rounded-md"
              >
                <PostcardFront
                  stadium={stadium}
                  photo={stadiumPhoto}
                  a={postalA}
                  b={postalB}
                  className="aspect-[8/7]"
                  photoOverlay={stadiumPhotos.length > 1 && [[-1, 'left-2', ChevronLeft, 'Foto anterior'], [1, 'right-2', ChevronRight, 'Foto siguiente']].map(([step, side, Icon, label]) => (
                    <button key={step} onClick={(e) => { e.stopPropagation(); goStadiumPhoto(step); }} aria-label={label} className={`absolute ${side} top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center gc-focus`} style={{ backgroundColor: rgba(C.bg, 0.6) }}>
                      <Icon size={18} color={C.bright} />
                    </button>
                  ))}
                  captionRight={stadiumPhotos.length > 1 && (
                    <div className="flex gap-1.5 shrink-0">
                      {stadiumPhotos.map((p, i) => (
                        <button key={p.url} onClick={(e) => { e.stopPropagation(); setStadiumPhotoIndex(i); }} aria-label={`Ver foto ${i + 1}`} className="w-2 h-2 rounded-full gc-focus" style={{ backgroundColor: i === stadiumPhotoIndex ? '#3B2F1E' : 'rgba(59,47,30,0.3)' }} />
                      ))}
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="min-w-0">
              <span className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-semibold" style={{ backgroundColor: isOwn ? C.brand : rgba(C.bg, 0.7), color: C.bright }}>
                {isOwn ? 'Tu reseña' : 'Reseña'}
              </span>

              {author && (
                <button
                  onClick={() => onOpenAuthor?.(author._id)}
                  disabled={!onOpenAuthor}
                  className="flex items-center gap-4 rounded-xl text-left gc-focus gc-tap disabled:cursor-default"
                >
                  {author.avatarUrl ? (
                    <img src={author.avatarUrl} alt={author.username} className="w-16 h-16 rounded-full object-cover shrink-0" style={{ border: `3px solid ${C.surface}` }} />
                  ) : (
                    <div className="w-16 h-16 rounded-full shrink-0 flex items-center justify-center text-2xl font-semibold" style={{ backgroundColor: C.border, color: C.bright }}>
                      {author.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="text-3xl md:text-4xl leading-none break-words min-w-0" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>{authorName}</span>
                </button>
              )}

              <div className="flex items-end gap-4 mt-5">
                <p className="leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.gold }}>
                  <span className="text-7xl">{visit.rating}</span><span className="text-2xl" style={{ color: C.muted }}>/10</span>
                </p>
                <div className="pb-1.5 space-y-1">
                  <StarRow rating={visit.rating / 2} size={18} />
                  <p className="flex items-center gap-1.5 text-sm" style={{ color: C.muted }}><CalendarDays size={14} /> {formatLongDate(visit.visitDate)}</p>
                </div>
              </div>

              <button
                onClick={() => onOpenStadium?.()}
                disabled={!onOpenStadium}
                className="mt-6 w-full flex items-center gap-3 p-3 rounded-2xl text-left gc-focus gc-tap disabled:cursor-default"
                style={{ backgroundColor: rgba(C.bg, 0.55), border: `1px solid ${C.border}` }}
              >
                {stadium.clubLogoUrl && <img src={stadium.clubLogoUrl} alt="" className="w-11 h-11 object-contain shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold leading-tight break-words" style={{ color: C.bright }}>{stadium.name || 'Estadio'}</p>
                  {stadium.locationLabel && <p className="flex items-start gap-1 text-xs mt-0.5" style={{ color: C.muted }}><MapPin size={12} className="shrink-0 mt-0.5" /> {stadium.locationLabel}</p>}
                </div>
                {onOpenStadium && <span className="text-xs font-semibold shrink-0" style={{ color: C.brandBright }}>Ver estadio →</span>}
              </button>

              {(isOwn && (onEditVisit || onDeleteVisit)) || (canAdminDelete && !adminDeleteOpen) ? (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {isOwn && onEditVisit && (
                    <button onClick={() => onEditVisit(visit)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus gc-tap" style={{ border: `1px solid ${C.border}`, color: C.bright, backgroundColor: rgba(C.bg, 0.55) }}>
                      <Pencil size={13} /> Editar reseña
                    </button>
                  )}
                  {isOwn && onDeleteVisit && (
                    <button onClick={() => setOwnDeleteOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus gc-tap" style={{ border: '1px solid #f85149', color: '#f85149' }}>
                      <Trash2 size={13} /> Eliminar reseña
                    </button>
                  )}
                  {canAdminDelete && !adminDeleteOpen && (
                    <button onClick={() => setAdminDeleteOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus gc-tap" style={{ border: '1px solid #f85149', color: '#f85149' }}>
                      <Trash2 size={13} /> Eliminar como admin
                    </button>
                  )}
                </div>
              ) : null}
              {ownDeleteOpen && (
                <ConfirmModal
                  danger
                  title="¿Eliminar tu reseña?"
                  message="Se borran también sus fotos. No se puede deshacer."
                  confirmLabel="Eliminar"
                  onConfirm={() => { setOwnDeleteOpen(false); onDeleteVisit(visit); }}
                  onCancel={() => setOwnDeleteOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid gap-8 md:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-4">
            {canAdminDelete && adminDeleteOpen && (
              <div className="p-4 rounded-2xl space-y-2" style={{ backgroundColor: C.surface, border: '1px solid #f85149' }}>
                <p className="text-xs font-semibold" style={{ color: '#f85149' }}>Eliminar esta reseña</p>
                <p className="text-xs" style={{ color: C.muted }}>Se borran también sus fotos y denuncias. Queda registrado en la auditoría con el motivo.</p>
                <textarea
                  value={adminDeleteReason}
                  onChange={(e) => setAdminDeleteReason(e.target.value.slice(0, 300))}
                  maxLength={300}
                  rows={2}
                  placeholder="Motivo (obligatorio)"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none gc-focus"
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.bright }}
                />
                {adminDeleteError && <p className="text-xs" style={{ color: '#f85149' }}>{adminDeleteError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAdminDelete}
                    disabled={adminDeleting || adminDeleteReason.trim().length < 5}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus disabled:opacity-40"
                    style={{ backgroundColor: '#f85149', color: C.bright }}
                  >
                    {adminDeleting ? 'Eliminando...' : 'Confirmar eliminación'}
                  </button>
                  <button onClick={() => { setAdminDeleteOpen(false); setAdminDeleteError(''); }} className="text-xs" style={{ color: C.muted }}>Cancelar</button>
                </div>
              </div>
            )}

            {hasMatch && (
              <div className="p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={14} color={C.muted} />
                  <span className="text-xs uppercase tracking-widest" style={{ color: C.muted }}>Partido</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  {[match.homeTeam, match.awayTeam].map((team, i) => (
                    <Fragment key={i}>
                      {i === 1 && (
                        <span className="text-xs font-semibold tracking-[0.3em]" style={{ color: C.gold, fontFamily: DISPLAY_FONT }}>VS</span>
                      )}
                      <div className="flex flex-col items-center gap-1.5 min-w-0 w-full">
                        <Logo url={team ? logoByName[team] : ''} size={56} />
                        <span className="text-base font-semibold truncate max-w-full" style={{ color: team ? C.bright : C.muted }}>{team || 'Sin equipo'}</span>
                      </div>
                    </Fragment>
                  ))}
                </div>
                {match.score && (
                  <p className="text-sm mt-3 text-center" style={{ color: C.muted }}>Resultado: <span style={{ color: C.bright, fontWeight: 600 }}>{match.score}</span></p>
                )}
              </div>
            )}

            <div className="p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <h2 className="flex items-center gap-2 text-base font-semibold mb-3" style={{ color: C.bright }}>
                <span className="text-4xl leading-none -mb-3" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>“</span> La reseña
              </h2>
              <p className="text-base leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]" style={{ color: visit.reviewText?.trim() ? C.bright : C.muted }}>
                {visit.reviewText?.trim() || (isOwn ? 'Sin reseña escrita todavía.' : 'No se escribió una reseña.')}
              </p>
            </div>

            {(socialEnabled || likesCount > 0) && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleLike}
                    disabled={!socialEnabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus gc-tap disabled:cursor-default"
                    style={{ border: `1px solid ${liked ? '#f85149' : C.border}`, color: liked ? '#f85149' : C.bright, backgroundColor: C.surface }}
                  >
                    <Heart size={14} fill={liked ? '#f85149' : 'none'} color={liked ? '#f85149' : C.bright} />
                    {likesCount} me gusta
                  </button>
                  {socialEnabled && (
                    <button
                      onClick={handleToggleSave}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus gc-tap"
                      style={{ border: `1px solid ${saved ? C.gold : C.border}`, color: saved ? C.gold : C.bright, backgroundColor: C.surface }}
                    >
                      <Bookmark size={14} fill={saved ? C.gold : 'none'} color={saved ? C.gold : C.bright} />
                      {saved ? 'Guardada' : 'Guardar'}
                    </button>
                  )}
                </div>
                {socialEnabled && (
                  <div className="space-y-2">
                    {!reportOpen && !reportDone && (
                      <button onClick={() => setReportOpen(true)} className="flex items-center gap-1.5 text-xs font-medium gc-focus" style={{ color: C.muted }}>
                        <Flag size={12} /> Reportar reseña
                      </button>
                    )}
                    {reportOpen && (
                      <div className="space-y-2">
                        <textarea
                          value={reportText}
                          onChange={(e) => setReportText(e.target.value.slice(0, 300))}
                          maxLength={300}
                          rows={2}
                          placeholder="Contá por qué la reseña no corresponde"
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none gc-focus"
                          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleReport}
                            disabled={!reportText.trim()}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold gc-focus disabled:opacity-40"
                            style={{ backgroundColor: C.brand, color: C.bright }}
                          >
                            Enviar denuncia
                          </button>
                          <button onClick={() => setReportOpen(false)} className="text-xs" style={{ color: C.muted }}>Cancelar</button>
                        </div>
                      </div>
                    )}
                    {reportDone && <p className="text-xs" style={{ color: C.brandBright }}>{reportDone}</p>}
                  </div>
                )}
                {socialError && <p className="text-xs" style={{ color: '#f85149' }}>{socialError}</p>}
              </div>
            )}

            <div className="p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Images size={14} color={C.muted} />
                <h2 className="text-sm font-semibold" style={{ color: C.bright }}>Fotos {images.length > 0 && <span className="font-normal" style={{ color: C.muted }}>{images.length}</span>}</h2>
              </div>
              {images.length === 0 ? (
                <p className="text-sm" style={{ color: C.muted }}>{isOwn ? 'No subiste fotos para esta visita.' : 'No se subieron imágenes para esta visita.'}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((src, i) => (
                    <button key={src} onClick={() => setPhotoIndex(i)} className="block rounded-xl overflow-hidden gc-focus gc-tap" style={{ border: `1px solid ${C.border}` }}>
                      <img src={src} alt={`Foto ${i + 1} de la visita a ${stadium.name || 'el estadio'}`} className="w-full h-44 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="min-w-0 flex flex-col">
            <div className="p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: C.bright }}>Gasto de la visita</span>
                <span className="text-sm font-semibold" style={{ color: C.brandBright }}>
                  {formatMoney(sumExpenses(Object.fromEntries(EXPENSE_ROWS.map(({ key }) => [key, expenses[key] || 0]))), currency)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {EXPENSE_ROWS.map(({ key, label, Icon }) => (
                  <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                    <Icon size={14} color={C.muted} />
                    <div className="flex-1">
                      <p className="text-xs" style={{ color: C.muted }}>{label}</p>
                      <p className="text-sm font-medium" style={{ color: C.bright }}>{formatMoney(expenses[key] || 0, currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {stadium.location?.coordinates && (
              <div className="relative flex-1 min-h-64 mt-4 rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <iframe
                  title={`Mapa de ${stadium.name || 'el estadio'}`}
                  src={`https://www.google.com/maps?q=${stadium.location.coordinates.lat},${stadium.location.coordinates.lng}&z=16&output=embed`}
                  className="absolute inset-0 w-full h-full block"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            )}
          </aside>
        </div>
      </div>

      {postalOpen && <PostcardViewer stadium={stadium} photo={stadiumPhoto} a={postalA} b={postalB} onClose={() => setPostalOpen(false)} />}
      {photoIndex !== null && (
        <PhotoModal
          images={images}
          index={photoIndex}
          alt={`Foto de la visita a ${stadium.name || 'el estadio'}`}
          onIndexChange={setPhotoIndex}
          onClose={() => setPhotoIndex(null)}
        />
      )}
    </div>
  );
}
