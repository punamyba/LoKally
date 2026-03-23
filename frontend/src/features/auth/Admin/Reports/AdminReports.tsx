import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Flag, RefreshCw, CheckCircle, AlertTriangle, X,
  MapPin, MessageSquare, User, Calendar, Eye, EyeOff,
  Trash2, ShieldAlert, ChevronRight, ExternalLink,
  Mail, Bell,
} from "lucide-react";
import axiosInstance from "../../../../shared/config/axiosinstance";
import { getImageUrl } from "../../../../shared/config/imageUrl";
import "./AdminReports.css";

type ReportType = "all" | "post" | "place";
type Report = {
  id: number;
  reason: string;
  note?: string;
  status?: "new" | "open" | "resolved" | "dismissed";
  created_at: string;
  reporter: { id: number; first_name: string; last_name: string; email: string };
  post?: {
    id: number; caption?: string; images?: string;
    author?: { id: number; first_name: string; last_name: string; email: string };
  };
  place?: {
    id: number; name: string; address: string; image?: string;
    submitter?: { id: number; first_name: string; last_name: string; email: string };
  };
  post_id?: number;
  place_id?: number;
};

const REASON_STYLES: Record<string, { color: string; bg: string }> = {
  "Spam content":                  { color: "#b45309", bg: "#fef3c7" },
  "Violates community guidelines": { color: "#dc2626", bg: "#fef2f2" },
  "Hate speech":                   { color: "#7c3aed", bg: "#ede9fe" },
  "Nudity or sexual content":      { color: "#be185d", bg: "#fce7f3" },
  "Violence or dangerous content": { color: "#b91c1c", bg: "#fef2f2" },
  "Harassment or bullying":        { color: "#9a3412", bg: "#ffedd5" },
  "Misinformation":                { color: "#0369a1", bg: "#e0f2fe" },
  "Other":                         { color: "#475569", bg: "#f1f5f9" },
};

function getRS(reason: string) {
  return REASON_STYLES[reason] || { color: "#475569", bg: "#f1f5f9" };
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days < 30 ? `${days}d ago` : new Date(d).toLocaleDateString();
}

function parseThumb(images?: string): string | null {
  if (!images) return null;
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) ? arr[0] : images;
  } catch { return images; }
}

