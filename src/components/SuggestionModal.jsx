import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import stadiumService from '../services/stadiumService';
import { SUGGESTION_FIELDS } from '../utils/suggestionFields';

const fieldStyle = { backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright };
const fieldClass = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus';

// Un usuario propone corregir un dato del estadio; un admin lo revisa antes de que se vea
export default function SuggestionModal({ stadium, onClose, onToast }) {
  const [field, setField] = useState(SUGGESTION_FIELDS[0].key);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const config = SUGGESTION_FIELDS.find((f) => f.key === field);

  function changeField(next) {
    setField(next);
    setValue('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await stadiumService.suggest(stadium.id, { field, value, note });
      onToast?.(result.message);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos enviar la corrección.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.6) }} onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl overflow-y-auto gc-hide-scrollbar" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-2xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>Sugerir una corrección</h2>
          <button onClick={onClose} aria-label="Cerrar" className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap" style={{ backgroundColor: C.surface }}>
            <X size={16} color={C.bright} />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 pb-6 pt-4 space-y-4">
          <p className="text-sm" style={{ color: C.muted }}>
            ¿Algo de <strong style={{ color: C.bright }}>{stadium.name}</strong> está mal o falta? Un administrador lo revisa antes de publicarlo.
          </p>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ backgroundColor: rgba('#f85149', 0.12), border: `1px solid ${rgba('#f85149', 0.4)}`, color: '#f85149' }}>
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>¿Qué dato querés corregir?</span>
            <select value={field} onChange={(e) => changeField(e.target.value)} className={fieldClass} style={fieldStyle}>
              {SUGGESTION_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>{field === 'other' ? '¿Qué está mal y cómo debería ser?' : 'Valor correcto'}</span>
            {config.type === 'select' ? (
              <select value={value} onChange={(e) => setValue(e.target.value)} required className={fieldClass} style={fieldStyle}>
                <option value="">Elegí una opción</option>
                {config.options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}
              </select>
            ) : config.type === 'textarea' ? (
              <textarea rows={4} value={value} onChange={(e) => setValue(e.target.value)} required maxLength={field === 'other' ? 500 : 3000} className={`${fieldClass} resize-y`} style={fieldStyle} />
            ) : (
              <input type={config.type} step={config.type === 'number' ? 'any' : undefined} value={value} onChange={(e) => setValue(e.target.value)} required className={fieldClass} style={fieldStyle} />
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>¿De dónde sacaste el dato? (opcional)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Ej: lo vi en el estadio, Wikipedia, el sitio del club" className={fieldClass} style={fieldStyle} />
          </label>

          <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl font-semibold text-sm gc-focus gc-tap" style={{ backgroundColor: C.brand, color: C.bright, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Enviando...' : 'Enviar corrección'}
          </button>
        </form>
      </div>
    </div>
  );
}
