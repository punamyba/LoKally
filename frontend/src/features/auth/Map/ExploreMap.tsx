

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Layout/Navbar/Navbar";
import MapView from "./MapView";
import type { Place } from "./Type";
import MapSearchPanel from "../Components/MapComponents/MapSearchPanel";
import axiosInstance from "../../../shared/config/axiosinstance";
import {
  MapPin, Upload, X, Plus, Images, CheckCircle,
  ChevronLeft, ChevronRight, Navigation, Search,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import "./ExploreMap.css";

type Mode = "explore" | "add";
type LatLng = { lat: number; lng: number };

function distanceMeters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

const SERVER = "http://localhost:5001";

const parseImages = (img: any): string[] => {
  if (!img) return [];
  if (Array.isArray(img)) return img;
  if (typeof img === "string") {
    const t = img.trim();
    if (t.startsWith("[")) { try { const a = JSON.parse(t); if (Array.isArray(a)) return a; } catch {} }
    return [img];
  }
  return [];
};

const toFullUrl = (path: string) => path.startsWith("http") ? path : `${SERVER}${path}`;

const CATEGORIES = [
  "Nature", "Heritage", "Temple", "Lake", "Viewpoint",
  "Hidden Gem", "Adventure", "Cultural", "Food", "Other",
];

const MAX_IMAGES = 20;

export default function ExploreMap() {
  const navigate = useNavigate();
  const location = useLocation();

  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  useEffect(() => {
    axiosInstance.get("/places").then((res) => {
      if (res.data?.success) {
        const normalized: Place[] = (res.data.data || []).map((p: any) => {
          const imgs = parseImages(p.image).map(toFullUrl);
          return {
            ...p, id: String(p.id),
            lat: typeof p.lat === "string" ? parseFloat(p.lat) : p.lat,
            lng: typeof p.lng === "string" ? parseFloat(p.lng) : p.lng,
            image: imgs[0] || undefined,
          };
        });
        setPlaces(normalized);
      } else setPlaces([]);
    }).catch(() => setPlaces([]))
      .finally(() => setPlacesLoading(false));
  }, []);

  // Read ?category= from URL (from Home page category click)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category") || "";
    setCategoryFilter(cat);
  }, [location.search]);

  const [mode, setMode] = useState<Mode>("explore");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [mobileAddOpen, setMobileAddOpen] = useState(false);
  const [addPanelMinimized, setAddPanelMinimized] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [zoomTarget, setZoomTarget] = useState<Place | null>(null);
  const [tempPin, setTempPin] = useState<LatLng | null>(null);
  const [nearbyPlace, setNearbyPlace] = useState<Place | null>(null);

  const [form, setForm] = useState({ name: "", address: "", description: "", category: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - imageFiles.length;
    const toProcess = Array.from(files).slice(0, remaining);
    setImageFiles(prev => [...prev, ...toProcess].slice(0, MAX_IMAGES));
    toProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => setUploadedImages(prev => prev.length >= MAX_IMAGES ? prev : [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
    setActiveSlide(Math.max(0, uploadedImages.length));
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); handleImageFiles(e.dataTransfer.files); };
  const removeImage = (i: number) => {
    setUploadedImages(prev => prev.filter((_, j) => j !== i));
    setImageFiles(prev => prev.filter((_, j) => j !== i));
    setActiveSlide(prev => Math.max(0, Math.min(prev, uploadedImages.length - 2)));
  };

  const filteredPlaces = useMemo(() => {
    let result = places;
    // Filter by category (from Home page URL param)
    if (categoryFilter) {
      result = result.filter(p => (p.category || "").toLowerCase() === categoryFilter.toLowerCase());
    }
    // Filter by search query
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [places, query, categoryFilter]);

  const onMapPickLocation = (pos: LatLng) => {
    setSelectedPlace(null); setTempPin(pos);
    let best: Place | null = null, bestDist = Infinity;
    for (const p of places) {
      const d = distanceMeters(pos, { lat: p.lat, lng: p.lng });
      if (d < bestDist) { bestDist = d; best = p; }
    }
    setNearbyPlace(best && bestDist <= 120 ? best : null);
  };

  const goAddMode = () => {
    setMode("add");
    if (!tempPin) setTempPin({ lat: 27.7172, lng: 85.324 });
    setSelectedPlace(null); setMobilePanelOpen(false);
    setMobileAddOpen(true); setSubmitMsg(null); setAddPanelMinimized(false);
  };

  const closeAddMode = () => {
    setMode("explore"); setMobileAddOpen(false);
    setSubmitMsg(null); setAddPanelMinimized(false);
  };

  const submitNewPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      setSubmitMsg({ type: "error", text: "Place name and address are required!" }); return;
    }
    if (!tempPin) { setSubmitMsg({ type: "error", text: "Please pick a location on the map!" }); return; }

    setSubmitting(true); setSubmitMsg(null);
    const fd = new FormData();
    fd.append("name", form.name.trim()); fd.append("address", form.address.trim());
    fd.append("description", form.description.trim()); fd.append("category", form.category);
    fd.append("lat", tempPin.lat.toString()); fd.append("lng", tempPin.lng.toString());
    imageFiles.forEach(file => fd.append("images", file));

    try {
      const res = await axiosInstance.post("/places", fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (res.data?.success) {
        setSubmitMsg({ type: "success", text: "Place submitted! Admin review paछi map ma dekhauxa." });
        setForm({ name: "", address: "", description: "", category: "" });
        setUploadedImages([]); setImageFiles([]); setActiveSlide(0); setTempPin(null);
        setTimeout(() => closeAddMode(), 3000);
      } else setSubmitMsg({ type: "error", text: res.data?.message || "Failed to submit." });
    } catch (err: any) {
      setSubmitMsg({ type: "error", text: err?.response?.data?.message || "Something went wrong." });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="exmap-page">
      <Navbar />
      <div className="exmap-body">
        <div className="exmap-mapArea">
          <MapView
            fullHeight places={filteredPlaces} selectedPlace={selectedPlace}
            zoomTarget={zoomTarget}
            onSelectPlace={p => { setMode("explore"); setSelectedPlace(p); setMobilePanelOpen(false); setMobileAddOpen(false); }}
            onMapPick={onMapPickLocation} tempPin={tempPin}
            setTempPin={pos => setTempPin(pos)} mode={mode}
            nearbyPlace={nearbyPlace}
            onClickAddPlace={() => goAddMode()}
            onClickViewPlaceDetails={() => { if (nearbyPlace) { setSelectedPlace(nearbyPlace); setMode("explore"); } }}
          />

          {mode === "explore" && (
            <button className="exmap-openSidebar" onClick={() => setMobilePanelOpen(true)} type="button">
              <Search size={14} strokeWidth={2.5} /> Explore
            </button>
          )}

          <button className="exmap-fab" onClick={goAddMode} type="button">
            <span className="fab-text"><Plus size={14} strokeWidth={3} /> Add place</span>
            <span className="fab-plus"><Plus size={22} strokeWidth={3} /></span>
          </button>

          {/* ── EXPLORE SIDEBAR ── */}
          {mode === "explore" && (
            <div className={`exmap-leftOverlay ${mobilePanelOpen ? "open" : ""}`}>
              <div className="exmap-drawerHeader">
                <div className="exmap-drawerTitle">Explore</div>
                <button className="exmap-drawerClose" onClick={() => setMobilePanelOpen(false)} type="button">
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
              {/* Category filter banner */}
              {categoryFilter && (
                <div className="exmap-cat-banner">
                  <span>Filtering: <strong>{categoryFilter}</strong></span>
                  <button type="button" className="exmap-cat-clear"
                    onClick={() => { setCategoryFilter(""); navigate("/explore-map", { replace: true }); }}>
                    <X size={12} strokeWidth={3} /> Clear
                  </button>
                </div>
              )}
              {placesLoading && (
                <div className="exmap-placesLoading">
                  <div className="exmap-loadingDot" /><div className="exmap-loadingDot" /><div className="exmap-loadingDot" />
                </div>
              )}
              <MapSearchPanel query={query} setQuery={setQuery} results={filteredPlaces}
                selectedPlaceId={selectedPlace?.id || null}
                onPick={p => { setSelectedPlace(p); setZoomTarget(p); setMobilePanelOpen(false); }} />
            </div>
          )}

          {/* ── PLACE DETAILS CARD ── */}
          {mode === "explore" && selectedPlace && (
            <div className="exmap-details">
              {selectedPlace.image && (
                <div className="exmap-detailsImageWrap">
                  <img className="exmap-detailsImage" src={selectedPlace.image} alt={selectedPlace.name} />
                </div>
              )}
              <div className="exmap-detailsContent">
                <div className="exmap-detailsTop">
                  <div>
                    <div className="exmap-detailsTitle">{selectedPlace.name}</div>
                    {selectedPlace.category && <div className="exmap-detailsTag">{selectedPlace.category}</div>}
                  </div>
                  <button className="exmap-detailsClose" onClick={() => setSelectedPlace(null)} type="button">
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
                {selectedPlace.description && <p className="exmap-detailsDesc">{selectedPlace.description}</p>}
                <div className="exmap-coords">
                  <div><b>Latitude:</b> {selectedPlace.lat.toFixed(6)}</div>
                  <div><b>Longitude:</b> {selectedPlace.lng.toFixed(6)}</div>
                </div>
                <button className="exmap-detailsBtn" onClick={() => navigate(`/place/${selectedPlace.id}`)} type="button">
                  <Navigation size={13} strokeWidth={2.5} /> View Full Details
                </button>
              </div>
            </div>
          )}

          {/* ── ADD PLACE PANEL — Admin-style form ── */}
          {mode === "add" && (
            <div className={`exmap-addPanel ${mobileAddOpen ? "open" : ""} ${addPanelMinimized ? "minimized" : ""}`}>
              <div className="exmap-addHeader">
                <div>
                  <div className="exmap-addTitle">Add a New Place</div>
                  {!addPanelMinimized && (
                    <div className="exmap-addSub">Drag the pin on the map to set location</div>
                  )}
                </div>
                <div className="exmap-addHeaderBtns">
                  <button className="exmap-minimizeBtn" onClick={() => setAddPanelMinimized(v => !v)} type="button">
                    {addPanelMinimized ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <button className="exmap-addClose" onClick={closeAddMode} type="button">
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {!addPanelMinimized && (
                <form className="exmap-addForm" onSubmit={submitNewPlace}>
                  {submitMsg && (
                    <div className={`exmap-submitMsg exmap-submitMsg--${submitMsg.type}`}>
                      {submitMsg.type === "success"
                        ? <CheckCircle size={14} strokeWidth={2.5} />
                        : <X size={14} strokeWidth={2.5} />
                      }
                      {submitMsg.text}
                    </div>
                  )}

                  {/* Name */}
                  <div className="exmap-field">
                    <label className="exmap-fieldLabel">Place Name <span className="exmap-req">*</span></label>
                    <input className="exmap-input" value={form.name}
                      onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                      placeholder="e.g. Phewa Lake" />
                  </div>

                  {/* Address */}
                  <div className="exmap-field">
                    <label className="exmap-fieldLabel">Address <span className="exmap-req">*</span></label>
                    <input className="exmap-input" value={form.address}
                      onChange={e => setForm(s => ({ ...s, address: e.target.value }))}
                      placeholder="e.g. Pokhara, Nepal" />
                  </div>

                  {/* Category */}
                  <div className="exmap-field">
                    <label className="exmap-fieldLabel">Category</label>
                    <select className="exmap-input" value={form.category}
                      onChange={e => setForm(s => ({ ...s, category: e.target.value }))}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="exmap-field">
                    <label className="exmap-fieldLabel">Description</label>
                    <textarea className="exmap-textarea" value={form.description} rows={3}
                      onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
                      placeholder="What makes this place special?" />
                  </div>

                  {/* Photos — admin-style grid */}
                  <div className="exmap-field">
                    <div className="exmap-photoHeader">
                      <label className="exmap-fieldLabel">
                        <Images size={13} strokeWidth={2} /> Photos
                      </label>
                      <span className="exmap-photoCount">{imageFiles.length} / {MAX_IMAGES}</span>
                    </div>

                    {uploadedImages.length > 0 ? (
                      <div className="exmap-photosGrid">
                        {uploadedImages.map((src, i) => (
                          <div key={i} className={`exmap-photoThumb ${i === 0 ? "exmap-photoThumb--primary" : ""}`}>
                            <img src={src} alt="" />
                            {i === 0 && <span className="exmap-photoCoverTag">Cover</span>}
                            <button type="button" className="exmap-photoRemove" onClick={() => removeImage(i)}>
                              <X size={10} strokeWidth={3} />
                            </button>
                          </div>
                        ))}
                        {imageFiles.length < MAX_IMAGES && (
                          <div className="exmap-photoAddMore" onClick={() => fileInputRef.current?.click()}>
                            <Plus size={18} strokeWidth={2} />
                            <span>Add</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="exmap-uploadBox" onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
                        <Upload size={22} strokeWidth={1.5} className="exmap-uploadIcon" />
                        <div className="exmap-uploadText">Click or drag to upload photos</div>
                        <div className="exmap-uploadSub">Up to {MAX_IMAGES} · JPG, PNG, WEBP</div>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                      onChange={e => handleImageFiles(e.target.files)} />
                  </div>

                  {/* Coordinates */}
                  <div className="exmap-coordsRow">
                    <div className="exmap-field">
                      <label className="exmap-fieldLabel">Latitude</label>
                      <input className="exmap-input exmap-input--readonly" value={tempPin ? tempPin.lat.toFixed(6) : ""} readOnly />
                    </div>
                    <div className="exmap-field">
                      <label className="exmap-fieldLabel">Longitude</label>
                      <input className="exmap-input exmap-input--readonly" value={tempPin ? tempPin.lng.toFixed(6) : ""} readOnly />
                    </div>
                  </div>

                  <div className="exmap-mapHint">
                    <MapPin size={12} strokeWidth={2} /> Click on the map or drag the pin to set location
                  </div>

                  <button className="exmap-submitBtn" type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : <><CheckCircle size={15} strokeWidth={2.5} /> Submit Place</>}
                  </button>
                  <div className="exmap-addHint">Your place will be reviewed by admin before appearing on the map.</div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}