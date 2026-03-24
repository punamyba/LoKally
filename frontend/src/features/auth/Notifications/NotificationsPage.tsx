import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Check, ArrowLeft, ThumbsUp, MessageCircle,
  MapPin, X, Mail, ShieldAlert, Flag,
} from "lucide-react";
import Navbar from "../Components/Layout/Navbar/Navbar";
import "./NotificationsPage.css";

const API    = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const SERVER = import.meta.env.VITE_API_BASE_URL || API.replace("/api", "");

const getAvatarUrl = (avatar?: string | null) => {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  if (avatar.includes("|||")) return avatar.split("|||")[1];
  if (avatar.startsWith("/")) return `${SERVER}${avatar}`;
  return null;
};

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

type Notif = {
  id: number; type: string; message: string;
  is_read: boolean; created_at: string;
  post_id?: number | null; place_id?: number | null;
  actor?: { id: number; first_name: string; last_name: string; avatar?: string };
};

const typeConfig: Record<string, { icon: React.ReactNode; cls: string }> = {
  like:           { icon: <ThumbsUp size={14} strokeWidth={2.5} />,     cls: "np-icon--blue"   },
  comment:        { icon: <MessageCircle size={14} strokeWidth={2.5} />, cls: "np-icon--teal"   },
  place_approved: { icon: <MapPin size={14} strokeWidth={2.5} />,        cls: "np-icon--green"  },
  place_rejected: { icon: <X size={14} strokeWidth={2.5} />,             cls: "np-icon--red"    },
  contact_reply:  { icon: <Mail size={14} strokeWidth={2.5} />,          cls: "np-icon--purple" },
  warning:        { icon: <ShieldAlert size={14} strokeWidth={2.5} />,   cls: "np-icon--amber"  },
  reported:       { icon: <Flag size={14} strokeWidth={2.5} />,          cls: "np-icon--red"    },
};

const TypeIcon = ({ type }: { type: string }) => {
  const t = typeConfig[type] || { icon: <Bell size={14} />, cls: "np-icon--blue" };
  return <div className={`np-type-icon ${t.cls}`}>{t.icon}</div>;
};

const buildMessage = (n: Notif): React.ReactNode => {
  const actorName = n.actor?.first_name && n.actor?.last_name
    ? `${n.actor.first_name} ${n.actor.last_name}`
    : "Someone";
  if (n.type === "like")           return <><strong>{actorName}</strong> liked your post</>;
  if (n.type === "comment")        return <><strong>{actorName}</strong> commented on your post</>;
  if (n.type === "place_approved") return <>{n.message}</>;
  if (n.type === "place_rejected") return <>{n.message}</>;
  if (n.type === "contact_reply")  return <>Admin replied to your message</>;
  if (n.type === "warning")        return <>{n.message}</>;
  if (n.type === "reported")       return <>{n.message}</>;
  return <><strong>{actorName}</strong> {n.message}</>;
};

const getRedirectPath = (n: Notif): string | null => {
  if (n.type === "like" || n.type === "comment")
    return n.post_id ? `/community` : null;
  if (n.type === "place_approved")
    return n.place_id ? `/place/${n.place_id}` : `/explore-map`;
  if (n.type === "contact_reply")
    return `/contact`;
  if (n.type === "warning" || n.type === "reported" || n.type === "place_rejected") {
    if (n.post_id)  return `/community`;
    if (n.place_id) return `/place/${n.place_id}`;
    return null;
  }
  if (n.post_id)  return `/community`;
  if (n.place_id) return `/place/${n.place_id}`;
  return null;
};

