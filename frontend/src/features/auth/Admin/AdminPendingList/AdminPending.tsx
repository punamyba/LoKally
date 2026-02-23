
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CheckCircle, Clock, User, Calendar, ChevronRight } from "lucide-react";
import { adminApi } from "../adminApi";
import type { Place } from "../AdminTypes";
import "./AdminPending.css";

// Parse images — single path or JSON array
function parseImages(image: string | null | undefined): string[] {
  if (!image) return [];
  if (image.startsWith("[")) {
    try { return (JSON.parse(image) as string[]).map(p => `http://localhost:5001${p}`); }
    catch { return [`http://localhost:5001${image}`]; }
  }
  return [`http://localhost:5001${image}`];
}

export default function AdminPending() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminApi.getPlaces("pending").then((res) => {
      if (res.success) setPlaces(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="apd-loading"><div className="apd-spinner" /></div>;

  return (
    <div className="apd-root">
      <div className="apd-header">
        <h1 className="apd-title">
          <Clock size={24} strokeWidth={2} />
          Pending Review
        </h1>
        <p className="apd-subtitle">
          {places.length} place{places.length !== 1 ? "s" : ""} waiting for your decision
        </p>
      </div>

      {places.length === 0 ? (
        <div className="apd-empty">
          <CheckCircle size={48} strokeWidth={1.2} className="apd-empty-icon" />
          <div className="apd-empty-title">All caught up!</div>
          <div className="apd-empty-sub">No pending places to review.</div>
        </div>
      ) : (
        <div className="apd-list">
          {places.map((place) => {
            const photos = parseImages(place.image);
            const coverImg = photos[0] || null;
            const photoCount = photos.length;

            return (
              <div
                key={place.id}
                className="apd-card apd-card--clickable"
                onClick={() => navigate(`/admin/pending/${place.id}`)}
                title="Click to review this place"
              >
                {/* Cover image */}
                <div className="apd-card-img">
                  {coverImg
                    ? <img src={coverImg} alt={place.name} />
                    : <div className="apd-card-img-placeholder"><MapPin size={32} strokeWidth={1.5} /></div>
                  }
                  {photoCount > 1 && (
                    <span className="apd-card-img-count">+{photoCount} photos</span>
                  )}
                  {place.category && (
                    <span className="apd-card-cat">{place.category}</span>
                  )}
                </div>

                <div className="apd-card-body">
                  <div className="apd-card-top">
                    <div>
                      <h3 className="apd-card-name">{place.name}</h3>
                      <div className="apd-card-address">
                        <MapPin size={12} strokeWidth={2} /> {place.address}
                      </div>
                    </div>
                    <span className="apd-badge-pending">
                      <Clock size={10} strokeWidth={2.5} /> Pending
                    </span>
                  </div>

                  {place.description && (
                    <p className="apd-card-desc">{place.description}</p>
                  )}

                  <div className="apd-card-meta">
                    <div className="apd-meta-item">
                      <User size={12} strokeWidth={2} />
                      <span>
                        {place.submitter?.first_name} {place.submitter?.last_name}
                      </span>
                    </div>
                    <div className="apd-meta-item">
                      <Calendar size={12} strokeWidth={2} />
                      <span>{new Date(place.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Click to review hint */}
                  <div className="apd-card-review-hint">
                    <span>Click to review & decide</span>
                    <ChevronRight size={15} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}