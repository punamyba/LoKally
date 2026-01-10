import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🔧 Fix default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ✅ Props type
interface MapViewProps {
  fullHeight?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ fullHeight = false }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);

  // 📍 Get user's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        alert("Location access denied");
        // fallback: Kathmandu
        setPosition([27.7172, 85.324]);
      }
    );
  }, []);

  if (!position) {
    return <p style={{ padding: "20px" }}>Loading map...</p>;
  }

  return (
    <MapContainer
      center={position}
      zoom={15}
      style={{
        height: fullHeight ? "100vh" : "400px",
        width: "100%",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 🧲 Draggable Marker */}
      <Marker
        position={position}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const newPos = marker.getLatLng();
            setPosition([newPos.lat, newPos.lng]);
          },
        }}
      >
        <Popup>
          <b>Your Location</b>
          <br />
          Lat: {position[0].toFixed(6)}
          <br />
          Lng: {position[1].toFixed(6)}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapView;
