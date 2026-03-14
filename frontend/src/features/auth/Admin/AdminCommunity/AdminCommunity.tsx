import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  MessageSquare, Flag, EyeOff, Eye, Trash2, RefreshCw,
  ChevronRight, CheckCircle, AlertTriangle, LayoutGrid,
  Heart, ChevronDown, User, Calendar, Image as ImageIcon,
} from "lucide-react";
import { communityApi } from "../../Community/communityApi";
import type { Post } from "../../Community/CommunityTypes";
import "./AdminCommunity.css";
import { getImageUrl } from "../../../../shared/config/imageUrl";

type Filter = "all" | "reported" | "hidden";
interface Counts { total: number; reported: number; hidden: number; }
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

// ── Memoized list item — prevents re-render when other posts change ──
const PostItem = memo(({ post, active, onSelect }: {
  post: RichPost;
  active: boolean;
  onSelect: (id: number) => void;
}) => (
  <button
    className={`ac-item ${active ? "ac-item--active" : ""} ${post.is_hidden ? "ac-item--hidden" : ""}`}
    onClick={() => onSelect(post.id)}
  >
    <div className="ac-item-thumb">
      {post._thumb
        ? <img src={getImageUrl(post._thumb)} alt="" loading="lazy" decoding="async" />
        : <div className="ac-item-thumb-icon"><ImageIcon size={18} strokeWidth={1.5} /></div>
      }
    </div>
    <div className="ac-item-info">
      <div className="ac-item-name">{post.author?.first_name} {post.author?.last_name}</div>
      <div className="ac-item-caption">
        {post.caption
          ? (post.caption.length > 55 ? post.caption.slice(0, 55) + "…" : post.caption)
          : <span className="ac-item-no-caption">No caption</span>
        }
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

// ── Skeleton ──
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

export default function AdminCommunity() {
  const [filter, setFilter]         = useState<Filter>("all");
  const [posts, setPosts]           = useState<RichPost[]>([]);
  const [counts, setCounts]         = useState<Counts>({ total: 0, reported: 0, hidden: 0 });
  const [selId, setSelId]           = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(false);
  const [toast, setToast]           = useState<{ ok: boolean; msg: string } | null>(null);
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
      setPage(p);
      setHasMore(!!r.hasMore);
      if (r.counts) {
        setCounts(r.counts);
      } else if (!append) {
        const data: Post[] = r.data ?? [];
        setCounts({
          total:    data.length,
          reported: data.filter((x: Post) => x.reports_count > 0).length,
          hidden:   data.filter((x: Post) => x.is_hidden).length,
        });
      }
    } catch (e: any) {
      if (e?.name === "AbortError" || e?.code === "ERR_CANCELED") return;
      notify(false, "Network error — please retry.");
    } finally {
      if (!ctrl.signal.aborted) { setLoading(false); setMoreLoading(false); }
    }
  }, [notify]);

  useEffect(() => {
    setPosts([]); setSelId(null); setPage(1);
    load(filter, 1, false);
    return () => abortRef.current?.abort();
  }, [filter]); // eslint-disable-line

  // Stable select callback — doesn't cause PostItem re-renders
  const handleSelect = useCallback((id: number) => setSelId(id), []);

  const sel = posts.find(p => p.id === selId) ?? null;

  const doHide = async (post: RichPost) => {
    try {
      post.is_hidden
        ? await communityApi.adminUnhidePost(post.id)
        : await communityApi.adminHidePost(post.id);
      const nowHidden = !post.is_hidden;
      setPosts(prev => prev.map(x => x.id === post.id ? { ...x, is_hidden: nowHidden } : x));
      setCounts(c => ({ ...c, hidden: nowHidden ? c.hidden + 1 : Math.max(0, c.hidden - 1) }));
      notify(true, nowHidden ? "Post hidden." : "Post restored.");
    } catch { notify(false, "Action failed."); }
  };

  const doDelete = async (post: RichPost) => {
    if (!confirm(`Permanently delete this post by ${post.author?.first_name}?`)) return;
    try {
      await communityApi.adminDeletePost(post.id);
      const next = posts.filter(x => x.id !== post.id);
      setPosts(next);
      setCounts(c => ({
        total:    Math.max(0, c.total - 1),
        reported: post.reports_count > 0 ? Math.max(0, c.reported - 1) : c.reported,
        hidden:   post.is_hidden ? Math.max(0, c.hidden - 1) : c.hidden,
      }));
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
      setCounts(c => ({
        ...c,
        reported: Math.max(0, c.reported - 1),
        hidden:   post.is_hidden ? Math.max(0, c.hidden - 1) : c.hidden,
      }));
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

      {/* Stat cards */}
      <div className="ac-stats">
        <div className="ac-stat--total">
          <div className="ac-stat-icon"><LayoutGrid size={16} /></div>
          <div className="ac-stat-num">{counts.total}</div>
          <div className="ac-stat-lbl">Total Posts</div>
        </div>
        <div className="ac-stat--reported">
          <div className="ac-stat-icon"><Flag size={20} /></div>
          <div>
            <div className="ac-stat-num">{counts.reported}</div>
            <div className="ac-stat-lbl">Reported</div>
          </div>
        </div>
        <div className="ac-stat--hidden">
          <div className="ac-stat-num">{counts.hidden}</div>
          <div className="ac-stat-lbl">Hidden</div>
          <div className="ac-stat-icon"><EyeOff size={22} /></div>
        </div>
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
        {/* LIST */}
        <div className="ac-panel ac-panel--list">
          <div className="ac-filter-bar">
            {(["all", "reported", "hidden"] as Filter[]).map(f => (
              <button key={f}
                className={`ac-filter-btn ${filter === f ? "ac-filter-btn--on" : ""}`}
                onClick={() => { if (filter !== f) setFilter(f); }}>
                {f === "all" ? "All" : f === "reported" ? "Reported" : "Hidden"}
                {f === "reported" && counts.reported > 0 && (
                  <span className="ac-filter-count">{counts.reported}</span>
                )}
              </button>
            ))}
          </div>

          <div className="ac-list">
            {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && posts.length === 0 && (
              <div className="ac-empty">
                <MessageSquare size={32} strokeWidth={1.2} />
                <span>No posts found</span>
              </div>
            )}

            {/* Memoized items — only re-renders if that specific post changes */}
            {!loading && posts.map(p => (
              <PostItem
                key={p.id}
                post={p}
                active={selId === p.id}
                onSelect={handleSelect}
              />
            ))}

            {!loading && hasMore && (
              <button className="ac-more-btn"
                onClick={() => load(filter, page + 1, true)}
                disabled={moreLoading}>
                {moreLoading
                  ? <><span className="ac-spin-sm" /> Loading...</>
                  : <><ChevronDown size={13} /> Load more</>
                }
              </button>
            )}
          </div>
        </div>

        {/* DETAIL */}
        <div className="ac-panel ac-panel--detail">
          {!sel ? (
            <div className="ac-no-sel">
              <MessageSquare size={44} strokeWidth={1} />
              <p>{loading ? "Loading posts…" : "Select a post to review"}</p>
            </div>
          ) : (
            <div className="ac-detail">
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

              {sel._images.length > 0 && (
                <div className={`ac-detail-imgs ac-detail-imgs--${Math.min(sel._images.length, 3)}`}>
                  {sel._images.slice(0, 3).map((img, i) => (
                    <div key={i} className="ac-detail-img-cell">
                      <img src={getImageUrl(img)} alt="" loading="lazy" decoding="async" />
                      {i === 2 && sel._images.length > 3 && (
                        <div className="ac-detail-img-more">+{sel._images.length - 3}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="ac-detail-stats">
                <div className="ac-detail-stat">
                  <Heart size={14} strokeWidth={2} className="ac-ds-icon ac-ds-icon--red" />
                  <span>{sel.likes_count}</span>
                  <span className="ac-ds-lbl">Likes</span>
                </div>
                <div className="ac-detail-stat">
                  <MessageSquare size={14} strokeWidth={2} className="ac-ds-icon ac-ds-icon--blue" />
                  <span>{sel.comments_count}</span>
                  <span className="ac-ds-lbl">Comments</span>
                </div>
                <div className="ac-detail-stat">
                  <Flag size={14} strokeWidth={2} className="ac-ds-icon ac-ds-icon--amber" />
                  <span>{sel.reports_count}</span>
                  <span className="ac-ds-lbl">Reports</span>
                </div>
              </div>

              <div className="ac-detail-actions">
                <button className="ac-act-btn ac-act-btn--grey" onClick={() => doHide(sel)}>
                  {sel.is_hidden
                    ? <><Eye size={14} /> Unhide Post</>
                    : <><EyeOff size={14} /> Hide Post</>
                  }
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
    </div>
  );
}