/* ExploreMap.tsx */

import { useMemo, useState } from "react";
import Navbar from "../Components/Layout/Navbar/Navbar";
import MapView from "./MapView";
import type { Place } from "./Type";
import MapSearchPanel from "../Components/MapComponents/MapSearchPanel";
import "./ExploreMap.css";

const DEMO_PLACES: Place[] = [
  {
    id: "1",
    name: "Lumbini",
    lat: 27.4843,
    lng: 83.276,
    category: "Temple",
    description: "Birthplace of Buddha. Peaceful and spiritual place.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/1/18/BRP_Lumbini_Mayadevi_temple.jpg",
  },
  {
    id: "2",
    name: "Pokhara (Lakeside)",
    lat: 28.2096,
    lng: 83.9856,
    category: "Lake",
    description: "Beautiful lake view & mountain vibes.",
    image:
      "https://www.acethehimalaya.com/wp-content/uploads/2024/02/things-to-do-in-pokhara.jpg",
  },
  {
    id: "3",
    name: "Bhaktapur Durbar Square",
    lat: 27.671,
    lng: 85.4298,
    category: "Heritage",
    description: "Traditional Newari architecture and culture.",
    image:
      "https://assets-cdn.kathmandupost.com/uploads/source/news/2020/opinion/7-lead-for-online%20(7).jpg",
  },
];

type Mode = "explore" | "add";
type LatLng = { lat: number; lng: number };

