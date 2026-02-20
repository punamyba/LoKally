// AdminPlaces.tsx — LoKally Admin v2 (with Detail Popup)
import { useEffect, useState } from "react";
import {
  MapPin, Search, Trash2, CheckCircle, Clock, XCircle,
  X, User, Calendar, Tag, Eye
} from "lucide-react";
import { adminApi } from "../AdminApi";
import type { Place } from "../AdminTypes";
import "./AdminPlaces.css";

type Filter = "all" | "pending" | "approved" | "rejected";

// ── Place Detail Modal ─────────────────────────────────────
function PlaceDetailModal({
  place,
  onClose,
  onDelete,
}: {
  place: Place;
  onClose: () => void;
  onDelete: (p: Place) => void;
}) {
  const imgSrc = place.image ? `http://localhost:5001${place.image}` : null;

  return (
    <div className="apl-overlay" onClick={onClose}>
      <div className="apl-detail-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header bar ── */}
        <div className="apl-detail-header">
          <div className="apl-detail-header-info">
            <span className={`apl-badge apl-badge--${place.status}`}>
              {place.status === "approved" && <CheckCircle size={11} strokeWidth={2.5} />}
              {place.status === "pending"  && <Clock       size={11} strokeWidth={2.5} />}
              {place.status === "rejected" && <XCircle     size={11} strokeWidth={2.5} />}
              {place.status.charAt(0).toUpperCase() + place.status.slice(1)}
            </span>
            {place.category && (
              <span className="apl-detail-cat">
                <Tag size={11} strokeWidth={2} /> {place.category}
              </span>
            )}
          </div>
          <button className="apl-detail-close" onClick={onClose}>
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Hero image ── */}
        <div className="apl-detail-hero">
          {imgSrc
            ? <img src={imgSrc} alt={place.name} />
            : (
              <div className="apl-detail-hero-placeholder">
                <MapPin size={48} strokeWidth={1} />
                <span>No photo uploaded</span>
              </div>
            )
          }
        </div>

        {/* ── Body ── */}
        <div className="apl-detail-body">
          <h2 className="apl-detail-name">{place.name}</h2>

          <div className="apl-detail-addr">
            <MapPin size={14} strokeWidth={2} />
            {place.address}
          </div>

          {place.description && (
            <p className="apl-detail-desc">{place.description}</p>
          )}

          {/* Meta grid */}
          <div className="apl-detail-meta">
            <div className="apl-detail-meta-item">
              <div className="apl-detail-meta-label">Submitted By</div>
              <div className="apl-detail-meta-val">
                <User size={13} strokeWidth={2} />
                {place.submitter?.first_name} {place.submitter?.last_name}
              </div>
              {place.submitter?.email && (
                <div className="apl-detail-meta-email">{place.submitter.email}</div>
              )}
            </div>

            <div className="apl-detail-meta-item">
              <div className="apl-detail-meta-label">Date Submitted</div>
              <div className="apl-detail-meta-val">
                <Calendar size={13} strokeWidth={2} />
                {new Date(place.created_at).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric"
                })}
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

          {/* Footer actions */}
          <div className="apl-detail-footer">
            <button className="apl-detail-del-btn" onClick={() => { onClose(); onDelete(place); }}>
              <Trash2 size={15} strokeWidth={2} />
              Delete Place
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
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

  const filtered = places.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setProcessing(deleteConfirm.id);
    await adminApi.deletePlace(deleteConfirm.id);
    setPlaces((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
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

      {/* Controls */}
      <div className="apl-controls">
        <div className="apl-tabs">
          {TABS.map(({ label, value, Icon }) => (
            <button
              key={value}
              className={`apl-tab ${filter === value ? "apl-tab--active" : ""}`}
              onClick={() => setFilter(value)}
            >
              <Icon size={13} strokeWidth={2.5} />
              {label}
            </button>
          ))}
        </div>
        <div className="apl-search-wrap">
          <Search size={15} className="apl-search-icon" />
          <input
            className="apl-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or address..."
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="apl-loading"><div className="apl-spinner" /></div>
      ) : (
        <div className="apl-table-wrap">
          <table className="apl-table">
            <thead>
              <tr>
                <th>Place</th>
                <th>Category</th>
                <th>Submitted By</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="apl-empty">No places found.</td>
                </tr>
              ) : filtered.map((p) => (
                <tr
                  key={p.id}
                  className="apl-row"
                  onClick={() => setSelectedPlace(p)}
                  title="Click to view details"
                >
                  <td>
                    <div className="apl-place-cell">
                      <div className="apl-place-img">
                        {p.image
                          ? <img src={`http://localhost:5001${p.image}`} alt={p.name} />
                          : <MapPin size={20} strokeWidth={1.5} />
                        }
                        <div className="apl-place-img-overlay">
                          <Eye size={14} strokeWidth={2} />
                        </div>
                      </div>
                      <div>
                        <div className="apl-place-name">{p.name}</div>
                        <div className="apl-place-addr">{p.address}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="apl-cat">{p.category || "—"}</span></td>
                  <td className="apl-submitter">
                    {p.submitter?.first_name} {p.submitter?.last_name}
                  </td>
                  <td>
                    <span className={`apl-badge apl-badge--${p.status}`}>
                      {p.status === "approved" && <CheckCircle size={11} strokeWidth={2.5} />}
                      {p.status === "pending"  && <Clock       size={11} strokeWidth={2.5} />}
                      {p.status === "rejected" && <XCircle     size={11} strokeWidth={2.5} />}
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </td>
                  <td className="apl-date">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="apl-del-btn"
                      onClick={() => setDeleteConfirm(p)}
                      title="Delete place"
                    >
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Place Detail Modal */}
      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onDelete={(p) => setDeleteConfirm(p)}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="apl-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="apl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apl-modal-icon-wrap">
              <Trash2 size={28} strokeWidth={1.5} />
            </div>
            <h3 className="apl-modal-title">Delete Place?</h3>
            <p className="apl-modal-msg">
              <strong>"{deleteConfirm.name}"</strong> will be permanently deleted. This cannot be undone.
            </p>
            <div className="apl-modal-actions">
              <button className="apl-btn apl-btn--cancel" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="apl-btn apl-btn--delete"
                onClick={handleDelete}
                disabled={!!processing}
              >
                {processing ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}