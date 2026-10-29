import { useEffect } from 'react';

// Llama a `onOutside` cuando se toca fuera del elemento (o se aprieta Escape), mientras `active` sea true
export default function useClickOutside(ref, active, onOutside) {
  useEffect(() => {
    if (!active) return undefined;
    const onPointerDown = (e) => { if (!ref.current?.contains(e.target)) onOutside(); };
    const onKeyDown = (e) => { if (e.key === 'Escape') onOutside(); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ref, active, onOutside]);
}
