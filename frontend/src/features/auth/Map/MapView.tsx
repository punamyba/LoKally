import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Place } from "./Type";
import "./MapView.css";

// 🔧 marker icon fix
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
    map.flyTo([selectedPlace.lat, selectedPlace.lng], 15, { duration: 0.8 });
  }, [selectedPlace, map]);

  return null;
}

export default function MapView({
  fullHeight = false,
  places,
  selectedPlace,
  onSelectPlace,
}: MapViewProps) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const fallbackPos = useMemo<[number, number]>(() => [27.7172, 85.324], []);

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

  const center = useMemo<[number, number]>(() => {
    if (selectedPlace) return [selectedPlace.lat, selectedPlace.lng];
    if (userPos) return userPos;
    return fallbackPos;
  }, [selectedPlace, userPos, fallbackPos]);

  return (
    <MapContainer
      center={center}
      zoom={15}
      className={fullHeight ? "lk-map lk-map--full" : "lk-map"}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToSelected selectedPlace={selectedPlace} />

      {/* user marker (simple) */}
      {userPos && <Marker position={userPos} />}

      {/* place markers — click => details open, but no leaflet popup */}
      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          eventHandlers={{ click: () => onSelectPlace(p) }}
        />
      ))}
    </MapContainer>
  );
}
