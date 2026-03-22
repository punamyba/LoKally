import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Grid3X3,
  ImageIcon,
  MapPin,
  Navigation,
  User,
} from "lucide-react";
import Navbar from "../Components/Layout/Navbar/Navbar";
import PostCard from "../Community/PostCard/PostCard";
import type { Post } from "../Community/CommunityTypes";
import { getAvatarUrl, getImageUrl } from "../../../shared/config/imageUrl";
import "./PublicProfile.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

type Tab = "posts" | "places";

type PublicUser = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  bio?: string | null;
  avatar?: string | null;
  created_at?: string;
  gender?: string | null;
  location?: string | null;
  website?: string | null;
};

type Place = {
  id: number;
  name: string;
  image?: string | null;
  location?: string | null;
  category?: string | null;
};

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("posts");
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const initials =
    `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase() || "U";

  const avatarUrl = useMemo(() => getAvatarUrl(profile?.avatar), [profile?.avatar]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const token = localStorage.getItem("token");
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const [profileRes, postsRes, placesRes] = await Promise.all([
          fetch(`${API}/user/public/${userId}`, { headers }),
          fetch(`${API}/user/public/${userId}/posts`, { headers }),
          fetch(`${API}/user/public/${userId}/places`, { headers }),
        ]);

        if (profileRes.status === 404) {
          setNotFound(true);
          setProfile(null);
          setPosts([]);
          setPlaces([]);
          return;
        }

        const profileJson = await profileRes.json();
        const postsJson = await postsRes.json();
        const placesJson = await placesRes.json();

        if (profileJson.success) {
          setProfile(profileJson.data);
        } else {
          setNotFound(true);
        }

        if (postsJson.success) setPosts(postsJson.data || []);
        else setPosts([]);

        if (placesJson.success) setPlaces(placesJson.data || []);
        else setPlaces([]);
      } catch (err) {
        console.error("PublicProfile load error:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (userId) load();
  }, [userId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pp-page">
          <div className="pp-fullload">
            <div className="pp-spinner" />
          </div>
        </div>
      </>
    );
  }

  if (notFound || !profile) {
    return (
      <>
        <Navbar />
        <div className="pp-page">
          <div className="pp-notfound">
            <div className="pp-nf-icon">👤</div>
            <h2>User not found</h2>
            <button onClick={() => navigate(-1)} type="button">
              Go back
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="pp-page">
        <section className="pp-hero">
          <div className="pp-hero-bg" />
          <div className="pp-hero-pattern" />
          <div className="pp-hero-overlay" />

          <div className="pp-hero-inner">
            <button className="pp-back" onClick={() => navigate(-1)} type="button">
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          </div>

          <div className="pp-hero-profile">
            <div className="pp-ava-ring">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={initials}
                  className="pp-ava-img"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="pp-ava-init">{initials}</div>
              )}

              <div className="pp-ava-badge">
                <BadgeCheck size={14} />
              </div>
            </div>

            <div className="pp-hero-nameblock">
              <div className="pp-username">
                {profile.first_name} {profile.last_name}
              </div>

              <div className="pp-role-chip">
                <User size={12} />
                Explorer
              </div>
            </div>
          </div>
        </section>

        <div className="pp-container">
          <section className="pp-info-card">
            <p className={`pp-bio ${profile.bio ? "" : "pp-bio--muted"}`}>
              {profile.bio || "No bio added yet."}
            </p>

            <div className="pp-meta">
              {profile.gender && (
                <span className="pp-meta-item">
                  <User size={14} />
                  {profile.gender}
                </span>
              )}

              {profile.location && (
                <span className="pp-meta-item">
                  <MapPin size={14} />
                  {profile.location}
                </span>
              )}

              {profile.created_at && (
                <span className="pp-meta-item">
                  <Calendar size={14} />
                  Joined{" "}
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>

            <div className="pp-stats-row">
              <div className="pp-stat-item" onClick={() => setTab("posts")}>
                <div className="pp-stat-num">{posts.length}</div>
                <div className="pp-stat-lbl">Posts</div>
              </div>

              <div className="pp-stat-div" />

              <div className="pp-stat-item" onClick={() => setTab("places")}>
                <div className="pp-stat-num">{places.length}</div>
                <div className="pp-stat-lbl">Places</div>
              </div>
            </div>
          </section>

          <div className="pp-tabs">
            <button
              className={`pp-tab ${tab === "posts" ? "pp-tab--on" : ""}`}
              onClick={() => setTab("posts")}
              type="button"
            >
              <Grid3X3 size={16} />
              <span>Posts</span>
              {tab === "posts" && <span className="pp-tab-bar" />}
            </button>

            <button
              className={`pp-tab ${tab === "places" ? "pp-tab--on" : ""}`}
              onClick={() => setTab("places")}
              type="button"
            >
              <Navigation size={16} />
              <span>Places</span>
              {tab === "places" && <span className="pp-tab-bar" />}
            </button>
          </div>

          <section className="pp-content">
            {tab === "posts" ? (
              <div className="pp-feed">
                {posts.length === 0 ? (
                  <div className="pp-empty">
                    <div className="pp-empty-ico">
                      <Grid3X3 size={28} />
                    </div>
                    <div className="pp-empty-h">No posts yet</div>
                    <div className="pp-empty-s">This user has not shared any posts.</div>
                  </div>
                ) : (
                  posts.map((post) => <PostCard key={post.id} post={post} />)
                )}
              </div>
            ) : (
              <div className="pp-places-grid">
                {places.length === 0 ? (
                  <div className="pp-empty">
                    <div className="pp-empty-ico">
                      <MapPin size={28} />
                    </div>
                    <div className="pp-empty-h">No places yet</div>
                    <div className="pp-empty-s">This user has not added any places.</div>
                  </div>
                ) : (
                  places.map((place) => {
                    const img = getImageUrl(place.image);

                    return (
                      <div key={place.id} className="pp-place-card">
                        <div className="pp-place-thumb">
                          {img ? (
                            <img src={img} alt={place.name} />
                          ) : (
                            <div className="pp-place-nopic">
                              <ImageIcon size={26} />
                            </div>
                          )}

                          {place.category && (
                            <div className="pp-place-cat-badge">{place.category}</div>
                          )}
                        </div>

                        <div className="pp-place-info">
                          <div className="pp-place-name">{place.name}</div>
                          {place.location && (
                            <div className="pp-place-addr">
                              <MapPin size={12} />
                              <span>{place.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}