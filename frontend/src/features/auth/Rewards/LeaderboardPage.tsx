import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Layout/Navbar/Navbar";
import { ArrowLeft, Zap } from "lucide-react";
import axiosInstance from "../../../shared/config/axiosinstance";
import "./LeaderboardPage.css";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace("/api", "");

interface LeaderEntry {
  rank: number; id: number;
  first_name: string; last_name: string;
  avatar: string | null; total_points: number;
  level: { name: string; emoji: string };
}

export default function LeaderboardPage() {
  const navigate    = useNavigate();
  const [data,    setData]    = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  useEffect(() => {
    axiosInstance.get("/points/leaderboard")
      .then(r => { if (r.data.success) setData(r.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const getAvatar = (u: LeaderEntry) => {
    if (!u.avatar) return null;
    return u.avatar.startsWith("http") ? u.avatar : `${SERVER}${u.avatar}`;
  };

  const getInitials = (u: LeaderEntry) =>
    `${u.first_name?.[0] || ""}${u.last_name?.[0] || ""}`.toUpperCase();

  const top3   = data.slice(0, 3);
  const rest   = data.slice(3);
  const first  = top3.find(u => u.rank === 1);
  const second = top3.find(u => u.rank === 2);
  const third  = top3.find(u => u.rank === 3);

  // podium order: 2nd, 1st, 3rd
  const podium = [second, first, third].filter(Boolean) as LeaderEntry[];

  return (
    <div className="lb-page">
      <Navbar />
      <div className="lb-content">

        {/* Back */}
        <button className="lb-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>

        <h1 className="lb-title">Leaderboard</h1>

        {loading ? (
          <div className="lb-loading"><div className="lb-spinner" /></div>
        ) : data.length === 0 ? (
          <div className="lb-empty">No explorers yet — be the first!</div>
        ) : (
          <>
            {/* TOP 3 PODIUM */}
            <div className="lb-podium">
              {podium.map((u) => {
                const isFirst = u.rank === 1;
                const isMe    = u.id === currentUser?.id;
                const pic     = getAvatar(u);
                return (
                  <div key={u.id} className={`lb-podium-item lb-podium-item--${u.rank} ${isMe ? "lb-podium-item--me" : ""}`}>
                    {isFirst && (
                      <div className="lb-crown">
                        {/* Crown SVG */}
                        <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 24L8 8L16 16L20 4L24 16L32 8L36 24H4Z" fill="#c8f03e" stroke="#a8cc20" strokeWidth="1.5" strokeLinejoin="round"/>
                          <circle cx="8" cy="8" r="2.5" fill="#c8f03e" stroke="#a8cc20" strokeWidth="1"/>
                          <circle cx="20" cy="4" r="2.5" fill="#c8f03e" stroke="#a8cc20" strokeWidth="1"/>
                          <circle cx="32" cy="8" r="2.5" fill="#c8f03e" stroke="#a8cc20" strokeWidth="1"/>
                        </svg>
                      </div>
                    )}
                    <div className={`lb-podium-avatar lb-podium-avatar--${u.rank}`}>
                      {pic
                        ? <img src={pic} alt={u.first_name} />
                        : <span>{getInitials(u)}</span>
                      }
                      <div className="lb-podium-rank">{u.rank}</div>
                    </div>
                    <div className="lb-podium-name">
                      {u.first_name} {u.last_name}
                      {isMe && <span className="lb-you">You</span>}
                    </div>
                    <div className="lb-podium-pts">
                      <Zap size={11} strokeWidth={2.5} /> {u.total_points} pts
                    </div>
                  </div>
                );
              })}
            </div>

            {/* REST LIST */}
            <div className="lb-list">
              {rest.map(u => {
                const isMe = u.id === currentUser?.id;
                const pic  = getAvatar(u);
                return (
                  <div key={u.id} className={`lb-row ${isMe ? "lb-row--me" : ""}`}>
                    <div className="lb-row-rank">{u.rank}</div>
                    <div className="lb-row-avatar">
                      {pic
                        ? <img src={pic} alt={u.first_name} />
                        : <span>{getInitials(u)}</span>
                      }
                    </div>
                    <div className="lb-row-info">
                      <div className="lb-row-name">
                        {u.first_name} {u.last_name}
                        {isMe && <span className="lb-you">You</span>}
                      </div>
                      <div className="lb-row-level">{u.level.emoji} {u.level.name}</div>
                    </div>
                    <div className="lb-row-pts">
                      <Zap size={11} strokeWidth={2.5} /> {u.total_points}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}