import { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Flag, EyeOff, Eye, Trash2,
  RefreshCw, ChevronRight, CheckCircle, AlertTriangle,
  LayoutGrid,
} from "lucide-react";
import { communityApi } from "../../Community/communityApi";
import type { Post, Comment } from "../../Community/CommunityTypes";
import "./AdminCommunity.css";
import { getImageUrl } from "../../../../shared/config/imageUrl";

const imgUrl = (p: string) => getImageUrl(p);

const parseImages = (raw: string | null): string[] => {
  if (!raw) return []; try { return JSON.parse(raw); } catch { return [raw]; }
};
const ago = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now"; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`;
};

type Filter = "all" | "reported" | "hidden";
interface Counts { total: number; reported: number; hidden: number }

export default function AdminCommunity() {
  const [filter, setFilter]   = useState<Filter>("all");
  const [posts, setPosts]     = useState<Post[]>([]);
  const [counts, setCounts]   = useState<Counts>({ total: 0, reported: 0, hidden: 0 });
  const [sel, setSel]         = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [ok, setOk]           = useState("");
  const [err, setErr]         = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const load = async (f: Filter = filter) => {
    setLoading(true); setErr("");
    try {
      const r = await communityApi.adminGetPosts(f);
      if (r.success) {
        setPosts(r.data);
        if (r.counts) setCounts(r.counts);
        else setCounts({
          total:    r.data.length,
          reported: r.data.filter((p: Post) => p.reports_count > 0).length,
          hidden:   r.data.filter((p: Post) => p.is_hidden).length,
        });
      }
    } catch { setErr("Failed to load posts."); }
    setLoading(false);
  };

  useEffect(() => { load(filter); }, [filter]);

  const flash = (msg: string) => { setOk(msg); setTimeout(() => setOk(""), 2500); };

  const handleHide = async (post: Post) => {
    try {
      if (post.is_hidden) await communityApi.adminUnhidePost(post.id);
      else                await communityApi.adminHidePost(post.id);
      const nowHidden = !post.is_hidden;
      setPosts(p => p.map(x => x.id === post.id ? { ...x, is_hidden: nowHidden } : x));
      setSel(s => s?.id === post.id ? { ...s, is_hidden: nowHidden } : s);
      setCounts(c => ({ ...c, hidden: nowHidden ? c.hidden + 1 : Math.max(0, c.hidden - 1) }));
      flash(nowHidden ? "Post hidden from feed." : "Post is now visible.");
    } catch { setErr("Action failed."); }
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`Delete post by ${post.author?.first_name}? This cannot be undone.`)) return;
    try {
      await communityApi.adminDeletePost(post.id);
      setPosts(p => p.filter(x => x.id !== post.id));
      if (sel?.id === post.id) setSel(null);
      setCounts(c => ({ ...c, total: Math.max(0, c.total - 1) }));
      flash("Post deleted.");
    } catch { setErr("Delete failed."); }
  };

  const handleDismiss = async (post: Post) => {
    try {
      await communityApi.adminDismissReports(post.id);
      setPosts(p => p.map(x => x.id === post.id ? { ...x, reports_count: 0, is_hidden: false } : x));
      setSel(s => s?.id === post.id ? { ...s, reports_count: 0, is_hidden: false } : s);
      setCounts(c => ({ ...c, reported: Math.max(0, c.reported - 1) }));
      flash("Reports dismissed. Post restored.");
    } catch { setErr("Action failed."); }
  };

  const selImages = sel ? parseImages(sel.images) : [];

  return (
    <div className="acp">

      {/* Header */}
      <div className="acp-header">
        <div>
          <h1 className="acp-title"><MessageSquare size={22} strokeWidth={2} /> Community Posts</h1>
          <p className="acp-sub">Review, moderate, and manage all community posts.</p>
        </div>
        <button className="acp-refresh" onClick={() => load()}>
          <RefreshCw size={14} strokeWidth={2.5} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="acp-stats">
        {[
          { label: "Total Posts", val: counts.total,    color: "#3b82f6", icon: <LayoutGrid size={15}/> },
          { label: "Reported",    val: counts.reported, color: "#f59e0b", icon: <Flag size={15}/> },
          { label: "Hidden",      val: counts.hidden,   color: "#8b5cf6", icon: <EyeOff size={15}/> },
        ].map(s => (
          <div key={s.label} className="acp-stat" style={{ borderTopColor: s.color }}>
            <div className="acp-stat-icon" style={{ background: s.color + "1a", color: s.color }}>{s.icon}</div>
            <div className="acp-stat-num">{s.val}</div>
            <div className="acp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {ok  && <div className="acp-alert acp-alert--ok"><CheckCircle size={14}/> {ok}</div>}
      {err && <div className="acp-alert acp-alert--err"><AlertTriangle size={14}/> {err}</div>}

      {/* Main grid */}
      <div className="acp-grid">

        {/* Left — list */}
        <div className="acp-list-panel">
          <div className="acp-filters">
            {(["all", "reported", "hidden"] as Filter[]).map(f => (
              <button key={f}
                className={`acp-filter ${filter === f ? "acp-filter--on" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f === "reported" ? "Reported" : "Hidden"}
              </button>
            ))}
          </div>

          <div className="acp-list">
            {loading && <div className="acp-spin-wrap"><div className="acp-spin" /></div>}
            {!loading && posts.length === 0 && <p className="acp-empty-msg">No posts found.</p>}
            {!loading && posts.map(p => {
              const thumb = parseImages(p.images)[0];
              return (
                <button key={p.id}
                  className={`acp-item ${sel?.id === p.id ? "acp-item--on" : ""} ${p.is_hidden ? "acp-item--hidden" : ""}`}
                  onClick={() => setSel(p)}
                >
                  {thumb
                    ? <img className="acp-item-thumb" src={imgUrl(thumb)} alt="" />
                    : <div className="acp-item-thumb acp-item-thumb--text">📝</div>
                  }
                  <div className="acp-item-info">
                    <div className="acp-item-name">{p.author?.first_name} {p.author?.last_name}</div>
                    <div className="acp-item-caption">
                      {p.caption ? p.caption.slice(0, 52) + (p.caption.length > 52 ? "…" : "") : "(no caption)"}
                    </div>
                    <div className="acp-item-pills">
                      <span className="acp-item-time">{ago(p.created_at)}</span>
                      {p.reports_count > 0 && (
                        <span className="acp-pill acp-pill--amber"><Flag size={9}/> {p.reports_count}</span>
                      )}
                      {p.is_hidden && <span className="acp-pill acp-pill--grey">Hidden</span>}
                    </div>
                  </div>
                  <ChevronRight size={13} className="acp-item-chevron" strokeWidth={2.5} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — detail */}
        <div className="acp-detail-panel">
          {!sel ? (
            <div className="acp-no-sel">
              <MessageSquare size={52} strokeWidth={1.2} className="acp-no-sel-icon" />
              <p>Select a post to review</p>
            </div>
          ) : (
            <div className="acp-detail">

              {/* Author */}
              <div className="acp-detail-head">
                <div className="acp-detail-av">
                  {sel.author?.first_name?.[0]?.toUpperCase()}
                </div>
                <div className="acp-detail-info">
                  <div className="acp-detail-name">{sel.author?.first_name} {sel.author?.last_name}</div>
                  <div className="acp-detail-time">{ago(sel.created_at)}</div>
                </div>
                <div className="acp-detail-badges">
                  {sel.reports_count > 0 && (
                    <span className="acp-badge acp-badge--amber">
                      <Flag size={10}/> {sel.reports_count} report{sel.reports_count !== 1 ? "s" : ""}
                    </span>
                  )}
                  {sel.is_hidden && <span className="acp-badge acp-badge--grey">Hidden</span>}
                </div>
              </div>

              {/* Caption */}
              {sel.caption && <p className="acp-detail-caption">{sel.caption}</p>}

              {/* Images */}
              {selImages.length > 0 && (
                <div className={`acp-detail-imgs acp-detail-imgs--${Math.min(selImages.length, 3)}`}>
                  {selImages.slice(0, 3).map((img, i) => (
                    <div key={i} className="acp-detail-img-wrap">
                      <img src={imgUrl(img)} className="acp-detail-img" alt="" />
                      {i === 2 && selImages.length > 3 && (
                        <div className="acp-detail-more">+{selImages.length - 3}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Post stats */}
              <div className="acp-detail-stats">
                <span>❤️ {sel.likes_count}</span>
                <span>💬 {sel.comments_count}</span>
                <span>🚩 {sel.reports_count}</span>
              </div>

              {/* Actions */}
              <div className="acp-actions">
                <button className="acp-action acp-action--grey" onClick={() => handleHide(sel)}>
                  {sel.is_hidden
                    ? <><Eye size={14}/> Unhide</>
                    : <><EyeOff size={14}/> Hide Post</>
                  }
                </button>
                {sel.reports_count > 0 && (
                  <button className="acp-action acp-action--green" onClick={() => handleDismiss(sel)}>
                    <CheckCircle size={14}/> Dismiss Reports
                  </button>
                )}
                <button className="acp-action acp-action--red" onClick={() => handleDelete(sel)}>
                  <Trash2 size={14}/> Delete
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}