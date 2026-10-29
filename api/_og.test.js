import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOgHtml } from './_og.js';

const stadium = {
  name: 'La Bombonera', nickname: 'La Bombonera', capacity: 54000,
  mainClub: { name: 'Boca Juniors' }, location: { city: 'Buenos Aires', country: 'Argentina' },
  photos: [{ url: 'https://res.cloudinary.com/demo/image/upload/a.jpg' }],
};

test('la vista previa lleva título, descripción, imagen y link', () => {
  const html = buildOgHtml(stadium, 'https://giracanchera.com/estadio/1');
  assert.match(html, /og:title" content="La Bombonera \| GiraCanchera"/);
  assert.match(html, /Boca Juniors · Buenos Aires, Argentina · 54\.000 espectadores/);
  assert.match(html, /og:image" content="https:\/\/res\.cloudinary\.com\/demo\/image\/upload\/a\.jpg"/);
  assert.match(html, /og:url" content="https:\/\/giracanchera\.com\/estadio\/1"/);
  assert.match(html, /summary_large_image/);
});

test('escapa HTML en los textos', () => {
  const html = buildOgHtml({ ...stadium, name: '<script>"x"</script>' }, 'https://x.com');
  assert.ok(!html.includes('<script>'));
});

test('sin estadio sale una vista previa genérica y sin imagen', () => {
  const html = buildOgHtml(null, 'https://giracanchera.com');
  assert.match(html, /<title>GiraCanchera<\/title>/);
  assert.ok(!html.includes('og:image'));
});
