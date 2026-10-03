import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Minus, Plus } from 'lucide-react';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { C, rgba } from '../theme';

const ARGENTINA_CENTER = [-34.6, -58.38];
const ARGENTINA_ZOOM = 5;
const FOCUS_ZOOM = 6;
const MIN_ZOOM = 3;
const WORLD_BOUNDS = [
  [-90, -180],
  [90, 180],
];

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

function buildMarkerIcon(status, logoUrl, hasClub) {
  const bg = statusColor(status);
  const inner = logoUrl ? `<img src="${logoUrl}" alt="" />` : hasClub ? goalSvg() : landmarkSvg();
  return L.divIcon({
    className: 'gc-marker',
    html: `<span class="gc-marker-badge" style="background:${bg}">${inner}</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

// Grupo de estadios superpuestos: símbolo genérico con la cantidad, sin tapar escudos
function buildClusterIcon(cluster) {
  return L.divIcon({
    className: 'gc-marker',
    html: `<span class="gc-cluster-badge">${goalSvg('#FFFFFF')}<b>${cluster.getChildCount()}</b></span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), FOCUS_ZOOM), { duration: 0.8 });
  }, [target, map]);
  return null;
}

function ZoomControls() {
  const map = useMap();
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-[400] flex items-center gap-1 p-1 rounded-full"
      style={{ bottom: '6.5rem', backgroundColor: rgba(C.surface, 0.92), border: `1px solid ${C.border}`, backdropFilter: 'blur(8px)' }}
    >
      <button
        onClick={() => map.zoomOut()}
        aria-label="Alejar"
        className="w-9 h-9 rounded-full flex items-center justify-center gc-focus gc-tap"
        style={{ color: C.bright }}
      >
        <Minus size={16} />
      </button>
      <div className="w-px h-5" style={{ backgroundColor: C.border }} />
      <button
        onClick={() => map.zoomIn()}
        aria-label="Acercar"
        className="w-9 h-9 rounded-full flex items-center justify-center gc-focus gc-tap"
        style={{ color: C.bright }}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

// El nombre es permanente: el cluster solo quita del mapa los marcadores agrupados,
// así que el texto aparece únicamente cuando el estadio se ve como marcador individual.
function Markers({ stadiums, onOpenStadium }) {
  return (
    <MarkerClusterGroup
      iconCreateFunction={buildClusterIcon}
      showCoverageOnHover={false}
      maxClusterRadius={40}
    >
      {stadiums
        .filter((s) => s.location?.coordinates?.lat != null && s.location?.coordinates?.lng != null)
        .map((s) => (
          <Marker
            key={s.id}
            position={[s.location.coordinates.lat, s.location.coordinates.lng]}
            icon={buildMarkerIcon(s.status, s.clubLogoUrl, Boolean(s.mainClubId))}
            eventHandlers={{ click: () => onOpenStadium(s) }}
          >
            <Tooltip permanent direction="top" offset={[0, -18]} className="gc-marker-label">
              {s.name}
            </Tooltip>
          </Marker>
        ))}
    </MarkerClusterGroup>
  );
}

export default function MapScreen({ stadiums, onOpenStadium, flyTarget }) {
  return (
    <MapContainer
      center={ARGENTINA_CENTER}
      zoom={ARGENTINA_ZOOM}
      minZoom={MIN_ZOOM}
      maxBounds={WORLD_BOUNDS}
      maxBoundsViscosity={1.0}
      worldCopyJump={false}
      scrollWheelZoom
      zoomControl={false}
      style={{ width: '100vw', height: '100vh', backgroundColor: C.bg }}
    >
      <TileLayer
        className="gc-tiles"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        noWrap
      />
      <Markers stadiums={stadiums} onOpenStadium={onOpenStadium} />
      <FlyTo target={flyTarget} />
      <ZoomControls />
    </MapContainer>
  );
}
