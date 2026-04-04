import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Ruler, MapPin, Navigation, Trash2, X } from "lucide-react";

function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function formatDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

// ── Place Detail Distance Widget ─────────────────────────────────────────────

interface PlaceDistanceProps {
  placeLat: number;
  placeLng: number;
  placeName: string;
}

export function PlaceDistance({ placeLat, placeLng }: PlaceDistanceProps) {
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locError, setLocError] = useState("");
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualPoint, setManualPoint] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(loc);
        setDistance(haversine(loc, [placeLat, placeLng]));
        setLoading(false);
      },
      () => { setLocError("Location access denied"); setLoading(false); },
      { timeout: 6000 }
    );
  }, [placeLat, placeLng]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!manualMode) return;
    const pt: [number, number] = [e.latlng.lat, e.latlng.lng];
    setManualPoint(pt);
    setDistance(haversine(pt, [placeLat, placeLng]));
    setUserLoc(null);
  };

  function MapClickHandler() {
    useMapEvents({ click: handleMapClick });
    return null;
  }

  const activeFrom = manualPoint || userLoc;

  return (
    <div className="pd-dist-card">
      <div className="pd-dist-header">
        <div className="pd-dist-title"><Ruler size={13} strokeWidth={2} /> Distance</div>
        <button
          className={`pd-dist-toggle ${manualMode ? "active" : ""}`}
          onClick={() => { setManualMode(v => !v); setManualPoint(null); }}
          type="button"
        >
          <MapPin size={12} strokeWidth={2.5} />
          {manualMode ? "Cancel" : "Custom point"}
        </button>
      </div>

      <div className="pd-dist-badge">
        {loading && <span className="pd-dist-loading">Detecting location…</span>}
        {!loading && distance !== null && (
          <>
            <span className="pd-dist-value">{formatDist(distance)}</span>
            <span className="pd-dist-label">{manualPoint ? "from selected point" : "from your location"}</span>
          </>
        )}
        {!loading && distance === null && !manualMode && (
          <span className="pd-dist-hint">{locError ? locError + " — use Custom point" : "Click 'Custom point' to measure"}</span>
        )}
        {manualMode && !manualPoint && (
          <span className="pd-dist-hint">Click anywhere on the map below</span>
        )}
      </div>

      <div className="pd-dist-map">
        <MapContainer
          center={[placeLat, placeLng]} zoom={11}
          style={{ height: "200px", width: "100%", borderRadius: "12px" }}
          zoomControl={false} scrollWheelZoom={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler />
          <Marker position={[placeLat, placeLng]} />
          {activeFrom && (
            <Marker
              position={activeFrom}
              icon={L.divIcon({
                className: "",
                html: `<div style="width:14px;height:14px;border-radius:50%;background:#167ee0;border:3px solid white;box-shadow:0 0 0 3px rgba(22,126,224,0.3)"></div>`,
                iconSize: [14, 14], iconAnchor: [7, 7],
              })}
            />
          )}
          {activeFrom && (
            <Polyline
              positions={[activeFrom, [placeLat, placeLng]]}
              pathOptions={{ color: "#167ee0", weight: 2, dashArray: "6 4", opacity: 0.7 }}
            />
          )}
        </MapContainer>
      </div>

      {manualMode && (
        <div className="pd-dist-tip">
          <Navigation size={11} strokeWidth={2} /> Click anywhere on the map to measure distance
        </div>
      )}
    </div>
  );
}

// ── Explore Map Ruler Tool ────────────────────────────────────────────────────

interface RulerToolProps {
  map: L.Map | null;
}

