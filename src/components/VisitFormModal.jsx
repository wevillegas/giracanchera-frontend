import { ChevronLeft, Check, Calendar, Minus, Plus } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';

export default function VisitFormModal({
  stadium, visit, setVisit, saved, totalGasto, expenseFields, onClose, onSave,
}) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center gc-overlay" style={{ backgroundColor: rgba('#000000', 0.6) }}>
      <div className="gc-sheet w-full max-w-md h-full rounded-t-3xl overflow-y-auto gc-hide-scrollbar flex flex-col" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderBottom: 'none' }}>
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4" style={{ backgroundColor: rgba(C.bg, 0.9), backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.border}` }}>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center gc-focus" style={{ backgroundColor: C.surface }}>
            <ChevronLeft size={18} color={C.bright} />
          </button>
          <div>
            <p className="text-xs" style={{ color: C.muted }}>Nueva entrada en tu bitácora</p>
            <p className="text-base font-semibold" style={{ color: C.bright }}>{stadium.name}</p>
          </div>
        </div>

        {saved ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: rgba(C.brandBright, 0.15) }}>
              <Check size={28} color={C.brandBright} />
            </div>
            <h3 className="text-2xl" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>¡Visita guardada!</h3>
            <p className="text-sm mt-1 max-w-xs" style={{ color: C.muted }}>
              Sumamos {stadium.name} a tu bitácora. Ya la podés ver en tu perfil.
            </p>
            <button onClick={onClose} className="mt-6 px-5 py-2.5 rounded-xl font-semibold text-sm gc-focus" style={{ backgroundColor: C.brand, color: C.bright }}>
              Listo
            </button>
          </div>
        ) : (
          <>
            <div className="px-4 py-5 space-y-6 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium" style={{ color: C.muted }}>Fecha de la visita</span>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <Calendar size={15} color={C.muted} />
                    <input
                      type="date"
                      value={visit.date}
                      onChange={(e) => setVisit({ ...visit, date: e.target.value })}
                      className="bg-transparent outline-none text-sm flex-1 gc-focus"
                      style={{ color: C.bright, colorScheme: 'dark' }}
                    />
                  </div>
                </label>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium" style={{ color: C.muted }}>Veces que fui</span>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <button onClick={() => setVisit((v) => ({ ...v, times: Math.max(1, v.times - 1) }))} className="w-7 h-7 rounded-lg flex items-center justify-center gc-focus" style={{ backgroundColor: C.border }}>
                      <Minus size={14} color={C.bright} />
                    </button>
                    <span className="text-lg font-semibold" style={{ color: C.bright }}>{visit.times}</span>
                    <button onClick={() => setVisit((v) => ({ ...v, times: v.times + 1 }))} className="w-7 h-7 rounded-lg flex items-center justify-center gc-focus" style={{ backgroundColor: C.brand }}>
                      <Plus size={14} color={C.bright} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>¿Cómo calificás la experiencia? (1 a 10)</span>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setVisit({ ...visit, score: n })}
                      className="w-9 h-9 rounded-lg text-sm font-semibold gc-focus"
                      style={{
                        backgroundColor: visit.score === n ? C.brandBright : C.surface,
                        color: visit.score === n ? C.bg : C.muted,
                        border: `1px solid ${visit.score === n ? C.brandBright : C.border}`,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Reseña de tu experiencia</span>
                <textarea
                  value={visit.review}
                  onChange={(e) => setVisit({ ...visit, review: e.target.value })}
                  placeholder="Contá cómo fue el ambiente, la hinchada, cómo se vio el partido..."
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none gc-focus"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: C.muted }}>Desglose de gastos</span>
                  <span className="text-xs font-semibold" style={{ color: C.brandBright }}>Total: ${totalGasto.toLocaleString('es-AR')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {expenseFields.map(({ key, label, Icon }) => (
                    <label key={key} className="flex flex-col gap-1.5">
                      <span className="text-xs" style={{ color: C.muted }}>{label}</span>
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                        <Icon size={14} color={C.muted} />
                        <span className="text-sm" style={{ color: C.muted }}>$</span>
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={visit[key]}
                          onChange={(e) => setVisit({ ...visit, [key]: e.target.value })}
                          placeholder="0"
                          className="bg-transparent outline-none text-sm flex-1 w-full gc-focus"
                          style={{ color: C.bright }}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 px-4 py-4" style={{ backgroundColor: rgba(C.bg, 0.9), backdropFilter: 'blur(10px)', borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={onSave}
                disabled={!visit.date}
                className="w-full py-3.5 rounded-xl font-semibold text-sm gc-focus"
                style={{
                  backgroundColor: visit.date ? C.brand : C.border,
                  color: visit.date ? C.bright : C.muted,
                }}
              >
                Guardar visita
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
