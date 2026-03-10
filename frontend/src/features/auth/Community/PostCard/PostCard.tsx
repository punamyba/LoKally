import { useState, useRef } from "react";
import {
  ThumbsUp, MessageCircle, Bookmark, BookmarkCheck,
  MoreHorizontal, Trash2, MapPin, Send,
  X, Reply, Flag, EyeOff, Eye,
  Share2, Link2, Download, Check,
} from "lucide-react";
import { communityApi } from "../communityApi";
import { REACTS, REPORT_REASONS } from "../CommunityTypes";
import type { Post, Comment, ReactType } from "../CommunityTypes";
import "./PostCard.css";

const BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001";
const imgUrl = (p: string) => p?.startsWith("http") ? p : `${BASE}${p}`;
const parseImages = (raw: string | null): string[] => {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return [raw]; }
};
const ago = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

interface Props {
  post: Post;
  currentUserId?: number;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
  onHide?: (id: number, hidden: boolean) => void;
}

export default function PostCard({ post, currentUserId, isAdmin, onDelete, onHide }: Props) {
  const [liked, setLiked]               = useState(post.has_liked ?? false);
  const [likeType, setLikeType]         = useState<ReactType>((post.liked_type as ReactType) ?? "like");
  const [likesCount, setLikesCount]     = useState(post.likes_count);
  const [bookmarked, setBookmarked]     = useState(post.is_bookmarked ?? false);
  const [isHidden, setIsHidden]         = useState(post.is_hidden);
  const [showReacts, setShowReacts]     = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText]   = useState("");
  const [replyTo, setReplyTo]           = useState<Comment | null>(null);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showMenu, setShowMenu]         = useState(false);
  const [showReport, setShowReport]     = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reported, setReported]         = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  // Like list
  const [showLikers, setShowLikers]     = useState(false);
  const [likers, setLikers]             = useState<{name:string; react:string}[]>([]);
  // Share
  const [showShare, setShowShare]       = useState(false);
  const [copied, setCopied]             = useState(false);

  const reactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  const images   = parseImages(post.images);
  const isOwner  = currentUserId === post.user_id;
  const initials = `${post.author?.first_name?.[0] ?? ""}${post.author?.last_name?.[0] ?? ""}`.toUpperCase();
  const postUrl  = `${window.location.origin}/community`;

  // ── Like ──────────────────────────────────────────────────────
  const handleLike = async (type: ReactType = "like") => {
    setShowReacts(false);
    const wasLiked = liked; const wasType = likeType;
    const sameType = wasLiked && wasType === type;
    setLiked(!sameType); setLikeType(type);
    setLikesCount(c => sameType ? c - 1 : wasLiked ? c : c + 1);
    try { await communityApi.toggleLike(post.id, type); }
    catch { setLiked(wasLiked); setLikeType(wasType); setLikesCount(post.likes_count); }
  };

  // ── Bookmark ──────────────────────────────────────────────────
  const handleBookmark = async () => {
    setBookmarked(b => !b);
    try { await communityApi.toggleBookmark(post.id); }
    catch { setBookmarked(post.is_bookmarked ?? false); }
  };

  // ── Like list (mock — real impl needs /api/posts/:id/likes endpoint) ──
  const handleShowLikers = () => {
    if (likesCount === 0) return;
    // Show simple count tooltip for now; real API would fetch actual likers
    setShowLikers(s => !s);
  };

  // ── Share ─────────────────────────────────────────────────────
  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(postUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch {}
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${post.caption ? post.caption.slice(0,80) + " — " : ""}Check this post on LoKally Nepal: ${postUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, "_blank");
  };

  const handleDownload = async () => {
    if (images.length === 0) return;
    try {
      const res  = await fetch(imgUrl(images[0]));
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `lokally-post-${post.id}.jpg`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  // ── Comments ──────────────────────────────────────────────────
  const loadComments = async () => {
    if (!commentsLoaded) {
      const r = await communityApi.getComments(post.id);
      if (r.success) { setComments(r.data); setCommentsLoaded(true); }
    }
    setShowComments(s => !s);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submitComment = async () => {
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const r = await communityApi.addComment(post.id, commentText.trim(), replyTo?.id);
      if (r.success) {
        if (replyTo) {
          setComments(prev => prev.map(c =>
            c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), r.data] } : c
          ));
        } else {
          setComments(prev => [...prev, { ...r.data, replies: [] }]);
          setCommentsCount(c => c + 1);
        }
        setCommentText(""); setReplyTo(null);
      }
    } catch {}
    setSubmittingComment(false);
  };

  const delComment = async (commentId: number, parentId?: number) => {
    try {
      await communityApi.deleteComment(post.id, commentId);
      if (parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId ? { ...c, replies: (c.replies ?? []).filter(r => r.id !== commentId) } : c
        ));
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setCommentsCount(c => c - 1);
      }
    } catch {}
  };

  const submitReport = async () => {
    if (!reportReason) return;
    try { await communityApi.reportPost(post.id, reportReason); setReported(true); setTimeout(() => setShowReport(false), 2200); }
    catch {}
  };

  const handleAdminHide = async () => {
    setShowMenu(false);
    try {
      if (isHidden) { await communityApi.adminUnhidePost(post.id); setIsHidden(false); onHide?.(post.id, false); }
      else          { await communityApi.adminHidePost(post.id);   setIsHidden(true);  onHide?.(post.id, true); }
    } catch {}
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (!confirm("Delete this post permanently?")) return;
    try {
      if (isAdmin) await communityApi.adminDeletePost(post.id);
      else         await communityApi.deletePost(post.id);
      onDelete?.(post.id);
    } catch {}
  };

  const reactKeys = Object.keys(REACTS) as ReactType[];

  return (
    <article className={`pc ${isHidden ? "pc--hidden" : ""}`}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="pc-head">
        <div className="pc-av">{initials}</div>
        <div className="pc-head-info">
          <div className="pc-name">{post.author?.first_name} {post.author?.last_name}</div>
          <div className="pc-meta-row">
            <span className="pc-time">{ago(post.created_at)}</span>
            {post.place && <span className="pc-place"><MapPin size={10}/> {post.place.name}</span>}
            {isHidden && <span className="pc-hidden-chip">Hidden</span>}
          </div>
        </div>

        <div className="pc-menu-wrap">
          <button className="pc-icon-btn" onClick={() => setShowMenu(m => !m)}>
            <MoreHorizontal size={20}/>
          </button>
          {showMenu && (
            <div className="pc-menu" onMouseLeave={() => setShowMenu(false)}>
              {(isOwner || isAdmin) && (
                <button className="pc-menu-item pc-menu-item--red" onClick={handleDelete}>
                  <Trash2 size={13}/> Delete post
                </button>
              )}
              {isAdmin && (
                <button className="pc-menu-item" onClick={handleAdminHide}>
                  {isHidden ? <><Eye size={13}/> Unhide</> : <><EyeOff size={13}/> Hide post</>}
                </button>
              )}
              {!isOwner && !isAdmin && (
                <button className="pc-menu-item pc-menu-item--amber"
                  onClick={() => { setShowMenu(false); setShowReport(true); }}>
                  <Flag size={13}/> Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Caption ────────────────────────────────────────────── */}
      {post.caption && <p className="pc-caption">{post.caption}</p>}

      {/* ── Images ─────────────────────────────────────────────── */}
      {images.length > 0 && (
        <div className="pc-media">
          {images.length === 1 && <img className="pc-img pc-img--single" src={imgUrl(images[0])} alt=""/>}
          {images.length === 2 && (
            <div className="pc-img-grid pc-img-grid--2">
              {images.map((img, i) => <img key={i} src={imgUrl(img)} alt=""/>)}
            </div>
          )}
          {images.length === 3 && (
            <div className="pc-img-grid pc-img-grid--3">
              <img className="pc-img-big" src={imgUrl(images[0])} alt=""/>
              <div className="pc-img-col">
                <img src={imgUrl(images[1])} alt=""/>
                <img src={imgUrl(images[2])} alt=""/>
              </div>
            </div>
          )}
          {images.length >= 4 && (
            <div className="pc-img-grid pc-img-grid--4">
              {images.slice(0, 4).map((img, i) => (
                <div key={i} className="pc-img-wrap">
                  <img src={imgUrl(img)} alt=""/>
                  {i === 3 && images.length > 4 && <div className="pc-img-more">+{images.length - 4}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Stats — clickable like count shows likers ───────────── */}
      {(likesCount > 0 || commentsCount > 0) && (
        <div className="pc-stats">
          {likesCount > 0 && (
            <div className="pc-stat-likes-wrap">
              <button className="pc-stat-likes" onClick={handleShowLikers} title="See who liked">
                <span className="pc-stat-emoji">{REACTS[likeType]?.emoji ?? "👍"}</span>
                {likesCount} {likesCount === 1 ? "person" : "people"} reacted
              </button>
              {showLikers && (
                <div className="pc-likers-popup">
                  <div className="pc-likers-title">Reactions</div>
                  <div className="pc-likers-body">
                    {/* Shows react breakdown since we don't have individual liker API */}
                    <div className="pc-liker-row">
                      <span>👍❤️😮😂😢😡</span>
                      <span className="pc-liker-count">{likesCount} total reaction{likesCount !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="pc-likers-note">Detailed likers list coming soon</p>
                  </div>
                </div>
              )}
            </div>
          )}
          {commentsCount > 0 && (
            <button className="pc-stat-cmts" onClick={loadComments}>
              {commentsCount} comment{commentsCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="pc-actions">
        {/* Like */}
        <div className="pc-react-wrap"
          onMouseEnter={() => { if(reactTimer.current) clearTimeout(reactTimer.current); reactTimer.current = setTimeout(() => setShowReacts(true), 380); }}
          onMouseLeave={() => { if(reactTimer.current) clearTimeout(reactTimer.current); reactTimer.current = setTimeout(() => setShowReacts(false), 280); }}
        >
          <button
            className={`pc-action ${liked ? "pc-action--liked" : ""}`}
            style={liked ? { color: REACTS[likeType]?.color } : {}}
            onClick={() => handleLike(liked ? likeType : "like")}
          >
            {liked ? <span className="pc-action-emoji">{REACTS[likeType]?.emoji}</span> : <ThumbsUp size={18} strokeWidth={2}/>}
            <span>{liked ? REACTS[likeType]?.label : "Like"}</span>
          </button>
          {showReacts && (
            <div className="pc-react-picker"
              onMouseEnter={() => { if(reactTimer.current) clearTimeout(reactTimer.current); }}
              onMouseLeave={() => { if(reactTimer.current) clearTimeout(reactTimer.current); reactTimer.current = setTimeout(() => setShowReacts(false), 280); }}
            >
              {reactKeys.map(type => (
                <button key={type} className="pc-react-btn" title={REACTS[type].label} onClick={() => handleLike(type)}>
                  {REACTS[type].emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="pc-action" onClick={loadComments}>
          <MessageCircle size={18} strokeWidth={2}/> <span>Comment</span>
        </button>

        {/* Share */}
        <div className="pc-share-wrap">
          <button className="pc-action" onClick={() => setShowShare(s => !s)}>
            <Share2 size={18} strokeWidth={2}/> <span>Share</span>
          </button>
          {showShare && (
            <div className="pc-share-menu" onMouseLeave={() => setShowShare(false)}>
              <button className="pc-share-item" onClick={handleCopyLink}>
                {copied ? <><Check size={13}/> Copied!</> : <><Link2 size={13}/> Copy Link</>}
              </button>
              <button className="pc-share-item pc-share-item--wa" onClick={handleWhatsApp}>
                <span>💬</span> WhatsApp
              </button>
              <button className="pc-share-item pc-share-item--fb" onClick={handleFacebook}>
                <span>📘</span> Facebook
              </button>
              {images.length > 0 && (
                <button className="pc-share-item" onClick={handleDownload}>
                  <Download size={13}/> Download
                </button>
              )}
            </div>
          )}
        </div>

        <button className={`pc-action ${bookmarked ? "pc-action--saved" : ""}`} onClick={handleBookmark}>
          {bookmarked ? <BookmarkCheck size={18} strokeWidth={2}/> : <Bookmark size={18} strokeWidth={2}/>}
          <span>{bookmarked ? "Saved" : "Save"}</span>
        </button>
      </div>

      {/* ── Comments ───────────────────────────────────────────── */}
      {showComments && (
        <div className="pc-comments">
          <div className="pc-cmt-input-row">
            <div className="pc-cmt-av">{initials[0]}</div>
            <div className="pc-cmt-box">
              {replyTo && (
                <div className="pc-reply-banner">
                  <Reply size={11}/> Replying to <strong>{replyTo.user.first_name}</strong>
                  <button onClick={() => setReplyTo(null)}><X size={10}/></button>
                </div>
              )}
              <input ref={inputRef} className="pc-cmt-input"
                placeholder={replyTo ? `Reply to ${replyTo.user.first_name}…` : "Write a comment…"}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitComment()}
              />
              {commentText.trim() && (
                <button className="pc-cmt-send" onClick={submitComment} disabled={submittingComment}>
                  <Send size={13} strokeWidth={2.5}/>
                </button>
              )}
            </div>
          </div>
          <div className="pc-cmt-list">
            {comments.map(c => (
              <div key={c.id} className="pc-cmt">
                <div className="pc-cmt-av">{c.user.first_name[0].toUpperCase()}</div>
                <div className="pc-cmt-body">
                  <div className="pc-cmt-bubble">
                    <span className="pc-cmt-name">{c.user.first_name} {c.user.last_name}</span>
                    <p className="pc-cmt-text">{c.body}</p>
                  </div>
                  <div className="pc-cmt-meta">
                    <span>{ago(c.created_at)}</span>
                    <button onClick={() => { setReplyTo(c); inputRef.current?.focus(); }}>Reply</button>
                    {(currentUserId === c.user_id || isAdmin) && (
                      <button className="pc-cmt-del" onClick={() => delComment(c.id)}>Delete</button>
                    )}
                  </div>
                  {(c.replies ?? []).map(r => (
                    <div key={r.id} className="pc-cmt pc-cmt--reply">
                      <div className="pc-cmt-av pc-cmt-av--sm">{r.user.first_name[0].toUpperCase()}</div>
                      <div className="pc-cmt-body">
                        <div className="pc-cmt-bubble">
                          <span className="pc-cmt-name">{r.user.first_name} {r.user.last_name}</span>
                          <p className="pc-cmt-text">{r.body}</p>
                        </div>
                        <div className="pc-cmt-meta">
                          <span>{ago(r.created_at)}</span>
                          {(currentUserId === r.user_id || isAdmin) && (
                            <button className="pc-cmt-del" onClick={() => delComment(r.id, c.id)}>Delete</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Report modal ────────────────────────────────────────── */}
      {showReport && (
        <div className="pc-overlay" onClick={() => setShowReport(false)}>
          <div className="pc-modal" onClick={e => e.stopPropagation()}>
            <div className="pc-modal-head">
              <Flag size={16}/> Report Post
              <button className="pc-modal-close" onClick={() => setShowReport(false)}><X size={14}/></button>
            </div>
            {reported ? (
              <div className="pc-report-done">✅ Reported! We'll review this post.</div>
            ) : (
              <>
                <p className="pc-modal-sub">Why are you reporting this?</p>
                <div className="pc-report-opts">
                  {REPORT_REASONS.map(r => (
                    <button key={r}
                      className={`pc-report-opt ${reportReason === r ? "pc-report-opt--on" : ""}`}
                      onClick={() => setReportReason(r)}>{r}</button>
                  ))}
                </div>
                <button className="pc-report-submit" disabled={!reportReason} onClick={submitReport}>
                  Submit Report
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}