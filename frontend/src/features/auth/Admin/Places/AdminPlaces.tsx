
import { useEffect, useState } from "react";
import {
  MapPin, Search, Trash2, CheckCircle, Clock, XCircle,
  X, User, Calendar, Tag, Eye, ChevronLeft, ChevronRight, Images
} from "lucide-react";
import { adminApi } from "../adminApi";
import type { Place } from "../AdminTypes";
import "./AdminPlaces.css";

type Filter = "all" | "pending" | "approved" | "rejected";

// Parse image field — single string OR JSON array
function parseImages(image: string | null | undefined): string[] {
  if (!image) return [];
  const base = "http://localhost:5001";
  if (image.startsWith("[")) {
    try { return (JSON.parse(image) as string[]).map(p => `${base}${p}`); }
    catch { return [`${base}${image}`]; }
  }
  return [`${base}${image}`];
}

// Place Detail Modal 
function PlaceDetailModal({ place, onClose, onDelete }: {
  place: Place; onClose: () => void; onDelete: (p: Place) => void;
}) {
  const photos = parseImages(place.image);
  const [activePhoto, setActivePhoto] = useState(0);

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
          <button className="apl-detail-close" onClick={onClose}><X size={16} strokeWidth={2.5} /></button>
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

        {/* Thumbnail strip */}
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

        {/* Body */}
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
      </div>
    </div>
  );
}

// Main Component
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