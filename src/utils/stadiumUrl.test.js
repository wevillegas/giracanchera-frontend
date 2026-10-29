import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stadiumPath, stadiumIdFromPath } from './stadiumUrl.js';

const id = '65f1a2b3c4d5e6f7a8b9c0d1';

test('arma y lee la ruta de un estadio', () => {
  assert.equal(stadiumPath(id), `/estadio/${id}`);
  assert.equal(stadiumIdFromPath(`/estadio/${id}`), id);
  assert.equal(stadiumIdFromPath(`/estadio/${id}/`), id);
});

test('rutas que no son de un estadio devuelven null', () => {
  assert.equal(stadiumIdFromPath('/'), null);
  assert.equal(stadiumIdFromPath('/estadio/abc'), null);
  assert.equal(stadiumIdFromPath('/otra/65f1a2b3c4d5e6f7a8b9c0d1'), null);
});
