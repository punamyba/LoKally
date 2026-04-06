import { useEffect, useState } from "react";
import {
  Gift, Plus, Trash2, Edit2, X, CheckCircle,
  Package, MapPin, Zap, Clock, AlertTriangle,
  Trophy, Users, ChevronDown, ChevronUp, History,
  Medal, Award,
} from "lucide-react";
import axiosInstance from "../../../../shared/config/axiosinstance";
import "./AdminRewards.css";

type Tab = "rewards" | "leaderboard" | "users";

interface Reward {
  id: number; title: string; description: string;
  partner_name: string; location: string; category: string;
  points_required: number; stock: number;
  expires_at: string | null; is_active: boolean;
}

interface LeaderEntry {
  rank: number; id: number;
  first_name: string; last_name: string;
  avatar: string | null; total_points: number;
  level: { name: string; emoji: string };
}

interface PointsHistoryItem {
  id: number; points: number; action: string;
  description: string; created_at: string;
}

const EMPTY = {
  title: "", description: "", partner_name: "", location: "",
  category: "", points_required: 100, stock: 10, expires_at: "",
};

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace("/api", "");

function getAvatar(avatar: string | null) {
  if (!avatar) return null;
  return avatar.startsWith("http") ? avatar : `${SERVER}${avatar}`;
}

function getInitials(first: string, last: string) {
  return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
}

/** Lucide-based rank badge — no emojis */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <span className="arw-rank-badge arw-rank-badge--1">
      <Trophy size={14} strokeWidth={2.5} />
    </span>
  );
  if (rank === 2) return (
    <span className="arw-rank-badge arw-rank-badge--2">
      <Medal size={14} strokeWidth={2.5} />
    </span>
  );
  if (rank === 3) return (
    <span className="arw-rank-badge arw-rank-badge--3">
      <Award size={14} strokeWidth={2.5} />
    </span>
  );
  return <span className="arw-rank-badge arw-rank-badge--other">#{rank}</span>;
}

