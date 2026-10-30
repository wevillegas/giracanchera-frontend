// URL compartible de la página de un estadio: /estadio/<id>
export const stadiumPath = (id) => `/estadio/${id}`;

// Id del estadio (UUID) si la ruta es /estadio/<id>; si no, null
export const stadiumIdFromPath = (path) => /^\/estadio\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i.exec(path)?.[1] ?? null;
