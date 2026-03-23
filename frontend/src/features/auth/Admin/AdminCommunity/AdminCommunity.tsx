import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, Flag, EyeOff, Eye, Trash2, RefreshCw,
  ChevronRight, CheckCircle, AlertTriangle,
  Heart, ChevronDown, User, Calendar, Image as ImageIcon,
  X, ChevronLeft,
} from "lucide-react";
import { communityApi } from "../../Community/communityApi";
import type { Post } from "../../Community/CommunityTypes";
import axiosInstance from "../../../../shared/config/axiosinstance";
import "./AdminCommunity.css";
import { getImageUrl } from "../../../../shared/config/imageUrl";

type Filter  = "all" | "reported" | "hidden";
type RichPost = Post & { _images: string[]; _thumb: string | null; };

function parseImages(raw: string | null): string[] {
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [raw]; }
  catch { return [raw]; }
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function enrich(posts: Post[]): RichPost[] {
  return posts.map(p => {
    const imgs = parseImages(p.images);
    return { ...p, _images: imgs, _thumb: imgs[0] || null };
  });
}

const PAGE_SIZE = 10;

// ── Image Lightbox ──────────────────────────────────────────
function Lightbox({ images, startIdx, onClose }: {
  images: string[]; startIdx: number; onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  setIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <div className="ac-lightbox" onClick={onClose}>
      <button className="ac-lightbox-close" onClick={onClose}><X size={20} /></button>
      <div className="ac-lightbox-counter">{idx + 1} / {images.length}</div>
      {images.length > 1 && (
        <button className="ac-lightbox-arr ac-lightbox-arr--l"
          onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}>
          <ChevronLeft size={24} />
        </button>
      )}
      <div className="ac-lightbox-img-wrap" onClick={e => e.stopPropagation()}>
        <img src={getImageUrl(images[idx])} alt="" />
      </div>
      {images.length > 1 && (
        <button className="ac-lightbox-arr ac-lightbox-arr--r"
          onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}>
          <ChevronRight size={24} />
        </button>
      )}
      {images.length > 1 && (
        <div className="ac-lightbox-thumbs">
          {images.map((img, i) => (
            <button key={i}
              className={`ac-lightbox-thumb ${i === idx ? "active" : ""}`}
              onClick={e => { e.stopPropagation(); setIdx(i); }}>
              <img src={getImageUrl(img)} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Likes / Comments Modal ──────────────────────────────────
function StatModal({ title, postId, type, onClose }: {
  title: string; postId: number;
  type: "likes" | "comments";
  onClose: () => void;
}) {
  const [data,    setData]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let r: any;
        if (type === "likes")    r = await axiosInstance.get(`/posts/${postId}/likes`);
        if (type === "comments") r = await axiosInstance.get(`/posts/${postId}/comments`);
        if (r?.data?.success) setData(r.data.data || []);
      } catch {}
      setLoading(false);
    })();
  }, [postId, type]);

  return (
    <div className="ac-modal-overlay" onClick={onClose}>
      <div className="ac-modal" onClick={e => e.stopPropagation()}>
        <div className="ac-modal-head">
          <div className="ac-modal-title">{title}</div>
          <button className="ac-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="ac-modal-body">
          {loading ? (
            <div className="ac-modal-loading"><div className="ac-spinner-sm" /></div>
          ) : data.length === 0 ? (
            <div className="ac-modal-empty">No {type} yet.</div>
          ) : type === "likes" ? (
            data.map((u: any) => (
              <div key={u.id} className="ac-modal-row">
                <div className="ac-modal-avatar">{u.first_name?.[0]?.toUpperCase() || "?"}</div>
                <div>
                  <div className="ac-modal-name">{u.first_name} {u.last_name}</div>
                  <div className="ac-modal-sub">{u.email}</div>
                </div>
              </div>
            ))
          ) : (
            data.flatMap((c: any) => [c, ...(c.replies || [])]).map((c: any) => (
              <div key={c.id} className={`ac-modal-row ${c.parent_id ? "ac-modal-row--reply" : ""}`}>
                <div className="ac-modal-avatar">
                  {(c.commenter?.first_name || c.user?.first_name || "?")?.[0]?.toUpperCase()}
                </div>
                <div className="ac-modal-comment-body">
                  <div className="ac-modal-name">
                    {c.commenter?.first_name || c.user?.first_name || "Unknown"}{" "}
                    {c.commenter?.last_name  || c.user?.last_name  || ""}
                    {c.parent_id && <span className="ac-modal-reply-badge">↩ reply</span>}
                  </div>
                  <div className="ac-modal-comment-text">{c.body || c.content || ""}</div>
                  <div className="ac-modal-sub">{timeAgo(c.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reports Modal — Facebook/Instagram style ────────────────
const REPORT_REASONS: Record<string, { label: string; color: string; bg: string }> = {
  "Spam content":                  { label: "Spam",              color: "#b45309", bg: "#fef3c7" },
  "Violates community guidelines": { label: "Community Guidelines", color: "#dc2626", bg: "#fef2f2" },
  "Hate speech":                   { label: "Hate Speech",       color: "#7c3aed", bg: "#ede9fe" },
  "Nudity or sexual content":      { label: "Adult Content",     color: "#be185d", bg: "#fce7f3" },
  "Violence or dangerous content": { label: "Violence",          color: "#b91c1c", bg: "#fef2f2" },
  "Harassment or bullying":        { label: "Harassment",        color: "#9a3412", bg: "#ffedd5" },
  "Misinformation":                { label: "Misinformation",    color: "#0369a1", bg: "#e0f2fe" },
  "Other":                         { label: "Other",             color: "#475569", bg: "#f1f5f9" },
};

function getReasonStyle(reason: string) {
  return REPORT_REASONS[reason] || { label: reason || "No reason", color: "#475569", bg: "#f1f5f9" };
}

function ReportsModal({ postId, reportCount, onClose, onDismissAll, onHidePost, onDeletePost }: {
  postId: number;
  reportCount: number;
  onClose: () => void;
  onDismissAll: () => void;
  onHidePost: () => void;
  onDeletePost: () => void;
}) {
  const navigate = useNavigate();
  const [reports,  setReports]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selReport, setSelReport] = useState<any | null>(null);
  const [acting,   setActing]   = useState(false);
  const [done,     setDone]     = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await axiosInstance.get(`/admin/posts/${postId}/reports`);
        if (r?.data?.success) setReports(r.data.data || []);
      } catch {}
      setLoading(false);
    })();
  }, [postId]);

  const handleDismissAll = async () => {
    setActing(true);
    await onDismissAll();
    setDone("Reports dismissed — post stays visible.");
    setActing(false);
  };

  const handleHide = async () => {
    setActing(true);
    await onHidePost();
    setDone("Post hidden from public view.");
    setActing(false);
  };

  const handleDelete = async () => {
    setActing(true);
    await onDeletePost();
    onClose();
  };

  // Group by reason for summary
  const reasonCounts = reports.reduce((acc: Record<string, number>, r) => {
    const key = r.reason || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="ac-modal-overlay" onClick={onClose}>
      <div className="ac-rmodal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ac-rmodal-head">
          <div className="ac-rmodal-head-left">
            <div className="ac-rmodal-flag-icon"><Flag size={16} strokeWidth={2.5} /></div>
            <div>
              <div className="ac-rmodal-title">Reports</div>
              <div className="ac-rmodal-sub">{reportCount} report{reportCount !== 1 ? "s" : ""} on this post</div>
            </div>
          </div>
          <button className="ac-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {done ? (
          <div className="ac-rmodal-done">
            <CheckCircle size={36} strokeWidth={1.5} className="ac-rmodal-done-icon" />
            <div className="ac-rmodal-done-text">{done}</div>
            <button className="ac-rmodal-close-btn" onClick={onClose}>Close</button>
          </div>
        ) : selReport ? (
          /* ── Single report detail view ── */
          <div className="ac-rmodal-detail">
            <button className="ac-rmodal-back" onClick={() => setSelReport(null)}>
              <ChevronLeft size={14} strokeWidth={2.5} /> Back to all reports
            </button>
            <div className="ac-rmodal-detail-card">
              <div className="ac-rmodal-reporter">
                <div className="ac-modal-avatar ac-modal-avatar--red">
                  {selReport.reporter?.first_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="ac-modal-name">
                    {selReport.reporter?.first_name} {selReport.reporter?.last_name}
                  </div>
                  <div className="ac-modal-sub">{selReport.reporter?.email}</div>
                  <div className="ac-modal-sub">{timeAgo(selReport.created_at)}</div>
                </div>
              </div>
              <div className="ac-rmodal-reason-block">
                <div className="ac-rmodal-reason-label">Reported for</div>
                {(() => {
                  const s = getReasonStyle(selReport.reason);
                  return (
                    <span className="ac-rmodal-reason-tag" style={{ color: s.color, background: s.bg }}>
                      {s.label}
                    </span>
                  );
                })()}
              </div>
              {selReport.note && (
                <div className="ac-rmodal-note">
                  <div className="ac-rmodal-note-label">Additional note</div>
                  <div className="ac-rmodal-note-text">"{selReport.note}"</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Reports list view ── */
          <>
            {/* Reason summary pills */}
            {!loading && Object.keys(reasonCounts).length > 0 && (
              <div className="ac-rmodal-summary">
                {Object.entries(reasonCounts).map(([reason, count]) => {
                  const s = getReasonStyle(reason);
                  return (
                    <span key={reason} className="ac-rmodal-summary-pill"
                      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}22` }}>
                      {s.label} · {count}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Report list */}
            <div className="ac-rmodal-list">
              {loading ? (
                <div className="ac-modal-loading"><div className="ac-spinner-sm" /></div>
              ) : reports.length === 0 ? (
                <div className="ac-modal-empty">No reports found.</div>
              ) : reports.map((r: any) => {
                const s = getReasonStyle(r.reason);
                return (
                  <button key={r.id} className="ac-rmodal-item" onClick={() => { onClose(); navigate(`/admin/reports?postId=${postId}`); }}>
                    <div className="ac-modal-avatar ac-modal-avatar--red">
                      {r.reporter?.first_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="ac-rmodal-item-body">
                      <div className="ac-rmodal-item-name">
                        {r.reporter?.first_name} {r.reporter?.last_name}
                      </div>
                      <span className="ac-rmodal-reason-tag"
                        style={{ color: s.color, background: s.bg }}>
                        {s.label}
                      </span>
                      <div className="ac-rmodal-item-time">{timeAgo(r.created_at)}</div>
                    </div>
                    <ChevronRight size={14} className="ac-rmodal-item-arrow" />
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="ac-rmodal-actions">
              <div className="ac-rmodal-actions-label">Take action on this post</div>
              <div className="ac-rmodal-btns">
                <button className="ac-rmodal-btn ac-rmodal-btn--dismiss"
                  onClick={handleDismissAll} disabled={acting}>
                  <CheckCircle size={14} />
                  Dismiss All Reports
                </button>
                <button className="ac-rmodal-btn ac-rmodal-btn--hide"
                  onClick={handleHide} disabled={acting}>
                  <EyeOff size={14} />
                  Hide Post
                </button>
                <button className="ac-rmodal-btn ac-rmodal-btn--delete"
                  onClick={handleDelete} disabled={acting}>
                  <Trash2 size={14} />
                  Delete Post
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Memoized list item ──────────────────────────────────────
const PostItem = memo(({ post, active, onSelect }: {
  post: RichPost; active: boolean; onSelect: (id: number) => void;
}) => (
  <button
    className={`ac-item ${active ? "ac-item--active" : ""} ${post.is_hidden ? "ac-item--hidden" : ""}`}
    onClick={() => onSelect(post.id)}>
    <div className="ac-item-thumb">
      {post._thumb
        ? <img src={getImageUrl(post._thumb)} alt="" loading="lazy" decoding="async" />
        : <div className="ac-item-thumb-icon"><ImageIcon size={18} strokeWidth={1.5} /></div>}
    </div>
    <div className="ac-item-info">
      <div className="ac-item-name">{post.author?.first_name} {post.author?.last_name}</div>
      <div className="ac-item-caption">
        {post.caption
          ? (post.caption.length > 55 ? post.caption.slice(0, 55) + "…" : post.caption)
          : <span className="ac-item-no-caption">No caption</span>}
      </div>
      <div className="ac-item-meta">
        <span className="ac-item-time">{timeAgo(post.created_at)}</span>
        {post.reports_count > 0 && (
          <span className="ac-tag ac-tag--red"><Flag size={9} strokeWidth={2.5} /> {post.reports_count}</span>
        )}
        {post.is_hidden && (
          <span className="ac-tag ac-tag--grey"><EyeOff size={9} strokeWidth={2.5} /> Hidden</span>
        )}
      </div>
    </div>
    <ChevronRight size={13} className="ac-item-arrow" />
  </button>
));

function SkeletonRow() {
  return (
    <div className="ac-skeleton">
      <div className="ac-skeleton-thumb" />
      <div className="ac-skeleton-body">
        <div className="ac-skeleton-line ac-skeleton-line--lg" />
        <div className="ac-skeleton-line ac-skeleton-line--md" />
        <div className="ac-skeleton-line ac-skeleton-line--sm" />
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────
export default function AdminCommunity() {
  const [filter,      setFilter]      = useState<Filter>("all");
  const [posts,       setPosts]       = useState<RichPost[]>([]);
  const [selId,       setSelId]       = useState<number | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [apiPage,     setApiPage]     = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [toast,       setToast]       = useState<{ ok: boolean; msg: string } | null>(null);

  // date filter
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  // left panel pagination
  const [page, setPage] = useState(1);

  // lightbox
  const [lightbox, setLightbox] = useState<{ images: string[]; idx: number } | null>(null);

  // likes/comments modal
  const [statModal, setStatModal] = useState<{
    title: string; postId: number; type: "likes" | "comments";
  } | null>(null);

  // reports modal
  const [reportsModal, setReportsModal] = useState<{ postId: number; reportCount: number } | null>(null);

  const abortRef   = useRef<AbortController | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((ok: boolean, msg: string) => {
    setToast({ ok, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async (f: Filter, p: number, append: boolean) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    append ? setMoreLoading(true) : setLoading(true);
    try {
      const r = await communityApi.adminGetPosts(f, p, 12);
      if (ctrl.signal.aborted) return;
      if (!r.success) { notify(false, "Failed to load."); return; }
      const rich = enrich(r.data ?? []);
      setPosts(prev => append ? [...prev, ...rich] : rich);
      if (!append) setSelId(rich[0]?.id ?? null);
      setApiPage(p);
      setHasMore(!!r.hasMore);
    } catch (e: any) {
      if (e?.name === "AbortError" || e?.code === "ERR_CANCELED") return;
      notify(false, "Network error — please retry.");
    } finally {
      if (!ctrl.signal.aborted) { setLoading(false); setMoreLoading(false); }
    }
  }, [notify]);

  useEffect(() => {
    setPosts([]); setSelId(null); setApiPage(1);
    load(filter, 1, false);
    return () => abortRef.current?.abort();
  }, [filter]); // eslint-disable-line

  // reset page when date/filter changes
  useEffect(() => { setPage(1); }, [filter, dateFrom, dateTo]);

  const handleSelect = useCallback((id: number) => setSelId(id), []);
  const sel = posts.find(p => p.id === selId) ?? null;

  // apply date filter on loaded posts
  const dateFiltered = posts.filter(p => {
    const createdAt = new Date(p.created_at);
    const matchFrom = dateFrom ? createdAt >= new Date(dateFrom) : true;
    const matchTo   = dateTo
      ? createdAt <= new Date(new Date(dateTo).setHours(23, 59, 59, 999))
      : true;
    return matchFrom && matchTo;
  });

  const hasDateFilter   = dateFrom || dateTo;
  const clearDateFilter = () => { setDateFrom(""); setDateTo(""); };

  // pagination
  const totalPages = Math.max(1, Math.ceil(dateFiltered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const paginated  = dateFiltered.slice(pageStart, pageStart + PAGE_SIZE);

  const doHide = async (post: RichPost) => {
    try {
      post.is_hidden
        ? await communityApi.adminUnhidePost(post.id)
        : await communityApi.adminHidePost(post.id);
      const nowHidden = !post.is_hidden;
      setPosts(prev => prev.map(x => x.id === post.id ? { ...x, is_hidden: nowHidden } : x));
      notify(true, nowHidden ? "Post hidden." : "Post restored.");
    } catch { notify(false, "Action failed."); }
  };

  const doDelete = async (post: RichPost) => {
    if (!confirm(`Permanently delete this post by ${post.author?.first_name}?`)) return;
    try {
      await communityApi.adminDeletePost(post.id);
      const next = posts.filter(x => x.id !== post.id);
      setPosts(next);
      setSelId(next[0]?.id ?? null);
      notify(true, "Post deleted.");
    } catch { notify(false, "Delete failed."); }
  };

  const doDismiss = async (post: RichPost) => {
    try {
      await communityApi.adminDismissReports(post.id);
      setPosts(prev => prev.map(x =>
        x.id === post.id ? { ...x, reports_count: 0, is_hidden: false } : x
      ));
      notify(true, "Reports cleared.");
    } catch { notify(false, "Action failed."); }
  };

  return (
    <div className="ac-root">

      {/* Header */}
      <div className="ac-header">
        <div>
          <h1 className="ac-title"><MessageSquare size={20} strokeWidth={2} /> Community Posts</h1>
          <p className="ac-sub">Review and moderate all community content.</p>
        </div>
        <button className="ac-btn-refresh" onClick={() => load(filter, 1, false)} disabled={loading}>
          <RefreshCw size={13} className={loading ? "ac-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`ac-toast ${toast.ok ? "ac-toast--ok" : "ac-toast--err"}`}>
          {toast.ok ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
          {toast.msg}
        </div>
      )}

      {/* Grid */}
      <div className="ac-grid">

        {/* ── LEFT PANEL ── */}
        <div className="ac-panel ac-panel--list">

          {/* Filter tabs */}
          <div className="ac-filter-bar">
            {(["all", "reported", "hidden"] as Filter[]).map(f => (
              <button key={f}
                className={`ac-filter-btn ${filter === f ? "ac-filter-btn--on" : ""}`}
                onClick={() => { if (filter !== f) setFilter(f); }}>
                {f === "all" ? "All" : f === "reported" ? "Reported" : "Hidden"}
              </button>
            ))}
          </div>

          {/* Date filter */}
          <div className="ac-date-wrap">
            <div className="ac-date-row">
              <Calendar size={12} strokeWidth={2} className="ac-date-icon" />
              <span className="ac-date-label">From</span>
              <input type="date" className="ac-date-input" value={dateFrom}
                max={dateTo || undefined}
                onChange={e => setDateFrom(e.target.value)} />
              <span className="ac-date-sep">—</span>
              <span className="ac-date-label">To</span>
              <input type="date" className="ac-date-input" value={dateTo}
                min={dateFrom || undefined}
                onChange={e => setDateTo(e.target.value)} />
              {hasDateFilter && (
                <button className="ac-date-clear" onClick={clearDateFilter}>
                  <X size={11} strokeWidth={2.5} />
                </button>
              )}
            </div>
            {hasDateFilter && (
              <div className="ac-date-badge">{dateFiltered.length} posts in range</div>
            )}
          </div>

          {/* List */}
          <div className="ac-list">
            {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && paginated.length === 0 && (
              <div className="ac-empty">
                <MessageSquare size={32} strokeWidth={1.2} />
                <span>{hasDateFilter ? "No posts in this date range." : "No posts found"}</span>
              </div>
            )}

            {!loading && paginated.map(p => (
              <PostItem key={p.id} post={p} active={selId === p.id} onSelect={handleSelect} />
            ))}
          </div>

          {/* Load more — only when no date filter */}
          {!loading && !hasDateFilter && hasMore && (
            <button className="ac-more-btn"
              onClick={() => load(filter, apiPage + 1, true)}
              disabled={moreLoading}>
              {moreLoading
                ? <><span className="ac-spin-sm" /> Loading...</>
                : <><ChevronDown size={13} /> Load more</>}
            </button>
          )}

          {/* Pagination inside left panel */}
          {!loading && dateFiltered.length > 0 && (
            <div className="ac-pagination">
              <span className="ac-page-info">
                {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, dateFiltered.length)} / {dateFiltered.length}
              </span>
              {totalPages > 1 && (
                <div className="ac-page-controls">
                  <button className="ac-page-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}>
                    <ChevronLeft size={14} strokeWidth={2.5} />
                  </button>
                  <span className="ac-page-num">{safePage} / {totalPages}</span>
                  <button className="ac-page-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}>
                    <ChevronRight size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: detail ── */}
        <div className="ac-panel ac-panel--detail">
          {!sel ? (
            <div className="ac-no-sel">
              <MessageSquare size={44} strokeWidth={1} />
              <p>{loading ? "Loading posts…" : "Select a post to review"}</p>
            </div>
          ) : (
            <div className="ac-detail">

              {/* Author */}
              <div className="ac-detail-author">
                <div className="ac-detail-avatar">
                  {sel.author?.first_name?.[0]?.toUpperCase() ?? <User size={16} />}
                </div>
                <div className="ac-detail-author-info">
                  <div className="ac-detail-name">{sel.author?.first_name} {sel.author?.last_name}</div>
                  <div className="ac-detail-time">
                    <Calendar size={11} strokeWidth={2} />{timeAgo(sel.created_at)}
                  </div>
                </div>
                <div className="ac-detail-badges">
                  {sel.reports_count > 0 && (
                    <span className="ac-badge ac-badge--red">
                      <Flag size={10} /> {sel.reports_count} report{sel.reports_count !== 1 ? "s" : ""}
                    </span>
                  )}
                  {sel.is_hidden && (
                    <span className="ac-badge ac-badge--grey"><EyeOff size={10} /> Hidden</span>
                  )}
                </div>
              </div>

              {sel.caption && <div className="ac-detail-caption">{sel.caption}</div>}

              {/* Images — clickable for lightbox */}
              {sel._images.length > 0 && (
                <div className={`ac-detail-imgs ac-detail-imgs--${Math.min(sel._images.length, 3)}`}>
                  {sel._images.slice(0, 3).map((img, i) => (
                    <div key={i} className="ac-detail-img-cell"
                      onClick={() => setLightbox({ images: sel._images, idx: i })}>
                      <img src={getImageUrl(img)} alt="" loading="lazy" decoding="async" />
                      {i === 2 && sel._images.length > 3 && (
                        <div className="ac-detail-img-more">+{sel._images.length - 3}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Stats — clickable */}
              <div className="ac-detail-stats">
                <button className="ac-detail-stat ac-detail-stat--btn"
                  onClick={() => setStatModal({ title: `Likes (${sel.likes_count})`, postId: sel.id, type: "likes" })}>
                  <Heart size={14} strokeWidth={2} className="ac-ds-icon ac-ds-icon--red" />
                  <span>{sel.likes_count}</span>
                  <span className="ac-ds-lbl">Likes</span>
                </button>
                <button className="ac-detail-stat ac-detail-stat--btn"
                  onClick={() => setStatModal({ title: `Comments (${sel.comments_count})`, postId: sel.id, type: "comments" })}>
                  <MessageSquare size={14} strokeWidth={2} className="ac-ds-icon ac-ds-icon--blue" />
                  <span>{sel.comments_count}</span>
                  <span className="ac-ds-lbl">Comments</span>
                </button>
                <button className="ac-detail-stat ac-detail-stat--btn"
                  onClick={() => setReportsModal({ postId: sel.id, reportCount: sel.reports_count })}>
                  <Flag size={14} strokeWidth={2} className="ac-ds-icon ac-ds-icon--amber" />
                  <span>{sel.reports_count}</span>
                  <span className="ac-ds-lbl">Flags</span>
                </button>
              </div>

              {/* Actions */}
              <div className="ac-detail-actions">
                <button className="ac-act-btn ac-act-btn--grey" onClick={() => doHide(sel)}>
                  {sel.is_hidden
                    ? <><Eye size={14} /> Unhide Post</>
                    : <><EyeOff size={14} /> Hide Post</>}
                </button>
                {sel.reports_count > 0 && (
                  <button className="ac-act-btn ac-act-btn--green" onClick={() => doDismiss(sel)}>
                    <CheckCircle size={14} /> Clear Reports
                  </button>
                )}
                <button className="ac-act-btn ac-act-btn--red" onClick={() => doDelete(sel)}>
                  <Trash2 size={14} /> Delete Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIdx={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Likes / Comments modal */}
      {statModal && (
        <StatModal
          title={statModal.title}
          postId={statModal.postId}
          type={statModal.type}
          onClose={() => setStatModal(null)}
        />
      )}

      {/* Reports modal */}
      {reportsModal && sel && (
        <ReportsModal
          postId={reportsModal.postId}
          reportCount={reportsModal.reportCount}
          onClose={() => setReportsModal(null)}
          onDismissAll={() => doDismiss(sel)}
          onHidePost={() => doHide(sel)}
          onDeletePost={() => doDelete(sel)}
        />
      )}
    </div>
  );
}