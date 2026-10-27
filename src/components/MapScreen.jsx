import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Minus, Plus } from 'lucide-react';
import { C, rgba } from '../theme';
import { userCountryCode, sameCountry } from '../utils/userCountry';

// MapLibre usa [lng, lat] y su zoom va uno por debajo del de Leaflet (tiles de 512 px)
const ARGENTINA_CENTER = [-58.38, -34.6];
const ARGENTINA_ZOOM = 3.7;
const FOCUS_ZOOM = 14; // nivel de calle: se ve el estadio, no solo la zona

// Zoom mínimo según el tamaño de la pantalla: el planeta ocupa como mucho ~75% del lado menor,
// así nunca queda como una bolita. Circunferencia en px = 512 * 2^zoom, diámetro = circunferencia / π.
const GLOBE_FILL = 0.75;
const minZoomFor = (el) => Math.log2((Math.PI * GLOBE_FILL * Math.min(el.clientWidth, el.clientHeight)) / 512);

// Vite no deja a MapLibre ubicar su worker por la URL del módulo (en desarrollo lo transforma y falla).
// Se carga su código como texto, en un chunk aparte, y se le pasa como Blob. Una sola vez por sesión.
let workerReady;
const prepareWorker = () => {
  workerReady ??= import('maplibre-gl/dist/maplibre-gl-worker.mjs?raw').then(({ default: source }) => {
    maplibregl.setWorkerUrl(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })));
  });
  return workerReady;
};

const MAP_STYLE = {
  version: 8,
  // Globo 3D: al acercarse se aplana solo hasta ser un mapa plano
  projection: { type: 'globe' },
  // Halo de atmósfera alrededor del planeta; se apaga al acercarse
  sky: {
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0],
    'sky-color': '#1B4D3E',
    'horizon-color': '#3FB950',
    'fog-color': '#0D1117',
  },
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    { id: 'fondo', type: 'background', paint: { 'background-color': C.bg } },
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      // Oscurece los tiles claros: brightness-min/max invertidos dan el negativo, el tono gira 180° y se apaga el color
      paint: {
        'raster-brightness-min': 0.8,
        'raster-brightness-max': 0,
        'raster-hue-rotate': 180,
        'raster-saturation': -0.6,
        'raster-contrast': -0.05,
      },
    },
  ],
};

// Icono "Goal" de lucide (https://lucide.dev), embebido como path SVG para los pines del mapa.
const GOAL_ICON_PATHS = [
  'M12 13V2l8 4-8 4',
  'M20.561 10.222a9 9 0 1 1-12.55-5.29',
  'M8.002 9.997a5 5 0 1 0 8.9 2.02',
];

function statusColor(status) {
  if (status === 'visited') return C.brandBright;
  if (status === 'wishlist') return C.gold;
  return C.muted;
}

function goalSvg(color = C.bg) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${GOAL_ICON_PATHS.map((d) => `<path d="${d}" />`).join('')}</svg>`;
}

// Icono "Landmark" de lucide: estadios sin club (propiedad de la provincia o sin dueño)
const LANDMARK_ICON_PATHS = [
  'M10 18v-7',
  'M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.574c-.531 0-.696-.715-.22-.949z',
  'M14 18v-7',
  'M18 18v-7',
  'M3 22h18',
  'M6 18v-7',
];

function landmarkSvg(color = C.bg) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${LANDMARK_ICON_PATHS.map((d) => `<path d="${d}" />`).join('')}</svg>`;
}

// Escapa texto antes de meterlo en el HTML del marcador (la URL del escudo y el nombre vienen de la base)
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

// Marcador de un estadio: escudo del club (o un icono genérico) y su nombre arriba
function buildStadiumElement(stadium) {
  const bg = statusColor(stadium.status);
  const inner = stadium.clubLogoUrl ? `<img src="${escapeHtml(stadium.clubLogoUrl)}" alt="" />` : stadium.mainClubId ? goalSvg() : landmarkSvg();
  const el = document.createElement('div');
  el.className = 'gc-pin';
  el.innerHTML = `<span class="gc-marker-label">${escapeHtml(stadium.name)}</span><span class="gc-marker-badge" style="background:${bg}">${inner}</span>`;
  return el;
}

// Grupo de estadios superpuestos: símbolo genérico con la cantidad, sin tapar escudos
function buildClusterElement(count) {
  const el = document.createElement('div');
  el.className = 'gc-pin';
  el.innerHTML = `<span class="gc-cluster-badge">${goalSvg('#FFFFFF')}<b>${count}</b></span>`;
  return el;
}

const hasCoordinates = (s) => s.location?.coordinates?.lat != null && s.location?.coordinates?.lng != null;

function ZoomControls({ map }) {
  const buttonClass = 'w-9 h-9 rounded-full flex items-center justify-center gc-focus gc-tap';
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-[400] flex items-center gap-1 p-1 rounded-full"
      style={{ bottom: '6.5rem', backgroundColor: rgba(C.surface, 0.92), border: `1px solid ${C.border}`, backdropFilter: 'blur(8px)' }}
    >
      <button onClick={() => map?.zoomOut()} aria-label="Alejar" className={buttonClass} style={{ color: C.bright }}>
        <Minus size={16} />
      </button>
      <div className="w-px h-5" style={{ backgroundColor: C.border }} />
      <button onClick={() => map?.zoomIn()} aria-label="Acercar" className={buttonClass} style={{ color: C.bright }}>
        <Plus size={16} />
      </button>
    </div>
  );
}

