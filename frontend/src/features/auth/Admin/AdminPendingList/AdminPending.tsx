// AdminPending.tsx — LoKally Admin v2
import { useEffect, useState } from "react";
import { MapPin, CheckCircle, XCircle, Clock, User, Calendar } from "lucide-react";
import { adminApi } from "../AdminApi";
import type { Place } from "../AdminTypes";
import "./AdminPending.css";

export default function AdminPending() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<Place | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    adminApi.getPlaces("pending").then((res) => {
      if (res.success) setPlaces(res.data);
      setLoading(false);
    });
  }, []);

  const handleApprove = async (id: number) => {
    setProcessing(id);
    const res = await adminApi.approvePlace(id);
    if (res.success) setPlaces((prev) => prev.filter((p) => p.id !== id));
    setProcessing(null);
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setProcessing(rejectModal.id);
    const res = await adminApi.rejectPlace(rejectModal.id, rejectReason);
    if (res.success) setPlaces((prev) => prev.filter((p) => p.id !== rejectModal.id));
    setRejectModal(null);
    setRejectReason("");
    setProcessing(null);
  };

  if (loading) return <div className="apd-loading"><div className="apd-spinner" /></div>;

  return (
    <div className="apd-root">

      <div className="apd-header">
        <h1 className="apd-title">
          <Clock size={24} strokeWidth={2} />
          Pending Review
        </h1>
        <p className="apd-subtitle">
          {places.length} place{places.length !== 1 ? "s" : ""} waiting for your decision
        </p>
      </div>

      {places.length === 0 ? (
        <div className="apd-empty">
          <CheckCircle size={48} strokeWidth={1.2} className="apd-empty-icon" />
          <div className="apd-empty-title">All caught up!</div>
          <div className="apd-empty-sub">No pending places to review.</div>
        </div>
      ) : (
        <div className="apd-list">
          {places.map((place) => (
            <div key={place.id} className="apd-card">
              <div className="apd-card-img">
                {place.image
                  ? <img src={`http://localhost:5001${place.image}`} alt={place.name} />
                  : <div className="apd-card-img-placeholder"><MapPin size={32} strokeWidth={1.5} /></div>
                }
                <span className="apd-card-cat">{place.category || "Uncategorized"}</span>
              </div>

              <div className="apd-card-body">
                <div className="apd-card-top">
                  <div>
                    <h3 className="apd-card-name">{place.name}</h3>
                    <div className="apd-card-address">
                      <MapPin size={12} strokeWidth={2} /> {place.address}
                    </div>
                  </div>
                  <span className="apd-badge-pending">
                    <Clock size={10} strokeWidth={2.5} /> Pending
                  </span>
                </div>

                {place.description && (
                  <p className="apd-card-desc">{place.description}</p>
                )}

                <div className="apd-card-meta">
                  <div className="apd-meta-item">
                    <User size={12} strokeWidth={2} />
                    <span>
                      {place.submitter?.first_name} {place.submitter?.last_name}
                      <em> ({place.submitter?.email})</em>
                    </span>
                  </div>
                  <div className="apd-meta-item">
                    <MapPin size={12} strokeWidth={2} />
                    <span>{parseFloat(place.lat).toFixed(4)}, {parseFloat(place.lng).toFixed(4)}</span>
                  </div>
                  <div className="apd-meta-item">
                    <Calendar size={12} strokeWidth={2} />
                    <span>{new Date(place.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="apd-card-actions">
                  <button
                    className="apd-btn apd-btn--approve"
                    onClick={() => handleApprove(place.id)}
                    disabled={processing === place.id}
                  >
                    <CheckCircle size={15} strokeWidth={2} />
                    {processing === place.id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    className="apd-btn apd-btn--reject"
                    onClick={() => { setRejectModal(place); setRejectReason(""); }}
                    disabled={processing === place.id}
                  >
                    <XCircle size={15} strokeWidth={2} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectModal && (
        <div className="apd-overlay" onClick={() => setRejectModal(null)}>
          <div className="apd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apd-modal-header">
              <h3 className="apd-modal-title">
                <XCircle size={18} strokeWidth={2} /> Reject Place
              </h3>
              <button className="apd-modal-close" onClick={() => setRejectModal(null)}>✕</button>
            </div>

            <div className="apd-modal-place">
              <strong>{rejectModal.name}</strong>
              <span>{rejectModal.address}</span>
            </div>

            <div className="apd-modal-body">
              <label className="apd-modal-label">
                Reason for rejection <span className="apd-required">*</span>
              </label>
              <textarea
                className="apd-modal-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Blurry images, duplicate place, incorrect location..."
                rows={4}
                autoFocus
              />
              <div className="apd-modal-hint">
                This reason will be saved and visible in All Places.
              </div>
            </div>

            <div className="apd-modal-footer">
              <button className="apd-btn apd-btn--cancel" onClick={() => setRejectModal(null)}>
                Cancel
              </button>
              <button
                className="apd-btn apd-btn--reject"
                onClick={handleReject}
                disabled={!rejectReason.trim() || processing !== null}
              >
                <XCircle size={14} strokeWidth={2} />
                {processing ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}