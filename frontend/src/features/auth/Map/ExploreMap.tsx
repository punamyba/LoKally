/* ExploreMap.tsx */
// CHANGES FROM ORIGINAL:
// 1. axiosInstance import added (line ~10)
// 2. submitNewPlace function updated — real API call instead of alert()
// 3. category field added to form state + form UI
// Everything else is exactly the same as before.

import { useMemo, useRef, useState } from "react";
import Navbar from "../Components/Layout/Navbar/Navbar";
import MapView from "./MapView";
import type { Place } from "./Type";
import MapSearchPanel from "../Components/MapComponents/MapSearchPanel";

// ── CHANGE 1: Import axiosInstance ──────────────────────────────
// axiosInstance already has baseURL + JWT token auto-attached
import axiosInstance from "../../../shared/config/axiosinstance";

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

  // ── CHANGE 2: category field added to form ──────────────────────
  const [form, setForm] = useState({
    name: "",
    address: "",
    description: "",
    category: "",  // ← new field
  });

  // Submission state — show loading + success/error message to user
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Image upload state (unchanged from original)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 20;

  // Track actual File objects separately (needed for FormData upload)
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - uploadedImages.length;
    if (remaining <= 0) return;

    const toProcess = Array.from(files).slice(0, remaining);

    // Save actual File objects for upload
    setImageFiles((prev) => [...prev, ...toProcess].slice(0, MAX_IMAGES));

    toProcess.forEach((file) => {
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

    setActiveSlide(Math.max(0, uploadedImages.length));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleImageFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setActiveSlide((prev) => Math.max(0, Math.min(prev, uploadedImages.length - 2)));
  };

  const prevSlide = () =>
    setActiveSlide((prev) => (prev === 0 ? uploadedImages.length - 1 : prev - 1));

  const nextSlide = () =>
    setActiveSlide((prev) => (prev === uploadedImages.length - 1 ? 0 : prev + 1));

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
    setSubmitMsg(null); // clear any old message
  };

  const closeAddMode = () => {
    setMode("explore");
    setMobileAddOpen(false);
    setSubmitMsg(null);
  };

  // ── CHANGE 3: Real API submit ───────────────────────────────────
  // Sends place data to backend as FormData (supports image upload).
  // Backend saves it with status = "pending" — admin reviews it later.
  // User does NOT need to be logged in concept-wise, but JWT token
  // is auto-attached by axiosInstance if they are logged in.
  const submitNewPlace = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!form.name.trim() || !form.address.trim()) {
      setSubmitMsg({ type: "error", text: "Place name and address are required!" });
      return;
    }
    if (!tempPin) {
      setSubmitMsg({ type: "error", text: "Please pick a location on the map first!" });
      return;
    }

    setSubmitting(true);
    setSubmitMsg(null);

    // Use FormData because we're sending image files
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("address", form.address.trim());
    fd.append("description", form.description.trim());
    fd.append("category", form.category);
    fd.append("lat", tempPin.lat.toString());
    fd.append("lng", tempPin.lng.toString());

    // Attach first image if user uploaded any
    // (backend currently supports 1 image — extend later if needed)
    if (imageFiles.length > 0) {
      fd.append("image", imageFiles[0]);
    }

    try {
      const res = await axiosInstance.post("/places", fd, {
        // Override Content-Type so axios sets multipart boundary correctly
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        // Success! Reset form
        setSubmitMsg({
          type: "success",
          text: "✅ Place submitted! It will appear on the map after admin review.",
        });
        setForm({ name: "", address: "", description: "", category: "" });
        setUploadedImages([]);
        setImageFiles([]);
        setActiveSlide(0);
        setTempPin(null);

        // Auto-close panel after 3 seconds
        setTimeout(() => {
          closeAddMode();
        }, 3000);
      } else {
        setSubmitMsg({ type: "error", text: res.data.message || "Failed to submit. Try again." });
      }
    } catch (err: any) {
      // Network error or server error
      const msg = err?.response?.data?.message || "Something went wrong. Try again.";
      setSubmitMsg({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
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
                  <div><b>Latitude:</b> {selectedPlace.lat.toFixed(6)}</div>
                  <div><b>Longitude:</b> {selectedPlace.lng.toFixed(6)}</div>
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

                {/* ── Success / Error message ── */}
                {submitMsg && (
                  <div
                    className={`exmap-submitMsg ${
                      submitMsg.type === "success"
                        ? "exmap-submitMsg--success"
                        : "exmap-submitMsg--error"
                    }`}
                  >
                    {submitMsg.text}
                  </div>
                )}

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
                    onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                    placeholder="Eg: Kathmandu, Nepal"
                  />
                </label>

                {/* ── CHANGE: Category dropdown added ── */}
                <label className="exmap-label">
                  Category
                  <select
                    className="exmap-input"
                    value={form.category}
                    onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                  >
                    <option value="">Select category (optional)</option>
                    <option value="Nature">Nature</option>
                    <option value="Heritage">Heritage</option>
                    <option value="Temple">Temple</option>
                    <option value="Lake">Lake</option>
                    <option value="Viewpoint">Viewpoint</option>
                    <option value="Hidden Gem">Hidden Gem</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Food">Food</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                {/* Image upload section — unchanged from original */}
                <div className="exmap-label">
                  Photos
                  <div className="exmap-imgCount">
                    {uploadedImages.length}/{MAX_IMAGES} images added
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="exmap-slideshow">
                      <div className="exmap-slideMain">
                        <img
                          src={uploadedImages[activeSlide]}
                          alt={`Preview ${activeSlide + 1}`}
                          className="exmap-slideImg"
                        />

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

                        <div className="exmap-slideBadge">
                          {activeSlide + 1} / {uploadedImages.length}
                        </div>

                        <button
                          className="exmap-slideRemove"
                          onClick={() => removeImage(activeSlide)}
                          type="button"
                          title="Remove this image"
                        >
                          ✕
                        </button>
                      </div>

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

                  {uploadedImages.length < MAX_IMAGES && (
                    <div
                      className="exmap-uploadBox"
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="exmap-uploadIcon">🖼️</div>
                      <div className="exmap-uploadText">
                        Click or drag & drop images here
                      </div>
                      <div className="exmap-uploadSub">
                        JPG, PNG, WEBP · Max {MAX_IMAGES} images
                      </div>
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

                <button
                  className="exmap-addBtn"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Place"}
                </button>

                <div className="exmap-addHint">
                  Your place will be reviewed by admin before appearing on the map.
                </div>

              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}