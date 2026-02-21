// PlaceDetails.tsx
// Location: src/features/auth/Map/PlaceDetails.tsx
// Layout matches wireframe exactly:
// - Full width gallery + thumbnails (collage if multiple images)
// - LEFT: Name → Description → Weather+Conditions (side by side) → Like/Visit → Comments
// - RIGHT: Location map → Submitted By → Tags → Report Issue
// Font: Red Rose (bold, clean — matches reference screenshot)
// Icons: Lucide React only (no emojis)

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft, MapPin, Navigation, Cloud, Wind, Droplets,
  CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight,
  ThumbsUp, Footprints, Star, MessageCircle, Send,
  User, Tag, Flag, BadgeCheck, Maximize2, Minimize2,
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

// ── DUMMY DATA (weather + conditions only — no real API yet) ────
const WEATHER = {
  temp: 22, condition: "Partly Cloudy", wind: 12, humidity: 65,
  forecast: [
    { day: "Today",    high: 22, low: 12, Icon: Cloud },
    { day: "Tomorrow", high: 19, low: 10, Icon: Wind },
    { day: "Sun",      high: 25, low: 13, Icon: Cloud },
    { day: "Mon",      high: 20, low: 11, Icon: Cloud },
  ],
};

const CONDITIONS = [
  { label: "Trail Condition", value: "Good",     status: "good", Icon: CheckCircle },
  { label: "Road Access",     value: "Paved",    status: "good", Icon: CheckCircle },
  { label: "Best Time",       value: "Oct–Mar",  status: "info", Icon: Clock },
  { label: "Difficulty",      value: "Moderate", status: "warn", Icon: AlertCircle },
];

const DUMMY_COMMENTS = [
  { id: 1, user: "Aarav Shrestha", initials: "A", text: "Amazing place! Highly recommend early morning visit.", time: "2 days ago" },
  { id: 2, user: "Priya Tamang",   initials: "P", text: "Hidden gem! The sunset view is breathtaking.", time: "1 week ago" },
  { id: 3, user: "Rohan Gurung",   initials: "R", text: "Trail can get muddy in monsoon. Bring proper shoes.", time: "2 weeks ago" },
];

const DUMMY_TAGS = ["Mountain", "Scenic", "Hiking"];

