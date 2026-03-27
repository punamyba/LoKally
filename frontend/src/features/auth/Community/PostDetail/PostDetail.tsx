import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ThumbsUp, MessageCircle, Bookmark, BookmarkCheck,
  Send, Reply, X, Flag, Share2, Link2, Download, Check,
  Heart, Smile, Frown, Zap, AlertCircle, MapPin, Trash2,
  MoreHorizontal, Eye, EyeOff,
} from "lucide-react";
import { communityApi } from "../communityApi";
import { REACTS, REPORT_REASONS } from "../CommunityTypes";
import type { Post, Comment, ReactType } from "../CommunityTypes";
import Navbar from "../../Components/Layout/Navbar/Navbar";
import { getImageUrl, getAvatarUrl } from "../../../../shared/config/imageUrl";
import "./PostDetail.css";

const parseImages = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [raw];
  } catch { return [raw]; }
};

const ago = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const ReactIcon = ({ type, size = 18 }: { type: ReactType; size?: number }) => {
  const icons: Record<ReactType, React.ReactNode> = {
    like:  <ThumbsUp size={size} strokeWidth={2} />,
    love:  <Heart size={size} strokeWidth={2} />,
    wow:   <Zap size={size} strokeWidth={2} />,
    haha:  <Smile size={size} strokeWidth={2} />,
    sad:   <Frown size={size} strokeWidth={2} />,
    angry: <AlertCircle size={size} strokeWidth={2} />,
  };
  return <>{icons[type]}</>;
};

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const reactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("currentUser") || "{}"); }
    catch { return {}; }
  })();
  const currentUserId = currentUser.id;
  const isAdmin = currentUser.role === "admin";
  const currentUserAvatar = getAvatarUrl(currentUser?.avatar);
  const currentUserInitial = `${currentUser.first_name?.[0] ?? ""}${currentUser.last_name?.[0] ?? ""}`.toUpperCase() || "U";

  const [post,    setPost]    = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // interactions
  const [liked,         setLiked]         = useState(false);
  const [likeType,      setLikeType]      = useState<ReactType>("like");
  const [likesCount,    setLikesCount]    = useState(0);
  const [bookmarked,    setBookmarked]    = useState(false);
  const [isHidden,      setIsHidden]      = useState(false);
  const [showReacts,    setShowReacts]    = useState(false);
  const [comments,      setComments]      = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentText,   setCommentText]   = useState("");
  const [replyTo,       setReplyTo]       = useState<Comment | null>(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [showMenu,      setShowMenu]      = useState(false);
  const [showReport,    setShowReport]    = useState(false);
  const [reportReason,  setReportReason]  = useState("");
  const [reportOther,   setReportOther]   = useState("");
  const [reported,      setReported]      = useState(false);
  const [showShare,     setShowShare]     = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [lightboxIdx,   setLightboxIdx]   = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    communityApi.getPost(Number(id))
      .then(r => {
        if (r.success && r.data) {
          const p = r.data;
          setPost(p);
          setLiked(p.has_liked ?? false);
          setLikeType((p.liked_type as ReactType) ?? "like");
          setLikesCount(p.likes_count ?? 0);
          setBookmarked(p.is_bookmarked ?? false);
          setIsHidden(p.is_hidden ?? false);
          setCommentsCount(p.comments_count ?? 0);
        } else setError("Post not found.");
      })
      .catch(() => setError("Failed to load post."))
      .finally(() => setLoading(false));

    // load comments
    communityApi.getComments(Number(id))
      .then(r => { if (r.success) setComments(r.data); })
      .catch(() => {});
  }, [id]);

  const images = useMemo(() => parseImages(post?.images ?? null), [post?.images]);
  const isOwner = currentUserId === post?.user_id;
  const initials = `${post?.author?.first_name?.[0] ?? ""}${post?.author?.last_name?.[0] ?? ""}`.toUpperCase() || "U";
  const authorAvatar = getAvatarUrl(post?.author?.avatar);
  const postUrl = `${window.location.origin}/community/post/${id}`;
  const reactKeys = Object.keys(REACTS) as ReactType[];

  const handleLike = async (type: ReactType = "like") => {
    setShowReacts(false);
    const wasLiked = liked; const wasType = likeType;
    const sameType = wasLiked && wasType === type;
    setLiked(!sameType); setLikeType(type);
    setLikesCount(c => sameType ? c - 1 : wasLiked ? c : c + 1);
    try { await communityApi.toggleLike(Number(id), type); }
    catch { setLiked(wasLiked); setLikeType(wasType); setLikesCount(post?.likes_count ?? 0); }
  };

  const handleBookmark = async () => {
    setBookmarked(b => !b);
    try { await communityApi.toggleBookmark(Number(id)); }
    catch { setBookmarked(post?.is_bookmarked ?? false); }
  };

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const r = await communityApi.addComment(Number(id), commentText.trim(), replyTo?.id);
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
    setSubmitting(false);
  };

  const delComment = async (commentId: number, parentId?: number) => {
    try {
      await communityApi.deleteComment(Number(id), commentId);
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
    const finalReason = reportReason === "Other" && reportOther.trim()
      ? `Other: ${reportOther.trim()}` : reportReason;
    try {
      await communityApi.reportPost(Number(id), finalReason);
      setReported(true);
      setTimeout(() => setShowReport(false), 2000);
    } catch {}
  };

  const handleDelete = async () => {
    try {
      if (isAdmin) await communityApi.adminDeletePost(Number(id));
      else await communityApi.deletePost(Number(id));
      navigate("/community");
    } catch {}
  };

  const handleHide = async () => {
    setShowMenu(false);
    try {
      if (isHidden) { await communityApi.adminUnhidePost(Number(id)); setIsHidden(false); }
      else          { await communityApi.adminHidePost(Number(id));   setIsHidden(true);  }
    } catch {}
  };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(postUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch {}
  };

  if (loading) return (
    <div className="pdt-page"><Navbar />
      <div className="pdt-loading"><div className="pdt-spinner" /></div>
    </div>
  );

  if (error || !post) return (
    <div className="pdt-page"><Navbar />
      <div className="pdt-error">
        <p>{error || "Post not found"}</p>
        <button onClick={() => navigate("/community")}>← Back to Community</button>
      </div>
    </div>
  );

  return (
    <div className="pdt-page">
      <Navbar />
      <div className="pdt-container">

        <button className="pdt-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} strokeWidth={2.5} /> Back
        </button>

        <div className="pdt-card">

          {/* Author header */}
          <div className="pdt-head">
            <div className="pdt-av-wrap" onClick={() => post.user_id === currentUserId ? navigate("/profile") : navigate(`/profile/${post.user_id}`)}>
              {authorAvatar
                ? <img src={authorAvatar} alt={initials} className="pdt-av-img" />
                : <div className="pdt-av">{initials}</div>
              }
            </div>
            <div className="pdt-head-info">
              <div className="pdt-name" onClick={() => navigate(post.user_id === currentUserId ? "/profile" : `/profile/${post.user_id}`)}>
                {post.author?.first_name} {post.author?.last_name}
              </div>
              <div className="pdt-meta">
                <span>{ago(post.created_at)}</span>
                {post.place && <span className="pdt-place"><MapPin size={10} /> {post.place.name}</span>}
                {isHidden && <span className="pdt-hidden-chip">Hidden</span>}
              </div>
            </div>
            <div className="pdt-menu-wrap">
              <button className="pdt-icon-btn" onClick={() => setShowMenu(m => !m)} type="button">
                <MoreHorizontal size={20} />
              </button>
              {showMenu && (
                <div className="pdt-menu" onMouseLeave={() => setShowMenu(false)}>
                  {(isOwner || isAdmin) && (
                    <button className="pdt-menu-item pdt-menu-item--red" onClick={handleDelete} type="button">
                      <Trash2 size={13} /> Delete post
                    </button>
                  )}
                  {isAdmin && (
                    <button className="pdt-menu-item" onClick={handleHide} type="button">
                      {isHidden ? <><Eye size={13} /> Unhide</> : <><EyeOff size={13} /> Hide post</>}
                    </button>
                  )}
                  {!isOwner && !isAdmin && (
                    <button className="pdt-menu-item pdt-menu-item--amber" onClick={() => { setShowMenu(false); setShowReport(true); }} type="button">
                      <Flag size={13} /> Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Caption */}
          {post.caption && <p className="pdt-caption">{post.caption}</p>}

          {/* Images */}
          {images.length > 0 && (
            <div className="pdt-images">
              {images.length === 1 && (
                <div className="pdt-img-single" onClick={() => setLightboxIdx(0)}>
                  <img src={getImageUrl(images[0])} alt="" />
                </div>
              )}
              {images.length >= 2 && (
                <div className={`pdt-img-grid pdt-img-grid--${Math.min(images.length, 4)}`}>
                  {images.slice(0, 4).map((img, i) => (
                    <div key={i} className="pdt-img-cell" onClick={() => setLightboxIdx(i)}>
                      <img src={getImageUrl(img)} alt="" />
                      {i === 3 && images.length > 4 && (
                        <div className="pdt-img-more">+{images.length - 4}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          {(likesCount > 0 || commentsCount > 0) && (
            <div className="pdt-stats">
              {likesCount > 0 && (
                <span className="pdt-stat-likes">
                  <span style={{ color: REACTS[likeType]?.color }}><ReactIcon type={likeType} size={14} /></span>
                  {likesCount} {likesCount === 1 ? "reaction" : "reactions"}
                </span>
              )}
              {commentsCount > 0 && (
                <span className="pdt-stat-cmts">{commentsCount} comment{commentsCount !== 1 ? "s" : ""}</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pdt-actions">
            <div className="pdt-react-wrap"
              onMouseEnter={() => { if (reactTimer.current) clearTimeout(reactTimer.current); reactTimer.current = setTimeout(() => setShowReacts(true), 350); }}
              onMouseLeave={() => { if (reactTimer.current) clearTimeout(reactTimer.current); reactTimer.current = setTimeout(() => setShowReacts(false), 220); }}>
              <button className={`pdt-action ${liked ? "pdt-action--liked" : ""}`}
                style={liked ? { color: REACTS[likeType]?.color } : {}}
                onClick={() => handleLike(liked ? likeType : "like")} type="button">
                <ReactIcon type={liked ? likeType : "like"} size={18} />
                <span>{liked ? REACTS[likeType]?.label : "Like"}</span>
              </button>
              {showReacts && (
                <div className="pdt-react-picker"
                  onMouseEnter={() => { if (reactTimer.current) clearTimeout(reactTimer.current); }}
                  onMouseLeave={() => { if (reactTimer.current) clearTimeout(reactTimer.current); reactTimer.current = setTimeout(() => setShowReacts(false), 220); }}>
                  {reactKeys.map(type => (
                    <button key={type} className="pdt-react-btn" title={REACTS[type].label}
                      onClick={() => handleLike(type)} type="button" style={{ color: REACTS[type].color }}>
                      <ReactIcon type={type} size={22} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="pdt-action" onClick={() => inputRef.current?.focus()} type="button">
              <MessageCircle size={18} /><span>Comment</span>
            </button>

            <div className="pdt-share-wrap">
              <button className="pdt-action" onClick={() => setShowShare(s => !s)} type="button">
                <Share2 size={18} /><span>Share</span>
              </button>
              {showShare && (
                <div className="pdt-share-menu" onMouseLeave={() => setShowShare(false)}>
                  <button className="pdt-share-item" onClick={handleCopyLink} type="button">
                    {copied ? <><Check size={13} /> Copied</> : <><Link2 size={13} /> Copy Link</>}
                  </button>
                  <button className="pdt-share-item" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(post.caption?.slice(0,80) + " — " + postUrl)}`, "_blank")} type="button">WhatsApp</button>
                  <button className="pdt-share-item" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, "_blank")} type="button">Facebook</button>
                  {images.length > 0 && (
                    <button className="pdt-share-item" onClick={async () => {
                      try { const blob = await (await fetch(getImageUrl(images[0]))).blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `lokally-post-${id}.jpg`; a.click(); URL.revokeObjectURL(url); } catch {}
                    }} type="button"><Download size={13} /> Download</button>
                  )}
                </div>
              )}
            </div>

            <button className={`pdt-action ${bookmarked ? "pdt-action--saved" : ""}`} onClick={handleBookmark} type="button">
              {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              <span>{bookmarked ? "Saved" : "Save"}</span>
            </button>
          </div>

          {/* Comments section */}
          <div className="pdt-comments">
            <div className="pdt-cmt-input-row">
              {currentUserAvatar
                ? <img src={currentUserAvatar} alt="" className="pdt-cmt-av-img" />
                : <div className="pdt-cmt-av">{currentUserInitial}</div>
              }
              <div className="pdt-cmt-box">
                {replyTo && (
                  <div className="pdt-reply-banner">
                    <Reply size={11} /> Replying to <strong>{replyTo.user.first_name}</strong>
                    <button onClick={() => setReplyTo(null)} type="button"><X size={10} /></button>
                  </div>
                )}
                <input ref={inputRef} className="pdt-cmt-input"
                  placeholder={replyTo ? `Reply to ${replyTo.user.first_name}…` : "Write a comment…"}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitComment()} />
                {commentText.trim() && (
                  <button className="pdt-cmt-send" onClick={submitComment} disabled={submitting} type="button">
                    <Send size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="pdt-cmt-list">
              {comments.map(c => {
                const cAvatar = getAvatarUrl(c.user?.avatar);
                const cInitials = `${c.user?.first_name?.[0] ?? ""}${c.user?.last_name?.[0] ?? ""}`.toUpperCase() || "U";
                return (
                  <div key={c.id} className="pdt-cmt">
                    {cAvatar
                      ? <img src={cAvatar} alt="" className="pdt-cmt-av-img" />
                      : <div className="pdt-cmt-av">{cInitials}</div>
                    }
                    <div className="pdt-cmt-body">
                      <div className="pdt-cmt-bubble">
                        <span className="pdt-cmt-name">{c.user.first_name} {c.user.last_name}</span>
                        <p className="pdt-cmt-text">{c.body}</p>
                      </div>
                      <div className="pdt-cmt-meta">
                        <span>{ago(c.created_at)}</span>
                        <button onClick={() => { setReplyTo(c); inputRef.current?.focus(); }} type="button">Reply</button>
                        {(currentUserId === c.user_id || isAdmin) && (
                          <button className="pdt-cmt-del" onClick={() => delComment(c.id)} type="button">Delete</button>
                        )}
                      </div>
                      {(c.replies ?? []).map(r => {
                        const rAvatar = getAvatarUrl(r.user?.avatar);
                        const rInitials = `${r.user?.first_name?.[0] ?? ""}${r.user?.last_name?.[0] ?? ""}`.toUpperCase() || "U";
                        return (
                          <div key={r.id} className="pdt-cmt pdt-cmt--reply">
                            {rAvatar
                              ? <img src={rAvatar} alt="" className="pdt-cmt-av-img pdt-cmt-av-img--sm" />
                              : <div className="pdt-cmt-av pdt-cmt-av--sm">{rInitials}</div>
                            }
                            <div className="pdt-cmt-body">
                              <div className="pdt-cmt-bubble">
                                <span className="pdt-cmt-name">{r.user.first_name} {r.user.last_name}</span>
                                <p className="pdt-cmt-text">{r.body}</p>
                              </div>
                              <div className="pdt-cmt-meta">
                                <span>{ago(r.created_at)}</span>
                                {(currentUserId === r.user_id || isAdmin) && (
                                  <button className="pdt-cmt-del" onClick={() => delComment(r.id, c.id)} type="button">Delete</button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <div className="pdt-overlay" onClick={() => setShowReport(false)}>
          <div className="pdt-modal" onClick={e => e.stopPropagation()}>
            <div className="pdt-modal-head">
              <span>Report Post</span>
              <button onClick={() => setShowReport(false)} type="button"><X size={14} /></button>
            </div>
            {reported ? <div className="pdt-report-done">Reported successfully!</div> : (
              <>
                <div className="pdt-report-opts">
                  {REPORT_REASONS.map(r => (
                    <button key={r} className={`pdt-report-opt ${reportReason === r ? "active" : ""}`}
                      onClick={() => setReportReason(r)} type="button">{r}</button>
                  ))}
                </div>
                {reportReason === "Other" && (
                  <textarea className="pdt-report-other" placeholder="Describe the issue..." rows={3}
                    value={reportOther} onChange={e => setReportOther(e.target.value)} />
                )}
                <button className="pdt-report-submit" disabled={!reportReason} onClick={submitReport} type="button">
                  Submit Report
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="pdt-lightbox" onClick={() => setLightboxIdx(null)}>
          <button className="pdt-lightbox-close" onClick={() => setLightboxIdx(null)} type="button"><X size={22} /></button>
          <img src={getImageUrl(images[lightboxIdx])} alt="" onClick={e => e.stopPropagation()} />
          {images.length > 1 && (
            <>
              <button className="pdt-lightbox-prev" type="button" onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + images.length) % images.length); }}>&#8249;</button>
              <button className="pdt-lightbox-next" type="button" onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % images.length); }}>&#8250;</button>
              <div className="pdt-lightbox-counter">{lightboxIdx + 1} / {images.length}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}