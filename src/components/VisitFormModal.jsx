import { useState } from 'react';
import { ChevronLeft, Check, Calendar, Minus, Plus, AlertCircle, ImagePlus } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import visitService from '../services/visitService';

function toDateInputValue(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export default function VisitFormModal({ stadium, editingVisit, expenseFields, onClose, onSaved }) {
  const isEditing = Boolean(editingVisit);
  const stadiumName = isEditing ? editingVisit.stadium?.name : stadium?.name;

  const [date, setDate] = useState(() => (isEditing ? toDateInputValue(editingVisit.visitDate) : ''));
  const [times, setTimes] = useState(1);
  const [score, setScore] = useState(() => editingVisit?.rating ?? 8);
  const [review, setReview] = useState(() => editingVisit?.reviewText ?? '');
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const totalGasto = Object.values(expenses).reduce((sum, v) => sum + (Number(v) || 0), 0);

  function handlePhotosChange(e) {
    setPhotos(Array.from(e.target.files || []).slice(0, 4));
  }

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('rating', score);
      formData.append('reviewText', review);
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
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
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

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium" style={{ color: C.muted }}>Fecha de la visita</span>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <Calendar size={15} color={C.muted} />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-transparent outline-none text-sm flex-1 gc-focus"
                      style={{ color: C.bright, colorScheme: 'dark' }}
                    />
                  </div>
                </label>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium" style={{ color: C.muted }}>Veces que fui</span>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <button onClick={() => setTimes((t) => Math.max(1, t - 1))} className="w-7 h-7 rounded-lg flex items-center justify-center gc-focus" style={{ backgroundColor: C.border }}>
                      <Minus size={14} color={C.bright} />
                    </button>
                    <span className="text-lg font-semibold" style={{ color: C.bright }}>{times}</span>
                    <button onClick={() => setTimes((t) => t + 1)} className="w-7 h-7 rounded-lg flex items-center justify-center gc-focus" style={{ backgroundColor: C.brand }}>
                      <Plus size={14} color={C.bright} />
                    </button>
                  </div>
                </div>
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
                <span className="text-xs font-medium" style={{ color: C.muted }}>Reseña de tu experiencia</span>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Contá cómo fue el ambiente, la hinchada, cómo se vio el partido..."
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none gc-focus"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
                />
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Fotos (hasta 4)</span>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                  <ImagePlus size={15} color={C.muted} />
                  <span className="text-sm flex-1" style={{ color: photos.length ? C.bright : C.muted }}>
                    {photos.length ? `${photos.length} foto${photos.length > 1 ? 's' : ''} seleccionada${photos.length > 1 ? 's' : ''}` : 'Elegí fotos de tu visita'}
                  </span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotosChange} className="hidden" />
                </div>
              </label>

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
