import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "./Type";
import "./MapView.css";

/* Leaflet default marker fix (Vite) */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Mode = "explore" | "add";

type LatLng = { lat: number; lng: number };

type MapViewProps = {
  fullHeight?: boolean;
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;

  // click on map -> temporary pin
  onMapPick: (pos: LatLng) => void;

  // temporary pin + setter (drag)
  tempPin: LatLng | null;
  setTempPin: (pos: LatLng | null) => void;

  // mode
  mode: Mode;

  // temp popup actions
  nearbyPlace: Place | null;
  onClickAddPlace: () => void;
  onClickViewPlaceDetails: () => void;
};

function FlyToSelected({ selectedPlace }: { selectedPlace: Place | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedPlace) return;
    map.flyTo([selectedPlace.lat, selectedPlace.lng], 12, { duration: 0.8 });
  }, [selectedPlace, map]);

  return null;
}

/* Round photo marker for database places */
function makePlaceIcon(p: Place) {
  const img = p.image || "";
  return L.divIcon({
    className: "lk-photoMarker",
    html: `
      <div class="lk-photoMarker__outer">
        <div class="lk-photoMarker__img" style="background-image:url('${img}')"></div>
      </div>
      <div class="lk-photoMarker__pin"></div>
    `,
    iconSize: [54, 70],
    iconAnchor: [27, 68],
    popupAnchor: [0, -62],
  });
}

/* User dot marker */
const userDotIcon = L.divIcon({
  className: "lk-userDot",
  html: `<div class="lk-userDot__dot"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/* Temporary pin icon (different from photo markers) */
const tempPinIcon = new L.Icon({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({
  onMapPick,
}: {
  onMapPick: (pos: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      onMapPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapView({
  fullHeight = false,
  places,
  selectedPlace,
  onSelectPlace,
  onMapPick,
  tempPin,
  setTempPin,
  mode,
  nearbyPlace,
  onClickAddPlace,
  onClickViewPlaceDetails,
}: MapViewProps) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const fallbackPos = useMemo<[number, number]>(() => [27.7172, 85.324], []);

  // keep ref to temp marker to open popup reliably
  const tempMarkerRef = useRef<L.Marker | null>(null);

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
    if (tempPin) return [tempPin.lat, tempPin.lng];
    if (userPos) return userPos;
    return fallbackPos;
  }, [selectedPlace, tempPin, userPos, fallbackPos]);

  // when tempPin changes, open the popup programmatically
  useEffect(() => {
    if (!tempPin) return;
    if (!tempMarkerRef.current) return;
    tempMarkerRef.current.openPopup();
  }, [tempPin]);

  return (
    <MapContainer
      center={center}
      zoom={7}
      className={fullHeight ? "lk-map lk-map--full" : "lk-map"}
      zoomControl={false}
      closePopupOnClick={false} /* important: popup won't auto-close */
    >
      {/* Keep zoom controls visible top-right */}
      <ZoomControl position="topright" />

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler onMapPick={onMapPick} />
      <FlyToSelected selectedPlace={selectedPlace} />

      {/* User marker as small dot */}
      {userPos && (
        <Marker position={userPos} icon={userDotIcon}>
          <Popup autoClose={false} closeOnClick={false}>
            <b>Your Location</b>
            <br />
            Lat: {userPos[0].toFixed(6)}
            <br />
            Lng: {userPos[1].toFixed(6)}
          </Popup>
        </Marker>
      )}

      {/* Database place markers: round photo marker */}
      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={makePlaceIcon(p)}
          eventHandlers={{
            click: () => onSelectPlace(p),
          }}
        />
      ))}

      {/* Temporary pin marker: different icon, draggable in add mode */}
      {tempPin && (
        <Marker
          position={[tempPin.lat, tempPin.lng]}
          icon={tempPinIcon}
          draggable={mode === "add"}
          ref={(ref) => {
            // react-leaflet gives Leaflet element under ref?.leafletElement in some versions
            // but in v4 it returns the element directly
            // we handle both safely
            const anyRef = ref as any;
            tempMarkerRef.current =
              anyRef?.leafletElement || anyRef || null;
          }}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target as L.Marker;
              const ll = marker.getLatLng();
              setTempPin({ lat: ll.lat, lng: ll.lng });
            },
          }}
        >
          {/* This popup must stay open until user closes it */}
          <Popup autoClose={false} closeOnClick={false} closeButton>
            <div className="lk-pickPopup">
              <div className="lk-pickPopup__title">Selected location</div>

              <div className="lk-pickPopup__coords">
                <div>
                  <b>Lat:</b> {tempPin.lat.toFixed(6)}
                </div>
                <div>
                  <b>Lng:</b> {tempPin.lng.toFixed(6)}
                </div>
              </div>

              <button
                className="lk-pickPopup__btn lk-pickPopup__btn--primary"
                onClick={onClickAddPlace}
                type="button"
              >
                Add Place
              </button>

              {/* Show View details only if nearby place exists */}
              {nearbyPlace ? (
                <button
                  className="lk-pickPopup__btn"
                  onClick={onClickViewPlaceDetails}
                  type="button"
                >
                  View Place Details
                </button>
              ) : null}

              <div className="lk-pickPopup__hint">
                {nearbyPlace
                  ? "A place is nearby. You can view details or add another place."
                  : "No place found here. You can add a new one."}
              </div>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
