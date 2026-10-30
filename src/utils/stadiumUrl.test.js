import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stadiumPath, stadiumIdFromPath } from './stadiumUrl.js';

const id = '3f2b8c1d-4e5a-5b6c-8d7e-9f0a1b2c3d4e';

test('arma y lee la ruta de un estadio', () => {
  assert.equal(stadiumPath(id), `/estadio/${id}`);
  assert.equal(stadiumIdFromPath(`/estadio/${id}`), id);
  assert.equal(stadiumIdFromPath(`/estadio/${id}/`), id);
});

test('rutas que no son de un estadio devuelven null', () => {
  assert.equal(stadiumIdFromPath('/'), null);
  assert.equal(stadiumIdFromPath('/estadio/abc'), null);
  assert.equal(stadiumIdFromPath('/estadio/65f1a2b3c4d5e6f7a8b9c0d1'), null, 'los ids viejos de Mongo ya no son válidos');
  assert.equal(stadiumIdFromPath(`/otra/${id}`), null);
});
