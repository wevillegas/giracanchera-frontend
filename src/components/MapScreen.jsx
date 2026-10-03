import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { Minus, Plus } from 'lucide-react';
import L from 'leaflet';
import { C, rgba } from '../theme';

const ARGENTINA_CENTER = [-34.6, -58.38];
const ARGENTINA_ZOOM = 5;
const FOCUS_ZOOM = 6;
const MIN_ZOOM = 3;
const LABEL_MIN_ZOOM = ARGENTINA_ZOOM + 5;
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

function buildMarkerIcon(status, logoUrl) {
  const bg = statusColor(status);
  const inner = logoUrl
    ? `<img src="${logoUrl}" alt="" />`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="${C.bg}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${GOAL_ICON_PATHS.map((d) => `<path d="${d}" />`).join('')}</svg>`;
  return L.divIcon({
    className: 'gc-marker',
    html: `<span class="gc-marker-badge" style="background:${bg}">${inner}</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

function useZoom() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: (e) => setZoom(e.target.getZoom()) });
  return zoom;
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

function Markers({ stadiums, onOpenStadium }) {
  const zoom = useZoom();
  const showLabels = zoom >= LABEL_MIN_ZOOM;
  return stadiums
    .filter((s) => s.location?.coordinates?.lat != null && s.location?.coordinates?.lng != null)
    .map((s) => (
      <Marker
        key={s.id}
        position={[s.location.coordinates.lat, s.location.coordinates.lng]}
        icon={buildMarkerIcon(s.status, s.clubLogoUrl)}
        eventHandlers={{ click: () => onOpenStadium(s) }}
      >
        {/* key fuerza el remonte: react-leaflet no sincroniza `permanent` tras la creación del tooltip */}
        <Tooltip key={showLabels ? 'permanent' : 'hover'} permanent={showLabels} direction="top" offset={[0, -18]} className="gc-marker-label">
          {s.name}
        </Tooltip>
      </Marker>
    ));
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
