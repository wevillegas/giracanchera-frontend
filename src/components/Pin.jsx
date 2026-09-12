import { MapPin } from 'lucide-react';
import { C, rgba } from '../theme';

export default function Pin({ stadium, onClick }) {
  const color = stadium.status === 'visited' ? C.brandBright : stadium.status === 'wishlist' ? C.gold : C.muted;
  return (
    <button
      onClick={() => onClick(stadium)}
      className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center group gc-focus"
      style={{ top: stadium.top, left: stadium.left }}
      aria-label={`Ver ${stadium.name}`}
    >
      <div
        className="flex items-center justify-center rounded-full transition-transform group-active:scale-90"
        style={{ width: 34, height: 34, backgroundColor: color, boxShadow: `0 0 0 5px ${rgba(color, 0.18)}` }}
      >
        <MapPin size={17} color={C.bg} fill={C.bg} strokeWidth={2} />
      </div>
      <span
        className="mt-1 px-2 py-0.5 rounded text-xs whitespace-nowrap font-medium"
        style={{ backgroundColor: rgba(C.bg, 0.75), color: C.bright }}
      >
        {stadium.name}
      </span>
    </button>
  );
}
