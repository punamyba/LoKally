

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft, MapPin, Navigation, Cloud, Wind, Droplets,
  CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight,
  ThumbsUp, Footprints, Star, MessageCircle, Send,
  User, Tag, Flag, BadgeCheck, Images, X,
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

// Parse image field — single string OR JSON array
function parseImages(image: string | null | undefined): string[] {
  if (!image) return [];
  const base = "http://localhost:5001";
  if (image.startsWith("[")) {
    try { return (JSON.parse(image) as string[]).map(p => `${base}${p}`); }
    catch { return [`${base}${image}`]; }
  }
  return [`${base}${image}`];
}

// Dummy data
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
  { label: "Trail",     value: "Good",     status: "good", Icon: CheckCircle },
  { label: "Road",      value: "Paved",    status: "good", Icon: CheckCircle },
  { label: "Best Time", value: "Oct–Mar",  status: "info", Icon: Clock },
  { label: "Difficulty",value: "Moderate", status: "warn", Icon: AlertCircle },
];
const DUMMY_COMMENTS = [
  { id: 1, user: "Aarav Shrestha", initials: "A", text: "Amazing place! Highly recommend early morning visit.", time: "2 days ago" },
  { id: 2, user: "Priya Tamang",   initials: "P", text: "Hidden gem! The sunset view is breathtaking.",        time: "1 week ago" },
];
const DUMMY_TAGS = ["Scenic", "Hiking"];

export default function PlaceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  // Slideshow
  const [slideOpen, setSlideOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  // Actions
  const [liked, setLiked] = useState(false);
  const [visited, setVisited] = useState(false);
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

  // Keyboard nav in slideshow
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

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setComments(prev => [
      { id: Date.now(), user: "You", initials: "Y", text: comment.trim(), time: "Just now" },
      ...prev,
    ]);
    setComment("");
  };

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

        {/* ── HERO IMAGE + photo count ── */}
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
          {/* Photo count badge */}
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

        {/* ── BODY ── */}
        <div className="pd-body">
          <div className="pd-left">

            {/* Info */}
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
              <div className="pd-stats-row">
                {place.category && (
                  <span className="pd-cat-badge"><Tag size={11} strokeWidth={2.5} /> {place.category}</span>
                )}
                <span className="pd-stat"><ThumbsUp size={13} strokeWidth={2} /> {liked ? 235 : 234} likes</span>
                <span className="pd-stat"><Footprints size={13} strokeWidth={2} /> 89 visited</span>
              </div>
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
                <div className="pd-section-label"><Cloud size={13} strokeWidth={2} /> Weather</div>
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
                      <f.Icon size={15} strokeWidth={1.5} className="pd-forecast-icon" />
                      <div className="pd-forecast-temps">
                        <span className="hi">{f.high}°</span>
                        <span className="lo">{f.low}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pd-card pd-card--conditions">
                <div className="pd-section-label"><CheckCircle size={13} strokeWidth={2} /> Conditions</div>
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

            {/* Actions */}
            <div className="pd-card pd-actions-card">
              <button className={`pd-action-btn ${liked ? "pd-action-btn--liked" : ""}`}
                onClick={() => setLiked(v => !v)}>
                <ThumbsUp size={15} strokeWidth={2.5} /> Like
              </button>
              <button className={`pd-action-btn ${visited ? "pd-action-btn--visited" : ""}`}
                onClick={() => setVisited(v => !v)}>
                <CheckCircle size={15} strokeWidth={2.5} /> {visited ? "Visited!" : "Mark Visited"}
              </button>
              <div className="pd-star-rate">
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" className="pd-star-btn"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(s)}>
                    <Star size={20} strokeWidth={1.5}
                      fill={s <= (hoverRating || userRating) ? "#f59e0b" : "none"}
                      color={s <= (hoverRating || userRating) ? "#f59e0b" : "#cbd5e1"} />
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="pd-card">
              <div className="pd-section-label"><MessageCircle size={13} strokeWidth={2} /> Comments ({comments.length})</div>
              <form className="pd-comment-form" onSubmit={handleComment}>
                <div className="pd-comment-avatar pd-comment-avatar--you">Y</div>
                <input className="pd-comment-input" value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment..." />
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

            <div className="pd-card">
              <div className="pd-section-label"><Tag size={13} strokeWidth={2} /> Tags</div>
              <div className="pd-tags">
                {[...(place.category ? [place.category] : []), ...DUMMY_TAGS].map(t => (
                  <span key={t} className="pd-tag">{t}</span>
                ))}
              </div>
            </div>

            <button className="pd-report-btn"><Flag size={13} strokeWidth={2.5} /> Report Issue</button>
          </div>
        </div>
      </div>

      {/* ── FULLSCREEN SLIDESHOW ── */}
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

                {/* Thumbnail strip */}
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
    </div>
  );
}