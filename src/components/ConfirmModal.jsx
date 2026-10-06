import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';

// Confirmación genérica para acciones que editan o borran.
// Se renderiza en document.body (portal) para que no herede transformaciones, overflow ni estados :active
// de la tarjeta o modal donde se abre. El clic no sube al overlay de abajo, así que no lo cierra.
export default function ConfirmModal({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, busy = false, onConfirm, onCancel }) {
  const accent = danger ? '#f85149' : C.brandBright;

  return createPortal(
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center p-4 gc-overlay"
      style={{ backgroundColor: rgba('#000000', 0.6) }}
      onClick={(e) => { e.stopPropagation(); if (!busy) onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: rgba(accent, 0.12) }}>
          <AlertTriangle size={20} color={accent} />
        </div>
        <h2 className="text-2xl mt-4" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>{title}</h2>
        {message && <p className="text-sm mt-1.5" style={{ color: C.muted }}>{message}</p>}

        <div className="flex items-center gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold gc-focus gc-tap disabled:opacity-40"
            style={{ border: `1px solid ${C.border}`, color: C.bright }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold gc-focus gc-tap disabled:opacity-40"
            style={{ backgroundColor: accent, color: danger ? C.bright : C.bg }}
          >
            {busy ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
