import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Search, Trash2, CheckCircle, Clock, XCircle,
  X, User, Calendar, Tag, Eye, ChevronLeft, ChevronRight,
  Images, ExternalLink, Settings, FileText, Save,
  AlertTriangle, Mountain, Car, Sun, Info, Star, Upload,
} from "lucide-react";
import { adminApi } from "../adminApi";
import axiosInstance from "../../../../shared/config/axiosinstance";
import type { Place } from "../AdminTypes";
import "./AdminPlaces.css";
import { getImageUrl } from "../../../../shared/config/imageUrl";

type Filter   = "all" | "pending" | "approved" | "rejected";
type ModalTab = "details" | "conditions" | "tags";

const PAGE_SIZE = 10;
const CATEGORIES = [
  "Nature", "Heritage", "Temple", "Lake", "Viewpoint",
  "Hidden Gem", "Adventure", "Cultural", "Food", "City", "Other", 
];
const PREDEFINED_TAGS = [
  "Scenic", "Hiking", "Photography", "Peaceful", "Family Friendly",
  "Adventure", "Cultural", "Historical", "Wildlife", "Waterfall",
  "Sunrise", "Sunset", "Budget Friendly", "Off the beaten path",
  "Camping", "Trekking", "Boating", "Bird Watching",
];

function parseImages(image: string | null | undefined): string[] {
  if (!image) return [];
  if (image.startsWith("[")) {
    try { return (JSON.parse(image) as string[]).map((p) => getImageUrl(p)); }
    catch { return [getImageUrl(image)]; }
  }
  return [getImageUrl(image)];
}

function parseRawImages(image: string | null | undefined): string[] {
  if (!image) return [];
  if (image.startsWith("[")) {
    try { return JSON.parse(image) as string[]; }
    catch { return [image]; }
  }
  return [image];
}