export default function PlaceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Gallery
  const [photos, setPhotos] = useState<string[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // Interactions (local state — not connected to backend yet)
  const [liked, setLiked] = useState(false);
  const [likeCount] = useState(234);
  const [visited, setVisited] = useState(false);
  const [visitCount] = useState(89);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(DUMMY_COMMENTS);

  useEffect(() => {
    if (!id) return;
    axiosInstance.get(`/places/${id}`)
      .then((res) => {
        if (res.data.success) {
          const p = res.data.data;
          const normalized: Place = {
            ...p,
            id: String(p.id),
            lat: typeof p.lat === "string" ? parseFloat(p.lat) : p.lat,
            lng: typeof p.lng === "string" ? parseFloat(p.lng) : p.lng,
            image: p.image ? `http://localhost:5001${p.image}` : undefined,
          };
          setPlace(normalized);
          // Only real image — no dummy extras
          setPhotos(normalized.image ? [normalized.image] : []);
        } else {
          setError("Place not found.");
        }
      })
      .catch(() => setError("Failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setComments((prev) => [
      { id: Date.now(), user: "You", initials: "Y", text: comment.trim(), time: "Just now" },
      ...prev,
    ]);
    setComment("");
  };

  if (loading) return (
    <div className="pd-page"><Navbar />
      <div className="pd-loading"><div className="pd-spinner" /><span>Loading...</span></div>
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

  // Collage layout: 1 photo = full width, 2+ = mosaic grid
  const hasMultiple = photos.length > 1;

  return (
    <div className="pd-page">
      <Navbar />
      <div className="pd-content">

        {/* ── BACK ── */}
        <button className="pd-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} strokeWidth={2.5} /> Back
        </button>

        {/* ── GALLERY ── */}
        <div className={`pd-gallery-wrap ${fullscreen ? "pd-gallery--fullscreen" : ""}`}>

          {/* Single image — full width slideshow */}
          {!hasMultiple && (
            <div className="pd-gallery-single">
              {photos.length > 0 ? (
                <img src={photos[0]} alt={place.name} className="pd-gallery-img" />
              ) : (
                <div className="pd-gallery-empty">
                  <MapPin size={48} strokeWidth={1.2} />
                  <span>No photo uploaded yet</span>
                </div>
              )}
              <button className="pd-gallery-fs-btn" onClick={() => setFullscreen(v => !v)}>
                {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          )}

          {/* Multiple images — Komoot collage grid */}
          {hasMultiple && (
            <div className="pd-gallery-collage">
              {/* Main big image — left */}
              <div className="pd-collage-main" onClick={() => setActivePhoto(0)}>
                <img src={photos[0]} alt={place.name} />
              </div>
              {/* Right grid — up to 4 small images */}
              <div className="pd-collage-grid">
                {photos.slice(1, 5).map((img, i) => (
                  <div key={i} className="pd-collage-cell" onClick={() => setActivePhoto(i + 1)}>
                    <img src={img} alt={`photo ${i + 2}`} />
                    {/* Last cell: show "X images" badge */}
                    {i === 3 && photos.length > 5 && (
                      <div className="pd-collage-more">
                        <Maximize2 size={14} /> {photos.length} images
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Fullscreen slideshow overlay */}
              {fullscreen && (
                <div className="pd-slideshow-overlay" onClick={() => setFullscreen(false)}>
                  <div className="pd-slideshow-inner" onClick={e => e.stopPropagation()}>
                    <img src={photos[activePhoto]} alt="" className="pd-slideshow-img" />
                    <button className="pd-slide-arrow pd-slide-arrow--left"
                      onClick={() => setActivePhoto(v => v === 0 ? photos.length - 1 : v - 1)}>
                      <ChevronLeft size={24} />
                    </button>
                    <button className="pd-slide-arrow pd-slide-arrow--right"
                      onClick={() => setActivePhoto(v => v === photos.length - 1 ? 0 : v + 1)}>
                      <ChevronRight size={24} />
                    </button>
                    <div className="pd-slide-count">{activePhoto + 1} / {photos.length}</div>
                    <button className="pd-slide-close" onClick={() => setFullscreen(false)}>
                      <Minimize2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thumbnails strip — only for single-view mode with multiple photos */}
          {!hasMultiple && photos.length > 1 && (
            <div className="pd-thumbs">
              {photos.map((img, i) => (
                <button key={i} type="button"
                  className={`pd-thumb ${i === activePhoto ? "active" : ""}`}
                  onClick={() => setActivePhoto(i)}>
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── MAIN BODY: LEFT + RIGHT ── */}
        <div className="pd-body">

          {/* ════ LEFT COLUMN ════ */}
          <div className="pd-left">

            {/* Place name + meta */}
            <div className="pd-card pd-card--info">
              <div className="pd-info-top">
                <div>
                  <h1 className="pd-name">{place.name}</h1>
                  <div className="pd-address-row">
                    <MapPin size={13} strokeWidth={2} />
                    <span>{place.address || "Nepal"}</span>
                  </div>
                </div>
                <div className="pd-verified">
                  <BadgeCheck size={18} strokeWidth={2} />
                  Verified
                </div>
              </div>

              {/* Category + stats row */}
              <div className="pd-stats-row">
                {place.category && (
                  <span className="pd-cat-badge">
                    <Tag size={11} strokeWidth={2.5} /> {place.category}
                  </span>
                )}
                <span className="pd-stat">
                  <ThumbsUp size={13} strokeWidth={2} /> {likeCount} likes
                </span>
                <span className="pd-stat">
                  <Footprints size={13} strokeWidth={2} /> {visitCount} visited
                </span>
              </div>

              {/* Description */}
              {place.description && (
                <div className="pd-section">
                  <div className="pd-section-label">Description</div>
                  <p className="pd-desc">{place.description}</p>
                </div>
              )}
            </div>

            {/* ── WEATHER + CONDITIONS side by side (wireframe layout) ── */}
            <div className="pd-weather-conditions-row">

              {/* Weather box */}
              <div className="pd-card pd-card--weather">
                <div className="pd-section-label">
                  <Cloud size={14} strokeWidth={2} /> Weather
                </div>
                <div className="pd-weather-temp">{WEATHER.temp}°C</div>
                <div className="pd-weather-cond">{WEATHER.condition}</div>
                <div className="pd-weather-meta">
                  <span><Wind size={12} strokeWidth={2} /> {WEATHER.wind} km/h</span>
                  <span><Droplets size={12} strokeWidth={2} /> {WEATHER.humidity}%</span>
                </div>
                <div className="pd-forecast">
                  {WEATHER.forecast.map((f) => (
                    <div key={f.day} className="pd-forecast-day">
                      <div className="pd-forecast-label">{f.day}</div>
                      <f.Icon size={16} strokeWidth={1.5} className="pd-forecast-icon" />
                      <div className="pd-forecast-temps">
                        <span className="hi">{f.high}°</span>
                        <span className="lo">{f.low}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditions box */}
              <div className="pd-card pd-card--conditions">
                <div className="pd-section-label">Condition of Place</div>
                <div className="pd-conditions">
                  {CONDITIONS.map(({ label, value, status, Icon }) => (
                    <div key={label} className={`pd-cond pd-cond--${status}`}>
                      <Icon size={14} strokeWidth={2.5} />
                      <div>
                        <div className="pd-cond-label">{label}</div>
                        <div className="pd-cond-val">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── LIKE / MARK VISITED / RATE ── */}
            <div className="pd-card pd-actions-card">
              <button
                className={`pd-action-btn ${liked ? "pd-action-btn--liked" : ""}`}
                onClick={() => setLiked(v => !v)}
              >
                <ThumbsUp size={16} strokeWidth={2.5} />
                Like ({liked ? likeCount + 1 : likeCount})
              </button>

              <button
                className={`pd-action-btn ${visited ? "pd-action-btn--visited" : ""}`}
                onClick={() => setVisited(v => !v)}
              >
                <CheckCircle size={16} strokeWidth={2.5} />
                Mark Visited
              </button>

              {/* Star rating */}
              <div className="pd-star-rate">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button"
                    className="pd-star-btn"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(s)}
                  >
                    <Star
                      size={20} strokeWidth={1.5}
                      fill={s <= (hoverRating || userRating) ? "#f59e0b" : "none"}
                      color={s <= (hoverRating || userRating) ? "#f59e0b" : "#cbd5e1"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* ── COMMENTS ── */}
            <div className="pd-card">
              <div className="pd-section-label">
                <MessageCircle size={14} strokeWidth={2} /> Comments ({comments.length})
              </div>

              <form className="pd-comment-form" onSubmit={handleComment}>
                <div className="pd-comment-avatar pd-comment-avatar--you">Y</div>
                <input
                  className="pd-comment-input"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment..."
                />
                <button className="pd-comment-send" type="submit" disabled={!comment.trim()}>
                  <Send size={14} strokeWidth={2.5} />
                </button>
              </form>

              <div className="pd-comments-list">
                {comments.map((c) => (
                  <div key={c.id} className="pd-comment">
                    <div className="pd-comment-avatar">{c.initials}</div>
                    <div>
                      <div className="pd-comment-header">
                        <span className="pd-comment-user">{c.user}</span>
                        <span className="pd-comment-time">{c.time}</span>
                      </div>
                      <div className="pd-comment-text">{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN ════ */}
          <div className="pd-right">

            {/* Location map */}
            <div className="pd-card pd-card--map">
              <div className="pd-section-label">
                <MapPin size={14} strokeWidth={2} /> Location
              </div>
              <div className="pd-minimap">
                <MapContainer
                  center={[place.lat, place.lng]}
                  zoom={14}
                  style={{ height: "220px", width: "100%", borderRadius: "12px" }}
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[place.lat, place.lng]} />
                </MapContainer>
              </div>
              <div className="pd-latlng">
                <div><span>Lat:</span> {place.lat.toFixed(5)}</div>
                <div><span>Lng:</span> {place.lng.toFixed(5)}</div>
              </div>
              <a
                className="pd-view-map-btn"
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                target="_blank" rel="noreferrer"
              >
                <Navigation size={14} strokeWidth={2.5} /> View on Map
              </a>
            </div>

            {/* Submitted By */}
            <div className="pd-card">
              <div className="pd-section-label">
                <User size={14} strokeWidth={2} /> Submitted By
              </div>
              <div className="pd-submitter">
                <div className="pd-submitter-avatar">
                  {place.submitter?.first_name?.[0] || "U"}
                </div>
                <div>
                  <div className="pd-submitter-name">
                    {place.submitter
                      ? `${place.submitter.first_name} ${place.submitter.last_name}`
                      : "Anonymous"}
                  </div>
                  <div className="pd-submitter-badge">
                    <BadgeCheck size={12} strokeWidth={2} /> Explorer Badge
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="pd-card">
              <div className="pd-section-label">
                <Tag size={14} strokeWidth={2} /> Tags
              </div>
              <div className="pd-tags">
                {(place.category ? [place.category, ...DUMMY_TAGS] : DUMMY_TAGS).map((t) => (
                  <span key={t} className="pd-tag">{t}</span>
                ))}
              </div>
            </div>

            {/* Report Issue */}
            <button className="pd-report-btn">
              <Flag size={14} strokeWidth={2.5} /> Report Issue
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}