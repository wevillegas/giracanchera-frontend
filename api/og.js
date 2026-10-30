// Vista previa de /estadio/<id> para los bots de WhatsApp, redes, etc. (ver el rewrite en vercel.json).
// Las personas siguen recibiendo la app normal. Necesita la variable de entorno API_URL (la URL del backend, sin / final).
import { buildOgHtml } from './_og.js';

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; // id de estadio (UUID)

export default async function handler(req, res) {
  const { id } = req.query;
  const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  let stadium = null;

  if (ID.test(id) && process.env.API_URL) {
    try {
      const response = await fetch(`${process.env.API_URL}/api/stadiums/${id}`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) stadium = (await response.json()).stadium;
    } catch {
      // sin datos del backend sale la vista previa genérica
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(buildOgHtml(stadium, ID.test(id) ? `${origin}/estadio/${id}` : origin));
}