function distanceMeters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) *
      Math.sin(dLng / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export default function ExploreMap() {
  const [mode, setMode] = useState<Mode>("explore");

  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [mobileAddOpen, setMobileAddOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [tempPin, setTempPin] = useState<LatLng | null>(null);
  const [nearbyPlace, setNearbyPlace] = useState<Place | null>(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    photos: "",
    description: "",
  });

  const places = useMemo(() => DEMO_PLACES, []);

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places;

    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [places, query]);

  const closeDetails = () => setSelectedPlace(null);

  const onMapPickLocation = (pos: LatLng) => {
    setSelectedPlace(null);
    setTempPin(pos);

    const THRESHOLD_METERS = 120;
    let best: Place | null = null;
    let bestDist = Infinity;

    for (const p of places) {
      const d = distanceMeters(pos, { lat: p.lat, lng: p.lng });
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }

    if (best && bestDist <= THRESHOLD_METERS) setNearbyPlace(best);
    else setNearbyPlace(null);
  };

  const viewNearbyDetails = () => {
    if (!nearbyPlace) return;
    setSelectedPlace(nearbyPlace);
    setMode("explore");
    setMobilePanelOpen(false);
    setMobileAddOpen(false);
  };

  const goAddMode = () => {
    setMode("add");
    if (!tempPin) setTempPin({ lat: 27.7172, lng: 85.324 });
    setSelectedPlace(null);
    setMobilePanelOpen(false);
    setMobileAddOpen(true);
  };

  const closeAddMode = () => {
    setMode("explore");
    setMobileAddOpen(false);
  };

  const submitNewPlace = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Add place form:", {
      ...form,
      lat: tempPin?.lat,
      lng: tempPin?.lng,
    });

    alert("Place add API later (console.log done).");
  };

  return (
    <div className="exmap-page">
      <Navbar />

      <div className="exmap-body">
        <div className="exmap-mapArea">
          <MapView
            fullHeight
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={(p) => {
              setMode("explore");
              setSelectedPlace(p);
              setMobilePanelOpen(false);
              setMobileAddOpen(false);
            }}
            onMapPick={onMapPickLocation}
            tempPin={tempPin}
            setTempPin={(pos) => setTempPin(pos)}
            mode={mode}
            nearbyPlace={nearbyPlace}
            onClickAddPlace={() => goAddMode()}
            onClickViewPlaceDetails={() => viewNearbyDetails()}
          />

          {mode === "explore" && (
            <button
              className="exmap-openSidebar"
              onClick={() => setMobilePanelOpen(true)}
              type="button"
            >
              Open sidebar
            </button>
          )}

          <button className="exmap-fab" onClick={goAddMode} type="button">
            <span className="fab-text">Add place</span>
            <span className="fab-plus">+</span>
          </button>

          {mode === "explore" && (
            <div className={`exmap-leftOverlay ${mobilePanelOpen ? "open" : ""}`}>
              <div className="exmap-drawerHeader">
                <div className="exmap-drawerTitle">Explore</div>
                <button
                  className="exmap-drawerClose"
                  onClick={() => setMobilePanelOpen(false)}
                  type="button"
                >
                  ✕
                </button>
              </div>

              <MapSearchPanel
                query={query}
                setQuery={setQuery}
                results={filteredPlaces}
                selectedPlaceId={selectedPlace?.id || null}
                onPick={(p) => {
                  setSelectedPlace(p);
                  setMobilePanelOpen(false);
                }}
              />
            </div>
          )}

          {mode === "explore" && selectedPlace && (
            <div className="exmap-details">
              {selectedPlace.image && (
                <div className="exmap-detailsImageWrap">
                  <img
                    className="exmap-detailsImage"
                    src={selectedPlace.image}
                    alt={selectedPlace.name}
                  />
                </div>
              )}

              <div className="exmap-detailsContent">
                <div className="exmap-detailsTop">
                  <div>
                    <div className="exmap-detailsTitle">{selectedPlace.name}</div>

                    {selectedPlace.category && (
                      <div className="exmap-detailsTag">{selectedPlace.category}</div>
                    )}
                  </div>

                  <button
                    className="exmap-detailsClose"
                    onClick={closeDetails}
                    type="button"
                  >
                    ✕
                  </button>
                </div>

                {selectedPlace.description && (
                  <p className="exmap-detailsDesc">{selectedPlace.description}</p>
                )}

                <div className="exmap-coords">
                  <div>
                    <b>Latitude:</b> {selectedPlace.lat.toFixed(6)}
                  </div>
                  <div>
                    <b>Longitude:</b> {selectedPlace.lng.toFixed(6)}
                  </div>
                </div>

                <button
                  className="exmap-detailsBtn"
                  onClick={() => alert("Full details page later")}
                  type="button"
                >
                  View Full Details
                </button>
              </div>
            </div>
          )}

          {mode === "add" && (
            <div className={`exmap-addPanel ${mobileAddOpen ? "open" : ""}`}>
              <div className="exmap-addHeader">
                <div>
                  <div className="exmap-addTitle">Add a new place</div>
                  <div className="exmap-addSub">
                    Drag the pin on the map to set exact location.
                  </div>
                </div>

                <button
                  className="exmap-addClose"
                  onClick={closeAddMode}
                  type="button"
                >
                  ✕
                </button>
              </div>

              <form className="exmap-addForm" onSubmit={submitNewPlace}>
                <label className="exmap-label">
                  Place name
                  <input
                    className="exmap-input"
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Eg: Swayambhunath View Point"
                  />
                </label>

                <label className="exmap-label">
                  Address
                  <input
                    className="exmap-input"
                    value={form.address}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, address: e.target.value }))
                    }
                    placeholder="Eg: Kathmandu, Nepal"
                  />
                </label>

                <label className="exmap-label">
                  Photos (URLs)
                  <input
                    className="exmap-input"
                    value={form.photos}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, photos: e.target.value }))
                    }
                    placeholder="Paste image URLs separated by comma"
                  />
                </label>

                <label className="exmap-label">
                  Description
                  <textarea
                    className="exmap-textarea"
                    value={form.description}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, description: e.target.value }))
                    }
                    placeholder="Why is this place special? hidden gem story..."
                    rows={4}
                  />
                </label>

                <div className="exmap-latlngRow">
                  <div className="exmap-latlngBox">
                    <div className="exmap-latlngLabel">Latitude</div>
                    <input
                      className="exmap-input"
                      value={tempPin ? tempPin.lat.toFixed(6) : ""}
                      readOnly
                    />
                  </div>

                  <div className="exmap-latlngBox">
                    <div className="exmap-latlngLabel">Longitude</div>
                    <input
                      className="exmap-input"
                      value={tempPin ? tempPin.lng.toFixed(6) : ""}
                      readOnly
                    />
                  </div>
                </div>

                <button className="exmap-addBtn" type="submit">
                  Add Place
                </button>

                <div className="exmap-addHint">
                  This form is UI only. Connect backend API later.
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
