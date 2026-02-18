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

      <div className="exmap-mapArea">
        <MapView
          fullHeight
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onSelectPlace={(p) => setSelectedPlace(p)}
        />

        {/* LEFT PANEL */}
        <div className="exmap-leftOverlay">
          <MapSearchPanel
            query={query}
            setQuery={setQuery}
            results={filteredPlaces}
            selectedPlaceId={selectedPlace?.id || null}
            onPick={(p) => setSelectedPlace(p)}
          />
        </div>

        {/* RIGHT DETAILS */}
        {selectedPlace && (
          <div className="exmap-details">
            {selectedPlace.image && (
              <img
                className="exmap-detailsImage"
                src={selectedPlace.image}
                alt={selectedPlace.name}
              />
            )}

            <div className="exmap-detailsContent">
              <div className="exmap-detailsTop">
                <h3>{selectedPlace.name}</h3>
                <button onClick={closeDetails}>✕</button>
              </div>

              <p>{selectedPlace.description}</p>

              <div className="coords">
                <b>Lat:</b> {selectedPlace.lat.toFixed(6)} <br />
                <b>Lng:</b> {selectedPlace.lng.toFixed(6)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
