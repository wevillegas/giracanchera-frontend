// ---------- Sistema de diseño ----------
export const C = {
  bg: '#0D1117',
  surface: '#161B22',
  border: '#30363D',
  brand: '#0F5132',
  brandBright: '#3FB950',
  muted: '#8B949E',
  bright: '#F0F6FC',
  gold: '#E3B341',
};

export function rgba(hex, a) {
  const v = hex.replace('#', '');
  const r = parseInt(v.substring(0, 2), 16);
  const g = parseInt(v.substring(2, 4), 16);
  const b = parseInt(v.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export const DISPLAY_FONT = "'Bebas Neue', sans-serif";
export const BODY_FONT = "'Inter', system-ui, -apple-system, sans-serif";
export const CURRENCY_SYMBOL = { ARS: '$', EUR: '€' };

export function formatMoney(amount, currency = 'ARS') {
  return `${CURRENCY_SYMBOL[currency] || '$'}${Number(amount).toLocaleString('es-AR')}`;
}

export function sumExpenses(obj) {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}
