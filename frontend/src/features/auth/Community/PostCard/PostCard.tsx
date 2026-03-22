import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThumbsUp,
  MessageCircle,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Trash2,
  MapPin,
  Send,
  X,
  Reply,
  Flag,
  Share2,
  Link2,
  Download,
  Check,
  Heart,
  Smile,
  Frown,
  Zap,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { communityApi } from "../communityApi";
import { REACTS, REPORT_REASONS } from "../CommunityTypes";
import type { Post, Comment, ReactType } from "../CommunityTypes";
import "./PostCard.css";
import {
  getImageUrl,
  getAvatarUrl,
} from "../../../../shared/config/imageUrl";

const parseImages = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [raw];
  } catch {
    return [raw];
  }
};

const ago = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

type Liker = {
  first_name: string;
  last_name: string;
  react_type: string;
  avatar?: string | null;
};

interface Props {
  post: Post;
  currentUserId?: number;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
  onHide?: (id: number, hidden: boolean) => void;
}

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="pc-overlay" onClick={onCancel}>
      <div className="pc-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pc-confirm-icon">
          <Trash2 size={20} strokeWidth={2} />
        </div>
        <p className="pc-confirm-msg">{message}</p>
        <div className="pc-confirm-btns">
          <button className="pc-confirm-cancel" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="pc-confirm-ok" onClick={onConfirm} type="button">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AvatarWithFallback({
  src,
  alt,
  initials,
  className,
  fallbackClassName,
  small = false,
}: {
  src?: string | null;
  alt?: string;
  initials: string;
  className: string;
  fallbackClassName: string;
  small?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={alt || initials}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div className={`${fallbackClassName}${small ? " pc-cmt-av--sm" : ""}`}>
      {initials || "U"}
    </div>
  );
}

