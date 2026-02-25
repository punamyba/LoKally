

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer, TileLayer, Marker, Popup,
  useMap, useMapEvents, ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "./Type";
import "./MapView.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Mode   = "explore" | "add";
type LatLng = { lat: number; lng: number };

export type MapViewProps = {
  fullHeight?:              boolean;
  places:                   Place[];
  selectedPlace:            Place | null;
  zoomTarget?:              Place | null;
  geoTarget?:               [number, number] | null;
  onGeoTargetConsumed?:     () => void;
  onMapReady?:              (map: L.Map) => void;
  onSelectPlace:            (place: Place) => void;
  onMapPick:                (pos: LatLng) => void;
  tempPin:                  LatLng | null;
  setTempPin:               (pos: LatLng | null) => void;
  mode:                     Mode;
  nearbyPlace:              Place | null;
  onClickAddPlace:          () => void;
  onClickViewPlaceDetails:  () => void;
};

/* ── inner hooks (must be children of MapContainer) ─────────────── */

function MapReadyEmitter({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { if (onMapReady) onMapReady(map); }, [map]); // eslint-disable-line
  return null;
}

function FlyToGeo({
  target, onConsumed,
}: { target?: [number, number] | null; onConsumed?: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target, 12, { duration: 1.2 });
    if (onConsumed) onConsumed();
  }, [target]); // eslint-disable-line
  return null;
}

function FlyToTarget({ target }: { target: Place | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 15, { duration: 0.9 });
  }, [target]); // eslint-disable-line
  return null;
}

function FlyToSelected({ selectedPlace }: { selectedPlace: Place | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedPlace) return;
    map.flyTo([selectedPlace.lat, selectedPlace.lng], 13, { duration: 0.8 });
  }, [selectedPlace]); // eslint-disable-line
  return null;
}

function ClickHandler({ onMapPick }: { onMapPick: (pos: LatLng) => void }) {
  useMapEvents({ click(e) { onMapPick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

/* ── icons ──────────────────────────────────────────────────────── */

function makeUserLocationIcon() {
  return L.divIcon({
    className: "lk-gpsPin",
    html: `
      <div class="lk-gpsPin__pulse"></div>
      <div class="lk-gpsPin__pulse lk-gpsPin__pulse--delay"></div>
      <div class="lk-gpsPin__dot"></div>
    `,
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
  });
}

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
    iconSize:     [54, 70],
    iconAnchor:   [27, 68],
    popupAnchor:  [0, -62],
  });
}

const tempPinIcon = new L.Icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
});

/* ── main component ─────────────────────────────────────────────── */

export default function MapView({
  fullHeight = false,
  places,
  selectedPlace,
  zoomTarget,
  geoTarget,
  onGeoTargetConsumed,
  onMapReady,
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
  const tempMarkerRef = useRef<L.Marker | null>(null);
  const gpsIcon = useMemo(() => makeUserLocationIcon(), []);

  useEffect(() => {
    if (!navigator.geolocation) { setUserPos(fallbackPos); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      ()    => setUserPos(fallbackPos),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [fallbackPos]);

  const center = useMemo<[number, number]>(() => {
    if (selectedPlace) return [selectedPlace.lat, selectedPlace.lng];
    if (tempPin)       return [tempPin.lat, tempPin.lng];
    if (userPos)       return userPos;
    return fallbackPos;
  }, [selectedPlace, tempPin, userPos, fallbackPos]);

  useEffect(() => {
    if (!tempPin || !tempMarkerRef.current) return;
    tempMarkerRef.current.openPopup();
  }, [tempPin]);

  return (
    <MapContainer
      center={center} zoom={7}
      className={fullHeight ? "lk-map lk-map--full" : "lk-map"}
      zoomControl={false} closePopupOnClick={false}
    >
      <ZoomControl position="topright" />
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* inner hook components */}
      <MapReadyEmitter onMapReady={onMapReady} />
      <FlyToGeo target={geoTarget} onConsumed={onGeoTargetConsumed} />
      <FlyToSelected selectedPlace={selectedPlace} />
      <FlyToTarget target={zoomTarget ?? null} />
      <ClickHandler onMapPick={onMapPick} />

      {/* GPS location pulse marker */}
      {userPos && (
        <Marker position={userPos} icon={gpsIcon}>
          <Popup autoClose={false} closeOnClick={false}>
            <b>📍 Your Location</b><br />
            Lat: {userPos[0].toFixed(5)}<br />
            Lng: {userPos[1].toFixed(5)}
          </Popup>
        </Marker>
      )}

      {/* Place markers */}
      {places.map((p) => (
        <Marker
          key={p.id} position={[p.lat, p.lng]}
          icon={makePlaceIcon(p)}
          eventHandlers={{ click: () => onSelectPlace(p) }}
        />
      ))}

      {/* Temp pin (add mode) */}
      {tempPin && (
        <Marker
          position={[tempPin.lat, tempPin.lng]}
          icon={tempPinIcon} draggable={mode === "add"}
          ref={(ref) => {
            const a = ref as any;
            tempMarkerRef.current = a?.leafletElement || a || null;
          }}
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              setTempPin({ lat: ll.lat, lng: ll.lng });
            },
          }}
        >
          <Popup autoClose={false} closeOnClick={false} closeButton>
            <div className="lk-pickPopup">
              <div className="lk-pickPopup__title">Selected location</div>
              <div className="lk-pickPopup__coords">
                <div><b>Lat:</b> {tempPin.lat.toFixed(6)}</div>
                <div><b>Lng:</b> {tempPin.lng.toFixed(6)}</div>
              </div>
              <button className="lk-pickPopup__btn lk-pickPopup__btn--primary"
                onClick={onClickAddPlace} type="button">
                Add Place Here
              </button>
              {nearbyPlace && (
                <button className="lk-pickPopup__btn"
                  onClick={onClickViewPlaceDetails} type="button">
                  View Nearby Place
                </button>
              )}
              <div className="lk-pickPopup__hint">
                {nearbyPlace
                  ? `"${nearbyPlace.name}" is nearby.`
                  : "No place found here. Add a new one!"}
              </div>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}