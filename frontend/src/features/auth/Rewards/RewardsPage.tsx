import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Layout/Navbar/Navbar";
import {
  Gift, Star, Trophy, Zap, Clock, MapPin,
  QrCode, CheckCircle, ChevronRight, Ticket, X,
} from "lucide-react";
import axiosInstance from "../../../shared/config/axiosinstance";
import "./RewardsPage.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const SERVER = API.replace("/api", "");

const LEVELS = [
  { name: "Newcomer",          emoji: "🌱", min: 0    },
  { name: "Explorer",          emoji: "🗺️", min: 100  },
  { name: "Trail Finder",      emoji: "🏔️", min: 300  },
  { name: "Hidden Gem Hunter", emoji: "⭐", min: 700  },
  { name: "LoKally Legend",    emoji: "🏆", min: 1500 },
];

function getLevel(pts: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) { if (pts >= l.min) level = l; }
  const idx  = LEVELS.indexOf(level);
  const next = LEVELS[idx + 1] || null;
  return {
    ...level,
    next,
    toNext:   next ? next.min - pts : 0,
    progress: next ? Math.round(((pts - level.min) / (next.min - level.min)) * 100) : 100,
  };
}

interface Reward {
  id: number; title: string; description: string;
  partner_name: string; location: string; category: string;
  points_required: number; stock: number; expires_at: string | null;
  image: string | null; is_active: boolean;
}

interface Voucher {
  id: number; uuid_code: string; qr_data: string;
  points_spent: number; status: string; expires_at: string;
  reward: Reward;
}

const CATEGORIES = ["All", "Cafe", "Trekking", "Homestay", "Adventure", "Other"];