export default function PostCard({
  post,
  currentUserId,
  isAdmin,
  onDelete,
  onHide,
}: Props) {
  const navigate = useNavigate();
  const reactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [liked, setLiked] = useState(post.has_liked ?? false);
  const [likeType, setLikeType] = useState<ReactType>(
    (post.liked_type as ReactType) ?? "like"
  );
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
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const [likers, setLikers] = useState<Liker[]>([]);
  const [likersLoading, setLikersLoading] = useState(false);
  const [likersFilter, setLikersFilter] = useState<string>("all");
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const images = useMemo(() => parseImages(post.images), [post.images]);
  const isOwner = currentUserId === post.user_id;
  const initials =
    `${post.author?.first_name?.[0] ?? ""}${post.author?.last_name?.[0] ?? ""}`.toUpperCase() || "U";
  const authorAvatar = getAvatarUrl(post.author?.avatar);
  const postUrl = `${window.location.origin}/community`;

  const currentUserData = (() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "{}");
    } catch {
      return {};
    }
  })();

  const currentUserAvatar = getAvatarUrl(currentUserData?.avatar);
  const currentUserInitial =
    `${currentUserData?.first_name?.[0] ?? ""}${currentUserData?.last_name?.[0] ?? ""}`.toUpperCase() || "U";

  const filteredLikers =
    likersFilter === "all"
      ? likers
      : likers.filter((l) => l.react_type === likersFilter);

  const reactCounts = likers.reduce((acc, l) => {
    acc[l.react_type] = (acc[l.react_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const goToProfile = () => {
    if (post.user_id === currentUserId) navigate("/profile");
    else navigate(`/profile/${post.user_id}`);
  };

  const handleLike = async (type: ReactType = "like") => {
    setShowReacts(false);
    const wasLiked = liked;
    const wasType = likeType;
    const sameType = wasLiked && wasType === type;

    setLiked(!sameType);
    setLikeType(type);
    setLikesCount((c) => (sameType ? c - 1 : wasLiked ? c : c + 1));

    try {
      await communityApi.toggleLike(post.id, type);
    } catch {
      setLiked(wasLiked);
      setLikeType(wasType);
      setLikesCount(post.likes_count);
    }
  };

  const handleBookmark = async () => {
    setBookmarked((b) => !b);
    try {
      await communityApi.toggleBookmark(post.id);
    } catch {
      setBookmarked(post.is_bookmarked ?? false);
    }
  };

  const handleShowLikers = async () => {
    if (likesCount === 0) return;

    if (!showLikers) {
      if (likers.length === 0) {
        setLikersLoading(true);
        try {
          const r = await communityApi.getLikers(post.id);
          if (r.success) setLikers(r.data);
        } catch {}
        setLikersLoading(false);
      }
      setShowLikers(true);
    } else {
      setShowLikers(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleWhatsApp = () =>
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `${post.caption?.slice(0, 80) ?? ""} — ${postUrl}`
      )}`,
      "_blank"
    );

  const handleFacebook = () =>
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
      "_blank"
    );

  const handleDownload = async () => {
    if (!images.length) return;
    try {
      const blob = await (await fetch(getImageUrl(images[0]))).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lokally-post-${post.id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const loadComments = async () => {
    if (!commentsLoaded) {
      const r = await communityApi.getComments(post.id);
      if (r.success) {
        setComments(r.data);
        setCommentsLoaded(true);
      }
    }

    setShowComments((s) => !s);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submitComment = async () => {
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const r = await communityApi.addComment(post.id, commentText.trim(), replyTo?.id);
      if (r.success) {
        if (replyTo) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyTo.id
                ? { ...c, replies: [...(c.replies ?? []), r.data] }
                : c
            )
          );
        } else {
          setComments((prev) => [...prev, { ...r.data, replies: [] }]);
          setCommentsCount((c) => c + 1);
        }

        setCommentText("");
        setReplyTo(null);
      }
    } catch {}
    setSubmittingComment(false);
  };

  const delComment = async (commentId: number, parentId?: number) => {
    try {
      await communityApi.deleteComment(post.id, commentId);

      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: (c.replies ?? []).filter((r) => r.id !== commentId) }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentsCount((c) => c - 1);
      }
    } catch {}
  };

  const submitReport = async () => {
    if (!reportReason) return;

    const finalReason =
      reportReason === "Other" && reportOther.trim()
        ? `Other: ${reportOther.trim()}`
        : reportReason;

    try {
      await communityApi.reportPost(post.id, finalReason);
      setReported(true);
      setTimeout(() => setShowReport(false), 2000);
    } catch {}
  };

  const handleAdminHide = async () => {
    setShowMenu(false);
    try {
      if (isHidden) {
        await communityApi.adminUnhidePost(post.id);
        setIsHidden(false);
        onHide?.(post.id, false);
      } else {
        await communityApi.adminHidePost(post.id);
        setIsHidden(true);
        onHide?.(post.id, true);
      }
    } catch {}
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      if (isAdmin) await communityApi.adminDeletePost(post.id);
      else await communityApi.deletePost(post.id);
      onDelete?.(post.id);
    } catch {}
  };

  const reactKeys = Object.keys(REACTS) as ReactType[];

  const ReactIcon = ({
    type,
    size = 18,
  }: {
    type: ReactType;
    size?: number;
  }) => {
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

  return (
    <>
      <article className={`pc ${isHidden ? "pc--hidden" : ""}`}>
        <div className="pc-head">
          <div className="pc-av-wrap" onClick={goToProfile} style={{ cursor: "pointer" }}>
            <AvatarWithFallback
              src={authorAvatar}
              alt={initials}
              initials={initials}
              className="pc-av-img"
              fallbackClassName="pc-av"
            />
          </div>

          <div className="pc-head-info">
            <div className="pc-name" onClick={goToProfile}>
              {post.author?.first_name} {post.author?.last_name}
            </div>
            <div className="pc-meta-row">
              <span className="pc-time">{ago(post.created_at)}</span>
              {post.place && (
                <span className="pc-place">
                  <MapPin size={10} /> {post.place.name}
                </span>
              )}
              {isHidden && <span className="pc-hidden-chip">Hidden</span>}
            </div>
          </div>

          <div className="pc-menu-wrap">
            <button className="pc-icon-btn" onClick={() => setShowMenu((m) => !m)} type="button">
              <MoreHorizontal size={20} />
            </button>

            {showMenu && (
              <div className="pc-menu" onMouseLeave={() => setShowMenu(false)}>
                {(isOwner || isAdmin) && (
                  <button
                    className="pc-menu-item pc-menu-item--red"
                    onClick={handleDelete}
                    type="button"
                  >
                    <Trash2 size={13} /> Delete post
                  </button>
                )}

                {isAdmin && (
                  <button className="pc-menu-item" onClick={handleAdminHide} type="button">
                    {isHidden ? (
                      <>
                        <Eye size={13} /> Unhide
                      </>
                    ) : (
                      <>
                        <EyeOff size={13} /> Hide post
                      </>
                    )}
                  </button>
                )}

                {!isOwner && !isAdmin && (
                  <button
                    className="pc-menu-item pc-menu-item--amber"
                    onClick={() => {
                      setShowMenu(false);
                      setShowReport(true);
                    }}
                    type="button"
                  >
                    <Flag size={13} /> Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {post.caption && <p className="pc-caption">{post.caption}</p>}

        {images.length > 0 && (
          <div className="pc-media">
            {images.length === 1 && (
              <div className="pc-ig-single" onClick={() => setLightboxIdx(0)}>
                <img src={getImageUrl(images[0])} alt="" loading="lazy" decoding="async" />
              </div>
            )}

            {images.length === 2 && (
              <div className="pc-ig-grid pc-ig-grid--2">
                {images.map((img, i) => (
                  <div key={i} className="pc-ig-cell" onClick={() => setLightboxIdx(i)}>
                    <img src={getImageUrl(img)} alt="" loading="lazy" decoding="async" />
                  </div>
                ))}
              </div>
            )}

            {images.length === 3 && (
              <div className="pc-ig-grid pc-ig-grid--3">
                <div className="pc-ig-cell pc-ig-cell--tall" onClick={() => setLightboxIdx(0)}>
                  <img src={getImageUrl(images[0])} alt="" loading="lazy" decoding="async" />
                </div>
                <div className="pc-ig-col">
                  {images.slice(1).map((img, i) => (
                    <div key={i} className="pc-ig-cell" onClick={() => setLightboxIdx(i + 1)}>
                      <img src={getImageUrl(img)} alt="" loading="lazy" decoding="async" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {images.length === 4 && (
              <div className="pc-ig-grid pc-ig-grid--4">
                {images.map((img, i) => (
                  <div key={i} className="pc-ig-cell" onClick={() => setLightboxIdx(i)}>
                    <img src={getImageUrl(img)} alt="" loading="lazy" decoding="async" />
                  </div>
                ))}
              </div>
            )}

            {images.length >= 5 && (
              <div className="pc-ig-grid pc-ig-grid--5">
                <div className="pc-ig-cell pc-ig-cell--tall" onClick={() => setLightboxIdx(0)}>
                  <img src={getImageUrl(images[0])} alt="" loading="lazy" decoding="async" />
                </div>
                <div className="pc-ig-cell pc-ig-cell--tall" onClick={() => setLightboxIdx(1)}>
                  <img src={getImageUrl(images[1])} alt="" loading="lazy" decoding="async" />
                </div>
                {images.slice(2, 5).map((img, i) => (
                  <div key={i} className="pc-ig-cell" onClick={() => setLightboxIdx(i + 2)}>
                    <img src={getImageUrl(img)} alt="" loading="lazy" decoding="async" />
                    {i === 2 && images.length > 5 && (
                      <div className="pc-ig-more">+{images.length - 5}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(likesCount > 0 || commentsCount > 0) && (
          <div className="pc-stats">
            {likesCount > 0 && (
              <button className="pc-stat-likes" onClick={handleShowLikers} type="button">
                <span className="pc-stat-react-icon" style={{ color: REACTS[likeType]?.color }}>
                  <ReactIcon type={likeType} size={14} />
                </span>
                {likesCount} {likesCount === 1 ? "person" : "people"} reacted
              </button>
            )}

            {commentsCount > 0 && (
              <button className="pc-stat-cmts" onClick={loadComments} type="button">
                {commentsCount} comment{commentsCount !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}

        <div className="pc-actions">
          <div
            className="pc-react-wrap"
            onMouseEnter={() => {
              if (reactTimer.current) clearTimeout(reactTimer.current);
              reactTimer.current = setTimeout(() => setShowReacts(true), 350);
            }}
            onMouseLeave={() => {
              if (reactTimer.current) clearTimeout(reactTimer.current);
              reactTimer.current = setTimeout(() => setShowReacts(false), 220);
            }}
          >
            <button
              className={`pc-action ${liked ? "pc-action--liked" : ""}`}
              style={liked ? { color: REACTS[likeType]?.color } : {}}
              onClick={() => handleLike(liked ? likeType : "like")}
              type="button"
            >
              <ReactIcon type={liked ? likeType : "like"} size={18} />
              <span>{liked ? REACTS[likeType]?.label : "Like"}</span>
            </button>

            {showReacts && (
              <div
                className="pc-react-picker"
                onMouseEnter={() => {
                  if (reactTimer.current) clearTimeout(reactTimer.current);
                }}
                onMouseLeave={() => {
                  if (reactTimer.current) clearTimeout(reactTimer.current);
                  reactTimer.current = setTimeout(() => setShowReacts(false), 220);
                }}
              >
                {reactKeys.map((type) => (
                  <button
                    key={type}
                    className="pc-react-btn"
                    title={REACTS[type].label}
                    onClick={() => handleLike(type)}
                    type="button"
                    style={{ color: REACTS[type].color }}
                  >
                    <ReactIcon type={type} size={22} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="pc-action" onClick={loadComments} type="button">
            <MessageCircle size={18} /> <span>Comment</span>
          </button>

          <div className="pc-share-wrap">
            <button className="pc-action" onClick={() => setShowShare((s) => !s)} type="button">
              <Share2 size={18} /> <span>Share</span>
            </button>

            {showShare && (
              <div className="pc-share-menu" onMouseLeave={() => setShowShare(false)}>
                <button className="pc-share-item" onClick={handleCopyLink} type="button">
                  {copied ? (
                    <>
                      <Check size={13} /> Copied
                    </>
                  ) : (
                    <>
                      <Link2 size={13} /> Copy Link
                    </>
                  )}
                </button>

                <button className="pc-share-item" onClick={handleWhatsApp} type="button">
                  WhatsApp
                </button>

                <button className="pc-share-item" onClick={handleFacebook} type="button">
                  Facebook
                </button>

                {images.length > 0 && (
                  <button className="pc-share-item" onClick={handleDownload} type="button">
                    <Download size={13} /> Download
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            className={`pc-action ${bookmarked ? "pc-action--saved" : ""}`}
            onClick={handleBookmark}
            type="button"
          >
            {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            <span>{bookmarked ? "Saved" : "Save"}</span>
          </button>
        </div>

        {showComments && (
          <div className="pc-comments">
            <div className="pc-cmt-input-row">
              <AvatarWithFallback
                src={currentUserAvatar}
                alt=""
                initials={currentUserInitial}
                className="pc-cmt-av pc-cmt-av-img"
                fallbackClassName="pc-cmt-av"
              />

              <div className="pc-cmt-box">
                {replyTo && (
                  <div className="pc-reply-banner">
                    <Reply size={11} /> Replying to <strong>{replyTo.user.first_name}</strong>
                    <button onClick={() => setReplyTo(null)} type="button">
                      <X size={10} />
                    </button>
                  </div>
                )}

                <input
                  ref={inputRef}
                  className="pc-cmt-input"
                  placeholder={replyTo ? `Reply to ${replyTo.user.first_name}…` : "Write a comment…"}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                />

                {commentText.trim() && (
                  <button
                    className="pc-cmt-send"
                    onClick={submitComment}
                    disabled={submittingComment}
                    type="button"
                  >
                    <Send size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="pc-cmt-list">
              {comments.map((c) => {
                const cAvatar = getAvatarUrl(c.user?.avatar);
                const cInitials =
                  `${c.user?.first_name?.[0] ?? ""}${c.user?.last_name?.[0] ?? ""}`.toUpperCase() || "U";

                return (
                  <div key={c.id} className="pc-cmt">
                    <AvatarWithFallback
                      src={cAvatar}
                      alt=""
                      initials={cInitials}
                      className="pc-cmt-av pc-cmt-av-img"
                      fallbackClassName="pc-cmt-av"
                    />

                    <div className="pc-cmt-body">
                      <div className="pc-cmt-bubble">
                        <span className="pc-cmt-name">
                          {c.user.first_name} {c.user.last_name}
                        </span>
                        <p className="pc-cmt-text">{c.body}</p>
                      </div>

                      <div className="pc-cmt-meta">
                        <span>{ago(c.created_at)}</span>
                        <button
                          onClick={() => {
                            setReplyTo(c);
                            inputRef.current?.focus();
                          }}
                          type="button"
                        >
                          Reply
                        </button>
                        {(currentUserId === c.user_id || isAdmin) && (
                          <button className="pc-cmt-del" onClick={() => delComment(c.id)} type="button">
                            Delete
                          </button>
                        )}
                      </div>

                      {(c.replies ?? []).map((r) => {
                        const rAvatar = getAvatarUrl(r.user?.avatar);
                        const rInitials =
                          `${r.user?.first_name?.[0] ?? ""}${r.user?.last_name?.[0] ?? ""}`.toUpperCase() || "U";

                        return (
                          <div key={r.id} className="pc-cmt pc-cmt--reply">
                            <AvatarWithFallback
                              src={rAvatar}
                              alt=""
                              initials={rInitials}
                              className="pc-cmt-av pc-cmt-av-img pc-cmt-av--sm"
                              fallbackClassName="pc-cmt-av"
                              small
                            />

                            <div className="pc-cmt-body">
                              <div className="pc-cmt-bubble">
                                <span className="pc-cmt-name">
                                  {r.user.first_name} {r.user.last_name}
                                </span>
                                <p className="pc-cmt-text">{r.body}</p>
                              </div>

                              <div className="pc-cmt-meta">
                                <span>{ago(r.created_at)}</span>
                                {(currentUserId === r.user_id || isAdmin) && (
                                  <button
                                    className="pc-cmt-del"
                                    onClick={() => delComment(r.id, c.id)}
                                    type="button"
                                  >
                                    Delete
                                  </button>
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

      {showReport && (
        <div className="pc-overlay" onClick={() => setShowReport(false)}>
          <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pc-modal-head">
              <div>Report Post</div>
              <button className="pc-modal-close" onClick={() => setShowReport(false)} type="button">
                <X size={14} />
              </button>
            </div>

            {reported ? (
              <div className="pc-report-done">Reported successfully.</div>
            ) : (
              <>
                <p className="pc-modal-sub">Why are you reporting this?</p>
                <div className="pc-report-opts">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r}
                      className={`pc-report-opt ${reportReason === r ? "pc-report-opt--on" : ""}`}
                      onClick={() => setReportReason(r)}
                      type="button"
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {reportReason === "Other" && (
                  <textarea
                    className="pc-report-other"
                    placeholder="Please describe the issue..."
                    value={reportOther}
                    onChange={(e) => setReportOther(e.target.value)}
                    rows={3}
                  />
                )}

                <button
                  className="pc-report-submit"
                  disabled={!reportReason || (reportReason === "Other" && !reportOther.trim())}
                  onClick={submitReport}
                  type="button"
                >
                  Submit Report
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          message="Delete this post permanently? This cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showLikers && (
        <div className="pc-overlay" onClick={() => setShowLikers(false)}>
          <div className="pc-likers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pc-likers-header">
              <h3 className="pc-likers-title">Reactions</h3>
              <button className="pc-modal-close" onClick={() => setShowLikers(false)} type="button">
                <X size={16} />
              </button>
            </div>

            <div className="pc-likers-tabs">
              <button
                className={`pc-likers-tab ${likersFilter === "all" ? "pc-likers-tab--on" : ""}`}
                onClick={() => setLikersFilter("all")}
                type="button"
              >
                All {likers.length}
              </button>

              {Object.entries(reactCounts).map(([type, count]) => (
                <button
                  key={type}
                  className={`pc-likers-tab ${likersFilter === type ? "pc-likers-tab--on" : ""}`}
                  onClick={() => setLikersFilter(type)}
                  type="button"
                  style={{ color: REACTS[type as ReactType]?.color }}
                >
                  <ReactIcon type={type as ReactType} size={14} /> {count}
                </button>
              ))}
            </div>

            <div className="pc-likers-list">
              {likersLoading ? (
                <div className="pc-likers-loading">Loading...</div>
              ) : filteredLikers.length === 0 ? (
                <div className="pc-likers-empty">No reactions yet</div>
              ) : (
                filteredLikers.map((l, i) => (
                  <div key={i} className="pc-likers-row">
                    <div className="pc-likers-av-wrap">
                      <div className="pc-likers-av">
                        {`${l.first_name?.[0] || ""}${l.last_name?.[0] || ""}`.toUpperCase() || "U"}
                      </div>
                    </div>
                    <span className="pc-likers-name">
                      {l.first_name} {l.last_name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {lightboxIdx !== null && (
        <div className="pc-lightbox" onClick={() => setLightboxIdx(null)}>
          <button className="pc-lightbox-close" onClick={() => setLightboxIdx(null)} type="button">
            <X size={22} />
          </button>

          <img
            src={getImageUrl(images[lightboxIdx])}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <>
              <button
                className="pc-lightbox-prev"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((lightboxIdx - 1 + images.length) % images.length);
                }}
              >
                &#8249;
              </button>

              <button
                className="pc-lightbox-next"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((lightboxIdx + 1) % images.length);
                }}
              >
                &#8250;
              </button>

              <div className="pc-lightbox-counter">
                {lightboxIdx + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}