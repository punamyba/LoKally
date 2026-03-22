import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, MapPin, ImageIcon, BadgeCheck, User,
  Calendar, Grid3X3, Navigation2
} from "lucide-react";
import Navbar from "../Components/Layout/Navbar/Navbar";
import PostCard from "../Community/PostCard/PostCard";
import type { Post } from "../Community/CommunityTypes";
import "./PublicProfile.css";

const API    = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const SERVER = import.meta.env.VITE_API_BASE_URL || API.replace("/api", "");

const getAvatarUrl = (avatar?: string | null): string | null => {
  if (!avatar) return null;
  if (avatar.includes("|||")) return avatar.split("|||")[1];
  if (avatar.startsWith("http")) return avatar;
  if (avatar.startsWith("/")) return `${SERVER}${avatar}`;
  return null;
};

type Tab = "posts" | "places";
type PublicUser = {
  id: number; first_name: string; last_name: string;
  email?: string; bio?: string; gender?: string;
  avatar?: string; role?: string; created_at?: string;
};
type Place = {
  id: number | string; name: string; address: string;
  category: string; image?: string; status?: string; created_at: string;
};

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate   = useNavigate();

  const [user,       setUser]       = useState<PublicUser | null>(null);
  const [posts,      setPosts]      = useState<Post[]>([]);
  const [places,     setPlaces]     = useState<Place[]>([]);
  const [tab,        setTab]        = useState<Tab>("posts");
  const [loading,    setLoading]    = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("currentUser") || "{}"); } catch { return {}; }
  })();

  useEffect(() => {
    if (userId && currentUser.id && Number(userId) === currentUser.id) {
      navigate("/profile", { replace: true });
    }
  }, [userId, currentUser.id]);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token") || "";
    fetch(`${API}/user/public/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setUser(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token") || "";
    setLoadingTab(true);
    const endpoint = tab === "posts"
      ? `${API}/user/public/${userId}/posts`
      : `${API}/user/public/${userId}/places`;
    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          if (tab === "posts") setPosts(d.data || []);
          else setPlaces(d.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTab(false));
  }, [userId, tab]);

  if (loading) return (
    <div className="pp-page"><Navbar />
      <div className="pp-fullload"><div className="pp-spinner" /></div>
    </div>
  );

  if (!user) return (
    <div className="pp-page"><Navbar />
      <div className="pp-notfound">
        <div className="pp-nf-icon">👤</div>
        <h2>User not found</h2>
        <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    </div>
  );

  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Explorer";
  const picUrl   = getAvatarUrl(user.avatar);
  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="pp-page">
      <Navbar />

      {/* Hero with avatar + name floating on it */}
      <div className="pp-hero">
        <div className="pp-hero-bg" />
        <div className="pp-hero-overlay" />
        <div className="pp-hero-pattern" />
        <div className="pp-hero-inner">
          <button className="pp-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} strokeWidth={2.5} /> Back
          </button>
        </div>
        {/* Avatar + Name overlaid on hero bottom */}
        <div className="pp-hero-profile">
          <div className="pp-ava-ring">
            {picUrl
              ? <img src={picUrl} alt={fullName} className="pp-ava-img" />
              : <div className="pp-ava-init">{initials}</div>
            }
            {user.role === "admin" && <div className="pp-ava-badge"><BadgeCheck size={14} /></div>}
          </div>
          <div className="pp-hero-nameblock">
            <h1 className="pp-username">{fullName}</h1>
            {user.role === "admin" && (
              <span className="pp-role-chip"><BadgeCheck size={11} /> Admin</span>
            )}
          </div>
        </div>
      </div>

      <div className="pp-container">
        {/* Info card — bio, meta, stats */}
        <div className="pp-info-card">
          {user.bio
            ? <p className="pp-bio">{user.bio}</p>
            : <p className="pp-bio pp-bio--muted">No bio yet.</p>
          }
          <div className="pp-meta">
            {user.gender && (
              <span className="pp-meta-item"><User size={13} strokeWidth={2} /> {user.gender}</span>
            )}
            {joinDate && (
              <span className="pp-meta-item"><Calendar size={13} strokeWidth={2} /> Joined {joinDate}</span>
            )}
          </div>
          <div className="pp-stats-row">
            <div className="pp-stat-item" onClick={() => setTab("posts")}>
              <span className="pp-stat-num">{posts.length}</span>
              <span className="pp-stat-lbl">Posts</span>
            </div>
            <div className="pp-stat-div" />
            <div className="pp-stat-item" onClick={() => setTab("places")}>
              <span className="pp-stat-num">{places.length}</span>
              <span className="pp-stat-lbl">Places</span>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="pp-tabs">
          <button
            className={`pp-tab ${tab === "posts" ? "pp-tab--on" : ""}`}
            onClick={() => setTab("posts")}
          >
            <Grid3X3 size={15} strokeWidth={2} />
            <span>Posts</span>
            {tab === "posts" && <div className="pp-tab-bar" />}
          </button>
          <button
            className={`pp-tab ${tab === "places" ? "pp-tab--on" : ""}`}
            onClick={() => setTab("places")}
          >
            <Navigation2 size={15} strokeWidth={2} />
            <span>Places</span>
            {tab === "places" && <div className="pp-tab-bar" />}
          </button>
        </div>

        {/* Content */}
        <div className="pp-content">
          {loadingTab && (
            <div className="pp-load-row">
              <div className="pp-spinner" />
            </div>
          )}

          {/* Posts tab */}
          {tab === "posts" && !loadingTab && (
            posts.length === 0
              ? (
                <div className="pp-empty">
                  <div className="pp-empty-ico"><ImageIcon size={32} strokeWidth={1.2} /></div>
                  <p className="pp-empty-h">No posts yet</p>
                  <p className="pp-empty-s">{user.first_name} hasn't shared anything yet</p>
                </div>
              ) : (
                <div className="pp-feed">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post}
                      currentUserId={currentUser.id}
                      isAdmin={currentUser.role === "admin"}
                      onDelete={id => setPosts(p => p.filter(x => x.id !== id))}
                      onHide={(id, hidden) => setPosts(p => p.map(x => x.id === id ? { ...x, is_hidden: hidden } : x))}
                    />
                  ))}
                </div>
              )
          )}

          {/* Places tab */}
          {tab === "places" && !loadingTab && (
            places.length === 0
              ? (
                <div className="pp-empty">
                  <div className="pp-empty-ico"><MapPin size={32} strokeWidth={1.2} /></div>
                  <p className="pp-empty-h">No places yet</p>
                  <p className="pp-empty-s">{user.first_name} hasn't added any places</p>
                </div>
              ) : (
                <div className="pp-places-grid">
                  {places.map(place => {
                    const img = place.image
                      ? (place.image.startsWith("http") ? place.image : `${SERVER}${place.image}`)
                      : null;
                    return (
                      <div key={place.id} className="pp-place-card" onClick={() => navigate(`/place/${place.id}`)}>
                        <div className="pp-place-thumb">
                          {img
                            ? <img src={img} alt={place.name} />
                            : (
                              <div className="pp-place-nopic">
                                <MapPin size={24} strokeWidth={1.5} />
                              </div>
                            )
                          }
                          <div className="pp-place-cat-badge">{place.category}</div>
                        </div>
                        <div className="pp-place-info">
                          <div className="pp-place-name">{place.name}</div>
                          <div className="pp-place-addr">
                            <MapPin size={11} strokeWidth={2} /> {place.address}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}