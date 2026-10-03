import { ChevronLeft, ChevronRight } from 'lucide-react';
import { C } from '../../theme';

export const PAGE_SIZE = 6;

export function paginate(items, page, size = PAGE_SIZE) {
  const start = (page - 1) * size;
  return items.slice(start, start + size);
}

export function clampPage(page, total, size = PAGE_SIZE) {
  return Math.min(page, Math.max(1, Math.ceil(total / size)));
}

// Se muestra desde pageSize elementos en adelante
export default function AdminPagination({ page, total, onChange, pageSize = PAGE_SIZE }) {
  if (total < pageSize) return null;

  const pages = Math.ceil(total / pageSize);
  const btnStyle = { color: C.brandBright, border: `1px solid ${C.border}`, backgroundColor: C.surface };

  return (
    <div className="flex items-center justify-between mt-3 text-sm" style={{ color: C.muted }}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap disabled:opacity-40"
        style={btnStyle}
      >
        <ChevronLeft size={15} />
      </button>
      <span>Página {page} de {pages}</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="Página siguiente"
        className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap disabled:opacity-40"
        style={btnStyle}
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

export const filterFieldStyle = { backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright };
