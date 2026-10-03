import { useEffect, useState } from 'react';

// Colores dominantes de un escudo, sacados de la propia imagen (no hay colores guardados por club).
// Devuelve [colorPrincipal, colorSecundario] en hex, o null si no se pudo leer la imagen.
const cache = new Map();

function toHex([r, g, b]) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function distance(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

function extractColors(url) {
  if (cache.has(url)) return cache.get(url);

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 40;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        // Agrupa píxeles parecidos y descarta transparentes, blancos, negros y grises
        const buckets = new Map();
        for (let i = 0; i < data.length; i += 4) {
          const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
          if (a < 128) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 30) continue;
          const key = [r, g, b].map((v) => Math.round(v / 32) * 32).join(',');
          buckets.set(key, (buckets.get(key) || 0) + 1);
        }

        const ranked = [...buckets.entries()]
          .sort((x, y) => y[1] - x[1])
          .map(([key]) => key.split(',').map(Number));
        if (ranked.length === 0) return resolve(null);

        const primary = ranked[0];
        const secondary = ranked.find((c) => distance(c, primary) > 90) || primary;
        resolve([toHex(primary), toHex(secondary)]);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

  cache.set(url, promise);
  return promise;
}

export function useLogoColors(url) {
  const [colors, setColors] = useState(null);

  useEffect(() => {
    if (!url) {
      setColors(null);
      return undefined;
    }
    let alive = true;
    extractColors(url).then((result) => { if (alive) setColors(result); });
    return () => { alive = false; };
  }, [url]);

  return colors;
}
