import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plain, uniqueSorted, canonical } from './text.js';

test('plain: ignora acentos, mayúsculas y espacios', () => {
  assert.equal(plain('  CÓRDOBA '), 'cordoba');
});

test('uniqueSorted: ordena, quita vacíos y repetidos que solo difieren en acentos o mayúsculas', () => {
  assert.deepEqual(uniqueSorted(['Santa Fe', '', 'Córdoba', 'cordoba', 'Buenos Aires', undefined]), ['Buenos Aires', 'Córdoba', 'Santa Fe']);
});

test('canonical: usa la escritura de la opción existente; si no existe, el texto limpio', () => {
  assert.equal(canonical('cordoba', ['Buenos Aires', 'Córdoba']), 'Córdoba');
  assert.equal(canonical('  Mendoza ', ['Córdoba']), 'Mendoza');
});
