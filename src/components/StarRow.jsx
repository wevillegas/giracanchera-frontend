import { Star } from 'lucide-react';
import { C } from '../theme';

export default function StarRow({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = rating >= n;
        const half = !filled && rating >= n - 0.5;
        return (
          <Star
            key={n}
            size={size}
            color={C.gold}
            fill={filled ? C.gold : 'none'}
            strokeWidth={1.5}
            style={half ? { opacity: 0.55 } : undefined}
          />
        );
      })}
    </div>
  );
}
