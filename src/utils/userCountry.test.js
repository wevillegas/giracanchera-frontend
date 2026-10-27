import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countryCode, sameCountry } from './userCountry.js';

test('countryCode: la zona horaria manda sobre el idioma', () => {
  assert.equal(countryCode('America/Argentina/Buenos_Aires', ['en-US']), 'AR');
  assert.equal(countryCode('Europe/Madrid', ['es-AR']), 'ES');
});

test('countryCode: sin zona conocida usa la región del idioma', () => {
  assert.equal(countryCode('Asia/Tokyo', ['es-419', 'es-UY']), 'UY');
  assert.equal(countryCode('Asia/Tokyo', ['es']), null);
});

test('sameCountry: compara con el nombre en español, sin acentos ni mayúsculas', () => {
  assert.equal(sameCountry('Argentina', 'AR'), true);
  assert.equal(sameCountry('brasil', 'BR'), true);
  assert.equal(sameCountry('Uruguay', 'AR'), false);
});
