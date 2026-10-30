import { useLayoutEffect, useState } from 'react';

// Devuelve true si la lista desplegable de `ref` no entra debajo (según la ventana) y hay más lugar arriba:
// en ese caso hay que abrirla hacia arriba para que no se salga de la pantalla.
export default function useDropUp(open, ref, needed = 300) {
  const [up, setUp] = useState(false);
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const { top, bottom } = ref.current.getBoundingClientRect();
    const below = window.innerHeight - bottom;
    setUp(below < needed && top > below);
  }, [open, ref, needed]);
  return up;
}