// ── CONDITIONS TAB ─────────────────────────────────────────────
function ConditionsTab({ placeId, onSaved }: { placeId: number; onSaved?: (data: any) => void }) {
  const [conditions, setConditions] = useState({
    trail_condition: "", road_condition: "", best_time: "", difficulty: "", note: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    axiosInstance.get(`/places/${placeId}/conditions`)
      .then(res => { if (res.data?.data) setConditions(c => ({ ...c, ...res.data.data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [placeId]);

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      await axiosInstance.put(`/places/${placeId}/conditions`, conditions);
      setMsg({ type: "success", text: "Conditions saved!" });
      onSaved?.(conditions);
    } catch {
      setMsg({ type: "error", text: "Failed to save. Try again." });
    }
    setSaving(false);
  };

  if (loading) return <div className="apl-cond-loading"><div className="apl-spinner" /><span>Loading...</span></div>;

  const trailOpts = ["Good", "Moderate", "Poor", "Closed"];
  const roadOpts  = ["Paved", "Gravel", "Dirt", "4WD Only", "Closed"];
  const diffOpts  = ["Easy", "Moderate", "Hard", "Expert"];

  return (
    <div className="apl-cond-root">
      {msg && (
        <div className={`apl-cond-msg apl-cond-msg--${msg.type}`}>
          {msg.type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}
      <div className="apl-cond-section">
        <div className="apl-cond-label"><Mountain size={13} strokeWidth={2} /> Trail Condition</div>
        <div className="apl-cond-opts">
          {trailOpts.map(o => (
            <button key={o} type="button"
              className={`apl-cond-opt ${conditions.trail_condition === o ? "active" : ""}`}
              onClick={() => setConditions(s => ({ ...s, trail_condition: o }))}>{o}</button>
          ))}
        </div>
      </div>
      <div className="apl-cond-section">
        <div className="apl-cond-label"><Car size={13} strokeWidth={2} /> Road Condition</div>
        <div className="apl-cond-opts">
          {roadOpts.map(o => (
            <button key={o} type="button"
              className={`apl-cond-opt ${conditions.road_condition === o ? "active" : ""}`}
              onClick={() => setConditions(s => ({ ...s, road_condition: o }))}>{o}</button>
          ))}
        </div>
      </div>
      <div className="apl-cond-section">
        <div className="apl-cond-label"><Mountain size={13} strokeWidth={2} /> Difficulty</div>
        <div className="apl-cond-opts">
          {diffOpts.map(o => (
            <button key={o} type="button"
              className={`apl-cond-opt ${conditions.difficulty === o ? "active" : ""}`}
              onClick={() => setConditions(s => ({ ...s, difficulty: o }))}>{o}</button>
          ))}
        </div>
      </div>
      <div className="apl-cond-section">
        <div className="apl-cond-label"><Sun size={13} strokeWidth={2} /> Best Time to Visit</div>
        <input className="apl-cond-input" value={conditions.best_time}
          onChange={e => setConditions(s => ({ ...s, best_time: e.target.value }))}
          placeholder="e.g. October – March, Early morning" />
      </div>
      <div className="apl-cond-section">
        <div className="apl-cond-label"><Info size={13} strokeWidth={2} /> Admin Note</div>
        <textarea className="apl-cond-textarea" value={conditions.note}
          onChange={e => setConditions(s => ({ ...s, note: e.target.value }))}
          placeholder="Any special notes for visitors..." rows={3} />
      </div>
      <button className="apl-cond-save" onClick={handleSave} disabled={saving}>
        <Save size={14} strokeWidth={2.5} />
        {saving ? "Saving..." : "Save Conditions"}
      </button>
    </div>
  );
}

// ── TAGS TAB ───────────────────────────────────────────────────
function TagsTab({ placeId, onSaved }: { placeId: number; onSaved?: (tags: string[]) => void }) {
  const [tags,        setTags]        = useState<string[]>([]);
  const [tagInput,    setTagInput]    = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    axiosInstance.get(`/places/${placeId}/tags`)
      .then(res => { if (res.data?.data?.tags) setTags(res.data.data.tags); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [placeId]);

  const handleInputChange = (val: string) => {
    setTagInput(val);
    setSuggestions(val.trim().length > 0
      ? PREDEFINED_TAGS.filter(t => t.toLowerCase().includes(val.toLowerCase()) && !tags.includes(t))
      : []);
  };
  const addTag    = (tag: string) => { const t = tag.trim(); if (t && !tags.includes(t)) setTags(p => [...p, t]); setTagInput(""); setSuggestions([]); };
  const removeTag = (tag: string) => setTags(p => p.filter(t => t !== tag));

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      await axiosInstance.put(`/places/${placeId}/tags`, { tags });
      setMsg({ type: "success", text: "Tags saved!" });
      onSaved?.(tags);
    } catch {
      setMsg({ type: "error", text: "Failed to save tags." });
    }
    setSaving(false);
  };

  if (loading) return <div className="apl-cond-loading"><div className="apl-spinner" /><span>Loading...</span></div>;

  return (
    <div className="apl-cond-root">
      {msg && (
        <div className={`apl-cond-msg apl-cond-msg--${msg.type}`}>
          {msg.type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}
      <div className="apl-cond-section">
        <div className="apl-cond-label"><Tag size={13} strokeWidth={2} /> Quick Add Tags</div>
        <div className="apl-tags-predefined">
          {PREDEFINED_TAGS.map(t => (
            <button key={t} type="button"
              className={`apl-tag-pill ${tags.includes(t) ? "active" : ""}`}
              onClick={() => tags.includes(t) ? removeTag(t) : addTag(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div className="apl-cond-section">
        <div className="apl-cond-label">Custom Tag</div>
        <div className="apl-tag-input-wrap">
          <input className="apl-cond-input" value={tagInput}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && tagInput.trim()) { e.preventDefault(); addTag(tagInput); } }}
            placeholder="Type and press Enter to add custom tag" />
          {suggestions.length > 0 && (
            <div className="apl-tag-suggestions">
              {suggestions.map(s => <div key={s} className="apl-tag-suggestion-item" onClick={() => addTag(s)}>{s}</div>)}
            </div>
          )}
        </div>
      </div>
      {tags.length > 0 && (
        <div className="apl-cond-section">
          <div className="apl-cond-label">Selected Tags ({tags.length})</div>
          <div className="apl-selected-tags">
            {tags.map(t => (
              <span key={t} className="apl-selected-tag">
                {t}
                <button type="button" onClick={() => removeTag(t)}><X size={11} strokeWidth={3} /></button>
              </span>
            ))}
          </div>
        </div>
      )}
      <button className="apl-cond-save" onClick={handleSave} disabled={saving}>
        <Save size={14} strokeWidth={2.5} />
        {saving ? "Saving..." : "Save Tags"}
      </button>
    </div>
  );
}

// ── PLACE DETAIL MODAL ─────────────────────────────────────────
function PlaceDetailModal({ place, onClose, onDelete, onUpdated }: {
  place: Place; onClose: () => void; onDelete: (p: Place) => void; onUpdated: () => void;
}) {
  const navigate = useNavigate();
  const [localPlace,   setLocalPlace]   = useState<Place>(place);
  const [activePhoto,  setActivePhoto]  = useState(0);
  const [tab,          setTab]          = useState<ModalTab>("details");
  const [form,         setForm]         = useState({
    name: place.name || "", address: place.address || "",
    description: place.description || "", category: place.category || "",
  });
  const [saving,       setSaving]       = useState(false);
  const [editMsg,      setEditMsg]      = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [deletingImg,  setDeletingImg]  = useState<string | null>(null);
  const [savedConditions, setSavedConditions] = useState<any>(null);
  const [savedTags,        setSavedTags]       = useState<string[]>([]);

  useEffect(() => {
    axiosInstance.get(`/places/${place.id}/conditions`).then(res => {
      if (res.data?.data) setSavedConditions(res.data.data);
    }).catch(() => {});
    axiosInstance.get(`/places/${place.id}/tags`).then(res => {
      if (res.data?.data?.tags) setSavedTags(res.data.data.tags);
    }).catch(() => {});
  }, [place.id]);

  const photos   = parseImages(localPlace.image);
  const rawPaths = parseRawImages(localPlace.image);

  const handleSaveDetails = async () => {
    setSaving(true); setEditMsg(null);
    try {
      await axiosInstance.put(`/admin/places/${place.id}`, form);
      setLocalPlace(prev => ({ ...prev, ...form }));
      setEditMsg({ type: "success", text: "Place updated successfully!" });
      onUpdated();
    } catch {
      setEditMsg({ type: "error", text: "Update failed. Try again." });
    }
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImg(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append("images", f));
      const res = await axiosInstance.put(`/admin/places/${place.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.data?.image) setLocalPlace(prev => ({ ...prev, image: res.data.data.image }));
      setEditMsg({ type: "success", text: "Images uploaded!" });
      onUpdated();
    } catch {
      setEditMsg({ type: "error", text: "Image upload failed." });
    }
    setUploadingImg(false);
    e.target.value = "";
  };

  const handleDeleteImage = async (rawPath: string, index: number) => {
    if (!confirm("This image lai permanently delete garne?")) return;
    setDeletingImg(rawPath);
    try {
      await axiosInstance.delete(`/admin/places/${place.id}/image`, { data: { imageUrl: rawPath } });
      const newRaw = rawPaths.filter((_, i) => i !== index);
      setLocalPlace(prev => ({ ...prev, image: newRaw.length > 0 ? JSON.stringify(newRaw) : null }));
      if (activePhoto >= index && activePhoto > 0) setActivePhoto(activePhoto - 1);
      onUpdated();
    } catch {
      setEditMsg({ type: "error", text: "Image delete garna sakiyena." });
    }
    setDeletingImg(null);
  };

  const hasConditions = savedConditions && Object.values(savedConditions).some(v => v && v !== "");

  return (
    <div className="apl-overlay" onClick={onClose}>
      <div className="apl-detail-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="apl-detail-header">
          <div className="apl-detail-header-info">
            <span className={`apl-badge apl-badge--${localPlace.status}`}>
              {localPlace.status === "approved" && <CheckCircle size={11} strokeWidth={2.5} />}
              {localPlace.status === "pending"  && <Clock       size={11} strokeWidth={2.5} />}
              {localPlace.status === "rejected" && <XCircle     size={11} strokeWidth={2.5} />}
              {localPlace.status.charAt(0).toUpperCase() + localPlace.status.slice(1)}
            </span>
            {(localPlace as any).is_featured && (
              <span className="apl-featured-badge"><Star size={11} strokeWidth={2.5} fill="currentColor" /> Featured</span>
            )}
            {localPlace.category && <span className="apl-detail-cat"><Tag size={11} strokeWidth={2} /> {localPlace.category}</span>}
            {photos.length > 0 && <span className="apl-detail-img-count"><Images size={11} strokeWidth={2} /> {photos.length} photos</span>}
          </div>
          <div className="apl-detail-header-actions">
            <button className="apl-view-page-btn" onClick={() => { onClose(); navigate(`/place/${place.id}`); }}>
              <ExternalLink size={13} strokeWidth={2.5} /> View Page
            </button>
            <button className="apl-detail-close" onClick={onClose}><X size={16} strokeWidth={2.5} /></button>
          </div>
        </div>

        {/* Hero */}
        {photos.length > 0 ? (
          <div className="apl-detail-hero">
            <img src={photos[activePhoto]} alt={localPlace.name} />
            <button className="apl-hero-del-btn"
              onClick={() => handleDeleteImage(rawPaths[activePhoto], activePhoto)}
              disabled={deletingImg === rawPaths[activePhoto]}>
              {deletingImg === rawPaths[activePhoto] ? "..." : <><Trash2 size={12} /> Delete</>}
            </button>
            {photos.length > 1 && (
              <>
                <button className="apl-gallery-arrow apl-gallery-arrow--left"
                  onClick={() => setActivePhoto(v => v === 0 ? photos.length - 1 : v - 1)}>
                  <ChevronLeft size={20} />
                </button>
                <button className="apl-gallery-arrow apl-gallery-arrow--right"
                  onClick={() => setActivePhoto(v => v === photos.length - 1 ? 0 : v + 1)}>
                  <ChevronRight size={20} />
                </button>
                <div className="apl-gallery-count">{activePhoto + 1} / {photos.length}</div>
              </>
            )}
          </div>
        ) : (
          <div className="apl-detail-no-img"><MapPin size={48} strokeWidth={1} /><span>No photo uploaded</span></div>
        )}

        {photos.length > 1 && (
          <div className="apl-detail-thumbs">
            {photos.map((img, i) => (
              <button key={i} type="button"
                className={`apl-detail-thumb ${i === activePhoto ? "active" : ""}`}
                onClick={() => setActivePhoto(i)}>
                <img src={img} alt="" />
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="apl-modal-tabs">
          <button className={`apl-modal-tab ${tab === "details"    ? "active" : ""}`} onClick={() => setTab("details")}>
            <FileText size={13} strokeWidth={2} /> Details
          </button>
          <button className={`apl-modal-tab ${tab === "conditions" ? "active" : ""}`} onClick={() => setTab("conditions")}>
            <Settings size={13} strokeWidth={2} /> Conditions
          </button>
          <button className={`apl-modal-tab ${tab === "tags" ? "active" : ""}`} onClick={() => setTab("tags")}>
            <Tag size={13} strokeWidth={2} /> Tags
          </button>
        </div>

        {/* DETAILS TAB */}
        {tab === "details" && (
          <div className="apl-detail-body">
            <h2 className="apl-detail-name">{localPlace.name}</h2>
            <div className="apl-detail-addr"><MapPin size={14} strokeWidth={2} />{localPlace.address}</div>
            {localPlace.description && <p className="apl-detail-desc">{localPlace.description}</p>}

            {/* Conditions preview */}
            {hasConditions && (
              <div className="apl-info-chips">
                {savedConditions.trail_condition && <span className="apl-info-chip"><Mountain size={11} /> Trail: {savedConditions.trail_condition}</span>}
                {savedConditions.road_condition  && <span className="apl-info-chip"><Car size={11} /> Road: {savedConditions.road_condition}</span>}
                {savedConditions.difficulty      && <span className="apl-info-chip">⚡ {savedConditions.difficulty}</span>}
                {savedConditions.best_time       && <span className="apl-info-chip"><Sun size={11} /> {savedConditions.best_time}</span>}
              </div>
            )}

            {/* Tags preview */}
            {savedTags.length > 0 && (
              <div className="apl-tags-preview">
                {savedTags.map(t => <span key={t} className="apl-tag-preview-pill">{t}</span>)}
              </div>
            )}

            {/* Meta */}
            <div className="apl-detail-meta">
              <div className="apl-detail-meta-item">
                <div className="apl-detail-meta-label">Submitted By</div>
                <div className="apl-detail-meta-val"><User size={13} strokeWidth={2} />{localPlace.submitter?.first_name} {localPlace.submitter?.last_name}</div>
                {localPlace.submitter?.email && <div className="apl-detail-meta-email">{localPlace.submitter.email}</div>}
              </div>
              <div className="apl-detail-meta-item">
                <div className="apl-detail-meta-label">Date Submitted</div>
                <div className="apl-detail-meta-val"><Calendar size={13} strokeWidth={2} />{new Date(localPlace.created_at).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}</div>
              </div>
              <div className="apl-detail-meta-item">
                <div className="apl-detail-meta-label">Coordinates</div>
                <div className="apl-detail-meta-val"><MapPin size={13} strokeWidth={2} />{parseFloat(localPlace.lat).toFixed(5)}, {parseFloat(localPlace.lng).toFixed(5)}</div>
              </div>
            </div>

            {/* Edit form */}
            <div className="apl-edit-form">
              <div className="apl-cond-label" style={{ marginBottom: 12 }}>
                <Settings size={13} strokeWidth={2} /> Edit Place Details
              </div>
              {editMsg && (
                <div className={`apl-cond-msg apl-cond-msg--${editMsg.type}`} style={{ marginBottom: 12 }}>
                  {editMsg.type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  {editMsg.text}
                </div>
              )}
              <div className="apl-edit-grid">
                <div className="apl-edit-field">
                  <label className="apl-edit-label">Place Name</label>
                  <input className="apl-cond-input" value={form.name}
                    onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
                </div>
                <div className="apl-edit-field">
                  <label className="apl-edit-label">Category</label>
                  <select className="apl-cond-input" value={form.category}
                    onChange={e => setForm(s => ({ ...s, category: e.target.value }))}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="apl-edit-field" style={{ marginTop: 10 }}>
                <label className="apl-edit-label">Address</label>
                <input className="apl-cond-input" value={form.address}
                  onChange={e => setForm(s => ({ ...s, address: e.target.value }))} />
              </div>
              <div className="apl-edit-field" style={{ marginTop: 10 }}>
                <label className="apl-edit-label">Description</label>
                <textarea className="apl-cond-textarea" rows={3} value={form.description}
                  onChange={e => setForm(s => ({ ...s, description: e.target.value }))} />
              </div>
              <div className="apl-edit-field" style={{ marginTop: 10 }}>
                <label className="apl-edit-label">Add New Images</label>
                <label className="apl-img-upload-btn">
                  <Upload size={14} />
                  {uploadingImg ? "Uploading..." : "Choose Photos"}
                  <input type="file" accept="image/*" multiple style={{ display: "none" }}
                    onChange={handleImageUpload} disabled={uploadingImg} />
                </label>
              </div>
              <button className="apl-cond-save" onClick={handleSaveDetails} disabled={saving} style={{ marginTop: 14 }}>
                <Save size={14} strokeWidth={2.5} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div className="apl-detail-footer">
              <button className="apl-detail-del-btn" onClick={() => { onClose(); onDelete(localPlace); }}>
                <Trash2 size={15} strokeWidth={2} /> Delete Place
              </button>
            </div>
          </div>
        )}

        {tab === "conditions" && (
          <div className="apl-tab-content-wrap">
            <ConditionsTab placeId={place.id} onSaved={(data) => setSavedConditions(data)} />
          </div>
        )}

        {tab === "tags" && (
          <div className="apl-tab-content-wrap">
            <TagsTab placeId={place.id} onSaved={(tags) => setSavedTags(tags)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────
export default function AdminPlaces() {
  const [places,        setPlaces]        = useState<Place[]>([]);
  const [filter,        setFilter]        = useState<Filter>("all");
  const [search,        setSearch]        = useState("");
  const [loading,       setLoading]       = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<Place | null>(null);
  const [processing,    setProcessing]    = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [featuringId,   setFeaturingId]   = useState<number | null>(null);
  const [page,          setPage]          = useState(1);
  const [dateFrom,      setDateFrom]      = useState("");
  const [dateTo,        setDateTo]        = useState("");

  const loadPlaces = () => {
    setLoading(true);
    adminApi.getPlaces(filter === "all" ? undefined : filter).then((res) => {
      if (res.success) setPlaces(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { loadPlaces(); }, [filter]);
  useEffect(() => { setPage(1); }, [filter, search, dateFrom, dateTo]);

  const filtered = places.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
    const createdAt   = new Date(p.created_at);
    const matchFrom   = dateFrom ? createdAt >= new Date(dateFrom) : true;
    const matchTo     = dateTo   ? createdAt <= new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : true;
    return matchSearch && matchFrom && matchTo;
  });

  const hasDateFilter   = dateFrom || dateTo;
  const clearDateFilter = () => { setDateFrom(""); setDateTo(""); };
  const totalPages      = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage        = Math.min(page, totalPages);
  const pageStart       = (safePage - 1) * PAGE_SIZE;
  const paginated       = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setProcessing(deleteConfirm.id);
    await adminApi.deletePlace(deleteConfirm.id);
    setPlaces(prev => prev.filter(p => p.id !== deleteConfirm.id));
    setDeleteConfirm(null); setProcessing(null);
  };

  const handleToggleFeatured = async (e: React.MouseEvent, place: Place) => {
    e.stopPropagation(); setFeaturingId(place.id);
    try {
      const res = await axiosInstance.patch(`/admin/places/${place.id}/feature`);
      if (res.data?.success) setPlaces(prev => prev.map(p => p.id === place.id ? { ...p, is_featured: res.data.is_featured } : p));
    } catch {}
    setFeaturingId(null);
  };

  const getPageNumbers = () => {
    const delta = 2; const range: number[] = [];
    for (let i = Math.max(1, safePage - delta); i <= Math.min(totalPages, safePage + delta); i++) range.push(i);
    return range;
  };

  const TABS: { label: string; value: Filter; Icon: any }[] = [
    { label: "All",      value: "all",      Icon: MapPin      },
    { label: "Approved", value: "approved", Icon: CheckCircle },
    { label: "Pending",  value: "pending",  Icon: Clock       },
    { label: "Rejected", value: "rejected", Icon: XCircle     },
  ];

  return (
    <div className="apl-root">
      <div className="apl-header">
        <h1 className="apl-title">All Places</h1>
        <p className="apl-subtitle">Manage all submitted places</p>
      </div>

      <div className="apl-controls">
        <div className="apl-tabs">
          {TABS.map(({ label, value, Icon }) => (
            <button key={value} className={`apl-tab ${filter === value ? "apl-tab--active" : ""}`} onClick={() => setFilter(value)}>
              <Icon size={13} strokeWidth={2.5} /> {label}
            </button>
          ))}
        </div>
        <div className="apl-search-wrap">
          <Search size={15} className="apl-search-icon" />
          <input className="apl-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or address..." />
        </div>
        <div className="apl-date-row">
          <Calendar size={13} strokeWidth={2} className="apl-date-row-icon" />
          <span className="apl-date-row-label">From</span>
          <input type="date" className="apl-date-input" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)} />
          <span className="apl-date-sep">—</span>
          <span className="apl-date-row-label">To</span>
          <input type="date" className="apl-date-input" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} />
          {hasDateFilter && <button className="apl-date-clear" onClick={clearDateFilter}><X size={12} strokeWidth={2.5} /></button>}
        </div>
      </div>

      {hasDateFilter && (
        <div className="apl-date-active-badge">
          <Calendar size={12} strokeWidth={2} />
          Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""} in selected date range
        </div>
      )}

      {loading ? (
        <div className="apl-loading"><div className="apl-spinner" /></div>
      ) : (
        <>
          <div className="apl-table-wrap">
            <table className="apl-table">
              <thead>
                <tr>
                  <th>Place</th><th>Category</th><th>Photos</th>
                  <th>Submitted By</th><th>Status</th><th>Featured</th>
                  <th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} className="apl-empty">{hasDateFilter ? "No places found in this date range." : "No places found."}</td></tr>
                ) : paginated.map(p => {
                  const photos = parseImages(p.image); const coverImg = photos[0] || null; const isFeat = !!(p as any).is_featured;
                  return (
                    <tr key={p.id} className="apl-row" onClick={() => setSelectedPlace(p)}>
                      <td>
                        <div className="apl-place-cell">
                          <div className="apl-place-img">
                            {coverImg ? <img src={coverImg} alt={p.name} /> : <MapPin size={20} strokeWidth={1.5} />}
                            <div className="apl-place-img-overlay"><Eye size={14} strokeWidth={2} /></div>
                          </div>
                          <div>
                            <div className="apl-place-name">{p.name}</div>
                            <div className="apl-place-addr">{p.address}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="apl-cat">{p.category || "—"}</span></td>
                      <td>{photos.length > 0 ? <span className="apl-photo-count-badge"><Images size={11} strokeWidth={2} /> {photos.length}</span> : <span className="apl-no-photo">—</span>}</td>
                      <td className="apl-submitter">{p.submitter?.first_name} {p.submitter?.last_name}</td>
                      <td>
                        <span className={`apl-badge apl-badge--${p.status}`}>
                          {p.status === "approved" && <CheckCircle size={11} strokeWidth={2.5} />}
                          {p.status === "pending"  && <Clock       size={11} strokeWidth={2.5} />}
                          {p.status === "rejected" && <XCircle     size={11} strokeWidth={2.5} />}
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className={`apl-feat-btn ${isFeat ? "apl-feat-btn--on" : ""}`}
                          onClick={e => handleToggleFeatured(e, p)} disabled={featuringId === p.id}>
                          <Star size={15} strokeWidth={2} fill={isFeat ? "currentColor" : "none"} />
                          {featuringId === p.id ? "..." : isFeat ? "Featured" : "Feature"}
                        </button>
                      </td>
                      <td className="apl-date">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="apl-del-btn" onClick={() => setDeleteConfirm(p)}><Trash2 size={15} strokeWidth={2} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="apl-pagination">
              <div className="apl-pagination-info">Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} places</div>
              {totalPages > 1 && (
                <div className="apl-pagination-controls">
                  <button className="apl-page-btn apl-page-btn--nav" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={15} strokeWidth={2.5} /></button>
                  {getPageNumbers()[0] > 1 && (<><button className="apl-page-btn" onClick={() => setPage(1)}>1</button>{getPageNumbers()[0] > 2 && <span className="apl-page-dots">…</span>}</>)}
                  {getPageNumbers().map(n => <button key={n} className={`apl-page-btn ${n === safePage ? "apl-page-btn--active" : ""}`} onClick={() => setPage(n)}>{n}</button>)}
                  {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (<>{getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && <span className="apl-page-dots">…</span>}<button className="apl-page-btn" onClick={() => setPage(totalPages)}>{totalPages}</button></>)}
                  <button className="apl-page-btn apl-page-btn--nav" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><ChevronRight size={15} strokeWidth={2.5} /></button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onDelete={p => setDeleteConfirm(p)}
          onUpdated={() => loadPlaces()}
        />
      )}

      {deleteConfirm && (
        <div className="apl-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="apl-modal" onClick={e => e.stopPropagation()}>
            <div className="apl-modal-icon-wrap"><Trash2 size={28} strokeWidth={1.5} /></div>
            <h3 className="apl-modal-title">Delete Place?</h3>
            <p className="apl-modal-msg"><strong>"{deleteConfirm.name}"</strong> will be permanently deleted.</p>
            <div className="apl-modal-actions">
              <button className="apl-btn apl-btn--cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="apl-btn apl-btn--delete" onClick={handleDelete} disabled={!!processing}>{processing ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}