import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft, MapPin, Navigation, Cloud, Wind, Droplets,
  CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight,
  ThumbsUp, Footprints, Star, MessageCircle, Send,
  User, Tag, Flag, BadgeCheck, Images, X, Reply, Trash2, Upload, Calendar, FileText,
} from "lucide-react";
import axiosInstance from "../../../shared/config/axiosinstance";
import type { Place } from "./Type";
import Navbar from "../Components/Layout/Navbar/Navbar";
import "./PlaceDetails.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function parseImages(image: string | null | undefined): string[] {
  if (!image) return [];
  const base = "http://localhost:5001";
  if (image.startsWith("[")) {
    try { return (JSON.parse(image) as string[]).map(p => `${base}${p}`); }
    catch { return [`${base}${image}`]; }
  }
  return [`${base}${image}`];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const WI: Record<string, string> = {
  "01d":"☀️","01n":"🌙","02d":"⛅","02n":"⛅","03d":"☁️","03n":"☁️",
  "04d":"☁️","04n":"☁️","09d":"🌧️","09n":"🌧️","10d":"🌦️","10n":"🌦️",
  "11d":"⛈️","11n":"⛈️","13d":"❄️","13n":"❄️","50d":"🌫️","50n":"🌫️",
};

const REPORT_REASONS = [
  "Incorrect information",
  "Inappropriate content",
  "Spam or fake place",
  "Duplicate listing",
  "Safety concern",
  "Other",
];

const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

interface Comment {
  id: number; text: string; created_at: string;
  user: { id: number; first_name: string; last_name: string; avatar?: string };
  replies?: Comment[];
}
interface RatingStats { avg: number; total: number; dist: Record<number, number>; myRating: number; }
interface LikeStats   { count: number; likedByMe: boolean; users: any[]; }
interface VisitStats  { count: number; visitedByMe: boolean; }
interface Conditions  { trail: string; road: string; best_time: string; difficulty: string; note?: string; }