export function RulerTool({ map }: RulerToolProps) {
  const [active, setActive]         = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [points, setPoints]         = useState<[number, number][]>([]);
  const mapRef                      = useRef<L.Map | null>(null);
  const markersRef                  = useRef<L.Marker[]>([]);
  const polylineRef                 = useRef<L.Polyline | null>(null);
  const labelsRef                   = useRef<L.Marker[]>([]);
  const pointsRef                   = useRef<[number, number][]>([]);

  useEffect(() => { mapRef.current = map; }, [map]);

  const totalDist = points.length >= 2
    ? points.slice(1).reduce((sum, pt, i) => sum + haversine(points[i], pt), 0)
    : 0;

  const clearAll = () => {
    markersRef.current.forEach(m => m.remove());
    labelsRef.current.forEach(l => l.remove());
    polylineRef.current?.remove();
    markersRef.current = [];
    labelsRef.current  = [];
    polylineRef.current = null;
    pointsRef.current  = [];
    setPoints([]);
  };

  const handleClick = (e: L.LeafletMouseEvent) => {
    const m = mapRef.current;
    if (!m) return;
    const pt: [number, number] = [e.latlng.lat, e.latlng.lng];
    const next = [...pointsRef.current, pt];
    pointsRef.current = next;
    setPoints([...next]);

    const idx = next.length;
    const marker = L.marker(pt, {
      icon: L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#167ee0;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:white;font-family:sans-serif">${idx}</div>`,
        iconSize: [22, 22], iconAnchor: [11, 11],
      }),
    }).addTo(m);
    markersRef.current.push(marker);

    if (next.length >= 2) {
      const a = next[next.length - 2];
      const b = next[next.length - 1];
      const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const seg = haversine(a, b);
      const lbl = L.marker(mid, {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:white;border:1px solid #e2e8f0;border-radius:6px;padding:2px 7px;font-size:11px;font-weight:700;color:#374151;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.1)">${formatDist(seg)}</div>`,
          iconSize: [80, 24], iconAnchor: [40, 12],
        }),
      }).addTo(m);
      labelsRef.current.push(lbl);
    }

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(next);
    } else {
      polylineRef.current = L.polyline(next, { color: "#167ee0", weight: 2.5, dashArray: "6 4" }).addTo(m);
    }
  };

  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    if (active) {
      m.on("click", handleClick);
      m.getContainer().style.cursor = "crosshair";
    } else {
      m.off("click", handleClick);
      m.getContainer().style.cursor = "";
    }
    return () => { m.off("click", handleClick); m.getContainer().style.cursor = ""; };
  }, [active]);

  useEffect(() => {
    if (!active || !map) return;
    map.on("click", handleClick);
    map.getContainer().style.cursor = "crosshair";
    return () => { map.off("click", handleClick); map.getContainer().style.cursor = ""; };
  }, [map]);

  const toggleActive = () => {
    if (active) { clearAll(); setActive(false); }
    else setActive(true);
  };

  // Shared content for panel and sheet
  const RulerContent = () => (
    <>
      {points.length === 0 && <div className="exmap-ruler-hint">Click map to add points</div>}
      {points.length === 1 && <div className="exmap-ruler-hint">Click again to continue</div>}
      {points.length >= 2 && (
        <div className="exmap-ruler-total">
          <span className="exmap-ruler-dist">{formatDist(totalDist)}</span>
          <span className="exmap-ruler-pts">{points.length} points</span>
        </div>
      )}
      <button className="exmap-ruler-clear" onClick={clearAll} type="button" disabled={points.length === 0}>
        <Trash2 size={11} strokeWidth={2.5} /> Clear
      </button>
    </>
  );

  return (
    <>
      {/* ── DESKTOP: icon button + inline panel ── */}
      <button
        className={`exmap-ruler-btn ${active ? "active" : ""}`}
        onClick={toggleActive}
        type="button"
        title={active ? "Stop measuring" : "Measure distance"}
      >
        <Ruler size={16} strokeWidth={2} />
      </button>

      {active && (
        <div className="exmap-ruler-panel">
          <div className="exmap-ruler-panel-title">
            <Ruler size={12} strokeWidth={2} /> Distance ruler
          </div>
          <RulerContent />
        </div>
      )}

      {/* ── MOBILE: icon button (same style as legend) + bottom sheet ── */}
      <button
        className={`exmap-ruler-mobile-btn ${active ? "active" : ""}`}
        onClick={() => { if (!active) setActive(true); setMobileOpen(true); }}
        type="button"
        aria-label="Distance ruler"
      >
        <Ruler size={16} strokeWidth={2} />
      </button>

      {mobileOpen && (
        <div className="exmap-ruler-mobile-sheet" onClick={() => setMobileOpen(false)}>
          <div className="lk-legendSheet__box" onClick={e => e.stopPropagation()}>
            <div className="lk-legendSheet__handle" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div className="exmap-ruler-panel-title" style={{ marginBottom: 0 }}>
                <Ruler size={13} strokeWidth={2} /> Distance ruler
              </div>
              <button
                onClick={() => { clearAll(); setActive(false); setMobileOpen(false); }}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", width: "28px", height: "28px", display: "grid", placeItems: "center", cursor: "pointer", color: "#64748b" }}
                type="button"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
            <RulerContent />
            <button className="lk-legendSheet__close" onClick={() => setMobileOpen(false)} type="button">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}