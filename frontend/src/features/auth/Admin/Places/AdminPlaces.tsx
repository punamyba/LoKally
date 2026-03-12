import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Search, Trash2, CheckCircle, Clock, XCircle,
  X, User, Calendar, Tag, Eye, ChevronLeft, ChevronRight,
  Images, ExternalLink, Settings, FileText, Save,
  AlertTriangle, Mountain, Car, Sun, Info
} from "lucide-react";
import { adminApi } from "../adminApi";
import axiosInstance from "../../../../shared/config/axiosinstance";
import type { Place } from "../AdminTypes";
import "./AdminPlaces.css";
import { getImageUrl } from "../../../../shared/config/imageUrl";

type Filter = "all" | "pending" | "approved" | "rejected";
type ModalTab = "details" | "conditions" | "tags";

function parseImages(image: string | null | undefined): string[] {
  if (!image) return [];
  if (image.startsWith("[")) {
    try { return (JSON.parse(image) as string[]).map((p) => getImageUrl(p)); }
    catch { return [getImageUrl(image)]; }
  }
  return [getImageUrl(image)];
}

// ── PREDEFINED TAGS ──────────────────────────────────────
const PREDEFINED_TAGS = [
  "Scenic", "Hiking", "Photography", "Peaceful", "Family Friendly",
  "Adventure", "Cultural", "Historical", "Wildlife", "Waterfall",
  "Sunrise", "Sunset", "Budget Friendly", "Off the beaten path",
  "Camping", "Trekking", "Boating", "Bird Watching"
];

// ── CONDITIONS TAB ────────────────────────────────────────
function ConditionsTab({ placeId }: { placeId: number }) {
  const [conditions, setConditions] = useState({
    trail_condition: "",
    road_condition: "",
    best_time: "",
    difficulty: "",
    note: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    axiosInstance.get(`/places/${placeId}/conditions`)
      .then(res => {
        if (res.data?.data) setConditions({ ...conditions, ...res.data.data });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [placeId]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await axiosInstance.put(`/places/${placeId}/conditions`, conditions);
      setMsg({ type: "success", text: "Conditions saved successfully!" });
    } catch {
      setMsg({ type: "error", text: "Failed to save. Try again." });
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="apl-cond-loading">
      <div className="apl-spinner" />
      <span>Loading conditions...</span>
    </div>
  );

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
              onClick={() => setConditions(s => ({ ...s, trail_condition: o }))}>
              {o}
            </button>
          ))}
        </div>
      </div>

      <div className="apl-cond-section">
        <div className="apl-cond-label"><Car size={13} strokeWidth={2} /> Road Condition</div>
        <div className="apl-cond-opts">
          {roadOpts.map(o => (
            <button key={o} type="button"
              className={`apl-cond-opt ${conditions.road_condition === o ? "active" : ""}`}
              onClick={() => setConditions(s => ({ ...s, road_condition: o }))}>
              {o}
            </button>
          ))}
        </div>
      </div>

      <div className="apl-cond-section">
        <div className="apl-cond-label"><Mountain size={13} strokeWidth={2} /> Difficulty</div>
        <div className="apl-cond-opts">
          {diffOpts.map(o => (
            <button key={o} type="button"
              className={`apl-cond-opt ${conditions.difficulty === o ? "active" : ""}`}
              onClick={() => setConditions(s => ({ ...s, difficulty: o }))}>
              {o}
            </button>
          ))}
        </div>
      </div>

      <div className="apl-cond-section">
        <div className="apl-cond-label"><Sun size={13} strokeWidth={2} /> Best Time to Visit</div>
        <input
          className="apl-cond-input"
          value={conditions.best_time}
          onChange={e => setConditions(s => ({ ...s, best_time: e.target.value }))}
          placeholder="e.g. October – March, Early morning" />
      </div>

      <div className="apl-cond-section">
        <div className="apl-cond-label"><Info size={13} strokeWidth={2} /> Admin Note</div>
        <textarea
          className="apl-cond-textarea"
          value={conditions.note}
          onChange={e => setConditions(s => ({ ...s, note: e.target.value }))}
          placeholder="Any special notes for visitors..."
          rows={3} />
      </div>

      <button className="apl-cond-save" onClick={handleSave} disabled={saving}>
        <Save size={14} strokeWidth={2.5} />
        {saving ? "Saving..." : "Save Conditions"}
      </button>
    </div>
  );
}

