import { C } from '../theme';

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-sm font-medium z-50" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}>
      {message}
    </div>
  );
}
