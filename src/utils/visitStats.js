const EMPTY_EXPENSES = { entradas: 0, comida: 0, estacionamiento: 0, transporte: 0 };

// Con menos reseñas que esto, el puntaje y los gastos se avisan como poco representativos
export const FEW_REVIEWS = 5;

// Mediana de los valores mayores a 0: un gasto en cero casi siempre es "no lo cargó", y un valor
// extremo no mueve el resultado como movería a un promedio
function median(values) {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return Math.round(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
}

export function computeVisitStats(visits) {
  const count = visits.length;
  if (!count) {
    return {
      avg: 0, count: 0, starRating: 0, distribution: [0, 0, 0, 0, 0],
      medianExpenses: EMPTY_EXPENSES, currency: 'ARS', fanPhotos: [],
    };
  }

  const sum = visits.reduce((acc, r) => acc + (r.rating || 0), 0);
  const avg = sum / count;

  const buckets = [0, 0, 0, 0, 0]; // [1-2, 3-4, 5-6, 7-8, 9-10]
  visits.forEach((r) => {
    const idx = Math.min(4, Math.max(0, Math.ceil((r.rating || 1) / 2) - 1));
    buckets[idx] += 1;
  });
  const distribution = buckets.map((n) => Math.round((n / count) * 100));
  const medianOf = (key) => median(visits.map((r) => r.expenses?.[key] || 0));
  const medianExpenses = {
    entradas: medianOf('ticket'), comida: medianOf('food'), estacionamiento: medianOf('parking'), transporte: medianOf('transport'),
  };
  // Fotos de las reseñas, cada una con la reseña de la que sale
  const fanPhotos = visits.flatMap((visit) => (visit.images || []).map((url) => ({ url, visit })));

  return {
    avg: Number(avg.toFixed(1)),
    count,
    starRating: avg / 2,
    distribution,
    medianExpenses,
    fanPhotos,
    currency: visits[0]?.expenses?.currency || 'ARS',
  };
}
