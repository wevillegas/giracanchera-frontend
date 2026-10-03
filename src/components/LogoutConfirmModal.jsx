import { LogOut } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';

export default function LogoutConfirmModal({ onClose, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4 gc-overlay"
      style={{ backgroundColor: rgba('#000000', 0.6) }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: rgba('#f85149', 0.12) }}
        >
          <LogOut size={20} color="#f85149" />
        </div>
        <h2 className="text-2xl mt-4" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>
          ¿Cerrar sesión?
        </h2>
        <p className="text-sm mt-1.5" style={{ color: C.muted }}>
          Vas a tener que volver a iniciar sesión para ver tu perfil y registrar visitas.
        </p>

        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold gc-focus gc-tap"
            style={{ border: `1px solid ${C.border}`, color: C.bright }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold gc-focus gc-tap"
            style={{ backgroundColor: '#f85149', color: C.bright }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
