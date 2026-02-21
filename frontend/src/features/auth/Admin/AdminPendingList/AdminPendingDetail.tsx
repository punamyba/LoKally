// AdminPendingDetail.tsx
// Location: src/features/auth/Admin/AdminPendingList/AdminPendingDetail.tsx
// Route: /admin/pending/:id  — full page for admin to review and decide

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft, MapPin, CheckCircle, XCircle, User,
  Calendar, Tag, Navigation, ChevronLeft, ChevronRight,
} from "lucide-react";
import { adminApi } from "../adminApi";
import type { Place } from "../AdminTypes";
import "./AdminPendingDetail.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function parseImages(place: Place): string[] {
  // First check place.images array (from PlaceImage table)
  if (place.images && place.images.length > 0) {
    return place.images.map((img: any) => `http://localhost:5001${img.image_path}`);
  }
  // Fallback to single image field
  if (!place.image) return [];
  if (place.image.startsWith("[")) {
    try { return (JSON.parse(place.image) as string[]).map(p => `http://localhost:5001${p}`); }
    catch { }
  }
  return [`http://localhost:5001${place.image}`];
}

export default function AdminPendingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);

  const [processing, setProcessing] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    if (!id) return;
    adminApi.getPlaces("pending").then((res) => {
      if (res.success) {
        const found = res.data.find((p: Place) => String(p.id) === id);
        if (found) {
          setPlace(found);
          setPhotos(parseImages(found));
        }
      }
      setLoading(false);
    });
  }, [id]);

  const handleApprove = async () => {
    if (!place) return;
    setProcessing(true);
    const res = await adminApi.approvePlace(place.id);
    if (res.success) setDone("approved");
    else { alert("Failed to approve. Try again."); }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!place || !rejectReason.trim()) return;
    setProcessing(true);
    const res = await adminApi.rejectPlace(place.id, rejectReason);
    if (res.success) setDone("rejected");
    else { alert("Failed to reject. Try again."); }
    setProcessing(false);
  };

  if (loading) return (
    <div className="apd2-wrap">
      <div className="apd2-loading"><div className="apd2-spinner" /> Loading...</div>
    </div>
  );

  if (!place) return (
    <div className="apd2-wrap">
      <div className="apd2-notfound">
        <MapPin size={40} strokeWidth={1.2} />
        <h2>Place not found in pending queue</h2>
        <button className="apd2-back-btn" onClick={() => navigate("/admin/pending")}>
          <ArrowLeft size={15} /> Back to Pending
        </button>
      </div>
    </div>
  );

  if (done) return (
    <div className="apd2-wrap">
      <div className="apd2-done">
        {done === "approved"
          ? <CheckCircle size={60} strokeWidth={1.2} className="apd2-done-icon--approved" />
          : <XCircle     size={60} strokeWidth={1.2} className="apd2-done-icon--rejected" />
        }
        <h2 className="apd2-done-title">
          {done === "approved" ? "Place Approved!" : "Place Rejected"}
        </h2>
        <p className="apd2-done-sub">
          {done === "approved"
            ? `"${place.name}" is now live on the map.`
            : `"${place.name}" has been rejected.`}
        </p>
        <button className="apd2-back-btn" onClick={() => navigate("/admin/pending")}>
          <ArrowLeft size={15} /> Back to Pending
        </button>
      </div>
    </div>
  );

  const lat = typeof place.lat === "string" ? parseFloat(place.lat) : place.lat;
  const lng = typeof place.lng === "string" ? parseFloat(place.lng) : place.lng;

  return (
    <div className="apd2-wrap">

      <button className="apd2-back" onClick={() => navigate("/admin/pending")}>
        <ArrowLeft size={16} strokeWidth={2.5} /> Back to Pending
      </button>

      <div className="apd2-layout">

        {/* ── LEFT: Images + Info ── */}
        <div className="apd2-left">

          {/* Gallery */}
          <div className="apd2-gallery">
            {photos.length > 0 ? (
              <>
                <div className="apd2-gallery-main">
                  <img src={photos[activePhoto]} alt={place.name} />
                  <div className="apd2-gallery-count">{activePhoto + 1} / {photos.length}</div>
                  {photos.length > 1 && (
                    <>
                      <button className="apd2-arrow apd2-arrow--left" type="button"
                        onClick={() => setActivePhoto(v => v === 0 ? photos.length - 1 : v - 1)}>
                        <ChevronLeft size={20} />
                      </button>
                      <button className="apd2-arrow apd2-arrow--right" type="button"
                        onClick={() => setActivePhoto(v => v === photos.length - 1 ? 0 : v + 1)}>
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>
                {photos.length > 1 && (
                  <div className="apd2-thumbs">
                    {photos.map((img, i) => (
                      <button key={i} type="button"
                        className={`apd2-thumb ${i === activePhoto ? "active" : ""}`}
                        onClick={() => setActivePhoto(i)}>
                        <img src={img} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="apd2-no-img">
                <MapPin size={40} strokeWidth={1.2} />
                <span>No photos submitted</span>
              </div>
            )}
          </div>

          {/* Place details */}
          <div className="apd2-card">
            <div className="apd2-name-row">
              <h1 className="apd2-name">{place.name}</h1>
              <span className="apd2-badge-pending">Pending</span>
            </div>

            <div className="apd2-meta-row">
              {place.category && (
                <span className="apd2-cat-tag"><Tag size={11} strokeWidth={2.5} /> {place.category}</span>
              )}
              <span className="apd2-addr"><MapPin size={12} strokeWidth={2} /> {place.address}</span>
            </div>

            {place.description && (
              <div className="apd2-section">
                <div className="apd2-label">Description</div>
                <p className="apd2-desc">{place.description}</p>
              </div>
            )}

            <div className="apd2-info-grid">
              <div className="apd2-info-item">
                <div className="apd2-info-label"><User size={11} /> Submitted By</div>
                <div className="apd2-info-val">
                  {place.submitter?.first_name} {place.submitter?.last_name}
                </div>
                {place.submitter?.email && (
                  <div className="apd2-info-email">{place.submitter.email}</div>
                )}
              </div>
              <div className="apd2-info-item">
                <div className="apd2-info-label"><Calendar size={11} /> Submitted On</div>
                <div className="apd2-info-val">
                  {new Date(place.created_at).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric"
                  })}
                </div>
              </div>
              <div className="apd2-info-item">
                <div className="apd2-info-label"><Navigation size={11} /> Coordinates</div>
                <div className="apd2-info-val">{lat.toFixed(5)}, {lng.toFixed(5)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Map + Decision ── */}
        <div className="apd2-right">

          {/* Map */}
          <div className="apd2-card apd2-map-card">
            <div className="apd2-section-label"><MapPin size={13} /> Location on Map</div>
            <div className="apd2-map">
              <MapContainer center={[lat, lng]} zoom={13}
                style={{ height: "240px", width: "100%", borderRadius: "12px" }}
                zoomControl={false} dragging={false} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[lat, lng]} />
              </MapContainer>
            </div>
            <a href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank" rel="noreferrer" className="apd2-gmaps-btn">
              <Navigation size={13} /> Open in Google Maps
            </a>
          </div>

          {/* Decision card */}
          <div className="apd2-card apd2-decision-card">
            <div className="apd2-section-label">Admin Decision</div>
            <p className="apd2-decision-hint">
              Review the photos and details carefully before approving or rejecting.
            </p>

            {!rejectMode ? (
              <div className="apd2-actions">
                <button className="apd2-btn apd2-btn--approve"
                  onClick={handleApprove} disabled={processing}>
                  <CheckCircle size={16} strokeWidth={2.5} />
                  {processing ? "Processing..." : "Approve Place"}
                </button>
                <button className="apd2-btn apd2-btn--reject"
                  onClick={() => setRejectMode(true)} disabled={processing}>
                  <XCircle size={16} strokeWidth={2.5} />
                  Reject
                </button>
              </div>
            ) : (
              <div className="apd2-reject-form">
                <label className="apd2-reject-label">
                  Reason for rejection <span>*</span>
                </label>
                <textarea className="apd2-reject-textarea" rows={4} autoFocus
                  value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Blurry images, duplicate, incorrect location..." />
                <div className="apd2-reject-actions">
                  <button className="apd2-btn apd2-btn--cancel"
                    onClick={() => { setRejectMode(false); setRejectReason(""); }}>
                    Cancel
                  </button>
                  <button className="apd2-btn apd2-btn--confirm-reject"
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || processing}>
                    <XCircle size={14} strokeWidth={2.5} />
                    {processing ? "Rejecting..." : "Confirm Reject"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}