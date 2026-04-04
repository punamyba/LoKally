import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Check, ExternalLink, ThumbsUp, MessageCircle,
  MapPin, X, Mail, ShieldAlert, Flag,
} from "lucide-react";
import "./NotificationDropdown.css";

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
  return `${Math.floor(h / 24)}d ago`;
};

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  like:           { icon: <ThumbsUp size={13} strokeWidth={2.5} />,     color: "#1a7fe8" },
  comment:        { icon: <MessageCircle size={13} strokeWidth={2.5} />, color: "#0d9488" },
  place_approved: { icon: <MapPin size={13} strokeWidth={2.5} />,        color: "#16a34a" },
  place_rejected: { icon: <X size={13} strokeWidth={2.5} />,             color: "#ef4444" },
  contact_reply:  { icon: <Mail size={13} strokeWidth={2.5} />,          color: "#8b5cf6" },
  warning:        { icon: <ShieldAlert size={13} strokeWidth={2.5} />,   color: "#b45309" },
  reported:       { icon: <Flag size={13} strokeWidth={2.5} />,          color: "#ef4444" },
};

type Notif = {
  id: number; type: string; message: string;
  is_read: boolean; created_at: string;
  post_id?: number | null; place_id?: number | null;
  actor?: { id: number; first_name: string; last_name: string; avatar?: string };
};

const POPUP_TYPES = ["warning", "reported", "place_rejected"];

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
    return n.post_id ? `/community/post/${n.post_id}` : null;
  if (n.type === "place_approved")
    return n.place_id ? `/place/${n.place_id}` : `/explore-map`;
  if (n.type === "contact_reply") return "/contact";
  if (n.post_id)  return `/community/post/${n.post_id}`;
  if (n.place_id) return `/place/${n.place_id}`;
  return null;
};

export default function NotificationDropdown() {
  const navigate  = useNavigate();
  const [open,    setOpen]    = useState(false);
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef   = useRef<HTMLDivElement>(null);

  // stable headers — read token once, not on every render
  const getHeaders = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  }), []);

  const fetchCount = useCallback(async () => {
    try {
      const r = await fetch(`${API}/notifications/unread-count`, { headers: getHeaders() });
      const d = await r.json();
      if (d.success) setUnread(d.count);
    } catch {}
  }, [getHeaders]);

  // poll every 30 seconds — cleanup on unmount
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/notifications`, { headers: getHeaders() });
      const d = await r.json();
      if (d.success) setNotifs(d.data);
    } catch {}
    setLoading(false);
  }, [getHeaders]);

  const handleOpen = () => {
    setOpen(o => {
      if (!o) fetchNotifs(); // fetch only when opening
      return !o;
    });
  };

  const markAllRead = async () => {
    await fetch(`${API}/notifications/read-all`, { method: "PUT", headers: getHeaders() });
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const handleClick = async (n: Notif) => {
    if (!n.is_read) {
      await fetch(`${API}/notifications/${n.id}/read`, { method: "PUT", headers: getHeaders() });
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      setUnread(u => Math.max(0, u - 1));
    }

    setOpen(false);

    if (POPUP_TYPES.includes(n.type)) {
      navigate("/notifications", { state: { fromNotif: true } });
      return;
    }

    const path = getRedirectPath(n);
    if (path) navigate(path);
  };

  return (
    <div className="nd-wrap" ref={wrapRef}>
      <button className="nd-bell" onClick={handleOpen} type="button">
        <Bell size={20} strokeWidth={2} />
        {unread > 0 && <span className="nd-badge">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <div className="nd-dropdown">
          <div className="nd-header">
            <span className="nd-title">Notifications</span>
            {unread > 0 && (
              <button className="nd-mark-all" onClick={markAllRead} type="button">
                <Check size={13} /> Mark all read
              </button>
            )}
            <button className="nd-view-all" onClick={() => { setOpen(false); navigate("/notifications"); }} type="button">
              <ExternalLink size={13} /> View all
            </button>
          </div>

          <div className="nd-list">
            {loading ? (
              <div className="nd-loading">
                <div className="nd-dot" /><div className="nd-dot" /><div className="nd-dot" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="nd-empty">
                <span>🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifs.slice(0, 8).map(n => {
                const pic      = getAvatarUrl(n.actor?.avatar);
                const initials = `${n.actor?.first_name?.[0] || ""}${n.actor?.last_name?.[0] || ""}`.toUpperCase();
                const tc       = typeConfig[n.type] || { icon: <Bell size={13} />, color: "#1a7fe8" };
                return (
                  <div
                    key={n.id}
                    className={`nd-item ${!n.is_read ? "nd-item--unread" : ""}`}
                    onClick={() => handleClick(n)}
                  >
                    <div className="nd-actor">
                      {pic
                        ? <img src={pic} alt={initials} className="nd-actor-img" />
                        : <div className="nd-actor-init">{initials || "?"}</div>
                      }
                      <span className="nd-type-badge" style={{ color: tc.color }}>{tc.icon}</span>
                    </div>
                    <div className="nd-body">
                      <p className="nd-msg">{buildMessage(n)}</p>
                      <span className="nd-time">{timeAgo(n.created_at)}</span>
                    </div>
                    {!n.is_read && <div className="nd-unread-dot" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}