export default function MapScreen({ stadiums, onOpenStadium, flyTarget }) {
  const containerRef = useRef(null);
  const [map, setMap] = useState(null);
  // Los handlers de los marcadores leen siempre lo último sin recrear el mapa
  const latest = useRef({ stadiums, onOpenStadium });
  useEffect(() => { latest.current = { stadiums, onOpenStadium }; }, [stadiums, onOpenStadium]);
  const markersRef = useRef(new Map());
  const interacted = useRef(false);
  const introDone = useRef(false);

  // Crea el mapa una sola vez
  useEffect(() => {
    let instance = null;
    let cancelled = false;
    const markers = markersRef.current;

    const start = () => {
    const container = containerRef.current;
    const minZoom = minZoomFor(container);
    instance = new maplibregl.Map({
      container,
      style: MAP_STYLE,
      center: ARGENTINA_CENTER,
      // Empieza viendo el planeta entero; al cargar los estadios viaja solo al país del visitante
      zoom: minZoom + 0.2,
      minZoom,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    instance.touchZoomRotate.disableRotation();
    instance.on('resize', () => instance.setMinZoom(minZoomFor(container)));
    // Si el usuario ya movió el mapa, el viaje de bienvenida no le arrebata el control
    ['mousedown', 'touchstart', 'wheel'].forEach((type) => instance.on(type, () => { interacted.current = true; }));

    // Dibuja como marcadores HTML lo que hay en pantalla (grupos o estadios sueltos) y quita el resto
    const syncMarkers = () => {
      if (!instance.getSource('stadiums') || !instance.isSourceLoaded('stadiums')) return;
      const visible = new Map();
      for (const f of instance.querySourceFeatures('stadiums')) {
        const { cluster, cluster_id: clusterId, point_count: count, id } = f.properties;
        const key = cluster ? `c${clusterId}` : `s${id}`;
        if (visible.has(key)) continue;
        visible.set(key, { f, cluster, count });
      }

      for (const [key, marker] of markers) {
        if (!visible.has(key)) { marker.remove(); markers.delete(key); }
      }
      for (const [key, { f, cluster, count }] of visible) {
        if (markers.has(key)) continue;
        const [lng, lat] = f.geometry.coordinates;
        let el;
        if (cluster) {
          el = buildClusterElement(count);
          el.addEventListener('click', async () => {
            const zoom = await instance.getSource('stadiums').getClusterExpansionZoom(f.properties.cluster_id);
            instance.easeTo({ center: [lng, lat], zoom });
          });
        } else {
          const stadium = latest.current.stadiums.find((s) => String(s.id) === String(f.properties.id));
          if (!stadium) continue;
          el = buildStadiumElement(stadium);
          el.addEventListener('click', () => latest.current.onOpenStadium(stadium));
        }
        markers.set(key, new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(instance));
      }
    };

    instance.on('load', () => {
      instance.addSource('stadiums', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 40,
        clusterMaxZoom: 14,
      });
      // Capa invisible: hace falta para que MapLibre cargue los datos del origen y se puedan consultar
      instance.addLayer({ id: 'estadios-oculto', type: 'circle', source: 'stadiums', paint: { 'circle-radius': 1, 'circle-opacity': 0 } });
      instance.on('render', syncMarkers);
      setMap(instance);
    });

    };

    prepareWorker().then(() => { if (!cancelled) start(); });

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove());
      markers.clear();
      instance?.remove();
    };
  }, []);

  // Actualiza los estadios cuando cambian (filtros, estado de visita)
  useEffect(() => {
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    map.getSource('stadiums').setData({
      type: 'FeatureCollection',
      features: stadiums.filter(hasCoordinates).map((s) => ({
        type: 'Feature',
        properties: { id: String(s.id) },
        geometry: { type: 'Point', coordinates: [s.location.coordinates.lng, s.location.coordinates.lat] },
      })),
    });
  }, [map, stadiums]);

  // Viaje de bienvenida: una sola vez, cuando el mapa y los estadios están listos
  useEffect(() => {
    if (!map || stadiums.length === 0 || introDone.current) return;
    introDone.current = true;
    if (interacted.current) return;

    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 3500;
    const code = userCountryCode();
    const local = stadiums.filter((s) => hasCoordinates(s) && sameCountry(s.location.country, code));
    if (local.length === 0) {
      map.flyTo({ center: ARGENTINA_CENTER, zoom: ARGENTINA_ZOOM, duration });
      return;
    }
    const bounds = local.reduce(
      (box, s) => box.extend([s.location.coordinates.lng, s.location.coordinates.lat]),
      new maplibregl.LngLatBounds(),
    );
    map.fitBounds(bounds, { padding: { top: 110, bottom: 150, left: 60, right: 60 }, maxZoom: 6, duration });
  }, [map, stadiums]);

  useEffect(() => {
    if (!map || !flyTarget) return;
    map.flyTo({ center: [flyTarget.lng, flyTarget.lat], zoom: Math.max(map.getZoom(), FOCUS_ZOOM), duration: 800 });
  }, [map, flyTarget]);

  return (
    <>
      <div ref={containerRef} className="gc-space" style={{ width: '100vw', height: '100vh' }} />
      <ZoomControls map={map} />
    </>
  );
}
