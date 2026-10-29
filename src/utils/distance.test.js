import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distanceKm, nearbyStadiums } from './distance.js';

const at = (id, lat, lng) => ({ id, location: { coordinates: { lat, lng } } });

test('distancia conocida: Buenos Aires a Rosario ronda los 280 km', () => {
  const km = distanceKm({ lat: -34.6037, lng: -58.3816 }, { lat: -32.9442, lng: -60.6505 });
  assert.ok(km > 270 && km < 290, `dio ${km}`);
});

test('mismo punto está a 0 km', () => {
  assert.equal(distanceKm({ lat: 10, lng: 20 }, { lat: 10, lng: 20 }), 0);
});

test('cercanos: ordena por distancia, excluye el propio, los lejanos y los sin coordenadas', () => {
  const base = at('base', -34.6, -58.4);
  const list = [base, at('lejos', -32.9, -60.6), at('medio', -34.8, -58.5), at('cerca', -34.61, -58.41), { id: 'sin-coords' }];
  assert.deepEqual(nearbyStadiums(base, list).map((n) => n.stadium.id), ['cerca', 'medio']);
  assert.deepEqual(nearbyStadiums(base, list, { limit: 1 }).map((n) => n.stadium.id), ['cerca']);
  assert.deepEqual(nearbyStadiums({ id: 'x' }, list), []);
});