export default function PlaceDetails() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [place,   setPlace]   = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [photos,  setPhotos]  = useState<string[]>([]);

  const [slideOpen,   setSlideOpen]   = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  const [likes,       setLikes]       = useState<LikeStats>({ count: 0, likedByMe: false, users: [] });
  const [visits,      setVisits]      = useState<VisitStats>({ count: 0, visitedByMe: false });
  const [ratings,     setRatings]     = useState<RatingStats>({ avg: 0, total: 0, dist: {1:0,2:0,3:0,4:0,5:0}, myRating: 0 });
  const [hoverRating, setHoverRating] = useState(0);
  const [comments,    setComments]    = useState<Comment[]>([]);
  const [comment,     setComment]     = useState("");
  const [replyTo,     setReplyTo]     = useState<{ id: number; name: string } | null>(null);
  const [tags,        setTags]        = useState<string[]>([]);
  const [conditions,  setConditions]  = useState<Conditions>({ trail: "Good", road: "Paved", best_time: "Oct–Mar", difficulty: "Moderate" });
  const [showLikers,  setShowLikers]  = useState(false);
  const [weather,     setWeather]     = useState<any>(null);

  // Report modal state
  const [reportOpen,   setReportOpen]   = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportNote,   setReportNote]   = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  // Visit submission modal
  const [visitOpen,    setVisitOpen]    = useState(false);
  const [visitDate,    setVisitDate]    = useState("");
  const [visitExp,     setVisitExp]     = useState("");
  const [visitPhoto,   setVisitPhoto]   = useState<File | null>(null);
  const [visitPreview, setVisitPreview] = useState<string | null>(null);
  const [visitStatus,  setVisitStatus]  = useState<"idle" | "sending" | "done" | "error">("idle");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);

  const closeVisitModal = () => {
    setVisitOpen(false);
    setVisitDate(""); setVisitExp(""); setVisitPhoto(null);
    setVisitPreview(null); setVisitStatus("idle");
  };

  const handleVisitPhoto = (file: File) => {
    setVisitPhoto(file);
    const reader = new FileReader();
    reader.onload = e => setVisitPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submitVisitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate) return;
    setVisitStatus("sending");
    try {
      const fd = new FormData();
      fd.append("visit_date", visitDate);
      fd.append("experience", visitExp);
      if (visitPhoto) fd.append("photo", visitPhoto);
      await axiosInstance.post(`/places/${id}/visit-submit`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setVisitStatus("done");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setVisitStatus("done"); // already submitted — treat as done
      } else {
        setVisitStatus("error");
      }
    }
  };

  const handleRemoveVisit = async () => {
    setRemoving(true);
    try {
      await axiosInstance.delete(`/places/${id}/visit`);
      setVisits(p => ({ ...p, visitedByMe: false, count: Math.max(0, p.count - 1) }));
      setShowRemoveConfirm(false);
    } catch {}
    setRemoving(false);
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) return;
    setReportStatus("sending");
    try {
      await axiosInstance.post(`/places/${id}/report`, {
        reason: reportReason,
        note: reportNote.trim() || undefined,
      });
      setReportStatus("done");
    } catch {
      setReportStatus("error");
    }
  };

  const closeReport = () => {
    setReportOpen(false);
    setReportReason(""); setReportNote(""); setReportStatus("idle");
  };

  useEffect(() => {
    if (!id) return;
    axiosInstance.get(`/places/${id}`)
      .then((res) => {
        if (res.data.success) {
          const p = res.data.data;
          setPlace({
            ...p,
            id: String(p.id),
            lat: typeof p.lat === "string" ? parseFloat(p.lat) : p.lat,
            lng: typeof p.lng === "string" ? parseFloat(p.lng) : p.lng,
          });
          setPhotos(parseImages(p.image));
        } else { setError("Place not found."); }
      })
      .catch(() => setError("Failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchSocial = useCallback(async () => {
    if (!id) return;
    const [l, v, r, c, t, cond] = await Promise.allSettled([
      axiosInstance.get(`/places/${id}/likes`),
      axiosInstance.get(`/places/${id}/visits`),
      axiosInstance.get(`/places/${id}/ratings`),
      axiosInstance.get(`/places/${id}/comments`),
      axiosInstance.get(`/places/${id}/tags`),
      axiosInstance.get(`/places/${id}/conditions`),
    ]);
    if (l.status    === "fulfilled") setLikes(l.value.data);
    if (r.status    === "fulfilled") setRatings(r.value.data);
    if (c.status    === "fulfilled") setComments(c.value.data);
    if (t.status    === "fulfilled") setTags(t.value.data);
    if (cond.status === "fulfilled") setConditions(cond.value.data);

    // Check approved visit status separately
    if (v.status === "fulfilled") {
      const vdata = v.value.data;
      try {
        const vs = await axiosInstance.get(`/places/${id}/visit-status`);
        console.log("visit-status response:", vs.data);
        if (vs.data?.success) {
          setVisits({ ...vdata, visitedByMe: vs.data.visitedByMe });
        } else {
          setVisits(vdata);
        }
      } catch (err: any) {
        console.log("visit-status error:", err?.response?.status, err?.message);
        setVisits(vdata);
      }
    }
  }, [id]);

  useEffect(() => { fetchSocial(); }, [fetchSocial]);

  useEffect(() => {
    if (!place) return;
    const key = (import.meta as any).env?.VITE_WEATHER_API_KEY;
    if (!key) return;
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${place.lat}&lon=${place.lng}&units=metric&appid=${key}`)
      .then(r => r.json())
      .then(data => {
        if (data.cod !== "200") return;
        const cur = data.list[0];
        setWeather({
          temp:      Math.round(cur.main.temp),
          condition: cur.weather[0].description.replace(/\b\w/g, (c: string) => c.toUpperCase()),
          wind:      Math.round(cur.wind.speed * 3.6),
          humidity:  cur.main.humidity,
          icon:      cur.weather[0].icon,
          forecast:  ["Today", "Tomorrow", "Day 3", "Day 4"].map((day, i) => {
            const item = data.list[Math.min(i * 8, data.list.length - 1)];
            return { day, high: Math.round(item.main.temp_max), low: Math.round(item.main.temp_min), icon: item.weather[0].icon };
          }),
        });
      }).catch(() => {});
  }, [place]);

  useEffect(() => {
    if (!slideOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  setActivePhoto(v => v === 0 ? photos.length - 1 : v - 1);
      if (e.key === "ArrowRight") setActivePhoto(v => v === photos.length - 1 ? 0 : v + 1);
      if (e.key === "Escape")     setSlideOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slideOpen, photos.length]);

  const openSlide = (index = 0) => { setActivePhoto(index); setSlideOpen(true); };

  const handleLike = async () => {
    try {
      const res = await axiosInstance.post(`/places/${id}/like`);
      setLikes(p => ({ ...p, likedByMe: res.data.liked, count: res.data.liked ? p.count + 1 : p.count - 1 }));
    } catch {}
  };

  const handleVisit = async () => {
    try {
      const res = await axiosInstance.post(`/places/${id}/visit`);
      setVisits(p => ({ ...p, visitedByMe: res.data.visited, count: res.data.visited ? p.count + 1 : p.count - 1 }));
    } catch {}
  };

  const handleRate = async (star: number) => {
    try {
      const res = await axiosInstance.post(`/places/${id}/rate`, { rating: star });
      setRatings(res.data);
    } catch {}
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await axiosInstance.post(`/places/${id}/comments`, {
        text: comment.trim(),
        parent_id: replyTo?.id || null,
      });
      if (replyTo) {
        setComments(prev => prev.map(c =>
          c.id === replyTo.id ? { ...c, replies: [...(c.replies || []), res.data] } : c
        ));
      } else {
        setComments(prev => [res.data, ...prev]);
      }
      setComment(""); setReplyTo(null);
    } catch {}
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await axiosInstance.delete(`/places/comments/${commentId}`);
      setComments(prev => prev
        .filter(c => c.id !== commentId)
        .map(c => ({ ...c, replies: (c.replies || []).filter(r => r.id !== commentId) }))
      );
    } catch {}
  };

  const condStatus = (val: string) => {
    if (["Good", "Paved", "Easy", "Moderate"].includes(val)) return "good";
    if (["Poor", "Hard", "Expert", "Closed"].includes(val))  return "warn";
    return "info";
  };

  const W = weather || {
    temp: "--", condition: "Add VITE_WEATHER_API_KEY for live weather",
    wind: "--", humidity: "--", icon: "02d",
    forecast: ["Today", "Tomorrow", "Day 3", "Day 4"].map(day => ({ day, high: "--", low: "--", icon: "02d" })),
  };

  const maxDist = Math.max(...Object.values(ratings.dist), 1);

  if (loading) return (
    <div className="pd-page"><Navbar />
      <div className="pd-loading"><div className="pd-spinner" /></div>
    </div>
  );

  if (error || !place) return (
    <div className="pd-page"><Navbar />
      <div className="pd-error">
        <MapPin size={48} strokeWidth={1.2} />
        <h2>{error || "Place not found"}</h2>
        <button className="pd-back-btn" onClick={() => navigate("/explore-map")}>
          <ArrowLeft size={16} /> Back to Map
        </button>
      </div>
    </div>
  );

  return (
    <div className="pd-page">
      <Navbar />
      <div className="pd-content">

        <button className="pd-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} strokeWidth={2.5} /> Back
        </button>

        {/* HERO */}
        <div className="pd-hero" onClick={() => photos.length > 0 && openSlide(0)}>
          {photos.length > 0
            ? <img src={photos[0]} alt={place.name} className="pd-hero-img" />
            : (
              <div className="pd-hero-empty">
                <MapPin size={48} strokeWidth={1.2} />
                <span>No photos yet</span>
              </div>
            )
          }
          {photos.length > 0 && (
            <div className="pd-hero-badge">
              <Images size={13} strokeWidth={2.5} />
              {photos.length} photo{photos.length !== 1 ? "s" : ""}
            </div>
          )}
          {photos.length > 1 && (
            <div className="pd-hero-strip">
              {photos.slice(1, 4).map((img, i) => (
                <div key={i} className="pd-hero-strip-thumb"
                  onClick={e => { e.stopPropagation(); openSlide(i + 1); }}>
                  <img src={img} alt="" />
                  {i === 2 && photos.length > 4 && (
                    <div className="pd-hero-strip-more">+{photos.length - 4}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BODY */}
        <div className="pd-body">
          <div className="pd-left">

            {/* Info card */}
            <div className="pd-card">
              <div className="pd-info-top">
                <div>
                  <h1 className="pd-name">{place.name}</h1>
                  <div className="pd-address-row">
                    <MapPin size={13} strokeWidth={2} />{place.address || "Nepal"}
                  </div>
                </div>
                <div className="pd-verified"><BadgeCheck size={16} strokeWidth={2} /> Verified</div>
              </div>

              <div className="pd-rating-summary">
                <span className="pd-rating-avg">{ratings.avg.toFixed(1)}</span>
                <div className="pd-stars-display">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} strokeWidth={1.5}
                      fill={s <= Math.round(ratings.avg) ? "#f59e0b" : "none"}
                      color={s <= Math.round(ratings.avg) ? "#f59e0b" : "#cbd5e1"} />
                  ))}
                </div>
                <span className="pd-rating-total">({ratings.total} reviews)</span>
              </div>

              <div className="pd-stats-row">
                {place.category && (
                  <span className="pd-cat-badge"><Tag size={11} strokeWidth={2.5} /> {place.category}</span>
                )}
                <button className="pd-stat pd-stat-btn" onClick={() => setShowLikers(v => !v)}>
                  <ThumbsUp size={13} strokeWidth={2} /> {likes.count} likes
                </button>
                <span className="pd-stat"><Footprints size={13} strokeWidth={2} /> {visits.count} visited</span>
              </div>

              {showLikers && likes.users.length > 0 && (
                <div className="pd-liked-by">
                  <div className="pd-liked-by-title">Liked by</div>
                  <div className="pd-liked-by-list">
                    {likes.users.map(u => (
                      <div key={u.id} className="pd-liked-by-user">
                        <div className="pd-comment-avatar pd-avatar-sm">{u.first_name?.[0]}</div>
                        <span>{u.first_name} {u.last_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {place.description && (
                <div className="pd-section">
                  <div className="pd-section-label">Description</div>
                  <p className="pd-desc">{place.description}</p>
                </div>
              )}
            </div>

            {/* Weather + Conditions */}
            <div className="pd-weather-conditions-row">
              <div className="pd-card pd-card--weather">
                <div className="pd-section-label"><Cloud size={13} strokeWidth={2} /> Live Weather</div>
                <div className="pd-weather-temp">
                  <span className="pd-weather-icon">{WI[W.icon] || "🌤️"}</span>{W.temp}°C
                </div>
                <div className="pd-weather-cond">{W.condition}</div>
                <div className="pd-weather-meta">
                  <span><Wind size={12} strokeWidth={2} /> {W.wind} km/h</span>
                  <span><Droplets size={12} strokeWidth={2} /> {W.humidity}%</span>
                </div>
                <div className="pd-forecast">
                  {W.forecast.map((f: any) => (
                    <div key={f.day} className="pd-forecast-day">
                      <div className="pd-forecast-label">{f.day}</div>
                      <div className="pd-forecast-emoji">{WI[f.icon] || "🌤️"}</div>
                      <div className="pd-forecast-temps">
                        <span className="hi">{f.high}°</span>
                        <span className="lo">{f.low}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pd-card pd-card--conditions">
                <div className="pd-section-label">
                  <CheckCircle size={13} strokeWidth={2} /> Conditions
                  <span className="pd-cond-admin-label">(admin updated)</span>
                </div>
                <div className="pd-conditions">
                  {([
                    { label: "Trail",      value: conditions.trail,      Icon: CheckCircle },
                    { label: "Road",       value: conditions.road,       Icon: CheckCircle },
                    { label: "Best Time",  value: conditions.best_time,  Icon: Clock },
                    { label: "Difficulty", value: conditions.difficulty, Icon: AlertCircle },
                  ] as any[]).map(({ label, value, Icon }) => (
                    <div key={label} className={`pd-cond pd-cond--${condStatus(value)}`}>
                      <Icon size={14} strokeWidth={2.5} />
                      <div>
                        <div className="pd-cond-label">{label}</div>
                        <div className="pd-cond-val">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {conditions.note && <div className="pd-cond-note">📝 {conditions.note}</div>}
              </div>
            </div>

            {/* Actions */}
            <div className="pd-card pd-actions-card">
              <button className={`pd-action-btn ${likes.likedByMe ? "pd-action-btn--liked" : ""}`}
                onClick={handleLike}>
                <ThumbsUp size={15} strokeWidth={2.5} />
                {likes.likedByMe ? "Liked" : "Like"} ({likes.count})
              </button>
              {visits.visitedByMe ? (
                <div className="pd-visited-row">
                  <div className="pd-action-btn pd-action-btn--visited pd-action-btn--no-hover">
                    <CheckCircle size={15} strokeWidth={2.5} />
                    Visited ✓ ({visits.count})
                  </div>
                  <button className="pd-remove-visit-btn" onClick={() => setShowRemoveConfirm(true)} title="Remove visit">
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <button className="pd-action-btn" onClick={() => setVisitOpen(true)}>
                  <CheckCircle size={15} strokeWidth={2.5} />
                  Mark Visited ({visits.count})
                </button>
              )}
              <div className="pd-star-rate">
                <span className="pd-rate-label">Rate:</span>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" className="pd-star-btn"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRate(s)}>
                    <Star size={20} strokeWidth={1.5}
                      fill={s <= (hoverRating || ratings.myRating) ? "#f59e0b" : "none"}
                      color={s <= (hoverRating || ratings.myRating) ? "#f59e0b" : "#cbd5e1"} />
                  </button>
                ))}
              </div>
            </div>

            {/* ── RATING BREAKDOWN — Google Maps style ── */}
            {ratings.total > 0 && (
              <div className="pd-card pd-rating-breakdown">
                <div className="pd-section-label"><Star size={13} strokeWidth={2} /> Review Summary</div>
                <div className="pd-rb-inner">
                  {/* Left: big number */}
                  <div className="pd-rb-left">
                    <div className="pd-rb-big">{ratings.avg.toFixed(1)}</div>
                    <div className="pd-rb-stars">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={16} strokeWidth={1.5}
                          fill={s <= Math.round(ratings.avg) ? "#f59e0b" : "none"}
                          color={s <= Math.round(ratings.avg) ? "#f59e0b" : "#cbd5e1"} />
                      ))}
                    </div>
                    <div className="pd-rb-total">{ratings.total} review{ratings.total !== 1 ? "s" : ""}</div>
                  </div>
                  {/* Right: bars */}
                  <div className="pd-rb-bars">
                    {[5,4,3,2,1].map(s => (
                      <div key={s} className="pd-rb-row">
                        <span className="pd-rb-label">{s}</span>
                        <div className="pd-rb-track">
                          <div className="pd-rb-fill"
                            style={{ width: `${(ratings.dist[s] / maxDist) * 100}%` }} />
                        </div>
                        <span className="pd-rb-count">{ratings.dist[s]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="pd-card">
              <div className="pd-section-label">
                <MessageCircle size={13} strokeWidth={2} /> Comments ({comments.length})
              </div>

              {replyTo && (
                <div className="pd-reply-indicator">
                  <Reply size={13} /> Replying to <strong>{replyTo.name}</strong>
                  <button onClick={() => setReplyTo(null)} className="pd-reply-cancel">
                    <X size={13} />
                  </button>
                </div>
              )}

              <form className="pd-comment-form" onSubmit={handleComment}>
                <div className="pd-comment-avatar pd-comment-avatar--you">
                  {currentUser.first_name?.[0] || "Y"}
                </div>
                <input className="pd-comment-input" value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Add a comment..."} />
                <button className="pd-comment-send" type="submit" disabled={!comment.trim()}>
                  <Send size={14} strokeWidth={2.5} />
                </button>
              </form>

              <div className="pd-comments-list">
                {comments.map((c) => (
                  <div key={c.id} className="pd-comment">
                    <div className="pd-comment-avatar">
                      {c.user?.avatar
                        ? <img src={c.user.avatar} alt="" style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }} />
                        : c.user?.first_name?.[0] || "U"
                      }
                    </div>
                    <div className="pd-comment-body">
                      <div className="pd-comment-header">
                        <span className="pd-comment-user">{c.user?.first_name} {c.user?.last_name}</span>
                        <span className="pd-comment-time">{timeAgo(c.created_at)}</span>
                      </div>
                      <div className="pd-comment-text">{c.text}</div>
                      <div className="pd-comment-actions">
                        <button className="pd-comment-reply-btn"
                          onClick={() => setReplyTo({ id: c.id, name: c.user?.first_name })}>
                          <Reply size={12} /> Reply
                        </button>
                        {(currentUser.id === c.user?.id || currentUser.role === "admin") && (
                          <button className="pd-comment-delete-btn"
                            onClick={() => handleDeleteComment(c.id)}>
                            <Trash2 size={12} /> Delete
                          </button>
                        )}
                      </div>
                      {(c.replies || []).length > 0 && (
                        <div className="pd-replies">
                          {(c.replies || []).map(r => (
                            <div key={r.id} className="pd-comment pd-reply">
                              <div className="pd-comment-avatar pd-avatar-sm">
                                {r.user?.first_name?.[0] || "U"}
                              </div>
                              <div className="pd-comment-body">
                                <div className="pd-comment-header">
                                  <span className="pd-comment-user">{r.user?.first_name} {r.user?.last_name}</span>
                                  <span className="pd-comment-time">{timeAgo(r.created_at)}</span>
                                </div>
                                <div className="pd-comment-text">{r.text}</div>
                                {(currentUser.id === r.user?.id || currentUser.role === "admin") && (
                                  <button className="pd-comment-delete-btn"
                                    onClick={() => handleDeleteComment(r.id)}>
                                    <Trash2 size={12} /> Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="pd-right">
            <div className="pd-card pd-card--map">
              <div className="pd-section-label"><MapPin size={13} strokeWidth={2} /> Location</div>
              <div className="pd-minimap">
                <MapContainer center={[place.lat, place.lng]} zoom={14}
                  style={{ height: "210px", width: "100%", borderRadius: "12px" }}
                  zoomControl={false} dragging={false} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[place.lat, place.lng]} />
                </MapContainer>
              </div>
              <div className="pd-latlng">
                <div><span>Lat:</span> {place.lat.toFixed(5)}</div>
                <div><span>Lng:</span> {place.lng.toFixed(5)}</div>
              </div>
              <a className="pd-view-map-btn"
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                target="_blank" rel="noreferrer">
                <Navigation size={13} strokeWidth={2.5} /> View on Map
              </a>
            </div>

            <div className="pd-card">
              <div className="pd-section-label"><User size={13} strokeWidth={2} /> Submitted By</div>
              <div className="pd-submitter">
                <div className="pd-submitter-avatar">{place.submitter?.first_name?.[0] || "U"}</div>
                <div>
                  <div className="pd-submitter-name">
                    {place.submitter ? `${place.submitter.first_name} ${place.submitter.last_name}` : "Anonymous"}
                  </div>
                  <div className="pd-submitter-badge"><BadgeCheck size={11} strokeWidth={2} /> Explorer</div>
                </div>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="pd-card">
                <div className="pd-section-label"><Tag size={13} strokeWidth={2} /> Tags</div>
                <div className="pd-tags">
                  {tags.map(t => <span key={t} className="pd-tag">{t}</span>)}
                </div>
              </div>
            )}

            {/* Report button */}
            <button className="pd-report-btn" onClick={() => setReportOpen(true)}>
              <Flag size={13} strokeWidth={2.5} /> Report Issue
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN SLIDESHOW */}
      {slideOpen && (
        <div className="pd-slideshow-overlay" onClick={() => setSlideOpen(false)}>
          <div className="pd-slideshow-inner" onClick={e => e.stopPropagation()}>
            <div className="pd-slideshow-counter">{activePhoto + 1} / {photos.length}</div>
            <button className="pd-slideshow-close" onClick={() => setSlideOpen(false)}>
              <X size={18} strokeWidth={2.5} />
            </button>
            <div className="pd-slideshow-img-wrap">
              <img src={photos[activePhoto]} alt="" />
            </div>
            {photos.length > 1 && (
              <>
                <button className="pd-slideshow-arrow pd-slideshow-arrow--left"
                  onClick={() => setActivePhoto(v => v === 0 ? photos.length - 1 : v - 1)}>
                  <ChevronLeft size={22} />
                </button>
                <button className="pd-slideshow-arrow pd-slideshow-arrow--right"
                  onClick={() => setActivePhoto(v => v === photos.length - 1 ? 0 : v + 1)}>
                  <ChevronRight size={22} />
                </button>
                <div className="pd-slideshow-thumbs">
                  {photos.map((img, i) => (
                    <button key={i} type="button"
                      className={`pd-slideshow-thumb ${i === activePhoto ? "active" : ""}`}
                      onClick={() => setActivePhoto(i)}>
                      <img src={img} alt="" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── REMOVE VISIT CONFIRM ── */}
      {showRemoveConfirm && (
        <div className="pd-report-overlay" onClick={() => setShowRemoveConfirm(false)}>
          <div className="pd-report-modal pd-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="pd-report-head">
              <div className="pd-report-icon" style={{ background: "#fff5f5", color: "#ef4444" }}>
                <Trash2 size={16} strokeWidth={2.5} />
              </div>
              <div>
                <div className="pd-report-title">Remove Visit?</div>
                <div className="pd-report-sub">This will remove your visited status</div>
              </div>
              <button className="pd-report-close" onClick={() => setShowRemoveConfirm(false)}><X size={16} /></button>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
                Are you sure you want to remove your visit to <strong>{place?.name}</strong>?

              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="pd-report-submit" style={{ background: "#ef4444", flex: 1 }}
                  onClick={handleRemoveVisit} disabled={removing}>
                  {removing ? "Removing…" : <><Trash2 size={14} /> Yes, Remove</>}
                </button>
                <button className="pd-report-submit" style={{ background: "#64748b", flex: 1 }}
                  onClick={() => setShowRemoveConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VISIT SUBMISSION MODAL ── */}
      {visitOpen && (
        <div className="pd-report-overlay" onClick={closeVisitModal}>
          <div className="pd-report-modal pd-visit-modal" onClick={e => e.stopPropagation()}>
            <div className="pd-report-head">
              <div className="pd-report-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                <CheckCircle size={16} strokeWidth={2.5} />
              </div>
              <div>
                <div className="pd-report-title">Mark as Visited</div>
                <div className="pd-report-sub">Submit proof — admin will verify your visit</div>
              </div>
              <button className="pd-report-close" onClick={closeVisitModal}><X size={16} /></button>
            </div>

            {visitStatus === "done" ? (
              <div className="pd-report-done">
                <CheckCircle size={40} strokeWidth={1.5} className="pd-report-done-icon" />
                <div className="pd-report-done-title">Visit submitted!</div>
                <div className="pd-report-done-sub">Our team will review your visit. Your "Visited" badge will appear once approved!</div>
                <button className="pd-report-done-btn" style={{ background: "#16a34a" }} onClick={closeVisitModal}>Done</button>
              </div>
            ) : (
              <form className="pd-report-form" onSubmit={submitVisitForm}>
                <div className="pd-report-field">
                  <label className="pd-report-label">
                    <Calendar size={13} strokeWidth={2} style={{ display:"inline", marginRight:4 }} />
                    Visit Date <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input type="date" className="pd-visit-input"
                    value={visitDate} max={new Date().toISOString().split("T")[0]}
                    onChange={e => setVisitDate(e.target.value)} required />
                </div>

                <div className="pd-report-field">
                  <label className="pd-report-label">
                    <FileText size={13} strokeWidth={2} style={{ display:"inline", marginRight:4 }} />
                    Your experience <span className="pd-report-optional">(optional)</span>
                  </label>
                  <textarea className="pd-report-textarea" rows={3}
                    value={visitExp} onChange={e => setVisitExp(e.target.value)}
                    placeholder="What was it like? Any tips for others?" />
                </div>

                <div className="pd-report-field">
                  <label className="pd-report-label">
                    <Upload size={13} strokeWidth={2} style={{ display:"inline", marginRight:4 }} />
                    Photo proof <span className="pd-report-optional">(optional but recommended)</span>
                  </label>
                  {visitPreview ? (
                    <div className="pd-visit-preview">
                      <img src={visitPreview} alt="preview" />
                      <button type="button" className="pd-visit-remove" onClick={() => { setVisitPhoto(null); setVisitPreview(null); }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="pd-visit-upload">
                      <Upload size={20} strokeWidth={1.5} />
                      <span>Click to upload a photo from your visit</span>
                      <input type="file" accept="image/*" style={{ display: "none" }}
                        onChange={e => e.target.files?.[0] && handleVisitPhoto(e.target.files[0])} />
                    </label>
                  )}
                </div>

                {visitStatus === "error" && (
                  <div className="pd-report-err">Failed to submit. Please try again.</div>
                )}

                <button className="pd-report-submit" type="submit"
                  disabled={!visitDate || visitStatus === "sending"}
                  style={{ background: "#16a34a" }}>
                  {visitStatus === "sending" ? "Submitting…" : <><CheckCircle size={14} /> Submit Visit</>}
                </button>

                <div style={{ textAlign:"center", fontSize:"12px", color:"#94a3b8", marginTop:"4px" }}>
                  Your "Visited" badge will appear after admin approval
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── REPORT MODAL ── */}
      {reportOpen && (
        <div className="pd-report-overlay" onClick={closeReport}>
          <div className="pd-report-modal" onClick={e => e.stopPropagation()}>
            <div className="pd-report-head">
              <div className="pd-report-icon"><Flag size={16} strokeWidth={2.5} /></div>
              <div>
                <div className="pd-report-title">Report an Issue</div>
                <div className="pd-report-sub">Help us keep LoKally accurate</div>
              </div>
              <button className="pd-report-close" onClick={closeReport}><X size={16} /></button>
            </div>

            {reportStatus === "done" ? (
              <div className="pd-report-done">
                <CheckCircle size={40} strokeWidth={1.5} className="pd-report-done-icon" />
                <div className="pd-report-done-title">Report submitted!</div>
                <div className="pd-report-done-sub">Thank you for helping keep LoKally accurate. Our team will review it shortly.</div>
                <button className="pd-report-done-btn" onClick={closeReport}>Close</button>
              </div>
            ) : (
              <form className="pd-report-form" onSubmit={submitReport}>
                <div className="pd-report-field">
                  <label className="pd-report-label">What's the issue?</label>
                  <div className="pd-report-reasons">
                    {REPORT_REASONS.map(r => (
                      <button key={r} type="button"
                        className={`pd-report-reason ${reportReason === r ? "active" : ""}`}
                        onClick={() => setReportReason(r)}>
                        {reportReason === r && <CheckCircle size={13} strokeWidth={2.5} />}
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pd-report-field">
                  <label className="pd-report-label">Additional details <span className="pd-report-optional">(optional)</span></label>
                  <textarea className="pd-report-textarea" rows={3}
                    value={reportNote}
                    onChange={e => setReportNote(e.target.value)}
                    placeholder="Describe the issue in more detail..." />
                </div>
                {reportStatus === "error" && (
                  <div className="pd-report-err">Failed to submit. Please try again.</div>
                )}
                <button className="pd-report-submit" type="submit"
                  disabled={!reportReason || reportStatus === "sending"}>
                  {reportStatus === "sending" ? "Submitting…" : <><Send size={14} /> Submit Report</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}