import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Place } from "./Type";
import "./MapView.css";

// Leaflet default marker fix (Vite)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type MapViewProps = {
  fullHeight?: boolean;
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
};

function FlyToSelected({ selectedPlace }: { selectedPlace: Place | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedPlace) return;
    map.flyTo([selectedPlace.lat, selectedPlace.lng], 12, { duration: 0.8 });
  }, [selectedPlace, map]);

  return null;
}

function makePlaceIcon(p: Place) {
  const letter = (p.name?.trim()?.[0] || "P").toUpperCase();

  // Using background-image is more reliable than <img> inside divIcon
  const bgStyle = p.image
    ? `style="background-image:url('${p.image}');"`
    : "";

  return L.divIcon({
    className: "lk-placeIcon",
    html: `
      <div class="lk-placeIcon__wrap" ${bgStyle}>
        <div class="lk-placeIcon__fallback">${letter}</div>
      </div>
      <div class="lk-placeIcon__pin"></div>
    `,
    iconSize: [52, 64],
    iconAnchor: [26, 62],
    popupAnchor: [0, -56],
  });
}

export default function MapView({
  fullHeight = false,
  places,
  selectedPlace,
  onSelectPlace,
}: MapViewProps) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const fallbackPos = useMemo<[number, number]>(() => [27.7172, 85.324], []);

  // User location
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserPos(fallbackPos);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setUserPos(fallbackPos),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [fallbackPos]);

  // Map center
  const center = useMemo<[number, number]>(() => {
    if (selectedPlace) return [selectedPlace.lat, selectedPlace.lng];
    if (userPos) return userPos;
    return fallbackPos;
  }, [selectedPlace, userPos, fallbackPos]);

  return (
    <MapContainer
      center={center}
      zoom={7}
      className={fullHeight ? "lk-map lk-map--full" : "lk-map"}
      zoomControl={false}
    >
      {/* Force zoom (+/-) */}
      <ZoomControl position="topright" />

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToSelected selectedPlace={selectedPlace} />

      {/* User marker */}
      {userPos && (
        <Marker position={userPos}>
          <Popup>
            <b>Your Location</b>
            <br />
            Lat: {userPos[0].toFixed(6)}
            <br />
            Lng: {userPos[1].toFixed(6)}
          </Popup>
        </Marker>
      )}

      {/* Places markers */}
      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={makePlaceIcon(p)}
          eventHandlers={{ click: () => onSelectPlace(p) }}
        >
          <Popup>
            <b>{p.name}</b>
            {p.category ? (
              <>
                <br />
                Category: {p.category}
              </>
            ) : null}
            {p.description ? (
              <>
                <br />
                {p.description}
              </>
            ) : null}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
