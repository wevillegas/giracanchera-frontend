// ---------- Datos de ejemplo ----------
// distribution = % de reseñas en cada rango: [1-2, 3-4, 5-6, 7-8, 9-10]
export const INITIAL_STADIUMS = [
  {
    id: 1, name: 'La Ciudadela', club: 'San Martín de Tucumán', city: 'Tucumán, Argentina',
    capacity: 27000, rating: 4.2, reviews: 128, status: 'visited', visits: 2, top: '58%', left: '30%', tone: 'brand',
    currency: 'ARS', communityAvg: 8.3, distribution: [2, 5, 15, 38, 40],
    avgExpenses: { entradas: 8000, comida: 6000, estacionamiento: 3000, transporte: 4000 },
  },
  {
    id: 2, name: 'Monumental', club: 'River Plate', city: 'Buenos Aires, Argentina',
    capacity: 83214, rating: 4.8, reviews: 940, status: 'wishlist', visits: 0, top: '40%', left: '55%', tone: 'gold',
    currency: 'ARS', communityAvg: 9.1, distribution: [1, 2, 7, 25, 65],
    avgExpenses: { entradas: 25000, comida: 12000, estacionamiento: 8000, transporte: 9000 },
  },
  {
    id: 3, name: 'La Bombonera', club: 'Boca Juniors', city: 'Buenos Aires, Argentina',
    capacity: 54000, rating: 4.6, reviews: 1023, status: 'visited', visits: 1, top: '47%', left: '59%', tone: 'brand',
    currency: 'ARS', communityAvg: 9.4, distribution: [1, 1, 5, 20, 73],
    avgExpenses: { entradas: 30000, comida: 14000, estacionamiento: 10000, transporte: 10000 },
  },
  {
    id: 4, name: 'Camp Nou', club: 'FC Barcelona', city: 'Barcelona, España',
    capacity: 99354, rating: 4.9, reviews: 2210, status: 'none', visits: 0, top: '18%', left: '13%', tone: 'muted',
    currency: 'EUR', communityAvg: 9.5, distribution: [1, 1, 4, 24, 70],
    avgExpenses: { entradas: 85, comida: 25, estacionamiento: 15, transporte: 12 },
  },
];

export const INITIAL_REVIEWS = [
  { id: 1, stadium: 'La Ciudadela', rating: 9, excerpt: 'El folclore de la hinchada en la popular se siente desde la cuadra. Volvería mil veces.', date: '12 jul 2026' },
  { id: 2, stadium: 'La Bombonera', rating: 10, excerpt: 'La cancha tiembla, literal. Llegué tres horas antes y valió cada minuto de espera.', date: '3 may 2026' },
  { id: 3, stadium: 'Presidente Perón', rating: 7, excerpt: 'Estadio chico pero con buena visibilidad desde cualquier lugar. Buena previa afuera.', date: '20 mar 2026' },
  { id: 4, stadium: 'La Ciudadela', rating: 8, excerpt: 'Segunda vez y el asado de la previa ya es un clásico personal antes de entrar.', date: '15 ene 2026' },
];

// Reseñas de otros cancheros, para la página de cada estadio (clave = id del estadio)
export const COMMUNITY_REVIEWS = {
  1: [
    { id: 101, author: 'Fede R.', rating: 9, excerpt: 'Fui un martes de local y la popular ya estaba a pleno media hora antes. Pura garra.', date: '5 ago 2026' },
    { id: 102, author: 'Vale Q.', rating: 7, excerpt: 'Buena ubicación para sacar fotos de la cancha, aunque el sonido se pierde en las plateas altas.', date: '22 jun 2026' },
    { id: 103, author: 'Turco Ale', rating: 10, excerpt: 'El clásico contra Central Córdoba se vive distinto. La organización mejoró un montón este año.', date: '30 abr 2026' },
  ],
  2: [
    { id: 201, author: 'Cande M.', rating: 10, excerpt: 'Entrar por primera vez y ver la cancha desde la Sívori te cambia la perspectiva del fútbol argentino.', date: '14 jul 2026' },
    { id: 202, author: 'Nico P.', rating: 8, excerpt: 'Muchísima gente, hay que llegar temprano si querés evitar las colas largas en los accesos.', date: '2 jun 2026' },
    { id: 203, author: 'Flor S.', rating: 9, excerpt: 'El clima de los días de Libertadores no se compara con nada. Vale cada peso de la entrada.', date: '19 mar 2026' },
  ],
  3: [
    { id: 301, author: 'Gonza T.', rating: 10, excerpt: 'La inclinación de la tribuna hace que sientas que la gente está encima tuyo. Único en el mundo.', date: '9 jul 2026' },
    { id: 302, author: 'Sole B.', rating: 9, excerpt: 'Conseguir entrada de visitante fue un parto, pero adentro se entiende por qué es tan pedida.', date: '1 jun 2026' },
    { id: 303, author: 'Kevin D.', rating: 8, excerpt: 'El folclore de la Doce se siente antes de entrar. Recomiendo llegar con tiempo para la previa.', date: '11 abr 2026' },
  ],
  4: [
    { id: 401, author: 'Laia F.', rating: 9, excerpt: 'En obra parcial pero la experiencia sigue siendo enorme, sobre todo en noches de Champions.', date: '28 may 2026' },
    { id: 402, author: 'Martí V.', rating: 10, excerpt: 'El tour del museo antes del partido vale la pena si es tu primera vez en Barcelona.', date: '10 abr 2026' },
    { id: 403, author: 'Jordi C.', rating: 9, excerpt: 'Los precios son altos comparados con otras canchas de Europa, pero el ambiente lo justifica.', date: '2 mar 2026' },
  ],
};
