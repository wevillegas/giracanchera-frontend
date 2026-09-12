import { C, rgba } from '../theme';

export default function StadiumArt({ tone = 'brand', uid = 'x', className = '' }) {
  const glow = tone === 'gold' ? C.gold : tone === 'muted' ? C.muted : C.brandBright;
  const gid = `glow-${tone}-${uid}`;
  return (
    <svg viewBox="0 0 320 180" className={className} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={gid} cx="50%" cy="12%" r="75%">
          <stop offset="0%" stopColor={rgba(glow, 0.35)} />
          <stop offset="100%" stopColor={rgba(glow, 0)} />
        </radialGradient>
      </defs>
      <rect width="320" height="180" fill={C.surface} />
      <rect width="320" height="180" fill={`url(#${gid})`} />
      <path d="M0 138 Q160 88 320 138 L320 180 L0 180 Z" fill={C.bg} />
      <path d="M0 150 Q160 106 320 150 L320 180 L0 180 Z" fill={rgba('#000000', 0.28)} />
      <rect x="0" y="162" width="320" height="18" fill={rgba(C.brand, 0.55)} />
      {[42, 278].map((x, i) => (
        <g key={i}>
          <rect x={x - 2} y="28" width="4" height="92" fill={C.border} />
          <rect x={x - 18} y="16" width="36" height="14" rx="2" fill={C.border} />
          {[0, 1, 2, 3].map((j) => (
            <circle key={j} cx={x - 12 + j * 8} cy="23" r="2.4" fill={glow} />
          ))}
        </g>
      ))}
    </svg>
  );
}
