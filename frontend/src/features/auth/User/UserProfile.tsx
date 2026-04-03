import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Pencil, Grid3X3, MapPin, Image as ImageIcon, X, Camera, Bookmark } from "lucide-react";
import Navbar from "../Components/Layout/Navbar/Navbar";
import PostCard from "../Community/PostCard/PostCard";
import type { Post } from "../Community/CommunityTypes";
import { getAvatarUrl, getImageUrl } from "../../../shared/config/imageUrl";
import "./UserProfile.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

type Tab = "posts" | "places" | "saved";

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
  const navigate = useNavigate();

  const [user, setUser]           = useState<User | null>(null);
  const [posts, setPosts]         = useState<Post[]>([]);
  const [places, setPlaces]       = useState<Place[]>([]);
  const [saved, setSaved]         = useState<Post[]>([]);
  const [tab, setTab]             = useState<Tab>("posts");
  const [loading, setLoading]     = useState(true);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const [showEdit, setShowEdit]     = useState(false);
  const [editFirst, setEditFirst]   = useState("");
  const [editLast, setEditLast]     = useState("");
  const [editBio, setEditBio]       = useState("");
  const [editGender, setEditGender] = useState("");
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("token");
  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "U";
  const avatarUrl = !avatarFailed ? getAvatarUrl(user?.avatar) : null;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const headers: HeadersInit = { Authorization: `Bearer ${token}` };
        const [profileRes, postsRes, placesRes, savedRes] = await Promise.all([
          fetch(`${API}/user/profile`, { headers }),
          fetch(`${API}/user/my-posts`, { headers }),
          fetch(`${API}/user/my-places`, { headers }),
          fetch(`${API}/posts/saved?limit=20`, { headers }),
        ]);
        const profileJson = await profileRes.json();
        const postsJson   = await postsRes.json();
        const placesJson  = await placesRes.json();
        const savedJson   = await savedRes.json();
        if (profileJson.success) setUser(profileJson.data);
        if (postsJson.success)   setPosts(postsJson.data || []);
        if (placesJson.success)  setPlaces(placesJson.data || []);
        if (savedJson.success)   setSaved(savedJson.data || []);
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const openEdit = () => {
    setEditFirst(user?.first_name || "");
    setEditLast(user?.last_name || "");
    setEditBio(user?.bio || "");
    setEditGender(user?.gender || "");
    setEditPreview(avatarUrl || null);
    setEditAvatar(null);
    setEditErr("");
    setShowEdit(true);
  };

  const handleAvatarFile = (f: File | null) => {
    if (!f) return;
    setEditAvatar(f);
    setEditPreview(URL.createObjectURL(f));
  };

  const saveEdit = async () => {
    if (!editFirst.trim()) { setEditErr("First name is required."); return; }
    setEditSaving(true); setEditErr("");
    try {
      const fd = new FormData();
      fd.append("first_name", editFirst.trim());
      fd.append("last_name",  editLast.trim());
      fd.append("bio",        editBio.trim());
      fd.append("gender",     editGender);
      if (editAvatar) fd.append("avatar", editAvatar);
      const res  = await fetch(`${API}/user/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setAvatarFailed(false);
        localStorage.setItem("currentUser", JSON.stringify(data.data));
        setShowEdit(false);
      } else {
        setEditErr(data.message || "Failed to save.");
      }
    } catch {
      setEditErr("Something went wrong.");
    }
    setEditSaving(false);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="up-page">
          <div className="up-fullload">
            <div className="up-dot" /><div className="up-dot" /><div className="up-dot" />
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

          {/* Profile card */}
          <div className="up-card">
            <div className="up-card-top">
              <div className="up-ava-wrap">
                {avatarUrl
                  ? <img src={avatarUrl} className="up-ava-img" alt={initials} referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} />
                  : <div className="up-initials">{initials}</div>}
                <div className="up-ava-online" />
              </div>
              <div className="up-card-actions">
                <button className="up-settings-btn" type="button" onClick={() => navigate("/settings")}>
                  <Settings size={16} />
                </button>
                <button className="up-edit-btn" type="button" onClick={openEdit}>
                  <Pencil size={14} /> Edit Profile
                </button>
              </div>
            </div>

            <div className="up-name">{user?.first_name} {user?.last_name}</div>
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
              <div className="up-stat-sep" />
              <div className="up-stat" onClick={() => setTab("saved")}>
                <div className="up-stat-n">{saved.length}</div>
                <div className="up-stat-l">Saved</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="up-tabs">
            <button className={`up-tab ${tab === "posts" ? "up-tab--on" : ""}`} onClick={() => setTab("posts")} type="button">
              <Grid3X3 size={16} /><span>Posts</span>
            </button>
            <button className={`up-tab ${tab === "places" ? "up-tab--on" : ""}`} onClick={() => setTab("places")} type="button">
              <MapPin size={16} /><span>Places</span>
            </button>
            <button className={`up-tab ${tab === "saved" ? "up-tab--on" : ""}`} onClick={() => setTab("saved")} type="button">
              <Bookmark size={16} /><span>Saved</span>
            </button>
          </div>

          {/* Content */}
          <div className="up-content">

            {/* Posts tab */}
            {tab === "posts" && (
              <>
                <div className="up-create-bar" onClick={openEdit}>
                  <div className="up-create-ava">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={initials} referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} />
                      : <span>{initials}</span>}
                  </div>
                  <div className="up-create-input">What's on your mind, {user?.first_name}?</div>
                  <button className="up-create-btn" type="button">+ Post</button>
                </div>
                <div className="up-feed">
                  {posts.length === 0
                    ? (
                      <div className="up-empty">
                        <div className="up-empty-icon"><Grid3X3 size={28} /></div>
                        <div className="up-empty-title">No posts yet</div>
                      </div>
                    )
                    : posts.map(p => <PostCard key={p.id} post={p} currentUserId={user?.id} />)
                  }
                </div>
              </>
            )}

            {/* Places tab */}
            {tab === "places" && (
              <div className="up-place-grid">
                {places.length === 0
                  ? (
                    <div className="up-empty">
                      <div className="up-empty-icon"><MapPin size={28} /></div>
                      <div className="up-empty-title">No places added yet</div>
                    </div>
                  )
                  : places.map(place => (
                    <div key={place.id} className="up-place-card-new">
                      <div className="up-place-card-img">
                        {place.image
                          ? <img src={getImageUrl(place.image)} alt={place.name} />
                          : <div className="up-place-card-blank"><MapPin size={28} /></div>}
                        <div className="up-place-card-overlay">
                          <div className="up-place-card-name">{place.name}</div>
                          {place.location && (
                            <div className="up-place-card-addr">
                              <MapPin size={10} /> {place.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* Saved tab */}
            {tab === "saved" && (
              <div className="up-feed">
                {saved.length === 0
                  ? (
                    <div className="up-empty">
                      <div className="up-empty-icon"><Bookmark size={28} /></div>
                      <div className="up-empty-title">No saved posts yet</div>
                    </div>
                  )
                  : saved.map(p => <PostCard key={p.id} post={p} currentUserId={user?.id} />)
                }
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="up-overlay" onClick={() => setShowEdit(false)}>
          <div className="up-modal" onClick={e => e.stopPropagation()}>
            <div className="up-modal-head">
              <h2>Edit Profile</h2>
              <button className="up-modal-x" onClick={() => setShowEdit(false)} type="button">
                <X size={15} />
              </button>
            </div>

            <div className="up-modal-body">
              <div className="up-edit-avatar-wrap">
                <div className="up-edit-avatar" onClick={() => fileRef.current?.click()}>
                  {editPreview
                    ? <img src={editPreview} alt="preview" className="up-edit-avatar-img" />
                    : <div className="up-edit-avatar-placeholder">{initials}</div>}
                  <div className="up-edit-avatar-overlay"><Camera size={20} /></div>
                </div>
                <div className="up-edit-avatar-hint">Click to change photo</div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleAvatarFile(e.target.files?.[0] || null)} />
              </div>

              {editErr && <div className="up-alert up-alert--err">{editErr}</div>}

              <div className="up-form-grid">
                <div className="up-field">
                  <label>First Name</label>
                  <input value={editFirst} onChange={e => setEditFirst(e.target.value)} placeholder="First name" />
                </div>
                <div className="up-field">
                  <label>Last Name</label>
                  <input value={editLast} onChange={e => setEditLast(e.target.value)} placeholder="Last name" />
                </div>
                <div className="up-field up-field--full">
                  <label>Bio</label>
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell people about yourself..." rows={3} />
                </div>
                <div className="up-field up-field--full">
                  <label>Gender</label>
                  <select value={editGender} onChange={e => setEditGender(e.target.value)}>
                    <option value="">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="up-modal-foot">
              <button className="up-btn-ghost" onClick={() => setShowEdit(false)} type="button">Cancel</button>
              <button className="up-btn-primary" onClick={saveEdit} disabled={editSaving} type="button">
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}