// Arma el HTML mínimo con las etiquetas Open Graph que leen WhatsApp, Facebook, X, Telegram, etc.
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const SITE = 'GiraCanchera';
const FALLBACK_DESCRIPTION = 'Descubrí estadios de todo el mundo, registrá tus visitas y mirá lo que dicen los hinchas.';

export function describe(stadium) {
  const place = [stadium.location?.city, stadium.location?.province, stadium.location?.country].filter(Boolean).join(', ');
  const parts = [
    stadium.nickname && `“${stadium.nickname}”`,
    stadium.mainClub?.name,
    place,
    stadium.capacity ? `${stadium.capacity.toLocaleString('es-AR')} espectadores` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : FALLBACK_DESCRIPTION;
}

// `stadium` puede ser null (no se encontró): sale una vista previa genérica del sitio
export function buildOgHtml(stadium, pageUrl) {
  const title = stadium ? `${stadium.name} | ${SITE}` : SITE;
  const description = stadium ? describe(stadium) : FALLBACK_DESCRIPTION;
  const image = stadium?.photos?.[0]?.url || stadium?.imageUrl || '';
  const tags = [
    ['og:type', 'website'], ['og:site_name', SITE], ['og:locale', 'es_AR'],
    ['og:title', title], ['og:description', description], ['og:url', pageUrl],
    ...(image ? [['og:image', image]] : []),
    ['twitter:card', image ? 'summary_large_image' : 'summary'],
  ].map(([key, value]) => `<meta property="${key}" content="${escapeHtml(value)}">`);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>`
    + `<meta name="description" content="${escapeHtml(description)}">${tags.join('')}</head><body></body></html>`;
}
