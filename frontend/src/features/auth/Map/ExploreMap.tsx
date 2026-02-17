import { useMemo, useState } from "react";
import Navbar from "../Components/Layout/Navbar/Navbar";
import Footer from "../Components/Layout/Footer/Footer";

import MapView from "./MapView";
import type { Place } from "./Type";

import MapSearchPanel from "../Components/MapComponents/MapSearchPanel";
import "./ExploreMap.css";

// ✅ Demo static places
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
  {
    id: "4",
    name: "Swayambhunath",
    lat: 27.7149,
    lng: 85.2903,
    category: "Temple",
    description: "Monkey Temple. Great view of Kathmandu valley.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/7/71/Swayambhunath_Stupa_2018.jpg",
  },
];

export default function ExploreMap() {
  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

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

  return (
    <div className="exmap-page">
      <Navbar />

      {/* ✅ flex layout: navbar/footer height hardcode नगर्ने */}
      <div className="exmap-body">
        {/* LEFT PANEL */}
        <MapSearchPanel
          query={query}
          setQuery={setQuery}
          results={filteredPlaces}
          selectedPlaceId={selectedPlace?.id || null}
          onPick={(p) => setSelectedPlace(p)}
        />

        {/* MAP AREA */}
        <div className="exmap-mapArea">
          <MapView
            fullHeight
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={(p) => setSelectedPlace(p)}
          />

          {/* DETAILS (RIGHT CARD) — ❌ नथिचेसम्म बन्द हुँदैन */}
          {selectedPlace && (
            <div className="exmap-details" role="dialog" aria-modal="false">
              {selectedPlace.image ? (
                <div className="exmap-detailsImageWrap">
                  <img
                    className="exmap-detailsImage"
                    src={selectedPlace.image}
                    alt={selectedPlace.name}
                  />
                </div>
              ) : null}

              <div className="exmap-detailsContent">
                <div className="exmap-detailsTop">
                  <div>
                    <div className="exmap-detailsTitle">
                      {selectedPlace.name}
                    </div>

                    {selectedPlace.category ? (
                      <div className="exmap-detailsTag">
                        {selectedPlace.category}
                      </div>
                    ) : null}
                  </div>

                  <button
                    className="exmap-detailsClose"
                    onClick={closeDetails}
                    aria-label="Close"
                    title="Close"
                    type="button"
                  >
                    ✕
                  </button>
                </div>

                {selectedPlace.description ? (
                  <p className="exmap-detailsDesc">{selectedPlace.description}</p>
                ) : null}

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
                  type="button"
                  onClick={() => alert("Later we will open full details page ✅")}
                >
                  View Full Details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
