// País probable del visitante, sin pedir permisos ni llamar a servicios externos:
// primero por la zona horaria del dispositivo (la fija el sistema según dónde está) y,
// si no alcanza, por la región del idioma del navegador (es-AR -> AR).
// ponytail: solo zonas de los países donde hay estadios; para cubrir el mundo, usar la IP (cabecera de Vercel).
const ZONES = [
  ['America/Argentina/', 'AR'], ['America/Buenos_Aires', 'AR'], ['America/Cordoba', 'AR'],
  ['America/Montevideo', 'UY'], ['America/Asuncion', 'PY'], ['America/Santiago', 'CL'],
  ['America/Sao_Paulo', 'BR'], ['America/Bogota', 'CO'], ['America/Lima', 'PE'],
  ['America/Guayaquil', 'EC'], ['America/La_Paz', 'BO'], ['America/Caracas', 'VE'],
  ['America/Mexico_City', 'MX'], ['Europe/Madrid', 'ES'], ['Europe/Rome', 'IT'],
  ['Europe/London', 'GB'], ['Europe/Paris', 'FR'], ['Europe/Berlin', 'DE'], ['Europe/Lisbon', 'PT'],
  ['America/New_York', 'US'], ['America/Chicago', 'US'], ['America/Los_Angeles', 'US'],
];

export function countryCode(timeZone = '', languages = []) {
  const byZone = ZONES.find(([prefix]) => timeZone.startsWith(prefix));
  if (byZone) return byZone[1];
  for (const lang of languages) {
    const region = lang.split('-')[1];
    if (region && /^[A-Za-z]{2}$/.test(region)) return region.toUpperCase();
  }
  return null;
}

export function userCountryCode() {
  return countryCode(Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.languages || [navigator.language]);
}

const plain = (text) => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Los estadios guardan el país como texto ("Argentina", "Brasil"); se compara por el nombre en español del código
export function sameCountry(stadiumCountry, code) {
  if (!stadiumCountry || !code) return false;
  const name = new Intl.DisplayNames(['es'], { type: 'region' }).of(code);
  return plain(stadiumCountry) === plain(name);
}
