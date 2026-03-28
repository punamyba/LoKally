import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThumbsUp, MessageCircle, Bookmark, BookmarkCheck,
  MoreHorizontal, Trash2, MapPin, Send, X, Reply,
  Flag, Share2, Link2, Download, Check, Heart, Smile,
  Frown, Zap, AlertCircle, Eye, EyeOff, Pencil, Plus,
} from "lucide-react";
import { communityApi } from "../communityApi";
import { REACTS, REPORT_REASONS } from "../CommunityTypes";
import type { Post, Comment, ReactType } from "../CommunityTypes";
import "./PostCard.css";
import { getImageUrl, getAvatarUrl } from "../../../../shared/config/imageUrl";

const parseImages = (raw: string | null): string[] => {
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [raw]; }
  catch { return [raw]; }
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

type Liker = { first_name: string; last_name: string; react_type: string; avatar?: string | null; };

interface Props {
  post: Post;
  currentUserId?: number;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
  onHide?: (id: number, hidden: boolean) => void;
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void; }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon"><Trash2 size={20} strokeWidth={2} /></div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-buttons">
          <button className="confirm-cancel-btn" onClick={onCancel} type="button">Cancel</button>
          <button className="confirm-delete-btn" onClick={onConfirm} type="button">Delete</button>
        </div>
      </div>
    </div>
  );
}

