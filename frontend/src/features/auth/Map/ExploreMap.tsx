/* ExploreMap.tsx */

import { useMemo, useRef, useState } from "react";
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
    description: "",
  });

  // --- IMAGE UPLOAD STUFF STARTS HERE ---
  // uploadedImages = list of image preview URLs (from user's device)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  // activeSlide = which image is currently showing in the slideshow
  const [activeSlide, setActiveSlide] = useState(0);
  // fileInputRef = hidden file input, we click it when user clicks upload button
  const fileInputRef = useRef<HTMLInputElement>(null);
  // MAX 20 images allowed
  const MAX_IMAGES = 20;

  // when user picks files from their device
  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - uploadedImages.length;
    if (remaining <= 0) return;

    // only take as many as we still have space for
    const toProcess = Array.from(files).slice(0, remaining);

    toProcess.forEach((file) => {
      // convert file to base64 URL so we can show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImages((prev) => {
          if (prev.length >= MAX_IMAGES) return prev;
          return [...prev, result];
        });
      };
      reader.readAsDataURL(file);
    });

    // after adding, go to the last slide so user sees new image
    setActiveSlide(Math.max(0, uploadedImages.length));
  };

  // drag and drop: when user drops image files onto the upload box
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleImageFiles(e.dataTransfer.files);
  };

  // remove one image from the list by its index
  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    // if we removed the last slide, go back one
    setActiveSlide((prev) => Math.max(0, Math.min(prev, uploadedImages.length - 2)));
  };

  // go to previous slide
  const prevSlide = () =>
    setActiveSlide((prev) => (prev === 0 ? uploadedImages.length - 1 : prev - 1));

  // go to next slide
  const nextSlide = () =>
    setActiveSlide((prev) => (prev === uploadedImages.length - 1 ? 0 : prev + 1));
  // --- IMAGE UPLOAD STUFF ENDS HERE ---

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
      images: uploadedImages, // send uploaded images to backend later
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

                {/* ======= IMAGE UPLOAD SECTION (new) ======= */}
                <div className="exmap-label">
                  Photos
                  <div className="exmap-imgCount">
                    {uploadedImages.length}/{MAX_IMAGES} images added
                  </div>

                  {/* --- SLIDESHOW: shows when at least 1 image is uploaded --- */}
                  {uploadedImages.length > 0 && (
                    <div className="exmap-slideshow">
                      {/* big preview of current image */}
                      <div className="exmap-slideMain">
                        <img
                          src={uploadedImages[activeSlide]}
                          alt={`Preview ${activeSlide + 1}`}
                          className="exmap-slideImg"
                        />

                        {/* left / right arrows — only show if more than 1 image */}
                        {uploadedImages.length > 1 && (
                          <>
                            <button
                              className="exmap-slideArrow exmap-slideArrow--left"
                              onClick={prevSlide}
                              type="button"
                            >
                              ‹
                            </button>
                            <button
                              className="exmap-slideArrow exmap-slideArrow--right"
                              onClick={nextSlide}
                              type="button"
                            >
                              ›
                            </button>
                          </>
                        )}

                        {/* image counter badge eg: 2 / 5 */}
                        <div className="exmap-slideBadge">
                          {activeSlide + 1} / {uploadedImages.length}
                        </div>

                        {/* remove current image button */}
                        <button
                          className="exmap-slideRemove"
                          onClick={() => removeImage(activeSlide)}
                          type="button"
                          title="Remove this image"
                        >
                          ✕
                        </button>
                      </div>

                      {/* small thumbnail strip below the big image */}
                      <div className="exmap-thumbStrip">
                        {uploadedImages.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`exmap-thumb ${i === activeSlide ? "active" : ""}`}
                            onClick={() => setActiveSlide(i)}
                          >
                            <img src={img} alt={`thumb ${i + 1}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* --- UPLOAD BOX: drag & drop or click to pick files --- */}
                  {uploadedImages.length < MAX_IMAGES && (
                    <div
                      className="exmap-uploadBox"
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()} // needed to allow drop
                      onClick={() => fileInputRef.current?.click()} // click box = open file picker
                    >
                      <div className="exmap-uploadIcon">🖼️</div>
                      <div className="exmap-uploadText">
                        Click or drag & drop images here
                      </div>
                      <div className="exmap-uploadSub">
                        JPG, PNG, WEBP · Max {MAX_IMAGES} images
                      </div>

                      {/* hidden file input — accepts multiple images */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={(e) => handleImageFiles(e.target.files)}
                      />
                    </div>
                  )}
                </div>
                {/* ======= IMAGE UPLOAD SECTION ENDS ======= */}

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