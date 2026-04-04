import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, CheckCircle, Clock, User, Calendar,
  ChevronRight, X, RefreshCw, AlertTriangle, Images, XCircle,
} from "lucide-react";
import { adminApi } from "../adminApi";
import axiosInstance from "../../../../shared/config/axiosinstance";
import type { Place } from "../AdminTypes";
import { getImageUrl } from "../../../../shared/config/imageUrl";
import "./AdminPending.css";

const SERVER = "http://localhost:5001";
const toUrl  = (p: string) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

function parseImages(image: string | null | undefined): string[] {
  if (!image) return [];
  if (image.startsWith("[")) {
    try { return (JSON.parse(image) as string[]).map(p => getImageUrl(p)); }
    catch { return [getImageUrl(image)]; }
  }
  return [getImageUrl(image)];
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Visit {
  id: number; visit_date: string; experience: string | null;
  photo: string | null; status: string; created_at: string;
  place: { id: number; name: string; image: string | null; address: string };
  user:  { id: number; first_name: string; last_name: string; email: string };
}

type Tab = "places" | "visits";
type VisitFilter = "pending" | "approved" | "rejected";

export default function AdminPending() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("places");

  // ── Places state ──────────────────────────────────────────
  const [places,  setPlaces]  = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);

  useEffect(() => {
    adminApi.getPlaces("pending").then(res => {
      if (res.success) setPlaces(res.data);
      setPlacesLoading(false);
    });
  }, []);

  // ── Visits state ──────────────────────────────────────────
  const [visits,       setVisits]       = useState<Visit[]>([]);
  const [visitFilter,  setVisitFilter]  = useState<VisitFilter>("pending");
  const [visitsLoading,setVisitsLoading]= useState(false);
  const [visitTotal,   setVisitTotal]   = useState(0);
  const [selectedVisit,setSelectedVisit]= useState<Visit | null>(null);
  const [acting,       setActing]       = useState<"approve" | "reject" | null>(null);
  const [rejectMsg,    setRejectMsg]    = useState("");
  const [showReject,   setShowReject]   = useState(false);
  const [toast,        setToast]        = useState<{ ok: boolean; msg: string } | null>(null);

  const notify = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const loadVisits = useCallback(async () => {
    setVisitsLoading(true);
    try {
      const r = await axiosInstance.get("/admin/visit-status", {
        params: { status: visitFilter, page: 1, limit: 50 },
      });
      if (r.data.success) {
        setVisits(r.data.data);
        setVisitTotal(r.data.total);
      }
    } catch { notify(false, "Failed to load visits."); }
    setVisitsLoading(false);
  }, [visitFilter]);

  useEffect(() => {
    if (tab === "visits") loadVisits();
  }, [tab, visitFilter]);

  const handleApprove = async (visitId: number) => {
    setActing("approve");
    try {
      await axiosInstance.patch(`/admin/visit-status/${visitId}/approve`);
      setVisits(prev => prev.filter(v => v.id !== visitId));
      setVisitTotal(t => t - 1);
      setSelectedVisit(null);
      notify(true, "Visit approved!");
    } catch { notify(false, "Failed to approve."); }
    setActing(null);
  };

  const handleReject = async (visitId: number) => {
    setActing("reject");
    try {
      await axiosInstance.patch(`/admin/visit-status/${visitId}/reject`, { reason: rejectMsg });
      setVisits(prev => prev.filter(v => v.id !== visitId));
      setVisitTotal(t => t - 1);
      setSelectedVisit(null); setShowReject(false); setRejectMsg("");
      notify(true, "Visit rejected. User notified.");
    } catch { notify(false, "Failed to reject."); }
    setActing(null);
  };

  const closeVisitModal = () => {
    setSelectedVisit(null); setShowReject(false); setRejectMsg("");
  };

  const handleUnapprove = async (visitId: number) => {
    setActing("reject");
    try {
      await axiosInstance.delete(`/admin/visit-status/${visitId}`);
      setVisits(prev => prev.filter(v => v.id !== visitId));
      setVisitTotal(t => t - 1);
      setSelectedVisit(null);
      notify(true, "Visit removed.");
    } catch { notify(false, "Failed to remove visit."); }
    setActing(null);
  };

  // pending visits count for badge
  const [pendingVisitCount, setPendingVisitCount] = useState(0);
  useEffect(() => {
    axiosInstance.get("/admin/visit-status", { params: { status: "pending", page: 1, limit: 1 } })
      .then(r => { if (r.data.success) setPendingVisitCount(r.data.total); })
      .catch(() => {});
  }, []);

  return (
    <div className="apd-root">
      <div className="apd-header">
        <h1 className="apd-title">
          <Clock size={24} strokeWidth={2} /> Pending Review
        </h1>
        <p className="apd-subtitle">Review place submissions and user visit verifications.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`apd-toast ${toast.ok ? "apd-toast--ok" : "apd-toast--err"}`}>
          {toast.ok ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="apd-tabs">
        <button className={`apd-tab ${tab === "places" ? "apd-tab--on" : ""}`}
          onClick={() => setTab("places")} type="button">
          <MapPin size={14} strokeWidth={2} /> Place Submissions
          <span className={`apd-tab-count ${tab === "places" ? "apd-tab-count--on" : ""}`}>
            {places.length}
          </span>
        </button>
        <button className={`apd-tab ${tab === "visits" ? "apd-tab--on" : ""}`}
          onClick={() => setTab("visits")} type="button">
          <CheckCircle size={14} strokeWidth={2} /> Visit Verifications
          {pendingVisitCount > 0 && (
            <span className={`apd-tab-count ${tab === "visits" ? "apd-tab-count--on" : ""} apd-tab-count--red`}>
              {pendingVisitCount}
            </span>
          )}
        </button>
      </div>

      {/* ── PLACES TAB ── */}
      {tab === "places" && (
        <>
          {placesLoading ? (
            <div className="apd-loading"><div className="apd-spinner" /></div>
          ) : places.length === 0 ? (
            <div className="apd-empty">
              <CheckCircle size={48} strokeWidth={1.2} className="apd-empty-icon" />
              <div className="apd-empty-title">All caught up!</div>
              <div className="apd-empty-sub">No pending places to review.</div>
            </div>
          ) : (
            <div className="apd-list">
              {places.map(place => {
                const photos = parseImages(place.image);
                const coverImg = photos[0] || null;
                return (
                  <div key={place.id} className="apd-card apd-card--clickable"
                    onClick={() => navigate(`/admin/pending/${place.id}`)}>
                    <div className="apd-card-img">
                      {coverImg
                        ? <img src={coverImg} alt={place.name} />
                        : <div className="apd-card-img-placeholder"><MapPin size={32} strokeWidth={1.5} /></div>
                      }
                      {photos.length > 1 && <span className="apd-card-img-count">+{photos.length} photos</span>}
                      {place.category && <span className="apd-card-cat">{place.category}</span>}
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
                      {place.description && <p className="apd-card-desc">{place.description}</p>}
                      <div className="apd-card-meta">
                        <div className="apd-meta-item">
                          <User size={12} strokeWidth={2} />
                          <span>{place.submitter?.first_name} {place.submitter?.last_name}</span>
                        </div>
                        <div className="apd-meta-item">
                          <Calendar size={12} strokeWidth={2} />
                          <span>{new Date(place.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="apd-card-review-hint">
                        <span>Click to review & decide</span>
                        <ChevronRight size={15} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── VISITS TAB ── */}
      {tab === "visits" && (
        <>
          {/* Visit filter + refresh */}
          <div className="apd-visit-filters">
            {(["pending", "approved", "rejected"] as VisitFilter[]).map(f => (
              <button key={f} type="button"
                className={`apd-vfilter ${visitFilter === f ? "apd-vfilter--on" : ""}`}
                onClick={() => setVisitFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "pending" && pendingVisitCount > 0 && (
                  <span className="apd-vfilter-badge">{pendingVisitCount}</span>
                )}
              </button>
            ))}
            <button type="button" className="apd-vfilter apd-vfilter--refresh" onClick={loadVisits}>
              <RefreshCw size={13} strokeWidth={2.5} className={visitsLoading ? "apd-spin" : ""} />
            </button>
          </div>

          {visitsLoading ? (
            <div className="apd-loading"><div className="apd-spinner" /></div>
          ) : visits.length === 0 ? (
            <div className="apd-empty">
              <CheckCircle size={48} strokeWidth={1.2} className="apd-empty-icon" />
              <div className="apd-empty-title">No {visitFilter} visits</div>
              <div className="apd-empty-sub">
                {visitFilter === "pending" ? "No visits waiting for review." : `No ${visitFilter} visits yet.`}
              </div>
            </div>
          ) : (
            <div className="apd-visit-list">
              {visits.map(v => (
                <div key={v.id} className="apd-visit-card" onClick={() => setSelectedVisit(v)}>
                  {/* Place thumb */}
                  <div className="apd-visit-thumb">
                    {v.place.image
                      ? <img src={toUrl(v.place.image)} alt="" />
                      : <MapPin size={18} strokeWidth={1.5} />
                    }
                  </div>

                  {/* Info */}
                  <div className="apd-visit-info">
                    <div className="apd-visit-place">{v.place.name}</div>
                    <div className="apd-visit-user">
                      <User size={11} strokeWidth={2} />
                      {v.user.first_name} {v.user.last_name} · {v.user.email}
                    </div>
                    <div className="apd-visit-meta">
                      <span><Calendar size={11} /> {v.visit_date}</span>
                      {v.photo && <span><Images size={11} /> Photo attached</span>}
                      {v.experience && <span className="apd-visit-exp">"{v.experience.slice(0, 60)}{v.experience.length > 60 ? "…" : ""}"</span>}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="apd-visit-right">
                    <span className={`apd-vstatus apd-vstatus--${v.status}`}>{v.status}</span>
                    <span className="apd-visit-time">{timeAgo(v.created_at)}</span>
                    <ChevronRight size={15} strokeWidth={2} className="apd-visit-arrow" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── VISIT DETAIL MODAL ── */}
      {selectedVisit && (
        <div className="apd-overlay" onClick={closeVisitModal}>
          <div className="apd-visit-modal" onClick={e => e.stopPropagation()}>
            <div className="apd-modal-head">
              <div className="apd-modal-icon">
                <CheckCircle size={16} strokeWidth={2.5} />
              </div>
              <div>
                <div className="apd-modal-title">Visit Verification</div>
                <div className="apd-modal-sub">{selectedVisit.place.name} · {timeAgo(selectedVisit.created_at)}</div>
              </div>
              <button className="apd-modal-close" onClick={closeVisitModal}><X size={16} /></button>
            </div>

            <div className="apd-modal-body">
              {/* User */}
              <div className="apd-modal-row">
                <div className="apd-modal-label"><User size={11} /> Submitted By</div>
                <div className="apd-modal-user-info">
                  <div className="apd-modal-avatar">
                    {selectedVisit.user.first_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="apd-modal-uname">
                      {selectedVisit.user.first_name} {selectedVisit.user.last_name}
                    </div>
                    <div className="apd-modal-uemail">{selectedVisit.user.email}</div>
                  </div>
                </div>
              </div>

              {/* Visit date */}
              <div className="apd-modal-row">
                <div className="apd-modal-label"><Calendar size={11} /> Visit Date</div>
                <div className="apd-modal-value">{selectedVisit.visit_date}</div>
              </div>

              {/* Experience */}
              {selectedVisit.experience && (
                <div className="apd-modal-row">
                  <div className="apd-modal-label">Experience</div>
                  <div className="apd-modal-experience">{selectedVisit.experience}</div>
                </div>
              )}

              {/* Photo */}
              <div className="apd-modal-row">
                <div className="apd-modal-label"><Images size={11} /> Photo Proof</div>
                {selectedVisit.photo
                  ? <img src={toUrl(selectedVisit.photo)} alt="proof" className="apd-modal-photo" />
                  : <div className="apd-modal-no-photo">No photo submitted</div>
                }
              </div>

              {/* Reject reason */}
              {showReject && (
                <div className="apd-modal-row">
                  <div className="apd-modal-label">Rejection reason (optional)</div>
                  <textarea className="apd-reject-input" rows={2}
                    value={rejectMsg} onChange={e => setRejectMsg(e.target.value)}
                    placeholder="e.g. Photo doesn't clearly show the location..." />
                </div>
              )}

              {/* Actions */}
              {selectedVisit.status === "pending" && (
                <div className="apd-modal-actions">
                  <button className="apd-act-btn apd-act-btn--approve"
                    onClick={() => handleApprove(selectedVisit.id)} disabled={!!acting}>
                    <CheckCircle size={14} />
                    {acting === "approve" ? "Approving…" : "Approve Visit"}
                  </button>
                  {!showReject ? (
                    <button className="apd-act-btn apd-act-btn--reject"
                      onClick={() => setShowReject(true)} disabled={!!acting}>
                      <X size={14} /> Reject
                    </button>
                  ) : (
                    <button className="apd-act-btn apd-act-btn--reject"
                      onClick={() => handleReject(selectedVisit.id)} disabled={!!acting}>
                      <X size={14} />
                      {acting === "reject" ? "Rejecting…" : "Confirm Reject"}
                    </button>
                  )}
                </div>
              )}

              {selectedVisit.status !== "pending" && (
                <div className={`apd-modal-resolved apd-modal-resolved--${selectedVisit.status}`}>
                  {selectedVisit.status === "approved"
                    ? "✅ This visit was approved — 15 points awarded"
                    : "❌ This visit was rejected"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}