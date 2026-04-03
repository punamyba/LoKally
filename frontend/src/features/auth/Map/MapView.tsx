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
  fullHeight?:             boolean;
  places:                  Place[];
  selectedPlace:           Place | null;
  zoomTarget?:             Place | null;
  geoTarget?:              [number, number] | null;
  onGeoTargetConsumed?:    () => void;
  geoSearchActive?:        boolean;
  onMapReady?:             (map: L.Map) => void;
  onSelectPlace:           (place: Place) => void;
  onMapPick:               (pos: LatLng) => void;
  tempPin:                 LatLng | null;
  setTempPin:              (pos: LatLng | null) => void;
  mode:                    Mode;
  nearbyPlace:             Place | null;
  onClickAddPlace:         () => void;
  onClickViewPlaceDetails: () => void;
};

const ZOOM_SHOW_ALL   = 10;  // all markers at zoom >= 10, only featured below
const INITIAL_ZOOM    = 7;

// ── hooks ────────────────────────────────────────────────────────

function MapReadyEmitter({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { onMapReady?.(map); }, [map]); // eslint-disable-line
  return null;
}

function FlyToGeo({ target, onConsumed }: { target?: [number, number] | null; onConsumed?: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target, 16, { duration: 1.4 });
    onConsumed?.();
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

// Only flies — never causes marker re-render (selectedPlace.id as dep, not whole object)
function FlyToSelected({ lat, lng, trigger }: { lat: number; lng: number; trigger: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!trigger) return;
    const currentZoom = map.getZoom();
    map.flyTo([lat, lng], Math.max(currentZoom, 13), { duration: 0.8 });
  }, [trigger]); // eslint-disable-line — only re-fly when id changes
  return null;
}

