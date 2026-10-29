import { Plus } from 'lucide-react';
import { C, rgba } from '../theme';

// Botón flotante para registrar una visita; reemplaza al menú inferior
export default function AddVisitButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Registrar visita"
      title="Registrar visita"
      className="fixed bottom-5 right-5 z-[1000] w-14 h-14 rounded-full flex items-center justify-center gc-focus gc-tap"
      style={{ backgroundColor: C.brand, border: `3px solid ${C.bg}`, boxShadow: `0 8px 22px ${rgba(C.brand, 0.55)}` }}
    >
      <Plus size={26} color={C.bright} strokeWidth={2.5} />
    </button>
  );
}
