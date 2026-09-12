import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { C, rgba } from '../theme';

const WORLD_CENTER = [0, 0];
const WORLD_ZOOM = 2;
const FOCUS_ZOOM = 6;

function statusColor(status) {
  if (status === 'visited') return C.brandBright;
  if (status === 'wishlist') return C.gold;
  return C.muted;
}

function buildMarkerIcon(status) {
  const color = statusColor(status);
  return L.divIcon({
    className: 'gc-marker',
    html: `<span style="background:${color};box-shadow:0 0 0 6px ${rgba(color, 0.25)}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
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

export default function MapScreen({ stadiums, onOpenStadium, flyTarget }) {
  return (
    <MapContainer
      center={WORLD_CENTER}
      zoom={WORLD_ZOOM}
      scrollWheelZoom
      style={{ width: '100vw', height: '100vh', backgroundColor: C.bg }}
    >
      <TileLayer
        className="gc-tiles"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stadiums.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={buildMarkerIcon(s.status)}
          eventHandlers={{ click: () => onOpenStadium(s) }}
        >
          <Tooltip permanent direction="top" offset={[0, -6]} className="gc-marker-label">
            {s.name}
          </Tooltip>
        </Marker>
      ))}
      <FlyTo target={flyTarget} />
    </MapContainer>
  );
}
