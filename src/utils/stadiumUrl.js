// URL compartible de la página de un estadio: /estadio/<id>
export const stadiumPath = (id) => `/estadio/${id}`;

// Id del estadio si la ruta es /estadio/<id>; si no, null
export const stadiumIdFromPath = (path) => /^\/estadio\/([a-f\d]{24})\/?$/i.exec(path)?.[1] ?? null;
