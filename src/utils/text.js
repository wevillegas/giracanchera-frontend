// Texto sin acentos, en minúsculas y sin espacios de más: para comparar y filtrar sin que importen "Córdoba" vs "cordoba"
export const plain = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Valores únicos y no vacíos, ordenados alfabéticamente en español; si dos difieren solo en mayúsculas o acentos, queda el primero
export function uniqueSorted(values) {
  const seen = new Map();
  for (const value of values) {
    if (value && !seen.has(plain(value))) seen.set(plain(value), value);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

// Si el texto coincide (sin importar mayúsculas ni acentos) con una opción existente, devuelve la opción tal como está escrita
export const canonical = (text, options) => options.find((o) => plain(o) === plain(text)) ?? text.trim();
