import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Search, X, MapPin, Navigation,
  ChevronRight, Loader2, AlertCircle, LocateFixed,
} from "lucide-react";
import axiosInstance from "../../../shared/config/axiosinstance";
import { getImageUrl } from "../../../shared/config/imageUrl";
import "./AISearch.css";

interface Place {
  id: number | null;
  name: string;
  address: string;
  image: string | null;
  category: string;
  lat: number | null;
  lng: number | null;
  similarity_score?: number;
  distance_km?: number;
  tags?: string[];
  source?: string;
}

function parseImages(image: string | null | undefined): string[] {
  if (!image) return [];
  if (image.startsWith("[")) {
    try { return JSON.parse(image) as string[]; }
    catch { return [image]; }
  }
  return [image];
}

function PlaceCard({ place, showDistance }: { place: Place; showDistance?: boolean }) {
  const navigate = useNavigate();
  const images   = parseImages(place.image);
  const coverImg = images[0] ? getImageUrl(images[0]) : null;

  return (
    <div className="ais-card" onClick={() => place.id && navigate(`/place/${place.id}`)}>
      <div className="ais-card-img">
        {coverImg
          ? <img src={coverImg} alt={place.name} />
          : <div className="ais-card-no-img"><MapPin size={28} strokeWidth={1.5} /></div>}
        <div className="ais-card-badges">
          {place.category && <span className="ais-badge-cat">{place.category}</span>}
          {place.similarity_score && (
            <span className="ais-badge-ai"><Sparkles size={10} /> AI Match</span>
          )}
          {showDistance && place.distance_km && (
            <span className="ais-badge-dist"><Navigation size={10} /> {place.distance_km} km</span>
          )}
        </div>
      </div>
      <div className="ais-card-body">
        <div className="ais-card-name">{place.name}</div>
        <div className="ais-card-addr"><MapPin size={12} strokeWidth={2} />{place.address}</div>
        {place.tags && place.tags.length > 0 && (
          <div className="ais-card-tags">
            {place.tags.slice(0, 3).map(t => (
              <span key={t} className="ais-card-tag">{t}</span>
            ))}
          </div>
        )}
        <button className="ais-card-btn">View Details <ChevronRight size={13} /></button>
      </div>
    </div>
  );
}

function Section({
  icon, title, subtitle, count, loading, empty, children,
}: {
  icon: React.ReactNode; title: string; subtitle?: string; count?: number;
  loading?: boolean; empty?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="ais-section">
      <div className="ais-section-header">
        <div className="ais-section-icon">{icon}</div>
        <div className="ais-section-header-text">
          <div className="ais-section-title-row">
            <span className="ais-section-title">{title}</span>
            {count !== undefined && count > 0 && (
              <span className="ais-section-count">{count} results</span>
            )}
          </div>
          {subtitle && <div className="ais-section-sub">{subtitle}</div>}
        </div>
      </div>
      {loading ? (
        <div className="ais-section-state">
          <Loader2 size={20} className="ais-spin" />
          <span>Finding places with AI...</span>
        </div>
      ) : empty ? (
        <div className="ais-section-state ais-section-empty">
          <AlertCircle size={16} />
          <span>No places found in this area</span>
        </div>
      ) : (
        <div className="ais-cards-grid">{children}</div>
      )}
    </div>
  );
}

const QUICK_TAGS    = ["Peaceful", "Scenic", "Hiking", "Adventure", "Cultural", "Photography", "Sunrise", "Wildlife"];
const QUICK_PLACES  = ["Pokhara", "Kathmandu", "Lumbini", "Gorkha", "Ilam", "Jumla"];

