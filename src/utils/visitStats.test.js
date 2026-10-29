import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeVisitStats } from './visitStats.js';

test('sin visitas devuelve stats en cero', () => {
  const stats = computeVisitStats([]);
  assert.equal(stats.count, 0);
  assert.equal(stats.avg, 0);
  assert.deepEqual(stats.distribution, [0, 0, 0, 0, 0]);
});

test('calcula promedio, distribucion y gastos', () => {
  const stats = computeVisitStats([
    { rating: 10, expenses: { ticket: 100, food: 50, parking: 0, transport: 20, currency: 'ARS' } },
    { rating: 6, expenses: { ticket: 50, food: 0, parking: 10, transport: 0 } },
  ]);

  assert.equal(stats.count, 2);
  assert.equal(stats.avg, 8);
  assert.equal(stats.distribution[4], 50); // una de dos visitas en el bucket 9-10
  assert.equal(stats.distribution[2], 50); // una de dos en el bucket 5-6
  assert.equal(stats.medianExpenses.entradas, 75);
  assert.equal(stats.currency, 'ARS');
});

test('el gasto típico es la mediana y ignora los ceros y los valores extremos', () => {
  const visits = [100, 120, 110, 0, 99999].map((ticket) => ({ rating: 8, expenses: { ticket } }));
  assert.equal(computeVisitStats(visits).medianExpenses.entradas, 115);
});

test('junta las fotos de las reseñas', () => {
  const stats = computeVisitStats([{ rating: 8, images: ['a', 'b'] }, { rating: 6 }, { rating: 7, images: ['c'] }]);
  assert.deepEqual(stats.fanPhotos.map((p) => p.url), ['a', 'b', 'c']);
});