// Types that show popup instead of redirect
const POPUP_TYPES = ["warning", "reported", "place_rejected"];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<"all" | "unread">("all");
  const [popup,   setPopup]   = useState<Notif | null>(null);

  const token   = localStorage.getItem("token") || "";
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/notifications`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setNotifs(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await fetch(`${API}/notifications/read-all`, { method: "PUT", headers });
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleClick = async (n: Notif) => {
    if (!n.is_read) {
      await fetch(`${API}/notifications/${n.id}/read`, { method: "PUT", headers });
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    // action notifications → popup
    if (POPUP_TYPES.includes(n.type)) {
      setPopup(n);
      return;
    }
    const path = getRedirectPath(n);
    if (path) navigate(path);
  };

  const popupTitle = (type: string) => {
    if (type === "warning")        return "Content Warning";
    if (type === "reported")       return "Report Reviewed";
    if (type === "place_rejected") return "Place Submission Update";
    return "Notification";
  };

  const displayed   = filter === "unread" ? notifs.filter(n => !n.is_read) : notifs;
  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <>
      <div className="np-page">
        <Navbar />
        <div className="np-container">

          <div className="np-header">
            <button className="np-back" onClick={() => navigate(-1)} type="button">
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
            <div className="np-title-wrap">
              <h1 className="np-title">Notifications</h1>
              {unreadCount > 0 && <span className="np-unread-chip">{unreadCount} new</span>}
            </div>
            {unreadCount > 0 && (
              <button className="np-mark-btn" onClick={markAllRead} type="button">
                <Check size={14} strokeWidth={2.5} /> Mark all read
              </button>
            )}
          </div>

          <div className="np-filters">
            <button
              className={`np-filter ${filter === "all" ? "np-filter--on" : ""}`}
              onClick={() => setFilter("all")} type="button">
              All ({notifs.length})
            </button>
            <button
              className={`np-filter ${filter === "unread" ? "np-filter--on" : ""}`}
              onClick={() => setFilter("unread")} type="button">
              Unread ({unreadCount})
            </button>
          </div>

          <div className="np-list">
            {loading ? (
              <div className="np-loading"><div className="np-spinner" /></div>
            ) : displayed.length === 0 ? (
              <div className="np-empty">
                <div className="np-empty-icon"><Bell size={32} strokeWidth={1.2} /></div>
                <p className="np-empty-h">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="np-empty-s">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "When someone likes or comments on your posts, you'll see it here"}
                </p>
              </div>
            ) : (
              displayed.map(n => {
                const pic      = getAvatarUrl(n.actor?.avatar);
                const initials = `${n.actor?.first_name?.[0] || ""}${n.actor?.last_name?.[0] || ""}`.toUpperCase();
                const canClick = POPUP_TYPES.includes(n.type) || !!getRedirectPath(n);
                return (
                  <div
                    key={n.id}
                    className={`np-item ${!n.is_read ? "np-item--unread" : ""} ${canClick ? "np-item--clickable" : ""}`}
                    onClick={() => handleClick(n)}
                  >
                    <div className="np-avatar-wrap">
                      {pic
                        ? <img src={pic} alt={initials} className="np-avatar-img" />
                        : <div className="np-avatar-init">{initials || "?"}</div>
                      }
                      <TypeIcon type={n.type} />
                    </div>
                    <div className="np-content">
                      <p className="np-message">{buildMessage(n)}</p>
                      <span className="np-time">{timeAgo(n.created_at)}</span>
                    </div>
                    {!n.is_read && <div className="np-dot" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Notification detail popup ── */}
      {popup && (
        <div className="np-popup-overlay" onClick={() => setPopup(null)}>
          <div className="np-popup" onClick={e => e.stopPropagation()}>
            <div className="np-popup-head">
              <TypeIcon type={popup.type} />
              <div className="np-popup-title">{popupTitle(popup.type)}</div>
              <button className="np-popup-close" onClick={() => setPopup(null)}>
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="np-popup-body">
              <p className="np-popup-msg">{popup.message}</p>
              <span className="np-popup-time">{timeAgo(popup.created_at)}</span>
            </div>
            {(popup.post_id || popup.place_id) && (
              <div className="np-popup-footer">
                <button className="np-popup-view" onClick={() => {
                  setPopup(null);
                  const path = getRedirectPath(popup);
                  if (path) navigate(path);
                }}>
                  View Content
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}