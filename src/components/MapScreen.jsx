import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Minus, Plus } from 'lucide-react';
import { C, rgba } from '../theme';
import { userCountryCode, sameCountry } from '../utils/userCountry';

// MapLibre usa [lng, lat] y su zoom va uno por debajo del de Leaflet (tiles de 512 px)
const ARGENTINA_CENTER = [-58.38, -34.6];
const ARGENTINA_ZOOM = 3.7;
const FOCUS_ZOOM = 16; // se ve el estadio y sus alrededores inmediatos, para ubicarlo en el barrio
const FOCUS_MS = 1500; // viaje al estadio y a un grupo: suave pero ágil
const FOCUS_CURVE = 1.1; // más bajo = menos "salto" de alejar y volver a acercar (por defecto 1.42)
const BUTTON_ZOOM_MS = 600; // botones + y −
// Arranque y llegada suaves (ease in-out cúbico): el movimiento nunca empieza ni termina de golpe
const smooth = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);

// Zoom mínimo según el tamaño de la pantalla: el planeta llena casi todo el lado menor (las barras
// lo tapan un poco), así nunca queda como una bolita. Circunferencia en px = 512 * 2^zoom, diámetro = circunferencia / π.
const GLOBE_FILL = 1.05;

// El espacio (estrellas fugaces y destellos) solo se ve mientras el planeta no llena toda la pantalla:
// diámetro del globo en px = 512 * 2^zoom / π
const globeCoversScreen = (zoom, el) => (512 * 2 ** zoom) / Math.PI >= Math.hypot(el.clientWidth, el.clientHeight);