export default function AISearch() {
  const [query,         setQuery]         = useState("");
  const [hasSearched,   setHasSearched]   = useState(false);
  const [aiResults,     setAiResults]     = useState<Place[]>([]);
  const [aiLoading,     setAiLoading]     = useState(false);
  const [nearbyResults, setNearbyResults] = useState<Place[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyName,    setNearbyName]    = useState("");
  const [nearMeResults, setNearMeResults] = useState<Place[]>([]);
  const [nearMeLoading, setNearMeLoading] = useState(false);
  const [userLocation,  setUserLocation]  = useState<{ lat: number; lng: number } | null>(null);
  const [locError,      setLocError]      = useState("");
  const [locRequested,  setLocRequested]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchNearMe = async (lat: number, lng: number) => {
    setNearMeLoading(true);
    try {
      const res = await axiosInstance.get("/recommendations/near-me", {
        params: { lat, lng, radius_km: 30, limit: 8 },
      });
      if (res.data?.success) setNearMeResults(res.data.data || []);
    } catch {}
    setNearMeLoading(false);
  };

  const requestLocation = () => {
    setLocRequested(true);
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        fetchNearMe(loc.lat, loc.lng);
      },
      () => {
        setLocError("Location access denied. Please allow location in browser settings.");
        setLocRequested(false);
      }
    );
  };

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) return;
    setQuery(q);
    setHasSearched(true);
    setAiResults([]);
    setNearbyResults([]);
    setNearbyName("");

    // Section 1 — AI Recommend
    setAiLoading(true);
    try {
      const res = await axiosInstance.get("/recommendations", {
        params: { place_name: q, limit: 8 },
      });
      if (res.data?.success) setAiResults(res.data.data || []);
    } catch {}
    setAiLoading(false);

    // Section 2 — Nearby (15km same locality)
    setNearbyLoading(true);
    try {
      const res = await axiosInstance.get("/recommendations/nearby", {
        params: { place_name: q, radius_km: 15, limit: 8 },
      });
      if (res.data?.success) {
        setNearbyResults(res.data.data || []);
        setNearbyName(res.data.searched_place?.name || q);
      }
    } catch {}
    setNearbyLoading(false);
  };

  const handleClear = () => {
    setQuery("");
    setHasSearched(false);
    setAiResults([]);
    setNearbyResults([]);
    setNearbyName("");
    inputRef.current?.focus();
  };

  return (
    <div className="ais-root">

      {/* ── HERO ── */}
      <div className="ais-hero">
        <div className="ais-hero-badge"><Sparkles size={13} /> AI-POWERED SEARCH</div>
        <h1 className="ais-hero-title">Discover Places with AI</h1>
        <p className="ais-hero-sub">
          Search by place name, category, or tags like "peaceful", "scenic", "hiking" — our KNN model finds the best matches
        </p>

        {/* Search bar */}
        <div className="ais-search-row">
          <div className="ais-search-bar">
            <Search size={18} className="ais-search-icon" />
            <input
              ref={inputRef}
              className="ais-search-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder='Try "Pokhara", "peaceful", "scenic", "hiking"...'
            />
            {query && (
              <button className="ais-clear-btn" onClick={handleClear}><X size={15} /></button>
            )}
          </div>
          <button className="ais-search-btn" onClick={() => handleSearch()}>
            <Sparkles size={15} /> Find Similar
          </button>
        </div>

        {/* Quick tags */}
        <div className="ais-quick-section">
          <div className="ais-quick-label">🏷️ Search by tag</div>
          <div className="ais-quick-pills">
            {QUICK_TAGS.map(t => (
              <button key={t} className="ais-quick-pill ais-quick-pill--tag"
                onClick={() => handleSearch(t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* Quick places */}
        <div className="ais-quick-section">
          <div className="ais-quick-label">📍 Popular places</div>
          <div className="ais-quick-pills">
            {QUICK_PLACES.map(p => (
              <button key={p} className="ais-quick-pill ais-quick-pill--place"
                onClick={() => handleSearch(p)}>{p}</button>
            ))}
          </div>
        </div>

        {/* Near Me button — hero maa */}
        <div className="ais-nearme-hero">
          {!userLocation ? (
            <button className="ais-nearme-btn" onClick={requestLocation}>
              <LocateFixed size={15} />
              {locRequested ? "Getting location..." : "Show Places Near Me"}
            </button>
          ) : (
            <div className="ais-nearme-active">
              <LocateFixed size={14} /> Location found — scroll down to see nearby places
            </div>
          )}
          {locError && <p className="ais-loc-error">{locError}</p>}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="ais-body">

        {/* Section 1 — AI Recommended */}
        {hasSearched && (
          <Section
            icon={<Sparkles size={17} />}
            title={`AI Recommended — "${query}"`}
            subtitle="Places matched by AI using category, tags and description"
            count={aiResults.length}
            loading={aiLoading}
            empty={!aiLoading && aiResults.length === 0}
          >
            {aiResults.map((p, i) => <PlaceCard key={p.id || i} place={p} />)}
          </Section>
        )}

        {/* Section 2 — Nearby searched place (15km) */}
        {hasSearched && (
          <Section
            icon={<MapPin size={17} />}
            title={`Nearby ${nearbyName || query}`}
            subtitle="Places within 15km — same locality"
            count={nearbyResults.length}
            loading={nearbyLoading}
            empty={!nearbyLoading && nearbyResults.length === 0}
          >
            {nearbyResults.map((p, i) => <PlaceCard key={p.id || i} place={p} showDistance />)}
          </Section>
        )}

        {/* Section 3 — Near Me (user location) */}
        {(userLocation || nearMeLoading) && (
          <Section
            icon={<LocateFixed size={17} />}
            title="Near You"
            subtitle="Places within 30km of your current location"
            count={nearMeResults.length}
            loading={nearMeLoading}
            empty={!nearMeLoading && nearMeResults.length === 0}
          >
            {nearMeResults.map((p, i) => <PlaceCard key={p.id || i} place={p} showDistance />)}
          </Section>
        )}

        {/* Near Me prompt — show only if not yet requested */}
        {!userLocation && !locRequested && !hasSearched && (
          <div className="ais-nearme-prompt">
            <LocateFixed size={36} strokeWidth={1.5} />
            <h3>Discover Places Near You</h3>
            <p>Allow location access to find hidden gems in your area</p>
            <button className="ais-location-btn" onClick={requestLocation}>
              <Navigation size={15} /> Use My Location
            </button>
          </div>
        )}

      </div>
    </div>
  );
}