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

// Photo circle only at zoom >= 14, otherwise teardrop
const ZOOM_SHOW_PHOTO = 14;

// ── Inner hooks ──────────────────────────────────────────────────

function MapReadyEmitter({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { if (onMapReady) onMapReady(map); }, [map]); // eslint-disable-line
  return null;
}

function FlyToGeo({ target, onConsumed }: { target?: [number, number] | null; onConsumed?: () => void }) {
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
    const currentZoom = map.getZoom();
    const targetZoom  = Math.max(currentZoom, 13);
    map.flyTo([selectedPlace.lat, selectedPlace.lng], targetZoom, { duration: 0.8 });
  }, [selectedPlace]); // eslint-disable-line
  return null;
}

function ClickHandler({ onMapPick }: { onMapPick: (pos: LatLng) => void }) {
  useMapEvents({ click(e) { onMapPick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({
    zoomend() { onZoom(map.getZoom()); },
  });
  return null;
}

// ── Icons ────────────────────────────────────────────────────────

// GPS blue pulse circle
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

// Blue teardrop — normal approved places
function makeTearDropIcon() {
  return L.divIcon({
    className: "lk-dotMarker",
    html: `
      <div class="lk-dotMarker__drop">
        <svg viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 2C8.925 2 4 6.925 4 13c0 8.5 11 27 11 27S26 21.5 26 13C26 6.925 21.075 2 15 2z"
            fill="#167ee0" stroke="white" stroke-width="1.8"/>
          <circle cx="15" cy="13" r="5" fill="white" opacity="0.95"/>
        </svg>
      </div>
    `,
    iconSize:    [30, 42],
    iconAnchor:  [15, 42],
    popupAnchor: [0, -44],
  });
}

// Golden star teardrop — featured places
function makeFeaturedIcon() {
  return L.divIcon({
    className: "lk-dotMarker lk-dotMarker--featured",
    html: `
      <div class="lk-dotMarker__drop lk-dotMarker__drop--featured">
        <svg viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 2C8.925 2 4 6.925 4 13c0 8.5 11 27 11 27S26 21.5 26 13C26 6.925 21.075 2 15 2z"
            fill="#f59e0b" stroke="white" stroke-width="1.8"/>
          <polygon
            points="15,6.5 16.8,11.5 22,11.5 17.9,14.6 19.4,19.5 15,16.5 10.6,19.5 12.1,14.6 8,11.5 13.2,11.5"
            fill="white" opacity="0.95"/>
        </svg>
      </div>
    `,
    iconSize:    [36, 50],
    iconAnchor:  [18, 50],
    popupAnchor: [0, -52],
  });
}

// Red teardrop — selected place OR map click pin
function makeRedIcon() {
  return L.divIcon({
    className: "lk-dotMarker lk-dotMarker--selected",
    html: `
      <div class="lk-dotMarker__drop lk-dotMarker__drop--selected">
        <svg viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 2C8.925 2 4 6.925 4 13c0 8.5 11 27 11 27S26 21.5 26 13C26 6.925 21.075 2 15 2z"
            fill="#ef4444" stroke="white" stroke-width="1.8"/>
          <circle cx="15" cy="13" r="5" fill="white" opacity="0.95"/>
        </svg>
        <div class="lk-dotMarker__ring"></div>
      </div>
    `,
    iconSize:    [34, 48],
    iconAnchor:  [17, 48],
    popupAnchor: [0, -50],
  });
}

// Photo circle — zoom >= 14
function makePhotoIcon(p: Place, isSelected: boolean) {
  const img        = p.image || "";
  const isFeatured = !!(p as any).is_featured;
  const ringColor  = isSelected ? "#ef4444" : (isFeatured ? "#f59e0b" : "#167ee0");
  return L.divIcon({
    className: "lk-photoMarker",
    html: `
      <div class="lk-photoMarker__outer" style="box-shadow:0 0 0 3px ${ringColor},0 10px 24px rgba(0,0,0,0.18)">
        <div class="lk-photoMarker__img" style="background-image:url('${img}');border-color:${ringColor}"></div>
      </div>
      <div class="lk-photoMarker__pin" style="background:${ringColor}"></div>
    `,
    iconSize:     [54, 70],
    iconAnchor:   [27, 68],
    popupAnchor:  [0, -62],
  });
}

// ── Main component ───────────────────────────────────────────────

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
  const [zoom, setZoom]       = useState(7);
  const fallbackPos           = useMemo<[number, number]>(() => [27.7172, 85.324], []);
  const gpsIcon               = useMemo(() => makeUserLocationIcon(), []);
  const tempMarkerRef         = useRef<L.Marker | null>(null);

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

  // Get correct icon
  const getPlaceIcon = (p: Place) => {
    const isSelected = selectedPlace?.id === p.id;
    const isFeatured = !!(p as any).is_featured;
    if (zoom >= ZOOM_SHOW_PHOTO) return makePhotoIcon(p, isSelected);
    if (isSelected)  return makeRedIcon();
    if (isFeatured)  return makeFeaturedIcon();
    return makeTearDropIcon();
  };

  // Featured matra zoom out maa, sabai zoom in maa
  const visiblePlaces = useMemo(() => {
    if (zoom < 9) {
      // Zoom out — featured matra + selected always
      const featured = places.filter(p => !!(p as any).is_featured);
      if (selectedPlace && !featured.find(p => p.id === selectedPlace.id)) {
        return [...featured, selectedPlace];
      }
      return featured;
    }
    // Zoom in — sabai dekhaucha
    return places;
  }, [places, zoom, selectedPlace]);

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

      <MapReadyEmitter onMapReady={onMapReady} />
      <FlyToGeo target={geoTarget} onConsumed={onGeoTargetConsumed} />
      <FlyToSelected selectedPlace={selectedPlace} />
      <FlyToTarget target={zoomTarget ?? null} />
      <ClickHandler onMapPick={onMapPick} />
      <ZoomWatcher onZoom={setZoom} />

      {/* GPS blue pulse circle */}
      {userPos && (
        <Marker position={userPos} icon={gpsIcon}>
          <Popup autoClose={false} closeOnClick={false}>
            <b>📍 Your Location</b><br />
            Lat: {userPos[0].toFixed(5)}<br />
            Lng: {userPos[1].toFixed(5)}
          </Popup>
        </Marker>
      )}

      {/* Place markers — SABAI HAMESHA VISIBLE */}
      {visiblePlaces.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={getPlaceIcon(p)}
          zIndexOffset={selectedPlace?.id === p.id ? 1000 : 0}
          eventHandlers={{ click: () => onSelectPlace(p) }}
        />
      ))}

      {/* Map click / add pin — RED + DRAGGABLE */}
      {tempPin && (
        <Marker
          position={[tempPin.lat, tempPin.lng]}
          icon={makeRedIcon()}
          draggable={true}
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
              <div className="lk-pickPopup__title">📍 Selected location</div>
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