// ── REWARDS TAB ────────────────────────────────────────────────
function RewardsTab() {
  const [rewards,    setRewards]    = useState<Reward[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<Reward | null>(null);
  const [form,       setForm]       = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [msg,        setMsg]        = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => { fetchRewards(); }, []);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/rewards");
      if (res.data.success) setRewards(res.data.data);
    } catch {}
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true); setMsg(null); };
  const openEdit = (r: Reward) => {
    setEditing(r);
    setForm({ ...r, expires_at: r.expires_at ? r.expires_at.split("T")[0] : "" });
    setShowForm(true); setMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setMsg(null);
    try {
      if (editing) { await axiosInstance.put(`/rewards/${editing.id}`, form); setMsg({ type: "success", text: "Reward updated!" }); }
      else          { await axiosInstance.post("/rewards", form);              setMsg({ type: "success", text: "Reward created!" }); }
      setShowForm(false); fetchRewards();
    } catch (err: any) { setMsg({ type: "error", text: err?.response?.data?.message || "Something went wrong." }); }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deactivate this reward?")) return;
    await axiosInstance.delete(`/rewards/${id}`);
    fetchRewards();
  };

  return (
    <>
      <div className="arw-tab-header">
        <div />
        <button className="arw-add-btn" onClick={openAdd}>
          <Plus size={15} strokeWidth={3} /> Add Reward
        </button>
      </div>

      {msg && (
        <div className={`arw-msg arw-msg--${msg.type}`}>
          {msg.type === "success" ? <CheckCircle size={14} strokeWidth={2.5} /> : <AlertTriangle size={14} strokeWidth={2.5} />}
          {msg.text}
          <button onClick={() => setMsg(null)}><X size={13} strokeWidth={2.5} /></button>
        </div>
      )}

      {loading ? <div className="arw-loading"><div className="arw-spinner" /></div>
        : rewards.length === 0 ? (
          <div className="arw-empty">
            <Gift size={32} strokeWidth={1.2} />
            <p>No rewards added yet</p>
          </div>
        ) : (
          <div className="arw-grid">
            {rewards.map(r => (
              <div key={r.id} className={`arw-card ${!r.is_active ? "arw-card--inactive" : ""}`}>

                {/* card head */}
                <div className="arw-card-head">
                  <div className="arw-card-icon"><Gift size={20} strokeWidth={1.5} /></div>
                  <div className="arw-card-actions">
                    <button className="arw-icon-btn arw-icon-btn--edit" onClick={() => openEdit(r)}>
                      <Edit2 size={13} strokeWidth={2} />
                    </button>
                    <button className="arw-icon-btn arw-icon-btn--del" onClick={() => handleDelete(r.id)}>
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* card body */}
                <div className="arw-card-body">
                  {r.category && <span className="arw-card-cat">{r.category}</span>}
                  <div className="arw-card-title">{r.title}</div>
                  <div className="arw-card-partner">
                    <MapPin size={11} strokeWidth={2} />
                    {r.partner_name}{r.location ? ` · ${r.location}` : ""}
                  </div>
                  {r.description && (
                    <p className="arw-card-desc">
                      {r.description.slice(0, 80)}{r.description.length > 80 ? "…" : ""}
                    </p>
                  )}
                </div>

                {/* card footer */}
                <div className="arw-card-footer">
                  <span className="arw-pts-badge"><Zap size={11} strokeWidth={2.5} /> {r.points_required} pts</span>
                  <span className="arw-stock-badge"><Package size={11} strokeWidth={2} /> {r.stock === -1 ? "Unlimited" : r.stock}</span>
                  {r.expires_at && (
                    <span className="arw-expiry-badge"><Clock size={11} strokeWidth={2} /> {new Date(r.expires_at).toLocaleDateString()}</span>
                  )}
                  {!r.is_active && <span className="arw-inactive-badge">Inactive</span>}
                </div>

              </div>
            ))}
          </div>
        )
      }

      {showForm && (
        <div className="arw-overlay" onClick={() => setShowForm(false)}>
          <div className="arw-modal" onClick={e => e.stopPropagation()}>
            <div className="arw-modal-header">
              <h2 className="arw-modal-title">{editing ? "Edit Reward" : "Add New Reward"}</h2>
              <button className="arw-modal-close" onClick={() => setShowForm(false)}><X size={16} strokeWidth={2.5} /></button>
            </div>
            <form className="arw-form" onSubmit={handleSubmit}>
              <div className="arw-form-grid">
                {[
                  { label: "Title *",            key: "title",            type: "text",   required: true  },
                  { label: "Partner Name *",      key: "partner_name",     type: "text",   required: true  },
                  { label: "Location",            key: "location",         type: "text",   required: false },
                  { label: "Category",            key: "category",         type: "text",   required: false },
                  { label: "Points Required *",   key: "points_required",  type: "number", required: true  },
                  { label: "Stock (-1=unlimited)", key: "stock",           type: "number", required: true  },
                  { label: "Expires At",          key: "expires_at",       type: "date",   required: false },
                ].map(f => (
                  <div className="arw-field" key={f.key}>
                    <label className="arw-label">{f.label}</label>
                    <input className="arw-input" type={f.type} required={f.required}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="arw-field">
                <label className="arw-label">Description</label>
                <textarea className="arw-textarea" rows={3} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="arw-form-actions">
                <button type="button" className="arw-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="arw-submit-btn" disabled={submitting}>
                  {submitting ? "Saving…" : editing ? "Update Reward" : "Create Reward"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── LEADERBOARD TAB ────────────────────────────────────────────
function LeaderboardTab() {
  const [data,    setData]    = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get("/points/leaderboard")
      .then(r => { if (r.data.success) setData(r.data.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="arw-loading"><div className="arw-spinner" /></div>;

  return (
    <div className="arw-table-wrap">
      <table className="arw-table">
        <thead><tr>
          <th>Rank</th><th>User</th><th>Level</th><th>Total Points</th>
        </tr></thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <div className="arw-empty">
                  <Trophy size={32} strokeWidth={1.2} /><p>No data yet</p>
                </div>
              </td>
            </tr>
          ) : data.map(u => {
            const pic = getAvatar(u.avatar);
            return (
              <tr key={u.id} className={`arw-row ${u.rank <= 3 ? "arw-row--top" : ""}`}>
                <td><RankBadge rank={u.rank} /></td>
                <td>
                  <div className="arw-user-cell">
                    <div className="arw-user-avatar">
                      {pic ? <img src={pic} alt={u.first_name} /> : <span>{getInitials(u.first_name, u.last_name)}</span>}
                    </div>
                    <div className="arw-user-name">{u.first_name} {u.last_name}</div>
                  </div>
                </td>
                <td><span className="arw-level">{u.level.name}</span></td>
                <td><span className="arw-pts"><Zap size={12} strokeWidth={2.5} /> {u.total_points}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── USERS POINTS TAB ───────────────────────────────────────────
function UsersPointsTab() {
  const [users,       setUsers]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [expandedId,  setExpandedId]  = useState<number | null>(null);
  const [history,     setHistory]     = useState<Record<number, PointsHistoryItem[]>>({});
  const [histLoading, setHistLoading] = useState<number | null>(null);

  useEffect(() => {
    axiosInstance.get("/points/leaderboard?limit=100")
      .then(r => { if (r.data.success) setUsers(r.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const toggleHistory = async (userId: number) => {
    if (expandedId === userId) { setExpandedId(null); return; }
    setExpandedId(userId);
    if (history[userId]) return;

    setHistLoading(userId);
    try {
      const res = await axiosInstance.get(`/points/admin/user/${userId}/history?limit=50`);
      if (res.data.success) setHistory(prev => ({ ...prev, [userId]: res.data.data }));
    } catch {}
    setHistLoading(null);
  };

  if (loading) return <div className="arw-loading"><div className="arw-spinner" /></div>;

  return (
    <div className="arw-table-wrap">
      <table className="arw-table">
        <thead><tr>
          <th>User</th><th>Level</th><th>Current Points</th><th>History</th>
        </tr></thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <div className="arw-empty">
                  <Users size={32} strokeWidth={1.2} /><p>No users with points yet</p>
                </div>
              </td>
            </tr>
          ) : users.map(u => {
            const pic        = getAvatar(u.avatar);
            const isExpanded = expandedId === u.id;
            const userHist   = history[u.id] || [];

            return (
              <>
                <tr key={u.id} className="arw-row">
                  <td>
                    <div className="arw-user-cell">
                      <div className="arw-user-avatar">
                        {pic ? <img src={pic} alt={u.first_name} /> : <span>{getInitials(u.first_name, u.last_name)}</span>}
                      </div>
                      <div>
                        <div className="arw-user-name">{u.first_name} {u.last_name}</div>
                        <div className="arw-user-rank">Rank #{u.rank}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="arw-level">{u.level.name}</span></td>
                  <td><span className="arw-pts"><Zap size={12} strokeWidth={2.5} /> {u.total_points}</span></td>
                  <td>
                    <button className="arw-hist-btn" onClick={() => toggleHistory(u.id)}>
                      <History size={13} strokeWidth={2} />
                      {isExpanded ? <ChevronUp size={13} strokeWidth={2.5} /> : <ChevronDown size={13} strokeWidth={2.5} />}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`hist-${u.id}`} className="arw-hist-row">
                    <td colSpan={4}>
                      {histLoading === u.id ? (
                        <div className="arw-hist-loading"><div className="arw-spinner arw-spinner--sm" /></div>
                      ) : userHist.length === 0 ? (
                        <div className="arw-hist-empty">No history found</div>
                      ) : (
                        <div className="arw-hist-list">
                          {userHist.map(h => (
                            <div key={h.id} className={`arw-hist-item ${h.points > 0 ? "arw-hist-item--earn" : "arw-hist-item--spend"}`}>
                              <div className="arw-hist-desc">{h.description || h.action}</div>
                              <div className="arw-hist-date">{new Date(h.created_at).toLocaleDateString()}</div>
                              <div className={`arw-hist-pts ${h.points > 0 ? "arw-hist-pts--earn" : "arw-hist-pts--spend"}`}>
                                {h.points > 0 ? "+" : ""}{h.points} pts
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────
export default function AdminRewards() {
  const [tab, setTab] = useState<Tab>("rewards");

  const TABS = [
    { key: "rewards",     label: "Rewards",     Icon: Gift    },
    { key: "leaderboard", label: "Leaderboard", Icon: Trophy  },
    { key: "users",       label: "User Points", Icon: Users   },
  ] as const;

  return (
    <div className="arw-root">
      <div className="arw-header">
        <div>
          <h1 className="arw-title">Points & Rewards</h1>
          <p className="arw-subtitle">Manage rewards, view leaderboard and user points history</p>
        </div>
      </div>

      <div className="arw-tabs">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key}
            className={`arw-tab ${tab === key ? "arw-tab--active" : ""}`}
            onClick={() => setTab(key as Tab)}>
            <Icon size={14} strokeWidth={2.5} /> {label}
          </button>
        ))}
      </div>

      {tab === "rewards"     && <RewardsTab />}
      {tab === "leaderboard" && <LeaderboardTab />}
      {tab === "users"       && <UsersPointsTab />}
    </div>
  );
}