function ClickHandler({ onMapPick }: { onMapPick: (pos: LatLng) => void }) {
  useMapEvents({ click(e) { onMapPick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  // Only update on zoomend — NOT moveend.
  // moveend fires continuously during flyTo causing icon/marker re-renders mid-animation.
  const map = useMapEvents({
    zoomend() { onZoom(map.getZoom()); },
  });
  return null;
}

// ── icons ─────────────────────────────────────────────────────────

const makeUserLocationIcon = () => L.divIcon({
  className: "lk-gpsPin",
  html: `<div class="lk-gpsPin__pulse"></div>
         <div class="lk-gpsPin__pulse lk-gpsPin__pulse--delay"></div>
         <div class="lk-gpsPin__dot"></div>`,
  iconSize: [36, 36], iconAnchor: [18, 18],
});

const makeGeoSearchIcon = () => L.divIcon({
  className: "lk-dotMarker lk-dotMarker--selected",
  html: `<div class="lk-dotMarker__drop lk-dotMarker__drop--selected">
    <svg viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 2C8.925 2 4 6.925 4 13c0 8.5 11 27 11 27S26 21.5 26 13C26 6.925 21.075 2 15 2z"
        fill="#ef4444" stroke="white" stroke-width="1.8"/>
      <circle cx="15" cy="13" r="5" fill="white" opacity="0.95"/>
    </svg>
    <div class="lk-dotMarker__ring"></div>
  </div>`,
  iconSize: [34, 48], iconAnchor: [17, 48], popupAnchor: [0, -50],
});

const makeTearDropIcon = () => L.divIcon({
  className: "lk-dotMarker",
  html: `<div class="lk-dotMarker__drop">
    <svg viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 2C8.925 2 4 6.925 4 13c0 8.5 11 27 11 27S26 21.5 26 13C26 6.925 21.075 2 15 2z"
        fill="#167ee0" stroke="white" stroke-width="1.8"/>
      <circle cx="15" cy="13" r="5" fill="white" opacity="0.95"/>
    </svg>
  </div>`,
  iconSize: [30, 42], iconAnchor: [15, 42], popupAnchor: [0, -44],
});

const makeFeaturedIcon = () => L.divIcon({
  className: "lk-dotMarker lk-dotMarker--featured",
  html: `<div class="lk-dotMarker__drop lk-dotMarker__drop--featured">
    <svg viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 2C8.925 2 4 6.925 4 13c0 8.5 11 27 11 27S26 21.5 26 13C26 6.925 21.075 2 15 2z"
        fill="#f59e0b" stroke="white" stroke-width="1.8"/>
      <polygon points="15,6.5 16.8,11.5 22,11.5 17.9,14.6 19.4,19.5 15,16.5 10.6,19.5 12.1,14.6 8,11.5 13.2,11.5"
        fill="white" opacity="0.95"/>
    </svg>
  </div>`,
  iconSize: [36, 50], iconAnchor: [18, 50], popupAnchor: [0, -52],
});

const makeRedIcon = () => L.divIcon({
  className: "lk-dotMarker lk-dotMarker--selected",
  html: `<div class="lk-dotMarker__drop lk-dotMarker__drop--selected">
    <svg viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 2C8.925 2 4 6.925 4 13c0 8.5 11 27 11 27S26 21.5 26 13C26 6.925 21.075 2 15 2z"
        fill="#ef4444" stroke="white" stroke-width="1.8"/>
      <circle cx="15" cy="13" r="5" fill="white" opacity="0.95"/>
    </svg>
    <div class="lk-dotMarker__ring"></div>
  </div>`,
  iconSize: [34, 48], iconAnchor: [17, 48], popupAnchor: [0, -50],
});


// ── component ─────────────────────────────────────────────────────

export default function MapView({
  fullHeight = false,
  places,
  selectedPlace,
  zoomTarget,
  geoTarget,
  onGeoTargetConsumed,
  geoSearchActive = false,
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
  const [zoom, setZoom]       = useState(INITIAL_ZOOM);
  const fallbackPos           = useMemo<[number, number]>(() => [27.7172, 85.324], []);
  const gpsIcon               = useMemo(() => makeUserLocationIcon(), []);
  const geoSearchIcon         = useMemo(() => makeGeoSearchIcon(), []);
  const tempMarkerRef         = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) { setUserPos(fallbackPos); return; }
    navigator.geolocation.getCurrentPosition(
      pos  => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      ()   => setUserPos(fallbackPos),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [fallbackPos]);

  const center = useMemo<[number, number]>(() => {
    if (selectedPlace) return [selectedPlace.lat, selectedPlace.lng];
    if (tempPin)       return [tempPin.lat, tempPin.lng];
    if (userPos)       return userPos;
    return fallbackPos;
  }, [selectedPlace, tempPin, userPos, fallbackPos]);

  // ── visible places (background markers, never includes selectedPlace) ──
  // During geo search → hide everything, show only the red geo pin
  const visiblePlaces = useMemo(() => {
    if (geoSearchActive) return [];
    // zoom < ZOOM_SHOW_ALL → show NO markers (clean initial view)
    // zoom >= ZOOM_SHOW_ALL → show all markers
    if (zoom < ZOOM_SHOW_ALL) return [];
    const base = places;
    return selectedPlace ? base.filter(p => p.id !== selectedPlace.id) : base;
  }, [places, zoom, selectedPlace, geoSearchActive]);

  // Stable icon map — only recalculates when the visible set or zoom changes
  const iconMap = useMemo(() => {
    const m = new Map<string, L.DivIcon>();
    for (const p of visiblePlaces) {
      const isFeatured = !!(p as any).is_featured;
      if (isFeatured) m.set(p.id, makeFeaturedIcon());
      else            m.set(p.id, makeTearDropIcon());
    }
    return m;
  }, [visiblePlaces, zoom]);

  // Selected place icon — NEVER depends on zoom so it never re-renders during flyTo
  // Always red teardrop. This is intentional: stability > visual perfection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedIcon = useMemo(() => {
    if (!selectedPlace) return null;
    return makeRedIcon();
  }, [selectedPlace?.id]); // only recompute when a DIFFERENT place is selected

  return (
    <MapContainer
      center={center} zoom={INITIAL_ZOOM}
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
      {/* KEY FIX: pass id as trigger so FlyToSelected only flies, never causes marker re-render */}
      <FlyToSelected
        lat={selectedPlace?.lat ?? 0}
        lng={selectedPlace?.lng ?? 0}
        trigger={selectedPlace?.id ?? null}
      />
      <FlyToTarget target={zoomTarget ?? null} />
      <ClickHandler onMapPick={onMapPick} />
      <ZoomWatcher onZoom={setZoom} />

      {/* GPS dot */}
      {userPos && (
        <Marker position={userPos} icon={gpsIcon}>
          <Popup autoClose={false} closeOnClick={false}>
            <b>📍 Your Location</b><br />
            Lat: {userPos[0].toFixed(5)}<br />
            Lng: {userPos[1].toFixed(5)}
          </Popup>
        </Marker>
      )}

      {/* Background place markers — zoom filtered, selectedPlace excluded */}
      {visiblePlaces.map(p => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={iconMap.get(p.id) ?? makeTearDropIcon()}
          zIndexOffset={0}
          eventHandlers={{ click: () => onSelectPlace(p) }}
        />
      ))}

      {/* ── SELECTED PLACE MARKER ──
          Rendered completely independently. ALWAYS shows when a place is selected,
          regardless of zoom level or geo search state. Never unmounts during flyTo. */}
      {selectedPlace && selectedIcon && (
        <Marker
          key={`sel-${selectedPlace.id}`}
          position={[selectedPlace.lat, selectedPlace.lng]}
          icon={selectedIcon}
          zIndexOffset={1000}
          eventHandlers={{ click: () => onSelectPlace(selectedPlace) }}
        />
      )}

      {/* ── GEO SEARCH PIN ──
          Red pulsing pin at the geocoded location. Only shown during active geo search. */}
      {geoSearchActive && geoTarget && (
        <Marker
          key="geo-search-pin"
          position={geoTarget}
          icon={geoSearchIcon}
          zIndexOffset={2000}
        >
          <Popup autoClose={false} closeOnClick={false}>
            <div className="lk-pickPopup">
              <div className="lk-pickPopup__title">📍 Search Result</div>
              <div className="lk-pickPopup__coords">
                <div><b>Lat:</b> {geoTarget[0].toFixed(6)}</div>
                <div><b>Lng:</b> {geoTarget[1].toFixed(6)}</div>
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Draggable add-place pin */}
      {tempPin && (
        <Marker
          position={[tempPin.lat, tempPin.lng]}
          icon={makeRedIcon()}
          draggable={true}
          ref={ref => {
            const a = ref as any;
            tempMarkerRef.current = a?.leafletElement || a || null;
          }}
          eventHandlers={{
            dragend(e) {
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
                {nearbyPlace ? `"${nearbyPlace.name}" is nearby.` : "No place found here. Add a new one!"}
              </div>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}