import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Layout/Navbar/Navbar";
import Footer from "../Components/Layout/Footer/Footer";
import {
  Sparkles, Search, X, MapPin, Navigation,
  ChevronRight, Loader2, LocateFixed, Zap,
} from "lucide-react";
import axiosInstance from "../../../shared/config/axiosinstance";
import { getImageUrl } from "../../../shared/config/imageUrl";
import "./AISearch.css";

interface Place {
  id: number | null;
  name: string;
  address: string;
  description?: string;
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
    <div className="ai-place-card" onClick={() => place.id && navigate(`/place/${place.id}`)}>
      <div className="ai-card-image">
        {coverImg
          ? <img src={coverImg} alt={place.name} />
          : <div className="ai-card-no-image"><MapPin size={26} strokeWidth={1.2} /></div>}
        <div className="ai-card-overlay" />
        <div className="ai-card-badges">
          {place.category && <span className="ai-badge-category">{place.category}</span>}
          {place.similarity_score && <span className="ai-badge-ai"><Zap size={9} /> AI</span>}
          {showDistance && place.distance_km && (
            <span className="ai-badge-distance"><Navigation size={9} /> {place.distance_km} km</span>
          )}
        </div>
      </div>
      <div className="ai-card-body">
        <div className="ai-card-name">{place.name}</div>
        <div className="ai-card-address"><MapPin size={11} strokeWidth={2} />{place.address}</div>
        {place.tags && place.tags.length > 0 && (
          <div className="ai-card-tags">
            {place.tags.slice(0, 3).map(t => (
              <span key={t} className="ai-card-tag">{t}</span>
            ))}
          </div>
        )}
        <button className="ai-card-button">View Details <ChevronRight size={12} /></button>
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
    <div className="ai-section">
      <div className="ai-section-header">
        <div className="ai-section-icon">{icon}</div>
        <div className="ai-section-header-text">
          <div className="ai-section-title-row">
            <span className="ai-section-title">{title}</span>
            {count !== undefined && count > 0 && (
              <span className="ai-section-count">{count} results</span>
            )}
          </div>
          {subtitle && <div className="ai-section-subtitle">{subtitle}</div>}
        </div>
      </div>
      {loading ? (
        <div className="ai-section-state">
          <Loader2 size={18} className="ai-spin" />
          <span>Finding with AI...</span>
        </div>
      ) : empty ? (
        <div className="ai-section-state ai-section-empty">
          <span>No places found</span>
        </div>
      ) : (
        <div className="ai-cards-grid">{children}</div>
      )}
    </div>
  );
}

const QUICK_TAGS   = ["Peaceful", "Scenic", "Hiking", "Adventure", "Photography", "Sunrise", "Wildlife", "Cultural"];
const QUICK_PLACES = ["Pokhara", "Kathmandu", "Lumbini", "Gorkha", "Ilam", "Jumla"];

