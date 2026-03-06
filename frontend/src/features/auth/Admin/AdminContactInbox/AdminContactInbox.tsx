import { useEffect, useState } from "react";
import {
  MessageSquare, RefreshCw, Send, Trash2,
  ToggleLeft, ToggleRight, ChevronRight,
  Clock, AlertCircle, MessageCircle, CheckCircle,
} from "lucide-react";
import { contactApi } from "../../ContactUs/ContactApi";
import type { ContactStatus } from "../../ContactUs/ContactApi";
import "./AdminContactInbox.css";

type Conv = { id: number; ref_number: string; name: string; email: string; subject: string; status: ContactStatus; allow_user_reply: boolean; created_at: string; updated_at: string };
type ConvMsg = { id: number; sender_type: "user" | "admin"; body: string; created_at: string; sender?: { first_name: string; last_name: string } | null };
type ConvDetail = Conv & { message: string; messages: ConvMsg[]; user: { id: number; first_name: string; last_name: string; email: string } | null };
type Counts = { new: number; open: number; replied: number; closed: number };

const FILTERS: { key: ContactStatus | "all"; label: string }[] = [
  { key: "all", label: "All" }, { key: "new", label: "New" },
  { key: "open", label: "In Progress" }, { key: "replied", label: "Replied" }, { key: "closed", label: "Closed" },
];
const STATUS: Record<ContactStatus, { label: string; cls: string }> = {
  new:     { label: "New",         cls: "aci-badge--new"     },
  open:    { label: "In Progress", cls: "aci-badge--open"    },
  replied: { label: "Replied",     cls: "aci-badge--replied" },
  closed:  { label: "Closed",      cls: "aci-badge--closed"  },
};

function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days < 7 ? `${days}d ago` : new Date(d).toLocaleDateString();
}

