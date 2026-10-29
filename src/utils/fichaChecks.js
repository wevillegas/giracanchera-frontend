// Qué le falta a la ficha del estadio (otros usos es opcional y no cuenta)
export function fichaChecks(s) {
  return [
    ['Apodo', Boolean(s.nickname)],
    ['Año de inauguración', Boolean(s.openedYear)],
    ['Estado', Boolean(s.status)],
    ['Superficie', Boolean(s.surface)],
    ['Medidas de la cancha', Boolean(s.pitch?.length && s.pitch?.width)],
    ['Historia', Boolean(s.history)],
    ['Datos curiosos', s.funFacts?.length > 0],
    ['Fotos', s.photos?.length > 0 || Boolean(s.imageUrl)],
  ];
}