export default function AISearch() {
  const [query,         setQuery]         = useState("");
  const [hasSearched,   setHasSearched]   = useState(false);
  const [aiResults,     setAiResults]     = useState<Place[]>([]);
  const [aiLoading,     setAiLoading]     = useState(false);
  const [nearbyResults, setNearbyResults] = useState<Place[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyName,    setNearbyName]    = useState("");
  const [isTagSearch,   setIsTagSearch]   = useState(false);
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
    if (!navigator.geolocation) { setLocError("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        fetchNearMe(loc.lat, loc.lng);
      },
      () => { setLocError("Location access denied."); setLocRequested(false); }
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

    // Tag/category search detect gara — Nearby nadekhaunu
    const KNOWN_TAGS = ["Peaceful","Scenic","Hiking","Adventure","Photography",
      "Sunrise","Wildlife","Cultural","Trekking","Boating","Bird Watching",
      "Waterfall","Sunset","Camping","Family Friendly","Budget Friendly",
      "Historical","Off the beaten path"];
    const KNOWN_CATEGORIES = ["Nature","Heritage","Temple","Lake","Viewpoint",
      "Hidden Gem","Adventure","Cultural","Food","City","Other"];
    const isTag = KNOWN_TAGS.some(t => t.toLowerCase() === q.toLowerCase());
    const isCat = KNOWN_CATEGORIES.some(c => c.toLowerCase() === q.toLowerCase());
    setIsTagSearch(isTag || isCat);

    setAiLoading(true);
    try {
      const res = await axiosInstance.get("/recommendations", {
        params: { place_name: q, limit: 8 },
      });
      if (res.data?.success) setAiResults(res.data.data || []);
    } catch {}
    setAiLoading(false);

    // Nearby — place search matra, tag/category search maa nadekhaunu
    if (!isTag && !isCat) {
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
    }
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
    <>
    <Navbar />
    <div className="ai-page">
      {/* Animated background blobs */}
      <div className="ai-background">
        <div className="ai-glow-blob ai-glow-blob-green" />
        <div className="ai-glow-blob ai-glow-blob-blue" />
        <div className="ai-glow-blob ai-glow-blob-purple" />
      </div>

      {/* Hero */}
      <div className="ai-hero">
        <div className="ai-hero-badge">
          <Sparkles size={12} />
          <span>KNN-POWERED AI SEARCH</span>
        </div>

        <h1 className="ai-hero-title">
          Discover Nepal's<br />
          <span className="ai-title-gradient">Hidden Gems</span>
        </h1>

        <p className="ai-hero-subtitle">
          Search by place, category, or mood tags like "peaceful", "scenic", "hiking"
        </p>

        {/* Search bar */}
        <div className="ai-search-box">
          <div className="ai-search-inner">
            <Search size={17} className="ai-search-icon" />
            <input
              ref={inputRef}
              className="ai-search-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder='Try "Pokhara", "peaceful", "hiking"...'
            />
            {query && (
              <button className="ai-clear-button" onClick={handleClear}><X size={14} /></button>
            )}
          </div>
          <button className="ai-search-button" onClick={() => handleSearch()}>
            <Sparkles size={14} /> Find
          </button>
        </div>

        {/* Quick tags */}
        <div className="ai-quick-row">
          <span className="ai-quick-label">Tags:</span>
          {QUICK_TAGS.map(t => (
            <button key={t} className="ai-pill ai-tag-pill" onClick={() => handleSearch(t)}>{t}</button>
          ))}
        </div>

        <div className="ai-quick-row">
          <span className="ai-quick-label">Places:</span>
          {QUICK_PLACES.map(p => (
            <button key={p} className="ai-pill ai-place-pill" onClick={() => handleSearch(p)}>{p}</button>
          ))}
        </div>

        {/* Near me button */}
        {!userLocation && (
          <button className="ai-nearme-button" onClick={requestLocation}>
            <LocateFixed size={14} />
            {locRequested ? "Getting location..." : "Show Places Near Me"}
          </button>
        )}
        {userLocation && (
          <div className="ai-nearme-active">
            <LocateFixed size={13} /> Location found — see below
          </div>
        )}
        {locError && <p className="ai-location-error">{locError}</p>}
      </div>

      {/* Results */}
      <div className="ai-results-body">

        {hasSearched && (
          <Section
            icon={<Sparkles size={16} />}
            title={`AI Recommended — "${query}"`}
            subtitle="Matched by AI using category, tags and description"
            count={aiResults.length}
            loading={aiLoading}
            empty={!aiLoading && aiResults.length === 0}
          >
            {aiResults.map((p, i) => <PlaceCard key={p.id || i} place={p} />)}
          </Section>
        )}

        {hasSearched && !isTagSearch && (nearbyLoading || nearbyResults.length > 0) && (
          <Section
            icon={<MapPin size={16} />}
            title={`Nearby ${nearbyName || query}`}
            subtitle="Places within 15km — same locality"
            count={nearbyResults.length}
            loading={nearbyLoading}
            empty={!nearbyLoading && nearbyResults.length === 0}
          >
            {nearbyResults.map((p, i) => <PlaceCard key={p.id || i} place={p} showDistance />)}
          </Section>
        )}

        {(userLocation || nearMeLoading) && (
          <Section
            icon={<LocateFixed size={16} />}
            title="Near You"
            subtitle="Places within 30km of your location"
            count={nearMeResults.length}
            loading={nearMeLoading}
            empty={!nearMeLoading && nearMeResults.length === 0}
          >
            {nearMeResults.map((p, i) => <PlaceCard key={p.id || i} place={p} showDistance />)}
          </Section>
        )}

        {!hasSearched && !userLocation && (
          <div className="ai-empty-state">
            <div className="ai-empty-icon"><Sparkles size={32} /></div>
            <h3>Start Discovering</h3>
            <p>Search for a place or click a tag above to find similar places across Nepal</p>
          </div>
        )}

      </div>
    </div>
    <Footer />
    </>
  );
}