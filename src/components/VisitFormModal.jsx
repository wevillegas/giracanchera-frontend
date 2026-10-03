import { useEffect, useState } from 'react';
import { ChevronLeft, Check, Calendar, AlertCircle, ImagePlus, X } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import visitService from '../services/visitService';
import clubService from '../services/clubService';

const REVIEW_MAX = 300;

function toDateInputValue(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

// Hoy en hora local, para no dejar elegir una fecha futura
function todayDateInputValue() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}

export default function VisitFormModal({ stadium, editingVisit, expenseFields, onClose, onSaved }) {
  const isEditing = Boolean(editingVisit);
  const stadiumName = isEditing ? editingVisit.stadium?.name : stadium?.name;

  const [date, setDate] = useState(() => (isEditing ? toDateInputValue(editingVisit.visitDate) : ''));
  const [score, setScore] = useState(() => editingVisit?.rating ?? 8);
  const [review, setReview] = useState(() => editingVisit?.reviewText ?? '');
  // Partido: club local y visitante que jugaron ese día en el estadio
  // Al crear, el local arranca como el club dueño del estadio (si tiene); se puede cambiar por cancha neutral
  const [homeTeam, setHomeTeam] = useState(() => editingVisit?.matchDetails?.homeTeam ?? (isEditing ? '' : stadium?.clubName ?? ''));
  const [awayTeam, setAwayTeam] = useState(() => editingVisit?.matchDetails?.awayTeam ?? '');
  const [matchScore, setMatchScore] = useState(() => editingVisit?.matchDetails?.score ?? '');
  const [clubs, setClubs] = useState([]);
  const [expenses, setExpenses] = useState(() => {
    const source = editingVisit?.expenses || {};
    return {
      entradas: source.ticket || '',
      comida: source.food || '',
      estacionamiento: source.parking || '',
      transporte: source.transport || '',
    };
  });
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState('');
  // Fotos ya guardadas: se pueden quitar; las quitadas se mandan al back para borrarlas
  const [keptImages, setKeptImages] = useState(() => (isEditing ? editingVisit.images || [] : []));
  const [removedImages, setRemovedImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    clubService.getAll()
      .then((data) => { if (!cancelled) setClubs(data); })
      .catch(() => { if (!cancelled) setClubs([]); });
    return () => { cancelled = true; };
  }, []);

  // Opciones de los dos selectores; si la visita guardada tiene un club que ya no está en la lista, lo mantenemos
  const teamOptions = [...new Set([...clubs.map((c) => c.name), homeTeam, awayTeam].filter(Boolean))];

  const totalGasto = Object.values(expenses).reduce((sum, v) => sum + (Number(v) || 0), 0);

  // Tope de 4 fotos por visita: cuentan las guardadas que quedan y las nuevas seleccionadas
  const MAX_PHOTOS = 4;
  const totalPhotos = keptImages.length + photos.length;
  const photosFull = totalPhotos >= MAX_PHOTOS;

  // Vistas previas de las fotos nuevas (se liberan al cambiar la lista o desmontar)
  const [previews, setPreviews] = useState([]);
  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  // Agrega las elegidas a las que ya estaban; si pasan el tope, no se carga ninguna
  function handlePhotosChange(e) {
    const incoming = Array.from(e.target.files || []);
    e.target.value = '';
    if (incoming.length === 0) return;
    if (totalPhotos + incoming.length > MAX_PHOTOS) {
      setPhotoError(`Una visita puede tener hasta ${MAX_PHOTOS} fotos. Ya tenés ${totalPhotos} y elegiste ${incoming.length}; no se cargó ninguna.`);
      return;
    }
    setPhotoError('');
    setPhotos((prev) => [...prev, ...incoming]);
  }

  function removeNewPhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoError('');
  }

  function removeSavedImage(url) {
    setKeptImages((prev) => prev.filter((u) => u !== url));
    setRemovedImages((prev) => [...prev, url]);
  }

  async function handleSubmit() {
    if (homeTeam && awayTeam && homeTeam === awayTeam) {
      setError('El local y el visitante no pueden ser el mismo club.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('rating', score);
      formData.append('reviewText', review);
      formData.append('matchDetails', JSON.stringify({
        homeTeam,
        awayTeam,
        score: matchScore.trim(),
      }));
      formData.append('visitDate', date);
      if (!isEditing) formData.append('stadium', stadium.id);
      formData.append('expenses', JSON.stringify({
        ticket: Number(expenses.entradas) || 0,
        food: Number(expenses.comida) || 0,
        parking: Number(expenses.estacionamiento) || 0,
        transport: Number(expenses.transporte) || 0,
        currency: 'ARS',
      }));
      photos.forEach((file) => formData.append('photos', file));
      if (isEditing) formData.append('removeImages', JSON.stringify(removedImages));

      const result = isEditing
        ? await visitService.updateVisit(editingVisit._id, formData)
        : await visitService.createVisit(formData);

      onSaved?.(result);

      if (isEditing) {
        onClose();
      } else {
        setSaved(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos guardar tu visita. Probá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.6) }}>
      <div className="w-full max-w-md rounded-3xl overflow-y-auto gc-hide-scrollbar flex flex-col" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, maxHeight: '90vh' }}>
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4" style={{ backgroundColor: rgba(C.bg, 0.9), backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.border}` }}>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center gc-focus" style={{ backgroundColor: C.surface }}>
            <ChevronLeft size={18} color={C.bright} />
          </button>
          <div>
            <p className="text-xs" style={{ color: C.muted }}>{isEditing ? 'Editar entrada de tu bitácora' : 'Nueva entrada en tu bitácora'}</p>
            <p className="text-base font-semibold" style={{ color: C.bright }}>{stadiumName}</p>
          </div>
        </div>

        {saved ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: rgba(C.brandBright, 0.15) }}>
              <Check size={28} color={C.brandBright} />
            </div>
            <h3 className="text-2xl" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>¡Visita guardada!</h3>
            <p className="text-sm mt-1 max-w-xs" style={{ color: C.muted }}>
              Sumamos {stadiumName} a tu bitácora. Ya la podés ver en tu perfil.
            </p>
            <button onClick={onClose} className="mt-6 px-5 py-2.5 rounded-xl font-semibold text-sm gc-focus" style={{ backgroundColor: C.brand, color: C.bright }}>
              Listo
            </button>
          </div>
        ) : (
          <>
            <div className="px-4 py-5 space-y-6 flex-1">
              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ backgroundColor: rgba('#f85149', 0.12), border: `1px solid ${rgba('#f85149', 0.4)}`, color: '#f85149' }}>
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium" style={{ color: C.muted }}>Fecha de la visita</span>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <Calendar size={15} color={C.muted} />
                    <input
                      type="date"
                      value={date}
                      max={todayDateInputValue()}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-transparent outline-none text-sm flex-1 gc-focus"
                      style={{ color: C.bright, colorScheme: 'dark' }}
                    />
                  </div>
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>¿Cómo calificás la experiencia? (1 a 10)</span>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setScore(n)}
                      className="w-9 h-9 rounded-lg text-sm font-semibold gc-focus"
                      style={{
                        backgroundColor: score === n ? C.brandBright : C.surface,
                        color: score === n ? C.bg : C.muted,
                        border: `1px solid ${score === n ? C.brandBright : C.border}`,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Partido (opcional)</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Local', value: homeTeam, set: setHomeTeam },
                    { label: 'Visitante', value: awayTeam, set: setAwayTeam },
                  ].map(({ label, value, set }) => (
                    <label key={label} className="flex flex-col gap-1.5">
                      <span className="text-[11px]" style={{ color: C.muted }}>{label}</span>
                      <select
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright, colorScheme: 'dark' }}
                      >
                        <option value="" style={{ backgroundColor: C.surface }}>Elegí un club</option>
                        {teamOptions.map((name) => (
                          <option key={name} value={name} style={{ backgroundColor: C.surface }}>{name}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <label className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[11px]" style={{ color: C.muted }}>Resultado (opcional)</span>
                  <input
                    value={matchScore}
                    onChange={(e) => setMatchScore(e.target.value)}
                    placeholder="Ej: 2-1"
                    maxLength={20}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                    style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: C.muted }}>Reseña de tu experiencia</span>
                  <span className="text-xs" style={{ color: review.length >= REVIEW_MAX ? '#f85149' : C.muted }}>{review.length}/{REVIEW_MAX}</span>
                </div>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value.slice(0, REVIEW_MAX))}
                  maxLength={REVIEW_MAX}
                  placeholder="Contá cómo fue el ambiente, la hinchada, cómo se vio el partido..."
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none gc-focus"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Fotos ({totalPhotos} de {MAX_PHOTOS})</span>
                {totalPhotos > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-1">
                    {keptImages.map((url, i) => (
                      <div key={url} className="relative rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                        <img src={url} alt={`Foto ${i + 1} guardada`} className="w-full h-28 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSavedImage(url)}
                          aria-label="Quitar foto"
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center gc-focus"
                          style={{ backgroundColor: rgba(C.bg, 0.8) }}
                        >
                          <X size={14} color={C.bright} />
                        </button>
                      </div>
                    ))}
                    {previews.map((url, i) => (
                      <div key={url} className="relative rounded-xl overflow-hidden" style={{ border: `1px solid ${C.brandBright}` }}>
                        <img src={url} alt={`Foto nueva ${i + 1}`} className="w-full h-28 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(i)}
                          aria-label="Quitar foto nueva"
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center gc-focus"
                          style={{ backgroundColor: rgba(C.bg, 0.8) }}
                        >
                          <X size={14} color={C.bright} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${photosFull ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  <ImagePlus size={15} color={C.muted} />
                  <span className="text-sm flex-1" style={{ color: C.muted }}>
                    {photosFull ? 'Llegaste al máximo de fotos' : 'Añadir imagen'}
                  </span>
                  <input type="file" accept="image/*" multiple disabled={photosFull} onChange={handlePhotosChange} className="hidden" />
                </label>
                {photoError && <p className="text-xs" style={{ color: '#f85149' }}>{photoError}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: C.muted }}>Desglose de gastos</span>
                  <span className="text-xs font-semibold" style={{ color: C.brandBright }}>Total: ${totalGasto.toLocaleString('es-AR')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {expenseFields.map(({ key, label, Icon }) => (
                    <label key={key} className="flex flex-col gap-1.5">
                      <span className="text-xs" style={{ color: C.muted }}>{label}</span>
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                        <Icon size={14} color={C.muted} />
                        <span className="text-sm" style={{ color: C.muted }}>$</span>
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={expenses[key]}
                          onChange={(e) => setExpenses((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder="0"
                          className="bg-transparent outline-none text-sm flex-1 w-full gc-focus"
                          style={{ color: C.bright }}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 px-4 py-4" style={{ backgroundColor: rgba(C.bg, 0.9), backdropFilter: 'blur(10px)', borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={handleSubmit}
                disabled={!date || saving}
                className="w-full py-3.5 rounded-xl font-semibold text-sm gc-focus"
                style={{
                  backgroundColor: date ? C.brand : C.border,
                  color: date ? C.bright : C.muted,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar visita'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