export default function AdminContactInbox() {
  const [convs, setConvs]   = useState<Conv[]>([]);
  const [counts, setCounts] = useState<Counts>({ new: 0, open: 0, replied: 0, closed: 0 });
  const [filter, setFilter] = useState<ContactStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selId, setSelId]   = useState<number | null>(null);
  const [detail, setDetail] = useState<ConvDetail | null>(null);
  const [detailLoad, setDetailLoad] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying]   = useState(false);
  const [err, setErr] = useState("");
  const [ok,  setOk]  = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await contactApi.adminGetAll(filter === "all" ? undefined : filter);
      if (r.success) { setConvs(r.data); setCounts(r.counts || { new:0, open:0, replied:0, closed:0 }); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const openConv = async (id: number) => {
    setSelId(id); setDetailLoad(true); setDetail(null); setReplyBody(""); setErr(""); setOk("");
    try {
      const r = await contactApi.adminGetDetail(id);
      if (r.success) {
        setDetail(r.data);
        setConvs(p => p.map(c => c.id === id && c.status === "new" ? { ...c, status: "open" as ContactStatus } : c));
      }
    } catch {}
    setDetailLoad(false);
  };

  const sendReply = async () => {
    if (!detail || !replyBody.trim()) return;
    setReplying(true); setErr(""); setOk("");
    try {
      const r = await contactApi.adminReply(detail.id, replyBody.trim());
      if (r.success) {
        setReplyBody(""); setOk("Reply sent — email delivered.");
        setDetail(p => p ? { ...p, messages: [...p.messages, r.data], status: "replied" as ContactStatus } : p);
        setConvs(p => p.map(c => c.id === detail.id ? { ...c, status: "replied" as ContactStatus } : c));
        setTimeout(() => setOk(""), 3000);
      } else setErr(r.message || "Failed.");
    } catch { setErr("Something went wrong."); }
    setReplying(false);
  };

  const changeStatus = async (s: ContactStatus) => {
    if (!detail) return;
    try {
      await contactApi.adminUpdateStatus(detail.id, s);
      setDetail(p => p ? { ...p, status: s } : p);
      setConvs(p => p.map(c => c.id === detail.id ? { ...c, status: s } : c));
      setOk(`Marked as "${STATUS[s].label}".`); setTimeout(() => setOk(""), 2500);
    } catch { setErr("Failed."); }
  };

  const toggleReply = async () => {
    if (!detail) return;
    try {
      const r = await contactApi.adminToggleUserReply(detail.id);
      if (r.success) {
        const v = r.data.allow_user_reply;
        setDetail(p => p ? { ...p, allow_user_reply: v } : p);
        setConvs(p => p.map(c => c.id === detail.id ? { ...c, allow_user_reply: v } : c));
      }
    } catch { setErr("Failed."); }
  };

  const deleteConv = async () => {
    if (!detail || !confirm(`Delete ${detail.ref_number}? Cannot be undone.`)) return;
    try {
      await contactApi.adminDelete(detail.id);
      setConvs(p => p.filter(c => c.id !== detail.id));
      setDetail(null); setSelId(null);
    } catch { setErr("Failed."); }
  };

  const filtered = convs.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      || c.subject.toLowerCase().includes(q) || c.ref_number.toLowerCase().includes(q);
  });

  const total = counts.new + counts.open + counts.replied + counts.closed;

  return (
    <div className="aci-root">

      {/* Page header */}
      <div className="aci-header">
        <div>
          <h1 className="aci-title"><MessageSquare size={22} strokeWidth={2} /> Contact Inbox</h1>
          <p className="aci-subtitle">Manage support conversations and reply to users.</p>
        </div>
        <button className="aci-refresh" onClick={load}><RefreshCw size={14} strokeWidth={2.5} /> Refresh</button>
      </div>

      {/* Summary cards */}
      <div className="aci-pipeline">
        {[
          { key: "new"     as ContactStatus, label: "New",         val: counts.new,     color: "#3b82f6", fill: "#bfdbfe", iconCls: "aci-stat-icon--blue",   badgeCls: "aci-stat-badge--blue",   Icon: Clock         },
          { key: "open"    as ContactStatus, label: "In Progress", val: counts.open,    color: "#f59e0b", fill: "#fde68a", iconCls: "aci-stat-icon--amber",  badgeCls: "aci-stat-badge--amber",  Icon: AlertCircle   },
          { key: "replied" as ContactStatus, label: "Replied",     val: counts.replied, color: "#22c55e", fill: "#bbf7d0", iconCls: "aci-stat-icon--green",  badgeCls: "aci-stat-badge--green",  Icon: MessageCircle },
          { key: "closed"  as ContactStatus, label: "Closed",      val: counts.closed,  color: "#8b5cf6", fill: "#ddd6fe", iconCls: "aci-stat-icon--purple", badgeCls: "aci-stat-badge--purple", Icon: CheckCircle   },
        ].map(s => {
          const pct = total > 0 ? Math.round((s.val / total) * 100) : 0;
          return (
            <div key={s.key} className={`aci-stat-card aci-stat-card--${s.key}`} onClick={() => setFilter(s.key)}>
              <div className="aci-stat-top">
                <div className={`aci-stat-icon ${s.iconCls}`}><s.Icon size={17} strokeWidth={2} /></div>
                <span className={`aci-stat-badge ${s.badgeCls}`}>{s.label}</span>
              </div>
              <div className="aci-stat-num">{s.val}</div>
              <div className="aci-stat-label">{s.label}</div>
              <div className="aci-stat-bar">
                <div className="aci-stat-fill" style={{ width: `${pct}%`, background: s.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Messages */}
      {err && <div className="aci-alert aci-alert--err"><AlertCircle size={14} /> {err}</div>}
      {ok  && <div className="aci-alert aci-alert--ok" ><CheckCircle size={14} /> {ok}</div>}

      {/* Main layout */}
      <div className="aci-grid">

        {/* Left side conversation list */}
        <div className="aci-left">
          <div className="aci-filters">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`aci-filter ${filter === f.key ? "aci-filter--on" : ""}`}
                onClick={() => setFilter(f.key as ContactStatus | "all")}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="aci-search-wrap">
            <input
              className="aci-search"
              placeholder="Search name, email, REF…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="aci-list">
            {loading ? (
              <div className="aci-spin-wrap"><div className="aci-spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="aci-list-empty">No conversations found.</div>
            ) : filtered.map(c => (
              <button
                key={c.id}
                className={`aci-item ${selId === c.id ? "aci-item--on" : ""}`}
                onClick={() => openConv(c.id)}
              >
                <div className="aci-item-row">
                  <div>
                    <div className="aci-item-name">{c.name}</div>
                    <div className="aci-item-ref">{c.ref_number}</div>
                  </div>
                  <div className="aci-item-right">
                    <span className={`aci-badge ${STATUS[c.status]?.cls}`}>{STATUS[c.status]?.label}</span>
                    <ChevronRight size={13} strokeWidth={2.5} className="aci-item-arrow" />
                  </div>
                </div>
                <div className="aci-item-subject">{c.subject}</div>
                <div className="aci-item-email">{c.email} · {ago(c.updated_at)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right side conversation detail */}
        <div className="aci-right">
          {!selId ? (
            <div className="aci-empty-panel">
              <MessageSquare size={46} strokeWidth={1.2} className="aci-empty-icon" />
              <p>Select a conversation to view</p>
            </div>
          ) : detailLoad ? (
            <div className="aci-spin-wrap"><div className="aci-spinner" /></div>
          ) : detail ? (
            <div className="aci-detail">

              {/* Conversation header */}
              <div className="aci-detail-head">
                <span className="aci-detail-ref">{detail.ref_number}</span>
                <h2 className="aci-detail-subject">{detail.subject}</h2>
                <div className="aci-detail-meta">
                  <div>
                    <div className="aci-detail-name">{detail.name}</div>
                    <div className="aci-detail-email">{detail.email}</div>
                  </div>
                  <span className={`aci-badge ${STATUS[detail.status]?.cls}`}>{STATUS[detail.status]?.label}</span>
                </div>
              </div>

              {/* Conversation controls */}
              <div className="aci-controls">
                <div className="aci-ctrl-row">
                  <span className="aci-ctrl-label">Status</span>
                  <div className="aci-status-btns">
                    {(["new","open","replied","closed"] as ContactStatus[]).map(s => (
                      <button
                        key={s}
                        className={`aci-sbtn ${detail.status === s ? "aci-sbtn--on" : ""}`}
                        onClick={() => changeStatus(s)}
                      >
                        {STATUS[s].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="aci-ctrl-row">
                  <span className="aci-ctrl-label">User reply</span>
                  <button className="aci-toggle" onClick={toggleReply}>
                    {detail.allow_user_reply
                      ? <><ToggleRight size={22} className="aci-toggle--on" /> Enabled</>
                      : <><ToggleLeft  size={22} className="aci-toggle--off" /> Disabled</>}
                  </button>
                </div>
              </div>

              {/* Message thread */}
              <div className="aci-thread">

                {/* First user message */}
                <div className="aci-msg aci-msg--user">
                  <div className="aci-av aci-av--user">{detail.name[0]?.toUpperCase()}</div>
                  <div className="aci-bubble aci-bubble--user">
                    <div className="aci-msg-meta">
                      <span>{detail.name}</span><span>{ago(detail.created_at)}</span>
                    </div>
                    <p className="aci-msg-text">{detail.message}</p>
                  </div>
                </div>

                {detail.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`aci-msg ${msg.sender_type === "admin" ? "aci-msg--admin" : "aci-msg--user"}`}
                  >
                    <div className={`aci-av ${msg.sender_type === "admin" ? "aci-av--admin" : "aci-av--user"}`}>
                      {msg.sender_type === "admin"
                        ? msg.sender?.first_name[0]?.toUpperCase() || "A"
                        : detail.name[0]?.toUpperCase()}
                    </div>
                    <div className={`aci-bubble ${msg.sender_type === "admin" ? "aci-bubble--admin" : "aci-bubble--user"}`}>
                      <div className="aci-msg-meta">
                        <span>{msg.sender_type === "admin" ? msg.sender ? `${msg.sender.first_name} (Admin)` : "Admin" : detail.name}</span>
                        <span>{ago(msg.created_at)}</span>
                      </div>
                      <p className="aci-msg-text">{msg.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              {detail.status !== "closed" ? (
                <div className="aci-reply-box">
                  <div className="aci-reply-label">
                    Replying as Admin → <strong>{detail.name}</strong> will receive this by email
                  </div>
                  <textarea
                    className="aci-reply-input"
                    rows={4}
                    placeholder="Write your reply…"
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                  />
                  <div className="aci-reply-actions">
                    <button className="aci-send-btn" onClick={sendReply} disabled={replying || !replyBody.trim()}>
                      <Send size={14} strokeWidth={2.5} />
                      {replying ? "Sending…" : "Send Reply"}
                    </button>
                    <button className="aci-delete-btn" onClick={deleteConv}>
                      <Trash2 size={13} strokeWidth={2.5} /> Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aci-closed-note">
                  🔒 Conversation closed.
                  <button className="aci-delete-btn" onClick={deleteConv}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}