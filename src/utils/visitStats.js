const EMPTY_EXPENSES = { entradas: 0, comida: 0, estacionamiento: 0, transporte: 0 };

export function computeVisitStats(visits) {
  const count = visits.length;
  if (!count) {
    return {
      avg: 0, count: 0, starRating: 0, distribution: [0, 0, 0, 0, 0],
      avgExpenses: EMPTY_EXPENSES, currency: 'ARS',
    };
  }

  const sum = visits.reduce((acc, r) => acc + (r.rating || 0), 0);
  const avg = sum / count;

  const buckets = [0, 0, 0, 0, 0]; // [1-2, 3-4, 5-6, 7-8, 9-10]
  const expenseTotals = { entradas: 0, comida: 0, estacionamiento: 0, transporte: 0 };
  visits.forEach((r) => {
    const idx = Math.min(4, Math.max(0, Math.ceil((r.rating || 1) / 2) - 1));
    buckets[idx] += 1;

    const e = r.expenses || {};
    expenseTotals.entradas += e.ticket || 0;
    expenseTotals.comida += e.food || 0;
    expenseTotals.estacionamiento += e.parking || 0;
    expenseTotals.transporte += e.transport || 0;
  });
  const distribution = buckets.map((n) => Math.round((n / count) * 100));
  const avgExpenses = Object.fromEntries(
    Object.entries(expenseTotals).map(([key, total]) => [key, Math.round(total / count)])
  );

  return {
    avg: Number(avg.toFixed(1)),
    count,
    starRating: avg / 2,
    distribution,
    avgExpenses,
    currency: visits[0]?.expenses?.currency || 'ARS',
  };
}