function AvatarWithFallback({ src, alt, initials, className, fallbackClassName, small = false }: {
  src?: string | null; alt?: string; initials: string;
  className: string; fallbackClassName: string; small?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  if (src && !imgFailed) {
    return <img src={src} alt={alt || initials} className={className} referrerPolicy="no-referrer" onError={() => setImgFailed(true)} />;
  }
  return <div className={`${fallbackClassName}${small ? " pc-cmt-av--sm" : ""}`}>{initials || "U"}</div>;
}

export default function PostCard({ post, currentUserId, isAdmin, onDelete, onHide }: Props) {
  const navigate = useNavigate();
  const reactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Core state
  const [liked, setLiked] = useState(post.has_liked ?? false);
  const [likeType, setLikeType] = useState<ReactType>((post.liked_type as ReactType) ?? "like");
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [bookmarked, setBookmarked] = useState(post.is_bookmarked ?? false);
  const [isHidden, setIsHidden] = useState(post.is_hidden);
  const [showReacts, setShowReacts] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportOther, setReportOther] = useState("");
  const [reported, setReported] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const [likers, setLikers] = useState<Liker[]>([]);
  const [likersLoading, setLikersLoading] = useState(false);
  const [likersFilter, setLikersFilter] = useState<string>("all");
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || "");
  const [editImages, setEditImages] = useState<string[]>(parseImages(post.images));
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [editNewPreviews, setEditNewPreviews] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>(parseImages(post.images));

  const images = useMemo(() => currentImages, [currentImages]);
  const isOwner = currentUserId === post.user_id;

  const initials = `${post.author?.first_name?.[0] ?? ""}${post.author?.last_name?.[0] ?? ""}`.toUpperCase() || "U";
  const authorAvatar = getAvatarUrl(post.author?.avatar);
  const postUrl = `${window.location.origin}/community`;

  const currentUserData = (() => { try { return JSON.parse(localStorage.getItem("currentUser") || "{}"); } catch { return {}; } })();
  const currentUserAvatar = getAvatarUrl(currentUserData?.avatar);
  const currentUserInitial = `${currentUserData?.first_name?.[0] ?? ""}${currentUserData?.last_name?.[0] ?? ""}`.toUpperCase() || "U";

  const filteredLikers = likersFilter === "all" ? likers : likers.filter(l => l.react_type === likersFilter);
  const reactCounts = likers.reduce((acc, l) => { acc[l.react_type] = (acc[l.react_type] || 0) + 1; return acc; }, {} as Record<string, number>);

  // Caption truncation — 4 lines
  const CAPTION_LIMIT = 200;
  const captionLong = (post.caption || "").length > CAPTION_LIMIT;
  const displayCaption = captionLong && !captionExpanded
    ? (post.caption || "").slice(0, CAPTION_LIMIT) + "…"
    : (post.caption || "");

  const goToProfile = () => {
    if (post.user_id === currentUserId) navigate("/profile");
    else navigate(`/profile/${post.user_id}`);
  };

  const handleLike = async (type: ReactType = "like") => {
    setShowReacts(false);
    const wasLiked = liked; const wasType = likeType;
    const sameType = wasLiked && wasType === type;
    setLiked(!sameType); setLikeType(type);
    setLikesCount(c => sameType ? c - 1 : wasLiked ? c : c + 1);
    try { await communityApi.toggleLike(post.id, type); }
    catch { setLiked(wasLiked); setLikeType(wasType); setLikesCount(post.likes_count); }
  };

  const handleBookmark = async () => {
    setBookmarked(b => !b);
    try { await communityApi.toggleBookmark(post.id); }
    catch { setBookmarked(post.is_bookmarked ?? false); }
  };

  const handleShowLikers = async () => {
    if (likesCount === 0) return;
    if (!showLikers) {
      if (likers.length === 0) {
        setLikersLoading(true);
        try { const r = await communityApi.getLikers(post.id); if (r.success) setLikers(r.data); } catch {}
        setLikersLoading(false);
      }
      setShowLikers(true);
    } else setShowLikers(false);
  };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(postUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const handleWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${post.caption?.slice(0, 80) ?? ""} — ${postUrl}`)}`, "_blank");
  const handleFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, "_blank");

  const handleDownload = async () => {
    if (!images.length) return;
    try {
      const blob = await (await fetch(getImageUrl(images[0]))).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `lokally-post-${post.id}.jpg`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

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
        if (replyTo) setComments(prev => prev.map(c => c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), r.data] } : c));
        else { setComments(prev => [...prev, { ...r.data, replies: [] }]); setCommentsCount(c => c + 1); }
        setCommentText(""); setReplyTo(null);
      }
    } catch {}
    setSubmittingComment(false);
  };

  const delComment = async (commentId: number, parentId?: number) => {
    try {
      await communityApi.deleteComment(post.id, commentId);
      if (parentId) setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: (c.replies ?? []).filter(r => r.id !== commentId) } : c));
      else { setComments(prev => prev.filter(c => c.id !== commentId)); setCommentsCount(c => c - 1); }
    } catch {}
  };

  const submitReport = async () => {
    if (!reportReason) return;
    const finalReason = reportReason === "Other" && reportOther.trim() ? `Other: ${reportOther.trim()}` : reportReason;
    try {
      await communityApi.reportPost(post.id, finalReason);
      setReported(true);
      setTimeout(() => setShowReport(false), 2000);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setAlreadyReported(true);
        setTimeout(() => setShowReport(false), 2000);
      }
    }
  };

  const handleAdminHide = async () => {
    setShowMenu(false);
    try {
      if (isHidden) { await communityApi.adminUnhidePost(post.id); setIsHidden(false); onHide?.(post.id, false); }
      else { await communityApi.adminHidePost(post.id); setIsHidden(true); onHide?.(post.id, true); }
    } catch {}
  };

  const handleDelete = () => { setShowMenu(false); setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      if (isAdmin) await communityApi.adminDeletePost(post.id);
      else await communityApi.deletePost(post.id);
      onDelete?.(post.id);
    } catch {}
  };

  // Edit handlers
  const startEdit = () => {
    setEditCaption(post.caption || "");
    setEditImages([...currentImages]);
    setEditNewFiles([]);
    setEditNewPreviews([]);
    setEditMode(true);
    setShowMenu(false);
  };

  const cancelEdit = () => {
    editNewPreviews.forEach(URL.revokeObjectURL);
    setEditMode(false); setEditNewFiles([]); setEditNewPreviews([]);
  };

  const removeExistingImage = (idx: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeNewImage = (idx: number) => {
    URL.revokeObjectURL(editNewPreviews[idx]);
    setEditNewFiles(prev => prev.filter((_, i) => i !== idx));
    setEditNewPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const addEditFiles = (fl: FileList | null) => {
    if (!fl) return;
    const total = editImages.length + editNewFiles.length;
    const arr = Array.from(fl).slice(0, 10 - total);
    setEditNewFiles(prev => [...prev, ...arr]);
    setEditNewPreviews(prev => [...prev, ...arr.map(f => URL.createObjectURL(f))]);
  };

  const saveEdit = async () => {
    setEditSaving(true);
    try {
      const fd = new FormData();
      fd.append("caption", editCaption.trim());
      fd.append("existingImages", JSON.stringify(editImages));
      editNewFiles.forEach(f => fd.append("images", f));
      const r = await (communityApi as any).updatePost(post.id, fd);
      if (r.success) {
        const updatedImages = parseImages(r.data?.images) || editImages;
        setCurrentImages(updatedImages);
        setEditMode(false);
        editNewPreviews.forEach(URL.revokeObjectURL);
        setEditNewFiles([]); setEditNewPreviews([]);
      }
    } catch {}
    setEditSaving(false);
  };

  const reactKeys = Object.keys(REACTS) as ReactType[];

  const ReactIcon = ({ type, size = 18 }: { type: ReactType; size?: number }) => {
    const icons: Record<ReactType, React.ReactNode> = {
      like: <ThumbsUp size={size} strokeWidth={2} />,
      love: <Heart size={size} strokeWidth={2} />,
      wow: <Zap size={size} strokeWidth={2} />,
      haha: <Smile size={size} strokeWidth={2} />,
      sad: <Frown size={size} strokeWidth={2} />,
      angry: <AlertCircle size={size} strokeWidth={2} />,
    };
    return <>{icons[type]}</>;
  };

  const renderImages = (imgs: string[]) => {
    if (imgs.length === 0) return null;
    return (
      <div className="post-media">
        {imgs.length === 1 && (
          <div className="post-img-single" onClick={() => setLightboxIdx(0)}>
            <img src={getImageUrl(imgs[0])} alt="" loading="lazy" decoding="async" />
          </div>
        )}
        {imgs.length === 2 && (
          <div className="post-img-grid post-img-grid--2">
            {imgs.map((img, i) => (
              <div key={i} className="post-img-cell" onClick={() => setLightboxIdx(i)}>
                <img src={getImageUrl(img)} alt="" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        )}
        {imgs.length === 3 && (
          <div className="post-img-grid post-img-grid--3">
            <div className="post-img-cell post-img-cell--tall" onClick={() => setLightboxIdx(0)}>
              <img src={getImageUrl(imgs[0])} alt="" loading="lazy" decoding="async" />
            </div>
            <div className="post-img-col">
              {imgs.slice(1).map((img, i) => (
                <div key={i} className="post-img-cell" onClick={() => setLightboxIdx(i + 1)}>
                  <img src={getImageUrl(img)} alt="" loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </div>
        )}
        {imgs.length === 4 && (
          <div className="post-img-grid post-img-grid--4">
            {imgs.map((img, i) => (
              <div key={i} className="post-img-cell" onClick={() => setLightboxIdx(i)}>
                <img src={getImageUrl(img)} alt="" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        )}
        {imgs.length >= 5 && (
          <div className="post-img-grid post-img-grid--5">
            <div className="post-img-cell post-img-cell--tall" onClick={() => setLightboxIdx(0)}>
              <img src={getImageUrl(imgs[0])} alt="" loading="lazy" decoding="async" />
            </div>
            <div className="post-img-cell post-img-cell--tall" onClick={() => setLightboxIdx(1)}>
              <img src={getImageUrl(imgs[1])} alt="" loading="lazy" decoding="async" />
            </div>
            {imgs.slice(2, 5).map((img, i) => (
              <div key={i} className="post-img-cell" onClick={() => setLightboxIdx(i + 2)}>
                <img src={getImageUrl(img)} alt="" loading="lazy" decoding="async" />
                {i === 2 && imgs.length > 5 && <div className="post-img-more">+{imgs.length - 5}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <article className={`post-card ${isHidden ? "post-card--hidden" : ""}`}>
        {/* Header */}
        <div className="post-head">
          <div className="post-avatar-wrap" onClick={goToProfile} style={{ cursor: "pointer" }}>
            <AvatarWithFallback src={authorAvatar} alt={initials} initials={initials} className="post-avatar-img" fallbackClassName="post-avatar" />
          </div>
          <div className="post-author-info">
            <div className="post-author-name" onClick={goToProfile}>{post.author?.first_name} {post.author?.last_name}</div>
            <div className="post-meta">
              <span className="post-time">{ago(post.created_at)}</span>
              {post.place && <span className="post-place"><MapPin size={10} /> {post.place.name}</span>}
              {isHidden && <span className="post-hidden-badge">Hidden</span>}
            </div>
          </div>
          <div className="post-menu-wrap">
            <button className="post-menu-btn" onClick={() => setShowMenu(m => !m)} type="button">
              <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <div className="post-menu" onMouseLeave={() => setShowMenu(false)}>
                {isOwner && (
                  <button className="post-menu-item" onClick={startEdit} type="button">
                    <Pencil size={13} /> Edit post
                  </button>
                )}
                {(isOwner || isAdmin) && (
                  <button className="post-menu-item post-menu-item--red" onClick={handleDelete} type="button">
                    <Trash2 size={13} /> Delete post
                  </button>
                )}
                {isAdmin && (
                  <button className="post-menu-item" onClick={handleAdminHide} type="button">
                    {isHidden ? <><Eye size={13} /> Unhide</> : <><EyeOff size={13} /> Hide post</>}
                  </button>
                )}
                {!isOwner && !isAdmin && (
                  <button className="post-menu-item post-menu-item--amber" onClick={() => { setShowMenu(false); setShowReport(true); }} type="button">
                    <Flag size={13} /> Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit mode */}
        {editMode ? (
          <div className="post-edit-box">
            <textarea
              className="post-edit-textarea"
              value={editCaption}
              onChange={e => setEditCaption(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
            />
            {/* Existing images */}
            {(editImages.length > 0 || editNewPreviews.length > 0) && (
              <div className="post-edit-images">
                {editImages.map((img, i) => (
                  <div key={i} className="post-edit-img">
                    <img src={getImageUrl(img)} alt="" />
                    <button className="post-edit-img-remove" onClick={() => removeExistingImage(i)} type="button">
                      <X size={11} strokeWidth={3} />
                    </button>
                  </div>
                ))}
                {editNewPreviews.map((src, i) => (
                  <div key={`new-${i}`} className="post-edit-img post-edit-img--new">
                    <img src={src} alt="" />
                    <button className="post-edit-img-remove" onClick={() => removeNewImage(i)} type="button">
                      <X size={11} strokeWidth={3} />
                    </button>
                  </div>
                ))}
                {(editImages.length + editNewFiles.length) < 10 && (
                  <button className="post-edit-img-add" onClick={() => editFileRef.current?.click()} type="button">
                    <Plus size={20} />
                  </button>
                )}
              </div>
            )}
            {editImages.length === 0 && editNewPreviews.length === 0 && (
              <button className="post-edit-add-photo" onClick={() => editFileRef.current?.click()} type="button">
                <Plus size={14} /> Add photos
              </button>
            )}
            <input ref={editFileRef} type="file" accept="image/*" multiple hidden onChange={e => addEditFiles(e.target.files)} />
            <div className="post-edit-footer">
              <button className="post-edit-cancel-btn" onClick={cancelEdit} type="button">Cancel</button>
              <button className="post-edit-save-btn" onClick={saveEdit} disabled={editSaving} type="button">
                {editSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Caption with view more */}
            {post.caption && (
              <p className="post-caption">
                {displayCaption}
                {captionLong && (
                  <button className="post-view-more" onClick={() => setCaptionExpanded(e => !e)} type="button">
                    {captionExpanded ? " Show less" : " View more"}
                  </button>
                )}
              </p>
            )}
            {renderImages(images)}
          </>
        )}

        {/* Stats */}
        {(likesCount > 0 || commentsCount > 0) && (
          <div className="post-stats-bar">
            {likesCount > 0 && (
              <button className="post-stat-likes" onClick={handleShowLikers} type="button">
                <span className="post-stat-icon" style={{ color: REACTS[likeType]?.color }}>
                  <ReactIcon type={likeType} size={14} />
                </span>
                {likesCount} {likesCount === 1 ? "person" : "people"} reacted
              </button>
            )}
            {commentsCount > 0 && (
              <button className="post-stat-comments" onClick={loadComments} type="button">
                {commentsCount} comment{commentsCount !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="post-actions">
          <div className="post-react-wrap"
            onMouseEnter={() => { if (reactTimer.current) clearTimeout(reactTimer.current); reactTimer.current = setTimeout(() => setShowReacts(true), 350); }}
            onMouseLeave={() => { if (reactTimer.current) clearTimeout(reactTimer.current); reactTimer.current = setTimeout(() => setShowReacts(false), 220); }}>
            <button className={`post-action ${liked ? "post-action--liked" : ""}`}
              style={liked ? { color: REACTS[likeType]?.color } : {}}
              onClick={() => handleLike(liked ? likeType : "like")} type="button">
              <ReactIcon type={liked ? likeType : "like"} size={18} />
              <span>{liked ? REACTS[likeType]?.label : "Like"}</span>
            </button>
            {showReacts && (
              <div className="post-react-picker"
                onMouseEnter={() => { if (reactTimer.current) clearTimeout(reactTimer.current); }}
                onMouseLeave={() => { if (reactTimer.current) clearTimeout(reactTimer.current); reactTimer.current = setTimeout(() => setShowReacts(false), 220); }}>
                {reactKeys.map(type => (
                  <button key={type} className="post-react-btn" title={REACTS[type].label} onClick={() => handleLike(type)} type="button" style={{ color: REACTS[type].color }}>
                    <ReactIcon type={type} size={22} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="post-action" onClick={loadComments} type="button">
            <MessageCircle size={18} /> <span>Comment</span>
          </button>

          <div className="post-share-wrap">
            <button className="post-action" onClick={() => setShowShare(s => !s)} type="button">
              <Share2 size={18} /> <span>Share</span>
            </button>
            {showShare && (
              <div className="post-share-menu" onMouseLeave={() => setShowShare(false)}>
                <button className="post-share-item" onClick={handleCopyLink} type="button">
                  {copied ? <><Check size={13} /> Copied</> : <><Link2 size={13} /> Copy Link</>}
                </button>
                <button className="post-share-item" onClick={handleWhatsApp} type="button">WhatsApp</button>
                <button className="post-share-item" onClick={handleFacebook} type="button">Facebook</button>
                {images.length > 0 && (
                  <button className="post-share-item" onClick={handleDownload} type="button">
                    <Download size={13} /> Download
                  </button>
                )}
              </div>
            )}
          </div>

          <button className={`post-action ${bookmarked ? "post-action--saved" : ""}`} onClick={handleBookmark} type="button">
            {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            <span>{bookmarked ? "Saved" : "Save"}</span>
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="post-comments">
            <div className="comment-input-row">
              <AvatarWithFallback src={currentUserAvatar} alt="" initials={currentUserInitial} className="comment-avatar comment-avatar-img" fallbackClassName="comment-avatar" />
              <div className="comment-input-box">
                {replyTo && (
                  <div className="comment-reply-banner">
                    <Reply size={11} /> Replying to <strong>{replyTo.user.first_name}</strong>
                    <button onClick={() => setReplyTo(null)} type="button"><X size={10} /></button>
                  </div>
                )}
                <input ref={inputRef} className="comment-input"
                  placeholder={replyTo ? `Reply to ${replyTo.user.first_name}…` : "Write a comment…"}
                  value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitComment()} />
                {commentText.trim() && (
                  <button className="comment-send-btn" onClick={submitComment} disabled={submittingComment} type="button">
                    <Send size={13} />
                  </button>
                )}
              </div>
            </div>
            <div className="comment-list">
              {comments.map(c => {
                const cAvatar = getAvatarUrl(c.user?.avatar);
                const cInitials = `${c.user?.first_name?.[0] ?? ""}${c.user?.last_name?.[0] ?? ""}`.toUpperCase() || "U";
                return (
                  <div key={c.id} className="comment-item">
                    <AvatarWithFallback src={cAvatar} alt="" initials={cInitials} className="comment-avatar comment-avatar-img" fallbackClassName="comment-avatar" />
                    <div className="comment-body">
                      <div className="comment-bubble">
                        <span className="comment-author">{c.user.first_name} {c.user.last_name}</span>
                        <p className="comment-text">{c.body}</p>
                      </div>
                      <div className="comment-meta">
                        <span>{ago(c.created_at)}</span>
                        <button onClick={() => { setReplyTo(c); inputRef.current?.focus(); }} type="button">Reply</button>
                        {(currentUserId === c.user_id || isAdmin) && (
                          <button className="comment-delete-btn" onClick={() => delComment(c.id)} type="button">Delete</button>
                        )}
                      </div>
                      {(c.replies ?? []).map(r => {
                        const rAvatar = getAvatarUrl(r.user?.avatar);
                        const rInitials = `${r.user?.first_name?.[0] ?? ""}${r.user?.last_name?.[0] ?? ""}`.toUpperCase() || "U";
                        return (
                          <div key={r.id} className="comment-item comment-item--reply">
                            <AvatarWithFallback src={rAvatar} alt="" initials={rInitials} className="comment-avatar comment-avatar-img comment-avatar--sm" fallbackClassName="comment-avatar" small />
                            <div className="comment-body">
                              <div className="comment-bubble">
                                <span className="comment-author">{r.user.first_name} {r.user.last_name}</span>
                                <p className="comment-text">{r.body}</p>
                              </div>
                              <div className="comment-meta">
                                <span>{ago(r.created_at)}</span>
                                {(currentUserId === r.user_id || isAdmin) && (
                                  <button className="comment-delete-btn" onClick={() => delComment(r.id, c.id)} type="button">Delete</button>
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
        )}
      </article>

      {/* Report modal */}
      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="report-header">
              <div className="report-header-left">
                <div className="report-header-icon"><Flag size={16} /></div>
                <span>Report Post</span>
              </div>
              <button className="report-close-btn" onClick={() => setShowReport(false)} type="button">
                <X size={15} />
              </button>
            </div>

            {/* Already reported */}
            {alreadyReported ? (
              <div className="report-status report-status--warn">
                <div className="report-status-icon">⚠️</div>
                <div>
                  <div className="report-status-title">Already Reported</div>
                  <div className="report-status-subtitle">You have already reported this post.</div>
                </div>
              </div>
            ) : reported ? (
              <div className="report-status report-status--success">
                <div className="report-status-icon">✅</div>
                <div>
                  <div className="report-status-title">Report Submitted</div>
                  <div className="report-status-subtitle">Thank you! Our team will review it.</div>
                </div>
              </div>
            ) : (
              <>
                <p className="report-subtitle">Why are you reporting this?</p>
                <div className="report-options">
                  {REPORT_REASONS.map(r => (
                    <button key={r}
                      className={`report-option ${reportReason === r ? "report-option--active" : ""}`}
                      onClick={() => setReportReason(r)} type="button">
                      {r}
                    </button>
                  ))}
                </div>
                {reportReason === "Other" && (
                  <textarea className="report-other-input" placeholder="Please describe the issue..."
                    value={reportOther} onChange={e => setReportOther(e.target.value)} rows={3} />
                )}
                <button className="report-submit-btn"
                  disabled={!reportReason || (reportReason === "Other" && !reportOther.trim())}
                  onClick={submitReport} type="button">
                  Submit Report
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmModal message="Delete this post permanently? This cannot be undone." onConfirm={confirmDelete} onCancel={() => setShowDeleteConfirm(false)} />
      )}

      {/* Likers modal */}
      {showLikers && (
        <div className="modal-overlay" onClick={() => setShowLikers(false)}>
          <div className="likers-modal" onClick={e => e.stopPropagation()}>
            <div className="likers-header">
              <h3 className="likers-title">Reactions</h3>
              <button className="modal-close-btn" onClick={() => setShowLikers(false)} type="button"><X size={16} /></button>
            </div>
            <div className="likers-tabs">
              <button className={`likers-tab ${likersFilter === "all" ? "likers-tab--active" : ""}`} onClick={() => setLikersFilter("all")} type="button">All {likers.length}</button>
              {Object.entries(reactCounts).map(([type, count]) => (
                <button key={type} className={`likers-tab ${likersFilter === type ? "likers-tab--active" : ""}`} onClick={() => setLikersFilter(type)} type="button" style={{ color: REACTS[type as ReactType]?.color }}>
                  <ReactIcon type={type as ReactType} size={14} /> {count}
                </button>
              ))}
            </div>
            <div className="likers-list">
              {likersLoading ? <div className="likers-loading">Loading...</div>
                : filteredLikers.length === 0 ? <div className="likers-empty">No reactions yet</div>
                : filteredLikers.map((l, i) => (
                  <div key={i} className="likers-row">
                    <div className="likers-avatar">{`${l.first_name?.[0] || ""}${l.last_name?.[0] || ""}`.toUpperCase() || "U"}</div>
                    <span className="likers-name">{l.first_name} {l.last_name}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="lightbox" onClick={() => setLightboxIdx(null)}>
          <button className="lightbox-close-btn" onClick={() => setLightboxIdx(null)} type="button"><X size={22} /></button>
          <img src={getImageUrl(images[lightboxIdx])} alt="" onClick={e => e.stopPropagation()} />
          {images.length > 1 && (
            <>
              <button className="lightbox-prev-btn" type="button" onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + images.length) % images.length); }}>&#8249;</button>
              <button className="lightbox-next-btn" type="button" onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % images.length); }}>&#8250;</button>
              <div className="lightbox-counter">{lightboxIdx + 1} / {images.length}</div>
            </>
          )}
        </div>
      )}
    </>
  );
}