/* ExploreMap.tsx */
// KEY CHANGES from previous version:
// 1. DEMO_PLACES removed — real data from backend (approved places only)
// 2. useEffect on mount to fetch /places from backend via axiosInstance
// 3. Add place form: minimize/maximize button added
// 4. Clicking list place now passes zoomTarget to MapView (zoom closer)
// 5. View Full Details → navigate to /place/:id (new detail page)
// 6. axiosInstance path corrected for this folder depth

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Layout/Navbar/Navbar";
import MapView from "./MapView";
import type { Place } from "./Type";
import MapSearchPanel from "../Components/MapComponents/MapSearchPanel";
import axiosInstance from "../../../shared/config/axiosinstance";
import "./ExploreMap.css";

type Mode = "explore" | "add";
type LatLng = { lat: number; lng: number };

function distanceMeters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function ExploreMap() {
  const navigate = useNavigate();

  // ── REAL DATA FROM BACKEND ──────────────────────────────────────
  // Replaces DEMO_PLACES. Fetches only approved places.
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);

  useEffect(() => {
    // GET /api/places — public endpoint, returns approved places only
    axiosInstance.get("/places")
      .then((res) => {
        if (res.data.success) {
          // Backend returns numbers for id, lat, lng — normalize them
          const normalized: Place[] = res.data.data.map((p: any) => ({
            ...p,
            id: String(p.id),
            lat: typeof p.lat === "string" ? parseFloat(p.lat) : p.lat,
            lng: typeof p.lng === "string" ? parseFloat(p.lng) : p.lng,
            // image path comes as "/uploads/xxx.jpg" — prepend server URL
            image: p.image ? `http://localhost:5001${p.image}` : undefined,
          }));
          setPlaces(normalized);
        }
      })
      .catch((err) => {
        console.error("Failed to load places:", err);
        // Don't crash — just show empty map
      })
      .finally(() => setPlacesLoading(false));
  }, []);

  const [mode, setMode] = useState<Mode>("explore");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [mobileAddOpen, setMobileAddOpen] = useState(false);

  // ── MINIMIZE/MAXIMIZE add panel ────────────────────────────────
  const [addPanelMinimized, setAddPanelMinimized] = useState(false);

  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // zoomTarget: when list item clicked, fly map to this place at zoom 15
  const [zoomTarget, setZoomTarget] = useState<Place | null>(null);

  const [tempPin, setTempPin] = useState<LatLng | null>(null);
  const [nearbyPlace, setNearbyPlace] = useState<Place | null>(null);

  const [form, setForm] = useState({
    name: "", address: "", description: "", category: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{
    type: "success" | "error"; text: string;
  } | null>(null);

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 20;
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - uploadedImages.length;
    if (remaining <= 0) return;
    const toProcess = Array.from(files).slice(0, remaining);
    setImageFiles((prev) => [...prev, ...toProcess].slice(0, MAX_IMAGES));
    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImages((prev) =>
          prev.length >= MAX_IMAGES ? prev : [...prev, result]
        );
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
    setActiveSlide((prev) =>
      Math.max(0, Math.min(prev, uploadedImages.length - 2))
    );
  };

  const prevSlide = () =>
    setActiveSlide((prev) =>
      prev === 0 ? uploadedImages.length - 1 : prev - 1
    );

  const nextSlide = () =>
    setActiveSlide((prev) =>
      prev === uploadedImages.length - 1 ? 0 : prev + 1
    );

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places;
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q)
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
      if (d < bestDist) { bestDist = d; best = p; }
    }
    setNearbyPlace(best && bestDist <= THRESHOLD_METERS ? best : null);
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
    setSubmitMsg(null);
    setAddPanelMinimized(false);
  };

  const closeAddMode = () => {
    setMode("explore");
    setMobileAddOpen(false);
    setSubmitMsg(null);
    setAddPanelMinimized(false);
  };

  // ── VIEW FULL DETAILS ───────────────────────────────────────────
  // Navigate to /place/:id — PlaceDetail page (Komoot style)
  const viewFullDetails = (place: Place) => {
    navigate(`/place/${place.id}`);
  };

  // ── SUBMIT PLACE TO BACKEND ─────────────────────────────────────
  const submitNewPlace = async (e: React.FormEvent) => {
    e.preventDefault();
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

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("address", form.address.trim());
    fd.append("description", form.description.trim());
    fd.append("category", form.category);
    fd.append("lat", tempPin.lat.toString());
    fd.append("lng", tempPin.lng.toString());
    if (imageFiles.length > 0) fd.append("image", imageFiles[0]);

    try {
      const res = await axiosInstance.post("/places", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setSubmitMsg({
          type: "success",
          text: "✅ Place submitted! It will appear on the map after admin review.",
        });
        setForm({ name: "", address: "", description: "", category: "" });
        setUploadedImages([]); setImageFiles([]); setActiveSlide(0); setTempPin(null);
        setTimeout(() => closeAddMode(), 3000);
      } else {
        setSubmitMsg({ type: "error", text: res.data.message || "Failed to submit." });
      }
    } catch (err: any) {
      setSubmitMsg({
        type: "error",
        text: err?.response?.data?.message || "Something went wrong. Try again.",
      });
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
            zoomTarget={zoomTarget}             // ← fly map to this place
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

          {/* ── EXPLORE SIDEBAR ── */}
          {mode === "explore" && (
            <div className={`exmap-leftOverlay ${mobilePanelOpen ? "open" : ""}`}>
              <div className="exmap-drawerHeader">
                <div className="exmap-drawerTitle">Explore</div>
                <button
                  className="exmap-drawerClose"
                  onClick={() => setMobilePanelOpen(false)}
                  type="button"
                >✕</button>
              </div>

              {/* Loading state */}
              {placesLoading && (
                <div className="exmap-placesLoading">
                  <div className="exmap-loadingDot" />
                  <div className="exmap-loadingDot" />
                  <div className="exmap-loadingDot" />
                </div>
              )}

              <MapSearchPanel
                query={query}
                setQuery={setQuery}
                results={filteredPlaces}
                selectedPlaceId={selectedPlace?.id || null}
                onPick={(p) => {
                  setSelectedPlace(p);
                  setZoomTarget(p);       // ← zoom map to this place
                  setMobilePanelOpen(false);
                }}
              />
            </div>
          )}

          {/* ── PLACE DETAILS CARD ── */}
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
                  <button className="exmap-detailsClose" onClick={closeDetails} type="button">✕</button>
                </div>
                {selectedPlace.description && (
                  <p className="exmap-detailsDesc">{selectedPlace.description}</p>
                )}
                <div className="exmap-coords">
                  <div><b>Latitude:</b> {selectedPlace.lat.toFixed(6)}</div>
                  <div><b>Longitude:</b> {selectedPlace.lng.toFixed(6)}</div>
                </div>
                {/* Navigate to full detail page */}
                <button
                  className="exmap-detailsBtn"
                  onClick={() => viewFullDetails(selectedPlace)}
                  type="button"
                >
                  View Full Details →
                </button>
              </div>
            </div>
          )}

          {/* ── ADD PLACE PANEL ── */}
          {mode === "add" && (
            <div className={`exmap-addPanel ${mobileAddOpen ? "open" : ""} ${addPanelMinimized ? "minimized" : ""}`}>

              {/* Header always visible — has minimize/maximize button */}
              <div className="exmap-addHeader">
                <div>
                  <div className="exmap-addTitle">Add a new place</div>
                  {!addPanelMinimized && (
                    <div className="exmap-addSub">Drag the pin on the map to set exact location.</div>
                  )}
                </div>
                <div className="exmap-addHeaderBtns">
                  {/* Minimize / Maximize button */}
                  <button
                    className="exmap-minimizeBtn"
                    onClick={() => setAddPanelMinimized((v) => !v)}
                    type="button"
                    title={addPanelMinimized ? "Expand" : "Minimize"}
                  >
                    {addPanelMinimized ? "▲" : "▼"}
                  </button>
                  {/* Close button */}
                  <button className="exmap-addClose" onClick={closeAddMode} type="button">✕</button>
                </div>
              </div>

              {/* Form — hidden when minimized */}
              {!addPanelMinimized && (
                <form className="exmap-addForm" onSubmit={submitNewPlace}>

                  {submitMsg && (
                    <div className={`exmap-submitMsg exmap-submitMsg--${submitMsg.type}`}>
                      {submitMsg.text}
                    </div>
                  )}

                  <label className="exmap-label">
                    Place name
                    <input className="exmap-input" value={form.name}
                      onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                      placeholder="Eg: Swayambhunath View Point" />
                  </label>

                  <label className="exmap-label">
                    Address
                    <input className="exmap-input" value={form.address}
                      onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                      placeholder="Eg: Kathmandu, Nepal" />
                  </label>

                  <label className="exmap-label">
                    Category
                    <select className="exmap-input" value={form.category}
                      onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}>
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

                  {/* Image upload — unchanged */}
                  <div className="exmap-label">
                    Photos
                    <div className="exmap-imgCount">{uploadedImages.length}/{MAX_IMAGES} images added</div>

                    {uploadedImages.length > 0 && (
                      <div className="exmap-slideshow">
                        <div className="exmap-slideMain">
                          <img src={uploadedImages[activeSlide]} alt={`Preview ${activeSlide + 1}`} className="exmap-slideImg" />
                          {uploadedImages.length > 1 && (
                            <>
                              <button className="exmap-slideArrow exmap-slideArrow--left" onClick={prevSlide} type="button">‹</button>
                              <button className="exmap-slideArrow exmap-slideArrow--right" onClick={nextSlide} type="button">›</button>
                            </>
                          )}
                          <div className="exmap-slideBadge">{activeSlide + 1} / {uploadedImages.length}</div>
                          <button className="exmap-slideRemove" onClick={() => removeImage(activeSlide)} type="button" title="Remove">✕</button>
                        </div>
                        <div className="exmap-thumbStrip">
                          {uploadedImages.map((img, i) => (
                            <button key={i} type="button"
                              className={`exmap-thumb ${i === activeSlide ? "active" : ""}`}
                              onClick={() => setActiveSlide(i)}>
                              <img src={img} alt={`thumb ${i + 1}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {uploadedImages.length < MAX_IMAGES && (
                      <div className="exmap-uploadBox"
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}>
                        <div className="exmap-uploadIcon">🖼️</div>
                        <div className="exmap-uploadText">Click or drag & drop images here</div>
                        <div className="exmap-uploadSub">JPG, PNG, WEBP · Max {MAX_IMAGES} images</div>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                          onChange={(e) => handleImageFiles(e.target.files)} />
                      </div>
                    )}
                  </div>

                  <label className="exmap-label">
                    Description
                    <textarea className="exmap-textarea" value={form.description}
                      onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                      placeholder="Why is this place special? hidden gem story..."
                      rows={4} />
                  </label>

                  <div className="exmap-latlngRow">
                    <div className="exmap-latlngBox">
                      <div className="exmap-latlngLabel">Latitude</div>
                      <input className="exmap-input" value={tempPin ? tempPin.lat.toFixed(6) : ""} readOnly />
                    </div>
                    <div className="exmap-latlngBox">
                      <div className="exmap-latlngLabel">Longitude</div>
                      <input className="exmap-input" value={tempPin ? tempPin.lng.toFixed(6) : ""} readOnly />
                    </div>
                  </div>

                  <button className="exmap-addBtn" type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Place"}
                  </button>

                  <div className="exmap-addHint">
                    Your place will be reviewed by admin before appearing on the map.
                  </div>

                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
