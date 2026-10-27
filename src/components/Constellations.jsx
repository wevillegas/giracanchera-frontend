// Constelaciones del fondo del espacio. Cada una es una caja de 0 a 100 de alto con sus estrellas
// y las líneas que las unen (pares de índices); el diseño decide dónde y cuán grande va.
const SHAPES = {
  cruz: {
    name: 'Cruz del Sur',
    stars: [[35, 0], [40, 100], [0, 36], [70, 58]],
    lines: [[0, 1], [2, 3]],
  },
  orion: {
    name: 'Orión',
    // Betelgeuse, Bellatrix, Mintaka, Alnilam, Alnitak (las Tres Marías), Saiph, Rigel
    stars: [[0, 0], [60, 6], [18, 48], [30, 46], [42, 44], [58, 100], [0, 94]],
    lines: [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 6], [4, 5], [6, 5]],
  },
  escorpio: {
    name: 'Escorpio',
    stars: [[34, 0], [42, 18], [32, 34], [12, 46], [4, 62], [0, 78], [6, 92], [22, 100], [38, 92], [42, 80]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]],
  },
};

// x, y y escala dentro del viewBox de cada disposición, fuera de la zona que tapa el planeta
const LANDSCAPE = [
  { shape: 'orion', x: 8, y: 26, scale: 0.28 },
  { shape: 'cruz', x: 136, y: 12, scale: 0.22 },
  { shape: 'escorpio', x: 138, y: 42, scale: 0.22 },
];
const PORTRAIT = [
  { shape: 'orion', x: 14, y: 14, scale: 0.24 },
  { shape: 'cruz', x: 60, y: 16, scale: 0.2 },
  { shape: 'escorpio', x: 54, y: 124, scale: 0.22 },
];

function Constellation({ shape, x, y, scale }) {
  const { name, stars, lines } = SHAPES[shape];
  const bottom = Math.max(...stars.map(([, sy]) => sy));
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {lines.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={stars[a][0]} y1={stars[a][1]} x2={stars[b][0]} y2={stars[b][1]}
          stroke="rgba(150, 180, 215, 0.3)" strokeWidth="1" vectorEffect="non-scaling-stroke"
        />
      ))}
      {stars.map(([sx, sy], i) => (
        <circle
          key={i} cx={sx} cy={sy} r={i % 3 === 0 ? 1.1 : 0.8}
          className="gc-star" style={{ animationDelay: `${(i * 1.3) % 5}s` }}
        />
      ))}
      <text x="0" y={bottom + 14} className="gc-const-name">{name}</text>
    </g>
  );
}

export default function Constellations() {
  return (
    <>
      <svg className="gc-const gc-const-landscape" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {LANDSCAPE.map((c) => <Constellation key={c.shape} {...c} />)}
      </svg>
      <svg className="gc-const gc-const-portrait" viewBox="0 0 90 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {PORTRAIT.map((c) => <Constellation key={c.shape} {...c} />)}
      </svg>
    </>
  );
}