export default function RewardsPage() {
  const navigate = useNavigate();
  const [balance,    setBalance]    = useState<any>(null);
  const [rewards,    setRewards]    = useState<Reward[]>([]);
  const [vouchers,   setVouchers]   = useState<Voucher[]>([]);
  const [tab,        setTab]        = useState<"rewards" | "vouchers">("rewards");
  const [catFilter,  setCatFilter]  = useState("All");
  const [redeeming,  setRedeeming]  = useState<number | null>(null);
  const [qrModal,    setQrModal]    = useState<Voucher | null>(null);
  const [msg,        setMsg]        = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get("/points/balance"),
      axiosInstance.get("/rewards"),
      axiosInstance.get("/rewards/my-vouchers"),
    ]).then(([b, r, v]) => {
      if (b.data.success) setBalance(b.data.data);
      if (r.data.success) setRewards(r.data.data);
      if (v.data.success) setVouchers(v.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleRedeem = async (rewardId: number) => {
    setRedeeming(rewardId);
    setMsg(null);
    try {
      const res = await axiosInstance.post(`/rewards/${rewardId}/redeem`);
      if (res.data.success) {
        setMsg({ type: "success", text: "Voucher redeemed! Check your vouchers tab." });
        // refresh balance and vouchers
        const [b, v] = await Promise.all([
          axiosInstance.get("/points/balance"),
          axiosInstance.get("/rewards/my-vouchers"),
        ]);
        if (b.data.success) setBalance(b.data.data);
        if (v.data.success) setVouchers(v.data.data);
        setTab("vouchers");
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to redeem." });
    }
    setRedeeming(null);
  };

  const filtered = catFilter === "All"
    ? rewards
    : rewards.filter(r => (r.category || "Other").toLowerCase() === catFilter.toLowerCase());

  const level = balance ? getLevel(balance.total_earned) : getLevel(0);

  if (loading) return (
    <div className="rp-page"><Navbar />
      <div className="rp-loading"><div className="rp-spinner" /></div>
    </div>
  );

  return (
    <div className="rp-page">
      <Navbar />
      <div className="rp-content">

        {/* POINTS HEADER */}
        <div className="rp-header">
          <div className="rp-header-left">
            <div className="rp-level-badge">{level.emoji} {level.name}</div>
            <div className="rp-points-big">{balance?.current || 0}</div>
            <div className="rp-points-label">available points</div>
          </div>
          <div className="rp-header-right">
            <div className="rp-stat">
              <span className="rp-stat-val">{balance?.total_earned || 0}</span>
              <span className="rp-stat-label">total earned</span>
            </div>
            <div className="rp-stat">
              <span className="rp-stat-val">{balance?.total_spent || 0}</span>
              <span className="rp-stat-label">total spent</span>
            </div>
            <button className="rp-leaderboard-btn" onClick={() => navigate("/leaderboard")}>
              <Trophy size={14} strokeWidth={2.5} /> Leaderboard
            </button>
          </div>
        </div>

        {/* LEVEL PROGRESS */}
        {level.next && (
          <div className="rp-progress-bar-wrap">
            <div className="rp-progress-label">
              <span>{level.emoji} {level.name}</span>
              <span>{level.toNext} pts to {level.next.emoji} {level.next.name}</span>
            </div>
            <div className="rp-progress-track">
              <div className="rp-progress-fill" style={{ width: `${level.progress}%` }} />
            </div>
          </div>
        )}

        {/* MESSAGE */}
        {msg && (
          <div className={`rp-msg rp-msg--${msg.type}`}>
            {msg.type === "success" ? <CheckCircle size={15} strokeWidth={2.5} /> : <X size={15} strokeWidth={2.5} />}
            {msg.text}
            <button onClick={() => setMsg(null)}><X size={13} /></button>
          </div>
        )}

        {/* TABS */}
        <div className="rp-tabs">
          <button className={`rp-tab ${tab === "rewards" ? "active" : ""}`} onClick={() => setTab("rewards")}>
            <Gift size={14} strokeWidth={2.5} /> Rewards
          </button>
          <button className={`rp-tab ${tab === "vouchers" ? "active" : ""}`} onClick={() => setTab("vouchers")}>
            <Ticket size={14} strokeWidth={2.5} /> My Vouchers
            {vouchers.filter(v => v.status === "active").length > 0 && (
              <span className="rp-tab-badge">{vouchers.filter(v => v.status === "active").length}</span>
            )}
          </button>
        </div>

        {/* REWARDS TAB */}
        {tab === "rewards" && (
          <>
            {/* Category filter */}
            <div className="rp-cats">
              {CATEGORIES.map(c => (
                <button key={c}
                  className={`rp-cat ${catFilter === c ? "active" : ""}`}
                  onClick={() => setCatFilter(c)}>{c}</button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="rp-empty">
                <Gift size={40} strokeWidth={1.2} />
                <p>No rewards available yet</p>
              </div>
            ) : (
              <div className="rp-grid">
                {filtered.map(r => {
                  const canAfford = (balance?.current || 0) >= r.points_required;
                  const isLoading = redeeming === r.id;
                  return (
                    <div key={r.id} className={`rp-card ${!canAfford ? "rp-card--locked" : ""}`}>
                      {r.image && (
                        <div className="rp-card-img">
                          <img src={r.image.startsWith("/") ? `${SERVER}${r.image}` : r.image} alt={r.title} />
                        </div>
                      )}
                      {!r.image && (
                        <div className="rp-card-img rp-card-img--empty">
                          <Gift size={32} strokeWidth={1.2} />
                        </div>
                      )}
                      <div className="rp-card-body">
                        {r.category && <div className="rp-card-cat">{r.category}</div>}
                        <div className="rp-card-title">{r.title}</div>
                        <div className="rp-card-partner">
                          <MapPin size={11} strokeWidth={2} /> {r.partner_name}
                          {r.location && ` · ${r.location}`}
                        </div>
                        {r.description && <p className="rp-card-desc">{r.description}</p>}
                        <div className="rp-card-footer">
                          <div className="rp-card-pts">
                            <Zap size={13} strokeWidth={2.5} /> {r.points_required} pts
                          </div>
                          {r.stock > 0 && (
                            <div className="rp-card-stock">{r.stock} left</div>
                          )}
                          {r.expires_at && (
                            <div className="rp-card-expiry">
                              <Clock size={11} strokeWidth={2} />
                              {new Date(r.expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <button
                          className={`rp-redeem-btn ${!canAfford ? "rp-redeem-btn--locked" : ""}`}
                          onClick={() => canAfford && handleRedeem(r.id)}
                          disabled={!canAfford || isLoading}
                        >
                          {isLoading ? "Redeeming..." : canAfford ? "Redeem" : `Need ${r.points_required - (balance?.current || 0)} more pts`}
                          {canAfford && !isLoading && <ChevronRight size={14} strokeWidth={2.5} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* VOUCHERS TAB */}
        {tab === "vouchers" && (
          <div className="rp-vouchers">
            {vouchers.length === 0 ? (
              <div className="rp-empty">
                <Ticket size={40} strokeWidth={1.2} />
                <p>No vouchers yet — redeem a reward!</p>
              </div>
            ) : (
              vouchers.map(v => (
                <div key={v.id} className={`rp-voucher rp-voucher--${v.status}`}>
                  <div className="rp-voucher-left">
                    <div className="rp-voucher-status">{v.status.toUpperCase()}</div>
                    <div className="rp-voucher-title">{v.reward?.title}</div>
                    <div className="rp-voucher-partner">
                      <MapPin size={11} strokeWidth={2} /> {v.reward?.partner_name}
                    </div>
                    <div className="rp-voucher-pts">
                      <Zap size={11} strokeWidth={2} /> {v.points_spent} pts spent
                    </div>
                    {v.expires_at && (
                      <div className="rp-voucher-expiry">
                        <Clock size={11} strokeWidth={2} />
                        Expires {new Date(v.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {v.status === "active" && (
                    <button className="rp-qr-btn" onClick={() => setQrModal(v)}>
                      <QrCode size={22} strokeWidth={1.5} />
                      <span>Show QR</span>
                    </button>
                  )}
                  {v.status === "used" && (
                    <div className="rp-voucher-used">
                      <CheckCircle size={22} strokeWidth={1.5} />
                      <span>Used</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* QR MODAL */}
      {qrModal && (
        <div className="rp-modal-overlay" onClick={() => setQrModal(null)}>
          <div className="rp-modal" onClick={e => e.stopPropagation()}>
            <div className="rp-modal-head">
              <div className="rp-modal-title">{qrModal.reward?.title}</div>
              <button className="rp-modal-close" onClick={() => setQrModal(null)}>
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="rp-modal-body">
              <div className="rp-modal-partner">
                <MapPin size={13} strokeWidth={2} /> {qrModal.reward?.partner_name}
              </div>
              <div className="rp-qr-wrap">
                <img src={qrModal.qr_data} alt="QR Code" className="rp-qr-img" />
              </div>
              <div className="rp-modal-code">{qrModal.uuid_code}</div>
              <p className="rp-modal-hint">Show this QR code at the partner location to redeem your reward.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}