// Con el planeta alejado (zoom por debajo de esto) gira solo, despacio, hasta que el usuario lo toca
const SPIN_BELOW_ZOOM = 3;
const SPIN_DEGREES = 20;
const SPIN_MS = 8000;
const SPIN_RESUME_MS = 2500;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    'sky-color': '#4F9BE8',
    'horizon-color': '#BFE0FF',
    'fog-color': '#0D1117',
  },
  sources: {
    // Imágenes satelitales (océanos, relieve, selvas, desiertos) con calles y nombres encima
    sat: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      // Con 256 el viaje a un estadio pedía unos 450 mosaicos en 1,5 s; con 384 se piden bastantes menos y la foto sigue nítida
      tileSize: 384,
      maxzoom: 18,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    },
    calles: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 18 },
    lugares: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 18 },
  },
  layers: [
    { id: 'fondo', type: 'background', paint: { 'background-color': '#0B3D6B' } },
    // Sin fundido: con el giro entran tiles nuevos todo el tiempo y con fundido el planeta parpadeaba
    { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-fade-duration': 0 } },
    { id: 'calles', type: 'raster', source: 'calles', minzoom: 9, paint: { 'raster-fade-duration': 0 } },
    { id: 'lugares', type: 'raster', source: 'lugares', minzoom: 3, paint: { 'raster-fade-duration': 0 } },
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

// Calles y nombres se ocultan durante el viaje a un estadio: son cientos de pedidos de imágenes que nadie llega a leer
// mientras la cámara se mueve, y le sacan ancho de banda a la foto satelital. Aparecen al llegar.
const OVERLAY_LAYERS = ['calles', 'lugares'];
const showOverlays = (map, visible) => OVERLAY_LAYERS.forEach((id) => {
  if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
});

const buttonZoom = () => ({ duration: reducedMotion() ? 0 : BUTTON_ZOOM_MS, easing: smooth });

function ZoomControls({ map }) {
  const buttonClass = 'w-9 h-9 rounded-full flex items-center justify-center gc-focus gc-tap';
  return (
    <div
      className="absolute left-4 z-[400] hidden md:flex flex-col items-center gap-1 p-1 rounded-full"
      style={{ bottom: '1.5rem', backgroundColor: rgba(C.surface, 0.92), border: `1px solid ${C.border}`, backdropFilter: 'blur(8px)' }}
    >
      <button onClick={() => map?.zoomIn(buttonZoom())} aria-label="Acercar" className={buttonClass} style={{ color: C.bright }}>
        <Plus size={16} />
      </button>
      <div className="h-px w-5" style={{ backgroundColor: C.border }} />
      <button onClick={() => map?.zoomOut(buttonZoom())} aria-label="Alejar" className={buttonClass} style={{ color: C.bright }}>
        <Minus size={16} />
      </button>
    </div>
  );
}

export default function MapScreen({ stadiums, onOpenStadium, flyTarget, onFlyEnd }) {
  const containerRef = useRef(null);
  const [map, setMap] = useState(null);
  // Los handlers de los marcadores leen siempre lo último sin recrear el mapa
  const latest = useRef({ stadiums, onOpenStadium, onFlyEnd });
  useEffect(() => { latest.current = { stadiums, onOpenStadium, onFlyEnd }; }, [stadiums, onOpenStadium, onFlyEnd]);
  const markersRef = useRef(new Map());
  const spaceRef = useRef(null);
  const interacted = useRef(false);
  const introDone = useRef(false);

  // Crea el mapa una sola vez
  useEffect(() => {
    let instance = null;
    let cancelled = false;
    let spinTimer = null;
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
      attributionControl: false,
      // Centra el planeta en el espacio bajo la navbar (80px); no cambia el zoom mínimo
      padding: { top: 80, bottom: 0, left: 0, right: 0 },
      dragRotate: false,
      pitchWithRotate: false,
    });
    instance.touchZoomRotate.disableRotation();
    const syncSpace = () => spaceRef.current?.classList.toggle('gc-space-hidden', globeCoversScreen(instance.getZoom(), container));
    instance.on('resize', () => { instance.setMinZoom(minZoomFor(container)); syncSpace(); });
    instance.on('zoom', syncSpace);
    // Si el usuario ya movió el mapa, el viaje de bienvenida no le arrebata el control
    ['mousedown', 'touchstart', 'wheel'].forEach((type) => instance.on(type, () => { interacted.current = true; }));

    // Giro lento: cada vuelta de animación encadena la siguiente; tras tocar el mapa espera un momento y retoma
    let spinning = false;
    const spin = () => {
      if (!instance || reducedMotion() || instance.getZoom() > SPIN_BELOW_ZOOM) return;
      spinning = true;
      const { lng, lat } = instance.getCenter();
      instance.easeTo({ center: [lng - SPIN_DEGREES, lat], duration: SPIN_MS, easing: (t) => t });
    };
    const stopSpin = () => {
      clearTimeout(spinTimer);
      if (!spinning) return; // sin giro en curso no se toca la cámara (el zoom con rueda anima por su cuenta)
      spinning = false;
      instance.stop();
    };
    ['mousedown', 'touchstart', 'wheel'].forEach((type) => instance.on(type, stopSpin));
    instance.on('moveend', () => {
      if (spinning) spin();
      else { clearTimeout(spinTimer); spinTimer = setTimeout(spin, SPIN_RESUME_MS); }
    });

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
            // Mismo ritmo que el viaje a un estadio
            instance.easeTo({ center: [lng, lat], zoom, duration: reducedMotion() ? 0 : FOCUS_MS, easing: smooth });
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
      clearTimeout(spinTimer);
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

    const duration = reducedMotion() ? 0 : 2500;
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

    // Quien pidió el viaje se entera al llegar (por ejemplo, para abrir la ficha del estadio recién ahí)
    const arrived = () => latest.current.onFlyEnd?.(flyTarget);
    const { lng, lat } = map.getCenter();
    const alreadyThere = Math.abs(lng - flyTarget.lng) < 1e-4 && Math.abs(lat - flyTarget.lat) < 1e-4 && map.getZoom() >= FOCUS_ZOOM;
    if (alreadyThere) {
      arrived();
      return;
    }

    showOverlays(map, false);
    map.flyTo({
      center: [flyTarget.lng, flyTarget.lat],
      zoom: Math.max(map.getZoom(), FOCUS_ZOOM),
      duration: reducedMotion() ? 0 : FOCUS_MS,
      curve: FOCUS_CURVE,
      easing: smooth,
    });
    // flyTo ya frenó cualquier animación anterior: el próximo moveend es el del final de este viaje
    const restore = () => showOverlays(map, true);
    map.once('moveend', restore);
    map.once('moveend', arrived);
    return () => { map.off('moveend', arrived); map.off('moveend', restore); restore(); };
  }, [map, flyTarget]);

  return (
    <>
      <div ref={spaceRef} className="gc-space" style={{ width: '100vw', height: '100vh' }}>
        {/* Capas del espacio, todas en CSS: Vía Láctea, dos capas de estrellas, destellos y estrellas fugaces */}
        <div className="gc-milkyway" aria-hidden="true" />
        <div className="gc-stars gc-stars-a" aria-hidden="true" />
        <div className="gc-stars gc-stars-b" aria-hidden="true" />
        <div className="gc-sky" aria-hidden="true">
          <span className="gc-bright" style={{ top: '14%', left: '9%', animationDelay: '0s' }} />
          <span className="gc-bright" style={{ top: '30%', left: '91%', animationDelay: '1.5s' }} />
          <span className="gc-bright" style={{ top: '72%', left: '6%', animationDelay: '3s' }} />
          <span className="gc-bright" style={{ top: '84%', left: '88%', animationDelay: '2s' }} />
          <span className="gc-bright" style={{ top: '10%', left: '66%', animationDelay: '4s' }} />
          <span className="gc-meteor" style={{ top: '8%', left: '12%', animationDelay: '2s', animationDuration: '13s' }} />
          <span className="gc-meteor" style={{ top: '22%', left: '58%', animationDelay: '7s', animationDuration: '17s' }} />
          <span className="gc-meteor" style={{ top: '5%', left: '80%', animationDelay: '11s', animationDuration: '15s' }} />
          <span className="gc-meteor" style={{ top: '40%', left: '6%', animationDelay: '15s', animationDuration: '19s' }} />
          <span className="gc-meteor" style={{ top: '62%', left: '70%', animationDelay: '4s', animationDuration: '21s' }} />
          <span className="gc-meteor" style={{ top: '30%', left: '35%', animationDelay: '18s', animationDuration: '16s' }} />
        </div>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <ZoomControls map={map} />
      {/* Atribución de Esri: abajo al centro, libre de los botones laterales */}
      <p className="fixed bottom-1 inset-x-0 text-center pointer-events-none z-[900]" style={{ fontSize: 10, color: C.muted, opacity: 0.7 }}>
        Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics
      </p>
    </>
  );
}
