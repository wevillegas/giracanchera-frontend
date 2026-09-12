import { C } from '../theme';

export default function ScoreDistribution({ distribution }) {
  const rows = [
    { label: '9-10', value: distribution[4] },
    { label: '7-8', value: distribution[3] },
    { label: '5-6', value: distribution[2] },
    { label: '3-4', value: distribution[1] },
    { label: '1-2', value: distribution[0] },
  ];
  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="text-xs w-9 shrink-0" style={{ color: C.muted }}>{row.label}</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
            <div className="h-full rounded-full" style={{ width: `${row.value}%`, backgroundColor: C.brandBright }} />
          </div>
          <span className="text-xs w-8 text-right shrink-0" style={{ color: C.muted }}>{row.value}%</span>
        </div>
      ))}
    </div>
  );
}
