

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Upload, Compass,
  Mountain, Droplets, Church, Waves, Home as HomeIcon,
  Heart, MessageCircle, BadgeCheck, TrendingUp,
} from 'lucide-react';
import Navbar from "../Components/Layout/Navbar/Navbar";
import Footer from "../Components/Layout/Footer/Footer";
import axiosInstance from "../../../shared/config/axiosinstance";
import "./home.css";
import "../Components/Layout/Navbar/Navbar.css";
import "../Components/Layout/Footer/Footer.css";

const SERVER = "http://localhost:5001";
const toUrl = (p: string) => p?.startsWith("http") ? p : `${SERVER}${p}`;

function parseCover(image: any): string | null {
  if (!image) return null;
  if (typeof image === "string") {
    if (image.startsWith("[")) {
      try { const a = JSON.parse(image); return a[0] ? toUrl(a[0]) : null; } catch {}
    }
    return toUrl(image);
  }
  return null;
}

type Place = { id: number; name: string; image: string | null; category: string; address: string; created_at: string; };

const CATEGORY_DEFS = [
  { name: "Mountains",  key: "Nature",    Icon: Mountain  },
  { name: "Waterfalls", key: "Viewpoint", Icon: Droplets  },
  { name: "Temples",    key: "Temple",    Icon: Church    },
  { name: "Lakes",      key: "Lake",      Icon: Waves     },
  { name: "Villages",   key: "Cultural",  Icon: HomeIcon  },
];
// Category key( ExploreMap filter param mapping )
const CAT_ROUTE: Record<string, string> = {
  Nature: "Nature", Viewpoint: "Viewpoint", Temple: "Temple", Lake: "Lake", Cultural: "Cultural",
};

export default function Home() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Place[]>([]);
  const [catCounts, setCatCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch featured (latest 6 approved)
    axiosInstance.get("/places/featured")
      .then(res => {
        if (res.data?.success) setFeatured(res.data.data || []);
      }).catch(() => {});

    // Fetch all approved to count categories
    axiosInstance.get("/places")
      .then(res => {
        if (res.data?.success) {
          const counts: Record<string, number> = {};
          (res.data.data || []).forEach((p: Place) => {
            if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
          });
          setCatCounts(counts);
        }
      }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-container">
      <Navbar />
      <main className="main">

        {/* Hero */}
        <div className="hero">
          <h1 className="hero-title">Discover Nepal's Hidden Gems</h1>
          <p className="hero-subtitle">Explore, Share & Verify lesser-known destinations across Nepal</p>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <div className="action-card" onClick={() => navigate("/explore-map")}>
            <div className="action-icon action-icon--blue"><MapPin size={28} strokeWidth={1.8} /></div>
            <h3 className="action-title">Explore Map</h3>
            <p className="action-desc">View all hidden places</p>
          </div>
          <div className="action-card" onClick={() => navigate("/explore-map")}>
            <div className="action-icon action-icon--green"><Upload size={28} strokeWidth={1.8} /></div>
            <h3 className="action-title">Add Place</h3>
            <p className="action-desc">Share your discovery</p>
          </div>
          <div className="action-card" onClick={() => navigate("/explore-map")}>
            <div className="action-icon action-icon--orange"><Compass size={28} strokeWidth={1.8} /></div>
            <h3 className="action-title">Explore</h3>
            <p className="action-desc">Find places near you</p>
          </div>
        </div>

        {/* Categories — real count from backend */}
        <h2 className="section-title">Explore by Category</h2>
        <div className="categories">
          {CATEGORY_DEFS.map(({ name, key, Icon }) => (
            <div key={name} className="category-card" onClick={() => navigate(`/explore-map?category=${encodeURIComponent(key)}`)}>
              <div className="category-icon"><Icon size={24} strokeWidth={1.8} /></div>
              <div className="category-name">{name}</div>
              <div className="category-count">
                {loading ? "—" : (catCounts[key] || 0)} places
              </div>
            </div>
          ))}
        </div>

        {/* Featured Destinations — real data from backend */}
        <div className="section-header">
          <h2 className="section-title">Featured Destinations</h2>
          <div className="section-meta">
            <TrendingUp size={14} strokeWidth={2} />
            Latest approved places
          </div>
        </div>

        {loading ? (
          <div className="home-loading">
            <div className="home-dot" /><div className="home-dot" /><div className="home-dot" />
          </div>
        ) : featured.length === 0 ? (
          <div className="home-empty">
            <MapPin size={36} strokeWidth={1.2} />
            <p>No featured places yet. Be the first to add one!</p>
            <button className="home-empty-btn" onClick={() => navigate("/explore-map")}>
              Add a Place
            </button>
          </div>
        ) : (
          <div className="places-grid">
            {featured.map((place) => {
              const cover = parseCover(place.image);
              return (
                <div key={place.id} className="place-card"
                  onClick={() => navigate(`/place/${place.id}`)}>
                  {cover
                    ? <img src={cover} alt={place.name} className="place-image" />
                    : <div className="place-no-img"><MapPin size={32} strokeWidth={1.2} /></div>
                  }
                  <div className="verified-badge">
                    <BadgeCheck size={12} strokeWidth={2.5} /> Verified
                  </div>
                  <div className="place-overlay">
                    <div className="place-name">{place.name}</div>
                    <div className="place-info">{place.address}</div>
                    <div className="place-actions">
                      <span><Heart size={13} strokeWidth={2} /> 0</span>
                      <span><MessageCircle size={13} strokeWidth={2} /> 0</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}