// ── TAGS TAB ──────────────────────────────────────────────
function TagsTab({ placeId }: { placeId: number }) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    axiosInstance.get(`/places/${placeId}/tags`)
      .then(res => { if (res.data?.data?.tags) setTags(res.data.data.tags); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [placeId]);

  const handleInputChange = (val: string) => {
    setTagInput(val);
    if (val.trim().length > 0) {
      setSuggestions(PREDEFINED_TAGS.filter(t =>
        t.toLowerCase().includes(val.toLowerCase()) && !tags.includes(t)
      ));
    } else {
      setSuggestions([]);
    }
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
    setSuggestions([]);
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await axiosInstance.put(`/places/${placeId}/tags`, { tags });
      setMsg({ type: "success", text: "Tags saved!" });
    } catch {
      setMsg({ type: "error", text: "Failed to save tags." });
    }
    setSaving(false);
  };

  if (loading) return <div className="apl-cond-loading"><div className="apl-spinner" /><span>Loading tags...</span></div>;

  return (
    <div className="apl-cond-root">
      {msg && (
        <div className={`apl-cond-msg apl-cond-msg--${msg.type}`}>
          {msg.type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}

      {/* Predefined tags */}
      <div className="apl-cond-section">
        <div className="apl-cond-label"><Tag size={13} strokeWidth={2} /> Quick Add Tags</div>
        <div className="apl-tags-predefined">
          {PREDEFINED_TAGS.map(t => (
            <button key={t} type="button"
              className={`apl-tag-pill ${tags.includes(t) ? "active" : ""}`}
              onClick={() => tags.includes(t) ? removeTag(t) : addTag(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Custom tag input */}
      <div className="apl-cond-section">
        <div className="apl-cond-label">Custom Tag</div>
        <div className="apl-tag-input-wrap" style={{ position: "relative" }}>
          <input
            className="apl-cond-input"
            value={tagInput}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && tagInput.trim()) { e.preventDefault(); addTag(tagInput); } }}
            placeholder="Type and press Enter to add custom tag" />
          {suggestions.length > 0 && (
            <div className="apl-tag-suggestions">
              {suggestions.map(s => (
                <div key={s} className="apl-tag-suggestion-item" onClick={() => addTag(s)}>{s}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected tags */}
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

// ── PLACE DETAIL MODAL ────────────────────────────────────
function PlaceDetailModal({ place, onClose, onDelete }: {
  place: Place; onClose: () => void; onDelete: (p: Place) => void;
}) {
  const navigate = useNavigate();
  const photos = parseImages(place.image);
  const [activePhoto, setActivePhoto] = useState(0);
  const [tab, setTab] = useState<ModalTab>("details");

  return (
    <div className="apl-overlay" onClick={onClose}>
      <div className="apl-detail-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="apl-detail-header">
          <div className="apl-detail-header-info">
            <span className={`apl-badge apl-badge--${place.status}`}>
              {place.status === "approved" && <CheckCircle size={11} strokeWidth={2.5} />}
              {place.status === "pending"  && <Clock       size={11} strokeWidth={2.5} />}
              {place.status === "rejected" && <XCircle     size={11} strokeWidth={2.5} />}
              {place.status.charAt(0).toUpperCase() + place.status.slice(1)}
            </span>
            {place.category && (
              <span className="apl-detail-cat"><Tag size={11} strokeWidth={2} /> {place.category}</span>
            )}
            {photos.length > 1 && (
              <span className="apl-detail-img-count">
                <Images size={11} strokeWidth={2} /> {photos.length} photos
              </span>
            )}
          </div>
          <div className="apl-detail-header-actions">
            <button
              className="apl-view-page-btn"
              onClick={() => { onClose(); navigate(`/place/${place.id}`); }}
              title="View place page">
              <ExternalLink size={13} strokeWidth={2.5} />
              View Page
            </button>
            <button className="apl-detail-close" onClick={onClose}><X size={16} strokeWidth={2.5} /></button>
          </div>
        </div>

        {/* Gallery */}
        {photos.length > 0 ? (
          <div className="apl-detail-hero">
            <img src={photos[activePhoto]} alt={place.name} />
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
          <div className="apl-detail-no-img">
            <MapPin size={48} strokeWidth={1} />
            <span>No photo uploaded</span>
          </div>
        )}

        {/* Thumbnails */}
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
          <button
            className={`apl-modal-tab ${tab === "details" ? "active" : ""}`}
            onClick={() => setTab("details")}>
            <FileText size={13} strokeWidth={2} /> Details
          </button>
          <button
            className={`apl-modal-tab ${tab === "conditions" ? "active" : ""}`}
            onClick={() => setTab("conditions")}>
            <Settings size={13} strokeWidth={2} /> Conditions
          </button>
          <button
            className={`apl-modal-tab ${tab === "tags" ? "active" : ""}`}
            onClick={() => setTab("tags")}>
            <Tag size={13} strokeWidth={2} /> Tags
          </button>
        </div>

        {/* Tab Content */}
        {tab === "details" && (
          <div className="apl-detail-body">
            <h2 className="apl-detail-name">{place.name}</h2>
            <div className="apl-detail-addr"><MapPin size={14} strokeWidth={2} />{place.address}</div>
            {place.description && <p className="apl-detail-desc">{place.description}</p>}

            <div className="apl-detail-meta">
              <div className="apl-detail-meta-item">
                <div className="apl-detail-meta-label">Submitted By</div>
                <div className="apl-detail-meta-val">
                  <User size={13} strokeWidth={2} />
                  {place.submitter?.first_name} {place.submitter?.last_name}
                </div>
                {place.submitter?.email && <div className="apl-detail-meta-email">{place.submitter.email}</div>}
              </div>
              <div className="apl-detail-meta-item">
                <div className="apl-detail-meta-label">Date Submitted</div>
                <div className="apl-detail-meta-val">
                  <Calendar size={13} strokeWidth={2} />
                  {new Date(place.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
              <div className="apl-detail-meta-item">
                <div className="apl-detail-meta-label">Coordinates</div>
                <div className="apl-detail-meta-val">
                  <MapPin size={13} strokeWidth={2} />
                  {parseFloat(place.lat).toFixed(5)}, {parseFloat(place.lng).toFixed(5)}
                </div>
              </div>
            </div>

            <div className="apl-detail-footer">
              <button className="apl-detail-del-btn" onClick={() => { onClose(); onDelete(place); }}>
                <Trash2 size={15} strokeWidth={2} /> Delete Place
              </button>
            </div>
          </div>
        )}

        {tab === "conditions" && (
          <div className="apl-tab-content-wrap">
            <ConditionsTab placeId={place.id} />
          </div>
        )}

        {tab === "tags" && (
          <div className="apl-tab-content-wrap">
            <TagsTab placeId={place.id} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────
export default function AdminPlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<Place | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    setLoading(true);
    adminApi.getPlaces(filter === "all" ? undefined : filter).then((res) => {
      if (res.success) setPlaces(res.data);
      setLoading(false);
    });
  }, [filter]);

  const filtered = places.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setProcessing(deleteConfirm.id);
    await adminApi.deletePlace(deleteConfirm.id);
    setPlaces(prev => prev.filter(p => p.id !== deleteConfirm.id));
    setDeleteConfirm(null);
    setProcessing(null);
  };

  const TABS: { label: string; value: Filter; Icon: any }[] = [
    { label: "All",      value: "all",      Icon: MapPin },
    { label: "Approved", value: "approved", Icon: CheckCircle },
    { label: "Pending",  value: "pending",  Icon: Clock },
    { label: "Rejected", value: "rejected", Icon: XCircle },
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
            <button key={value}
              className={`apl-tab ${filter === value ? "apl-tab--active" : ""}`}
              onClick={() => setFilter(value)}>
              <Icon size={13} strokeWidth={2.5} /> {label}
            </button>
          ))}
        </div>
        <div className="apl-search-wrap">
          <Search size={15} className="apl-search-icon" />
          <input className="apl-search" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or address..." />
        </div>
      </div>

      {loading ? (
        <div className="apl-loading"><div className="apl-spinner" /></div>
      ) : (
        <div className="apl-table-wrap">
          <table className="apl-table">
            <thead>
              <tr>
                <th>Place</th><th>Category</th><th>Photos</th>
                <th>Submitted By</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="apl-empty">No places found.</td></tr>
              ) : filtered.map(p => {
                const photos = parseImages(p.image);
                const coverImg = photos[0] || null;
                return (
                  <tr key={p.id} className="apl-row" onClick={() => setSelectedPlace(p)} title="Click to view details">
                    <td>
                      <div className="apl-place-cell">
                        <div className="apl-place-img">
                          {coverImg
                            ? <img src={coverImg} alt={p.name} />
                            : <MapPin size={20} strokeWidth={1.5} />
                          }
                          <div className="apl-place-img-overlay"><Eye size={14} strokeWidth={2} /></div>
                        </div>
                        <div>
                          <div className="apl-place-name">{p.name}</div>
                          <div className="apl-place-addr">{p.address}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="apl-cat">{p.category || "—"}</span></td>
                    <td>
                      {photos.length > 0 ? (
                        <span className="apl-photo-count-badge">
                          <Images size={11} strokeWidth={2} /> {photos.length}
                        </span>
                      ) : <span className="apl-no-photo">—</span>}
                    </td>
                    <td className="apl-submitter">{p.submitter?.first_name} {p.submitter?.last_name}</td>
                    <td>
                      <span className={`apl-badge apl-badge--${p.status}`}>
                        {p.status === "approved" && <CheckCircle size={11} strokeWidth={2.5} />}
                        {p.status === "pending"  && <Clock       size={11} strokeWidth={2.5} />}
                        {p.status === "rejected" && <XCircle     size={11} strokeWidth={2.5} />}
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td className="apl-date">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="apl-del-btn" onClick={() => setDeleteConfirm(p)} title="Delete">
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedPlace && (
        <PlaceDetailModal place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onDelete={p => setDeleteConfirm(p)} />
      )}

      {deleteConfirm && (
        <div className="apl-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="apl-modal" onClick={e => e.stopPropagation()}>
            <div className="apl-modal-icon-wrap"><Trash2 size={28} strokeWidth={1.5} /></div>
            <h3 className="apl-modal-title">Delete Place?</h3>
            <p className="apl-modal-msg"><strong>"{deleteConfirm.name}"</strong> will be permanently deleted.</p>
            <div className="apl-modal-actions">
              <button className="apl-btn apl-btn--cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="apl-btn apl-btn--delete" onClick={handleDelete} disabled={!!processing}>
                {processing ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}