// ── Report Detail Modal ──────────────────────────────────────
function ReportDetailModal({ report, onClose, onAction }: {
  report: Report;
  onClose: () => void;
  onAction: (action: "dismiss" | "hide" | "delete" | "warn", reportId: number) => Promise<void>;
}) {
  const navigate  = useNavigate();
  const [acting,   setActing]   = useState<string | null>(null);
  const [done,     setDone]     = useState("");
  const [warnMsg,  setWarnMsg]  = useState("");
  const [showWarn, setShowWarn] = useState(false);
  const [status,   setStatus]   = useState<string>(report.status || "new");

  const handleStatusChange = async (s: string) => {
    setStatus(s);
    try {
      await axiosInstance.patch(`/admin/reports/${report.id}/status`, { status: s });
    } catch { /* silently fail — UI already updated */ }
  };

  const isPost  = !!report.post;
  const target  = isPost ? report.post : report.place;
  const owner   = isPost ? report.post?.author : report.place?.submitter;
  const thumb   = isPost
    ? parseThumb(report.post?.images)
    : (report.place?.image ? parseThumb(report.place.image) : null);

  const rs = getRS(report.reason);

  const handle = async (action: "dismiss" | "hide" | "delete" | "warn") => {
    setActing(action);
    await onAction(action, report.id);
    setDone(
      action === "dismiss" ? "Report dismissed — content stays visible." :
      action === "hide"    ? "Content hidden from public." :
      action === "delete"  ? "Content deleted permanently." :
      "Warning sent to user."
    );
    setActing(null);
  };

  return (
    <div className="ar-overlay" onClick={onClose}>
      <div className="ar-detail-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ar-detail-head">
          <div className="ar-detail-head-left">
            <div className="ar-detail-flag"><Flag size={15} strokeWidth={2.5} /></div>
            <div>
              <div className="ar-detail-title">Report Detail</div>
              <div className="ar-detail-sub">
                {isPost ? "Community Post" : "Place"} · {timeAgo(report.created_at)}
              </div>
            </div>
          </div>
          <button className="ar-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {done ? (
          <div className="ar-done">
            <CheckCircle size={40} strokeWidth={1.5} className="ar-done-icon" />
            <div className="ar-done-text">{done}</div>
            <button className="ar-done-close" onClick={onClose}>Close</button>
          </div>
        ) : (
          <div className="ar-detail-body">

            {/* Reporter */}
            <div className="ar-section">
              <div className="ar-section-label">Reported by</div>
              <div className="ar-person-row">
                <div className="ar-avatar ar-avatar--red">
                  {report.reporter.first_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="ar-person-name">
                    {report.reporter.first_name} {report.reporter.last_name}
                  </div>
                  <div className="ar-person-sub">{report.reporter.email}</div>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="ar-section">
              <div className="ar-section-label">Reason</div>
              <span className="ar-reason-tag" style={{ color: rs.color, background: rs.bg }}>
                {report.reason || "No reason given"}
              </span>
              {report.note && (
                <div className="ar-note">"{report.note}"</div>
              )}
            </div>

            {/* Reported content */}
            <div className="ar-section">
              <div className="ar-section-label">
                {isPost ? "Reported Post" : "Reported Place"}
              </div>
              <div className="ar-content-card">
                {thumb && (
                  <div className="ar-content-thumb">
                    <img src={getImageUrl(thumb)} alt="" />
                  </div>
                )}
                <div className="ar-content-info">
                  {isPost ? (
                    <>
                      <div className="ar-content-title">
                        {report.post?.caption
                          ? report.post.caption.slice(0, 80) + (report.post.caption.length > 80 ? "…" : "")
                          : <span className="ar-content-no-caption">No caption</span>}
                      </div>
                      <div className="ar-content-owner">
                        <User size={11} strokeWidth={2} />
                        {owner?.first_name} {owner?.last_name}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="ar-content-title">{report.place?.name}</div>
                      <div className="ar-content-owner">
                        <MapPin size={11} strokeWidth={2} />
                        {report.place?.address}
                      </div>
                    </>
                  )}
                </div>
                <button className="ar-content-link"
                  onClick={() => { onClose(); navigate(isPost ? `/community` : `/place/${report.place?.id}`); }}
                  title="View">
                  <ExternalLink size={13} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Owner */}
            {owner && (
              <div className="ar-section">
                <div className="ar-section-label">Content Owner</div>
                <div className="ar-person-row">
                  <div className="ar-avatar">
                    {owner.first_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="ar-person-name">{owner.first_name} {owner.last_name}</div>
                    <div className="ar-person-sub">{owner.email}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Status selector */}
            <div className="ar-section">
              <div className="ar-section-label">Status</div>
              <div className="ar-status-btns">
                {([
                  { key: "new",       label: "New",       cls: "ar-sbtn--new"       },
                  { key: "open",      label: "In Review", cls: "ar-sbtn--open"      },
                  { key: "resolved",  label: "Resolved",  cls: "ar-sbtn--resolved"  },
                  { key: "dismissed", label: "Dismissed", cls: "ar-sbtn--dismissed" },
                ] as any[]).map(s => (
                  <button key={s.key} type="button"
                    className={`ar-sbtn ${s.cls} ${status === s.key ? "ar-sbtn--on" : ""}`}
                    onClick={() => handleStatusChange(s.key)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Warn message input */}
            {showWarn && (
              <div className="ar-section">
                <div className="ar-section-label">Warning message to user</div>
                <textarea
                  className="ar-warn-input"
                  rows={3}
                  placeholder="Write a warning message — will be sent via email and notification..."
                  value={warnMsg}
                  onChange={e => setWarnMsg(e.target.value)}
                />
              </div>
            )}

            {/* Actions */}
            <div className="ar-actions">
              <button className="ar-action-btn ar-action-btn--dismiss"
                onClick={() => handle("dismiss")} disabled={!!acting}>
                <CheckCircle size={14} />
                {acting === "dismiss" ? "Dismissing…" : "Dismiss Report"}
              </button>
              <button className="ar-action-btn ar-action-btn--hide"
                onClick={() => handle("hide")} disabled={!!acting}>
                <EyeOff size={14} />
                {acting === "hide" ? "Hiding…" : "Hide Content"}
              </button>
              {!showWarn ? (
                <button className="ar-action-btn ar-action-btn--warn"
                  onClick={() => setShowWarn(true)} disabled={!!acting}>
                  <ShieldAlert size={14} />
                  Warn User
                </button>
              ) : (
                <button className="ar-action-btn ar-action-btn--warn"
                  onClick={() => handle("warn")} disabled={!!acting || !warnMsg.trim()}>
                  <Mail size={14} />
                  {acting === "warn" ? "Sending…" : "Send Warning"}
                </button>
              )}
              <button className="ar-action-btn ar-action-btn--delete"
                onClick={() => handle("delete")} disabled={!!acting}>
                <Trash2 size={14} />
                {acting === "delete" ? "Deleting…" : "Delete Content"}
              </button>
            </div>

            <div className="ar-actions-note">
              <Bell size={11} strokeWidth={2} /> Hide/Delete/Warn will notify the content owner via email and in-app notification.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main AdminReports page ───────────────────────────────────
export default function AdminReports() {
  const [searchParams] = useSearchParams();
  const highlightPostId = searchParams.get("postId");

  const [reports,  setReports]  = useState<Report[]>([]);
  const [filter,   setFilter]   = useState<ReportType>("all");
  const [loading,  setLoading]  = useState(true);
  const [selReport, setSelReport] = useState<Report | null>(null);
  const [toast,    setToast]    = useState<{ ok: boolean; msg: string } | null>(null);

  const notify = useCallback((ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get("/admin/reports", { params: { type: filter === "all" ? undefined : filter } });
      if (r.data?.success) setReports(r.data.data || []);
    } catch { notify(false, "Failed to load reports."); }
    setLoading(false);
  }, [filter, notify]);

  useEffect(() => { load(); }, [load]);

  // Highlight row if redirected from community popup — user clicks to open

  const handleAction = async (action: "dismiss" | "hide" | "delete" | "warn", reportId: number) => {
    const rep = reports.find(r => r.id === reportId);
    if (!rep) return;
    try {
      if (action === "dismiss") {
        await axiosInstance.patch(`/admin/reports/${reportId}/dismiss`);
        setReports(prev => prev.filter(r => r.id !== reportId));
        notify(true, "Report dismissed.");
      } else if (action === "hide") {
        const endpoint = rep.post_id
          ? `/admin/community/${rep.post_id}/hide`
          : `/admin/places/${rep.place_id}/hide`;
        await axiosInstance.patch(endpoint);
        setReports(prev => prev.filter(r => r.id !== reportId));
        notify(true, "Content hidden. Owner notified.");
      } else if (action === "delete") {
        const endpoint = rep.post_id
          ? `/admin/community/${rep.post_id}/delete`
          : `/admin/places/${rep.place_id}`;
        await axiosInstance.delete(endpoint);
        setReports(prev => prev.filter(r => r.id !== reportId));
        notify(true, "Content deleted. Owner notified.");
      } else if (action === "warn") {
        await axiosInstance.post(`/admin/users/${rep.reporter.id}/warn`, {
          reason: rep.reason,
          contentType: rep.post_id ? "post" : "place",
        });
        notify(true, "Warning sent to user via email and notification.");
      }
    } catch { notify(false, "Action failed. Please try again."); }
  };

  const filtered = reports.filter(r =>
    filter === "all"   ? true :
    filter === "post"  ? !!r.post_id :
    filter === "place" ? !!r.place_id : true
  );

  const postCount  = reports.filter(r => !!r.post_id).length;
  const placeCount = reports.filter(r => !!r.place_id).length;

  return (
    <div className="ar-root">

      {/* Header */}
      <div className="ar-header">
        <div>
          <h1 className="ar-title"><Flag size={22} strokeWidth={2} /> Reported Content</h1>
          <p className="ar-sub">Review content flagged by users across the platform.</p>
        </div>
        <button className="ar-refresh" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "ar-spin" : ""} strokeWidth={2.5} /> Refresh
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`ar-toast ${toast.ok ? "ar-toast--ok" : "ar-toast--err"}`}>
          {toast.ok ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
          {toast.msg}
        </div>
      )}

      {/* Filter tabs */}
      <div className="ar-filters">
        {([
          { key: "all",   label: "All Flags",    count: reports.length },
          { key: "post",  label: "Posts",         count: postCount,  Icon: MessageSquare },
          { key: "place", label: "Places",        count: placeCount, Icon: MapPin },
        ] as any[]).map(f => (
          <button key={f.key} type="button"
            className={`ar-filter ${filter === f.key ? "ar-filter--on" : ""}`}
            onClick={e => { e.stopPropagation(); setFilter(f.key); }}>
            {f.Icon && <f.Icon size={13} strokeWidth={2} />}
            {f.label}
            <span className={`ar-filter-count ${filter === f.key ? "ar-filter-count--on" : ""}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="ar-loading"><div className="ar-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="ar-empty">
          <Flag size={40} strokeWidth={1.2} />
          <span>No reports found</span>
        </div>
      ) : (
        <div className="ar-table-wrap">
          <table className="ar-table">
            <thead>
              <tr>
                <th>Reported Content</th>
                <th>Type</th>
                <th>Reported By</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const isPost  = !!r.post_id;
                const thumb   = isPost ? parseThumb(r.post?.images) : parseThumb(r.place?.image);
                const title   = isPost
                  ? (r.post?.caption?.slice(0, 50) || "No caption")
                  : (r.place?.name || "—");
                const owner   = isPost ? r.post?.author : r.place?.submitter;
                const rs      = getRS(r.reason);
                const isHighlighted = highlightPostId && String(r.post_id) === highlightPostId;

                return (
                  <tr key={r.id}
                    className={`ar-row ${isHighlighted ? "ar-row--highlighted" : ""}`}
                    onClick={() => setSelReport(r)}>
                    <td>
                      <div className="ar-content-cell">
                        <div className="ar-content-cell-thumb">
                          {thumb
                            ? <img src={getImageUrl(thumb)} alt="" />
                            : <div className="ar-content-cell-icon">
                                {isPost ? <MessageSquare size={16} strokeWidth={1.5} /> : <MapPin size={16} strokeWidth={1.5} />}
                              </div>}
                        </div>
                        <div>
                          <div className="ar-content-cell-title">{title}{title.length >= 50 ? "…" : ""}</div>
                          <div className="ar-content-cell-owner">
                            {owner?.first_name} {owner?.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`ar-type-badge ar-type-badge--${isPost ? "post" : "place"}`}>
                        {isPost ? <MessageSquare size={10} strokeWidth={2.5} /> : <MapPin size={10} strokeWidth={2.5} />}
                        {isPost ? "Post" : "Place"}
                      </span>
                    </td>
                    <td>
                      <div className="ar-reporter-cell">
                        <div className="ar-avatar ar-avatar--sm ar-avatar--red">
                          {r.reporter.first_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="ar-reporter-name">{r.reporter.first_name} {r.reporter.last_name}</div>
                          <div className="ar-reporter-email">{r.reporter.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="ar-reason-tag" style={{ color: rs.color, background: rs.bg }}>
                        {r.reason || "No reason"}
                      </span>
                    </td>
                    <td>
                      <span className={`ar-status-badge ar-status-badge--${r.status || "new"}`}>
                        {r.status === "resolved" ? "Resolved" :
                         r.status === "dismissed" ? "Dismissed" :
                         r.status === "open" ? "In Review" : "New"}
                      </span>
                    </td>
                    <td className="ar-date">{timeAgo(r.created_at)}</td>
                    <td>
                      <ChevronRight size={15} strokeWidth={2} className="ar-row-arrow" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selReport && (
        <ReportDetailModal
          report={selReport}
          onClose={() => setSelReport(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}