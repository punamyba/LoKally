import { useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Upload, MapPin, CheckCircle, X, Images, Plus, Tag } from "lucide-react";
import { adminApi } from "../adminApi";
import axiosInstance from "../../../../shared/config/axiosinstance";
import "./AdminAddPlace.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LatLng = { lat: number; lng: number };

function MapPicker({ pin, setPin }: { pin: LatLng; setPin: (p: LatLng) => void }) {
  useMapEvents({
    click(e) { setPin({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return (
    <Marker position={[pin.lat, pin.lng]} draggable
      eventHandlers={{
        dragend(e) {
          const ll = (e.target as L.Marker).getLatLng();
          setPin({ lat: ll.lat, lng: ll.lng });
        },
      }}
    />
  );
}

const CATEGORIES = [
  "Nature", "Heritage", "Temple", "Lake", "Viewpoint",
  "Hidden Gem", "Adventure", "Cultural", "Food", "Other",
];

const PREDEFINED_TAGS = [
  "Scenic", "Hiking", "Photography", "Peaceful", "Family Friendly",
  "Adventure", "Cultural", "Historical", "Wildlife", "Waterfall",
  "Sunrise", "Sunset", "Budget Friendly", "Off the beaten path",
  "Camping", "Trekking", "Boating", "Bird Watching"
];

const MAX_PHOTOS = 20;

export default function AdminAddPlace() {
  const [form, setForm] = useState({ name: "", address: "", description: "", category: "" });
  const [pin, setPin] = useState<LatLng>({ lat: 27.7172, lng: 85.324 });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Image helpers ──────────────────────────────────
  const handleImages = (files: FileList) => {
    const remaining = MAX_PHOTOS - imageFiles.length;
    const newFiles = Array.from(files).slice(0, remaining);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
    setImageFiles((prev) => [...prev, ...newFiles]);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) handleImages(e.dataTransfer.files);
  };

  // ── Tag helpers ────────────────────────────────────
  const handleTagInput = (val: string) => {
    setTagInput(val);
    if (val.trim()) {
      setTagSuggestions(
        PREDEFINED_TAGS.filter(t =>
          t.toLowerCase().includes(val.toLowerCase()) && !selectedTags.includes(t)
        )
      );
    } else {
      setTagSuggestions([]);
    }
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !selectedTags.includes(t)) setSelectedTags(prev => [...prev, t]);
    setTagInput("");
    setTagSuggestions([]);
  };

  const removeTag = (tag: string) => setSelectedTags(prev => prev.filter(t => t !== tag));

  const togglePredefinedTag = (tag: string) => {
    if (selectedTags.includes(tag)) removeTag(tag);
    else addTag(tag);
  };

  // ── Submit ─────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address) { setError("Name and address are required!"); return; }
    setError("");
    setLoading(true);

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("address", form.address);
    fd.append("description", form.description);
    fd.append("category", form.category);
    fd.append("lat", pin.lat.toString());
    fd.append("lng", pin.lng.toString());
    imageFiles.forEach((file) => fd.append("images", file));

    const res = await adminApi.addPlace(fd);
    setLoading(false);

    if (res.success) {
      // Save tags if any
      if (selectedTags.length > 0 && res.data?.id) {
        try {
          await axiosInstance.put(`/places/${res.data.id}/tags`, { tags: selectedTags });
        } catch {}
      }
      setSuccess(true);
      setForm({ name: "", address: "", description: "", category: "" });
      setImageFiles([]);
      setImagePreviews([]);
      setSelectedTags([]);
      setTagInput("");
      setPin({ lat: 27.7172, lng: 85.324 });
      setTimeout(() => setSuccess(false), 4000);
    } else {
      setError(res.message || "Failed to add place. Try again.");
    }
  };

  return (
    <div className="aap-root">
      <div className="aap-header">
        <h1 className="aap-title">Add New Place</h1>
        <p className="aap-subtitle">
          Admin-added places are <strong>auto-approved</strong> and visible on the map immediately.
        </p>
      </div>

      <div className="aap-body">
        <div className="aap-form-wrap">
          {success && (
            <div className="aap-success">
              <CheckCircle size={15} strokeWidth={2.5} />
              Place added and is now live on the map!
            </div>
          )}
          {error && (
            <div className="aap-error">
              <X size={15} strokeWidth={2.5} /> {error}
            </div>
          )}

          <form className="aap-form" onSubmit={handleSubmit}>

            {/* Name */}
            <div className="aap-field">
              <label className="aap-label">Place Name <span className="aap-req">*</span></label>
              <input className="aap-input" value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g. Phewa Lake" />
            </div>

            {/* Address */}
            <div className="aap-field">
              <label className="aap-label">Address <span className="aap-req">*</span></label>
              <input className="aap-input" value={form.address}
                onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                placeholder="e.g. Pokhara, Nepal" />
            </div>

            {/* Category */}
            <div className="aap-field">
              <label className="aap-label">Category</label>
              <select className="aap-select" value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="aap-field">
              <label className="aap-label">Description</label>
              <textarea className="aap-textarea" value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="What makes this place special?" rows={3} />
            </div>

            {/* ── TAGS SECTION ────────────────────────────────── */}
            <div className="aap-field">
              <label className="aap-label">
                <Tag size={13} strokeWidth={2} style={{ display: "inline", marginRight: 4 }} />
                Tags
                <span className="aap-tag-hint">Click to select or type your own</span>
              </label>

              {/* Predefined tag pills */}
              <div className="aap-tags-predefined">
                {PREDEFINED_TAGS.map(t => (
                  <button key={t} type="button"
                    className={`aap-tag-pill ${selectedTags.includes(t) ? "active" : ""}`}
                    onClick={() => togglePredefinedTag(t)}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Custom tag input */}
              <div className="aap-tag-input-row">
                <div className="aap-tag-input-wrap">
                  <input
                    className="aap-input"
                    value={tagInput}
                    onChange={e => handleTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && tagInput.trim()) {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Type a custom tag and press Enter..." />
                  {tagSuggestions.length > 0 && (
                    <div className="aap-tag-suggestions">
                      {tagSuggestions.map(s => (
                        <div key={s} className="aap-tag-suggestion-item"
                          onMouseDown={() => addTag(s)}>{s}</div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" className="aap-tag-add-btn"
                  onClick={() => tagInput.trim() && addTag(tagInput)}
                  disabled={!tagInput.trim()}>
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>

              {/* Selected tags */}
              {selectedTags.length > 0 && (
                <div className="aap-selected-tags">
                  {selectedTags.map(t => (
                    <span key={t} className="aap-selected-tag">
                      {t}
                      <button type="button" onClick={() => removeTag(t)}>
                        <X size={11} strokeWidth={3} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Photos */}
            <div className="aap-field">
              <div className="aap-photo-header">
                <label className="aap-label">
                  <Images size={14} strokeWidth={2} /> Photos
                </label>
                <span className="aap-photo-count">{imageFiles.length} / {MAX_PHOTOS}</span>
              </div>

              {imagePreviews.length > 0 && (
                <div className="aap-photos-grid">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className={`aap-photo-thumb ${i === 0 ? "aap-photo-thumb--primary" : ""}`}>
                      <img src={src} alt={`photo ${i + 1}`} />
                      {i === 0 && <span className="aap-photo-primary-tag">Cover</span>}
                      <button type="button" className="aap-photo-remove" onClick={() => removeImage(i)}>
                        <X size={11} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  {imageFiles.length < MAX_PHOTOS && (
                    <div className="aap-photo-add-more" onClick={() => fileRef.current?.click()}>
                      <Plus size={20} strokeWidth={2} />
                      <span>Add</span>
                    </div>
                  )}
                </div>
              )}

              {imagePreviews.length === 0 && (
                <div className="aap-upload-box"
                  onClick={() => fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}>
                  <Upload size={24} strokeWidth={1.5} className="aap-upload-icon" />
                  <div className="aap-upload-text">Click or drag to upload photos</div>
                  <div className="aap-upload-sub">Up to {MAX_PHOTOS} photos · JPG, PNG, WEBP · Max 5MB each</div>
                </div>
              )}

              <input ref={fileRef} type="file" accept="image/*" multiple
                style={{ display: "none" }}
                onChange={(e) => e.target.files && handleImages(e.target.files)} />
            </div>

            {/* Coordinates */}
            <div className="aap-coords-row">
              <div className="aap-field">
                <label className="aap-label">Latitude</label>
                <input className="aap-input aap-input--readonly" value={pin.lat.toFixed(6)} readOnly />
              </div>
              <div className="aap-field">
                <label className="aap-label">Longitude</label>
                <input className="aap-input aap-input--readonly" value={pin.lng.toFixed(6)} readOnly />
              </div>
            </div>

            <div className="aap-map-hint">
              <MapPin size={13} strokeWidth={2} />
              Click on the map or drag the pin to set location
            </div>

            <button className="aap-submit" type="submit" disabled={loading}>
              {loading
                ? "Adding..."
                : <><CheckCircle size={16} strokeWidth={2.5} /> Add Place (Auto Approved)</>
              }
            </button>
          </form>
        </div>

        <div className="aap-map-wrap">
          <MapContainer center={[pin.lat, pin.lng]} zoom={7}
            style={{ height: "100%", width: "100%", borderRadius: "16px" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapPicker pin={pin} setPin={setPin} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}