import { useEffect, useState } from "react";
import { Settings, Pencil, Grid3X3, MapPin, Plus, Image as ImageIcon } from "lucide-react";
import Navbar from "../Components/Layout/Navbar/Navbar";
import PostCard from "../Community/PostCard/PostCard";
import type { Post } from "../Community/CommunityTypes";
import { getAvatarUrl, getImageUrl } from "../../../shared/config/imageUrl";
import "./UserProfile.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

type Tab = "posts" | "places";

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  gender?: string;
};

type Place = {
  id: number;
  name: string;
  image?: string | null;
  location?: string;
};

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [tab, setTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const token = localStorage.getItem("token");

  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "U";

  const avatarUrl = !avatarFailed ? getAvatarUrl(user?.avatar) : "";

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
        };

        const [profileRes, postsRes, placesRes] = await Promise.all([
          fetch(`${API}/user/profile`, { headers }),
          fetch(`${API}/user/my-posts`, { headers }),
          fetch(`${API}/user/my-places`, { headers }),
        ]);

        const profileJson = await profileRes.json();
        const postsJson = await postsRes.json();
        const placesJson = await placesRes.json();

        if (profileJson.success) setUser(profileJson.data);
        if (postsJson.success) setPosts(postsJson.data || []);
        if (placesJson.success) setPlaces(placesJson.data || []);
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="up-page">
          <div className="up-fullload">
            <div className="up-dot" />
            <div className="up-dot" />
            <div className="up-dot" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="up-page">
        <div className="up-cover">
          <div className="up-cover-grad" />
          <div className="up-cover-dots" />
        </div>

        <div className="up-container">
          <div className="up-card">
            <div className="up-card-top">
              <div className="up-ava-wrap">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    className="up-ava-img"
                    alt={initials}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <div className="up-initials">{initials}</div>
                )}
                <div className="up-ava-online" />
              </div>

              <div className="up-card-actions">
                <button className="up-settings-btn" type="button">
                  <Settings size={16} />
                </button>

                <button className="up-edit-btn" type="button">
                  <Pencil size={14} />
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="up-name">
              {user?.first_name} {user?.last_name}
            </div>

            <div className={`up-bio ${!user?.bio ? "up-bio--empty" : ""}`}>
              {user?.bio || "No bio yet"}
            </div>

            <div className="up-chips">
              <div className="up-chip">{user?.email}</div>
              {user?.gender && <div className="up-chip">{user.gender}</div>}
            </div>

            <div className="up-stats">
              <div className="up-stat" onClick={() => setTab("posts")}>
                <div className="up-stat-n">{posts.length}</div>
                <div className="up-stat-l">Posts</div>
              </div>

              <div className="up-stat-sep" />

              <div className="up-stat" onClick={() => setTab("places")}>
                <div className="up-stat-n">{places.length}</div>
                <div className="up-stat-l">Places</div>
              </div>
            </div>
          </div>

          <div className="up-tabs">
            <button
              className={`up-tab ${tab === "posts" ? "up-tab--on" : ""}`}
              onClick={() => setTab("posts")}
              type="button"
            >
              <Grid3X3 size={16} />
              <span>Posts</span>
            </button>

            <button
              className={`up-tab ${tab === "places" ? "up-tab--on" : ""}`}
              onClick={() => setTab("places")}
              type="button"
            >
              <MapPin size={16} />
              <span>Places</span>
            </button>
          </div>

          <div className="up-content">
            {tab === "posts" ? (
              <>
                <div className="up-create-bar">
                  <div className="up-create-ava">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={initials}
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  <div className="up-create-input">
                    What's on your mind, {user?.first_name}?
                  </div>

                  <button className="up-create-btn" type="button">
                    <Plus size={14} />
                    Post
                  </button>
                </div>

                <div className="up-feed">
                  {posts.length === 0 ? (
                    <div className="up-empty">
                      <div className="up-empty-icon">
                        <Grid3X3 size={28} />
                      </div>
                      <div className="up-empty-title">No posts yet</div>
                    </div>
                  ) : (
                    posts.map((p) => <PostCard key={p.id} post={p} />)
                  )}
                </div>
              </>
            ) : (
              <div className="up-place-list">
                {places.length === 0 ? (
                  <div className="up-empty">
                    <div className="up-empty-icon">
                      <MapPin size={28} />
                    </div>
                    <div className="up-empty-title">No places yet</div>
                  </div>
                ) : (
                  places.map((place) => (
                    <div key={place.id} className="up-place-card">
                      <div className="up-place-img">
                        {place.image ? (
                          <img src={getImageUrl(place.image)} alt={place.name} />
                        ) : (
                          <div className="up-place-blank">
                            <ImageIcon size={24} />
                          </div>
                        )}
                      </div>

                      <div className="up-place-body">
                        <div className="up-place-name">{place.name}</div>
                        {place.location && (
                          <div className="up-place-addr">
                            <MapPin size={12} />
                            {place.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}