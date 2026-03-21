import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, Edit3, X, MapPin, Heart, Bookmark,
  MessageCircle, BadgeCheck, Settings, LogOut,
  Trash2, Globe, Phone, Calendar, Mail, ImageIcon,
  ChevronRight, AlertTriangle, Lock, Bell, Shield,
  Eye, EyeOff, Check, Plus, User, Save,
} from "lucide-react";
import Navbar from "../Components/Layout/Navbar/Navbar";
import "./UserProfile.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Tab = "posts" | "places" | "saved" | "settings";

type UserData = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  address?: string;
  gender?: string;
  dob?: string;
  created_at?: string;
  avatar?: string;
  role?: string;
  google_id?: string;
};

type Post = {
  id: number;
  caption?: string;
  images?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
};

type Place = {
  id: number | string;
  name: string;
  address: string;
  category: string;
  image?: string;
  status?: "pending" | "approved" | "rejected";
  created_at: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const API    = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const SERVER = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001";

const getAvatarUrl = (avatar?: string | null): string | null => {
  if (!avatar) return null;
  if (avatar.includes("|||")) return avatar.split("|||")[1];
  if (avatar.startsWith("http")) return avatar;
  return `${SERVER}${avatar}`;
};

const parseImages = (raw?: string | null): string[] => {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return [raw]; }
};

const toUrl = (p?: string | null): string | null => {
  if (!p) return null;
  return p.startsWith("http") ? p : `${SERVER}${p}`;
};

const timeAgo = (d: string): string => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days < 7 ? `${days}d ago`
    : new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const authHeader = (): HeadersInit => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  "Content-Type": "application/json",
});

// ---------------------------------------------------------------------------
// Initials Avatar
// ---------------------------------------------------------------------------
function InitialsAvatar({ name, size = 96 }: { name: string; size?: number }) {
  const parts = name.split(" ").filter(Boolean).slice(0, 2);
  const initials = parts.map(w => w[0].toUpperCase()).join("");
  return (
    <div className="up-avatar-initials" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials || "U"}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Profile Modal
// ---------------------------------------------------------------------------
function EditModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<UserData>>({
    first_name: user.first_name || "",
    last_name:  user.last_name  || "",
    bio:        user.bio        || "",
    phone:      user.phone      || "",
    address:    user.address    || "",
    location:   user.location   || "",
    website:    user.website    || "",
    dob:        user.dob        || "",
    gender:     user.gender     || "",
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch(`${API}/user/profile`, {
        method:  "PUT",
        headers: authHeader(),
        body:    JSON.stringify(form),
      });
      const d = await r.json();
      if (d.success) {
        localStorage.setItem("currentUser", JSON.stringify({ ...user, ...d.data }));
        setMsg({ type: "ok", text: "Profile saved!" });
        setTimeout(() => { onSaved(); onClose(); }, 800);
      } else {
        setMsg({ type: "err", text: d.message || "Update failed." });
      }
    } catch {
      setMsg({ type: "err", text: "Could not reach server." });
    }
    setSaving(false);
  };

  return (
    <div className="up-modal-overlay" onClick={onClose}>
      <div className="up-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="up-edit-modal-head">
          <h2>Edit Profile</h2>
          <button className="up-modal-close" onClick={onClose} type="button">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="up-edit-modal-body">
          {msg && (
            <div className={`up-alert up-alert--${msg.type}`}>
              {msg.type === "ok" ? <Check size={14} /> : <AlertTriangle size={14} />}
              {msg.text}
            </div>
          )}

          <div className="up-edit-grid">
            <div className="up-ef">
              <label>First Name</label>
              <input value={form.first_name || ""} placeholder="First name"
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div className="up-ef">
              <label>Last Name</label>
              <input value={form.last_name || ""} placeholder="Last name"
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
            <div className="up-ef up-ef--full">
              <label>Bio</label>
              <textarea rows={3} value={form.bio || ""}
                placeholder="Tell the community about yourself..."
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div className="up-ef">
              <label>Phone</label>
              <input value={form.phone || ""} placeholder="+977 98XXXXXXXX"
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="up-ef">
              <label>Location</label>
              <input value={form.location || ""} placeholder="e.g. Kathmandu, Nepal"
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="up-ef up-ef--full">
              <label>Address</label>
              <input value={form.address || ""} placeholder="Your full address"
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="up-ef up-ef--full">
              <label>Website</label>
              <input value={form.website || ""} placeholder="https://yourwebsite.com"
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
            </div>
            <div className="up-ef">
              <label>Date of Birth</label>
              <input type="date" value={form.dob || ""}
                onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
            </div>
            <div className="up-ef">
              <label>Gender</label>
              <select value={form.gender || ""}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        <div className="up-edit-modal-foot">
          <button className="up-btn-ghost" onClick={onClose} type="button">Cancel</button>
          <button className="up-btn-primary" onClick={save} disabled={saving} type="button">
            {saving ? <><div className="up-spin-sm" /> Saving...</> : <><Save size={14} strokeWidth={2.5} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function UserProfile() {
  const navigate = useNavigate();

  const [user,          setUser]          = useState<UserData | null>(null);
  const [tab,           setTab]           = useState<Tab>("posts");
  const [showEditModal, setShowEditModal] = useState(false);

  const [posts,      setPosts]      = useState<Post[]>([]);
  const [myPlaces,   setMyPlaces]   = useState<Place[]>([]);
  const [savedItems, setSavedItems] = useState<Post[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  const [picUploading,    setPicUploading]    = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm,   setDeleteConfirm]   = useState("");

  const [pwForm,   setPwForm]   = useState({ current: "", next: "", confirm: "" });
  const [pwShow,   setPwShow]   = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg,    setPwMsg]    = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const picInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchTabData(tab);
  }, [tab, user]);

  const fetchUser = async () => {
    try {
      const r = await fetch(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      const d = await r.json();
      if (d.success) {
        setUser(d.data);
        localStorage.setItem("currentUser", JSON.stringify(d.data));
      } else { navigate("/"); }
    } catch { navigate("/"); }
  };

  const fetchTabData = async (t: Tab) => {
    setLoadingTab(true);
    const headers: HeadersInit = { Authorization: `Bearer ${localStorage.getItem("token") || ""}` };
    try {
      if (t === "posts") {
        const r = await fetch(`${API}/user/my-posts?limit=30`, { headers });
        const d = await r.json();
        if (d.success) setPosts(d.data || []);
      } else if (t === "places") {
        const r = await fetch(`${API}/user/my-places`, { headers });
        const d = await r.json();
        if (d.success) setMyPlaces(d.data || []);
      } else if (t === "saved") {
        const r = await fetch(`${API}/posts/saved?limit=30`, { headers });
        const d = await r.json();
        if (d.success) setSavedItems(d.data || []);
      }
    } catch {}
    setLoadingTab(false);
  };

  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicUploading(true);
    const fd = new FormData();
    fd.append("profile_picture", file);
    try {
      const r = await fetch(`${API}/user/profile-picture`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        body:    fd,
      });
      const d = await r.json();
      if (d.success) await fetchUser();
    } catch {}
    setPicUploading(false);
    if (picInputRef.current) picInputRef.current.value = "";
  };

  const handleRemovePic = async () => {
    try {
      await fetch(`${API}/user/profile-picture`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      await fetchUser();
    } catch {}
  };

  const changePassword = async () => {
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ type: "err", text: "Passwords do not match." }); return; }
    if (pwForm.next.length < 6) { setPwMsg({ type: "err", text: "Min 6 characters." }); return; }
    setPwSaving(true); setPwMsg(null);
    try {
      const r = await fetch(`${API}/user/password`, {
        method: "PUT", headers: authHeader(),
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.next }),
      });
      const d = await r.json();
      if (d.success) { setPwMsg({ type: "ok", text: "Password changed!" }); setPwForm({ current: "", next: "", confirm: "" }); }
      else setPwMsg({ type: "err", text: d.message || "Failed." });
    } catch { setPwMsg({ type: "err", text: "Server error." }); }
    setPwSaving(false);
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    try {
      await fetch(`${API}/user/account`, { method: "DELETE", headers: authHeader() });
      localStorage.removeItem("token"); localStorage.removeItem("currentUser"); navigate("/");
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("currentUser"); navigate("/");
  };

  if (!user) return (
    <div className="up-page">
      <Navbar />
      <div className="up-fullload"><div className="up-dot"/><div className="up-dot"/><div className="up-dot"/></div>
    </div>
  );

  const fullName     = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Explorer";
  const picUrl       = getAvatarUrl(user.avatar);
  const isCloudinary = !!user.avatar && user.avatar.includes("|||");
  const isGoogleUser = !!user.google_id;
  const joinDate     = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "LoKally Explorer";

  const tabItems: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: "posts",    icon: <ImageIcon size={16} strokeWidth={2} />, label: "Posts"    },
    { key: "places",   icon: <MapPin    size={16} strokeWidth={2} />, label: "Places"   },
    { key: "saved",    icon: <Bookmark  size={16} strokeWidth={2} />, label: "Saved"    },
    { key: "settings", icon: <Settings  size={16} strokeWidth={2} />, label: "Settings" },
  ];

  const pwLabels: Record<"current" | "next" | "confirm", string> = {
    current: "Current Password",
    next:    "New Password",
    confirm: "Confirm Password",
  };

  return (
    <div className="up-page">
      <Navbar />

      {/* Cover */}
      <div className="up-cover">
        <div className="up-cover-gradient" />
        <div className="up-cover-glow" />
      </div>

      <div className="up-container">

        {/* ── Hero section ── */}
        <div className="up-hero">

          {/* Avatar */}
          <div className="up-avatar-section">
            <div className="up-avatar-ring">
              {picUrl
                ? <img src={picUrl} alt={fullName} className="up-avatar-photo" />
                : <InitialsAvatar name={fullName} size={96} />
              }
              {picUploading && (
                <div className="up-avatar-uploading"><div className="up-spinner" /></div>
              )}
              <button
                className="up-avatar-cam-btn"
                onClick={() => picInputRef.current?.click()}
                type="button"
                title="Change photo"
              >
                <Camera size={14} strokeWidth={2.5} />
              </button>
              <input ref={picInputRef} type="file" accept="image/*"
                style={{ display: "none" }} onChange={handlePicChange} />
            </div>
            {isCloudinary && (
              <button className="up-remove-photo" onClick={handleRemovePic} type="button">
                Remove photo
              </button>
            )}
          </div>

          {/* Name + bio + meta */}
          <div className="up-hero-info">
            <div className="up-hero-top">
              <div>
                <div className="up-hero-name-row">
                  <h1 className="up-hero-name">{fullName}</h1>
                  {user.role === "admin" && (
                    <span className="up-admin-chip">
                      <BadgeCheck size={12} strokeWidth={2.5} /> Admin
                    </span>
                  )}
                </div>
                {user.bio
                  ? <p className="up-hero-bio">{user.bio}</p>
                  : <p className="up-hero-bio up-hero-bio--empty">No bio yet</p>
                }
              </div>
              <button
                className="up-edit-profile-btn"
                onClick={() => setShowEditModal(true)}
                type="button"
              >
                <Edit3 size={15} strokeWidth={2.5} /> Edit Profile
              </button>
            </div>

            {/* Meta chips */}
            <div className="up-meta-chips">
              <span className="up-chip"><Mail size={13} strokeWidth={2} /> {user.email}</span>
              {user.phone    && <span className="up-chip"><Phone    size={13} strokeWidth={2} /> {user.phone}</span>}
              {user.location && <span className="up-chip"><MapPin   size={13} strokeWidth={2} /> {user.location}</span>}
              {user.website  && (
                <a href={user.website} className="up-chip up-chip--link" target="_blank" rel="noreferrer">
                  <Globe size={13} strokeWidth={2} /> {user.website}
                </a>
              )}
              <span className="up-chip"><Calendar size={13} strokeWidth={2} /> Joined {joinDate}</span>
              {user.gender && <span className="up-chip"><User size={13} strokeWidth={2} /> {user.gender}</span>}
            </div>
          </div>

          {/* Stats */}
          <div className="up-stats-row">
            <div className="up-stat" onClick={() => setTab("posts")}>
              <div className="up-stat-num">{posts.length}</div>
              <div className="up-stat-lbl">Posts</div>
            </div>
            <div className="up-stat-sep" />
            <div className="up-stat" onClick={() => setTab("places")}>
              <div className="up-stat-num">{myPlaces.length}</div>
              <div className="up-stat-lbl">Places</div>
            </div>
            <div className="up-stat-sep" />
            <div className="up-stat" onClick={() => setTab("saved")}>
              <div className="up-stat-num">{savedItems.length}</div>
              <div className="up-stat-lbl">Saved</div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="up-tabs">
          {tabItems.map(t => (
            <button
              key={t.key}
              className={`up-tab ${tab === t.key ? "up-tab--on" : ""}`}
              onClick={() => setTab(t.key)}
              type="button"
            >
              {t.icon}
              <span>{t.label}</span>
              {tab === t.key && <div className="up-tab-bar" />}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="up-content">

          {loadingTab && (
            <div className="up-loader">
              <div className="up-dot" /><div className="up-dot" /><div className="up-dot" />
            </div>
          )}

          {/* POSTS */}
          {tab === "posts" && !loadingTab && (
            posts.length === 0 ? (
              <div className="up-empty">
                <div className="up-empty-icon"><ImageIcon size={36} strokeWidth={1.2} /></div>
                <p className="up-empty-title">No posts yet</p>
                <p className="up-empty-desc">Share your Nepal adventures!</p>
                <button className="up-btn-primary" onClick={() => navigate("/community")} type="button">
                  <Plus size={14} strokeWidth={2.5} /> Create Post
                </button>
              </div>
            ) : (
              <div className="up-grid">
                {posts.map(post => {
                  const imgs  = parseImages(post.images);
                  const cover = imgs[0] ? toUrl(imgs[0]) : null;
                  return (
                    <div key={post.id} className="up-grid-item" onClick={() => navigate("/community")}>
                      {cover
                        ? <img src={cover} alt="" className="up-grid-img" />
                        : <div className="up-grid-blank"><MessageCircle size={24} strokeWidth={1.5} /></div>
                      }
                      <div className="up-grid-hover">
                        <span><Heart size={14} strokeWidth={2} /> {post.likes_count}</span>
                        <span><MessageCircle size={14} strokeWidth={2} /> {post.comments_count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* PLACES */}
          {tab === "places" && !loadingTab && (
            myPlaces.length === 0 ? (
              <div className="up-empty">
                <div className="up-empty-icon"><MapPin size={36} strokeWidth={1.2} /></div>
                <p className="up-empty-title">No places added yet</p>
                <p className="up-empty-desc">Share hidden gems of Nepal!</p>
                <button className="up-btn-primary" onClick={() => navigate("/explore-map")} type="button">
                  <Plus size={14} strokeWidth={2.5} /> Add a Place
                </button>
              </div>
            ) : (
              <div className="up-place-list">
                {myPlaces.map(place => {
                  const cover = toUrl(place.image);
                  const stMap: Record<string, { cls: string; label: string }> = {
                    approved: { cls: "st--green", label: "Approved"       },
                    pending:  { cls: "st--amber", label: "Pending Review" },
                    rejected: { cls: "st--red",   label: "Rejected"       },
                  };
                  const st = stMap[place.status || "pending"];
                  return (
                    <div key={place.id} className="up-place-card" onClick={() => navigate(`/place/${place.id}`)}>
                      <div className="up-place-img">
                        {cover
                          ? <img src={cover} alt={place.name} />
                          : <div className="up-place-img-blank"><MapPin size={20} strokeWidth={1.5} /></div>
                        }
                      </div>
                      <div className="up-place-body">
                        <div className="up-place-name">{place.name}</div>
                        <div className="up-place-addr">
                          <MapPin size={11} strokeWidth={2} /> {place.address}
                        </div>
                        <div className="up-place-foot">
                          <span className="up-place-cat">{place.category}</span>
                          <span className={`up-st ${st.cls}`}>
                            {place.status === "approved" && <BadgeCheck size={11} />}
                            {st.label}
                          </span>
                          <span className="up-place-time">{timeAgo(place.created_at)}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} strokeWidth={2} className="up-place-arr" />
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* SAVED */}
          {tab === "saved" && !loadingTab && (
            savedItems.length === 0 ? (
              <div className="up-empty">
                <div className="up-empty-icon"><Bookmark size={36} strokeWidth={1.2} /></div>
                <p className="up-empty-title">Nothing saved yet</p>
                <p className="up-empty-desc">Bookmark posts to find them here!</p>
                <button className="up-btn-primary" onClick={() => navigate("/community")} type="button">
                  <Plus size={14} strokeWidth={2.5} /> Browse Community
                </button>
              </div>
            ) : (
              <div className="up-saved-list">
                {savedItems.map(post => {
                  const imgs  = parseImages(post.images);
                  const cover = imgs[0] ? toUrl(imgs[0]) : null;
                  return (
                    <div key={post.id} className="up-saved-card" onClick={() => navigate("/community")}>
                      {cover && <div className="up-saved-img"><img src={cover} alt="" /></div>}
                      <div className="up-saved-body">
                        {post.caption && <p className="up-saved-cap">{post.caption}</p>}
                        <div className="up-saved-meta">
                          <span><Heart size={12} strokeWidth={2} /> {post.likes_count}</span>
                          <span><MessageCircle size={12} strokeWidth={2} /> {post.comments_count}</span>
                          <span>{timeAgo(post.created_at)}</span>
                        </div>
                      </div>
                      <Bookmark size={15} strokeWidth={2} className="up-saved-bm" />
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* SETTINGS */}
          {tab === "settings" && !loadingTab && (
            <div className="up-settings">

              {/* Account info */}
              <div className="up-sblock">
                <div className="up-sblock-head"><User size={16} strokeWidth={2} /> Account Information</div>
                <div className="up-srow"><span>Email</span><strong>{user.email}</strong></div>
                <div className="up-srow"><span>Role</span><strong style={{ textTransform: "capitalize" }}>{user.role || "user"}</strong></div>
                <div className="up-srow"><span>Member since</span><strong>{joinDate}</strong></div>
                {user.dob && <div className="up-srow"><span>Date of Birth</span><strong>{user.dob}</strong></div>}
                {isGoogleUser && (
                  <div className="up-srow">
                    <span>Sign-in</span>
                    <strong className="up-google-chip">Google Account</strong>
                  </div>
                )}
              </div>

              {/* Change password */}
              {!isGoogleUser && (
                <div className="up-sblock">
                  <div className="up-sblock-head"><Lock size={16} strokeWidth={2} /> Change Password</div>
                  <div className="up-sblock-body">
                    {pwMsg && (
                      <div className={`up-alert up-alert--${pwMsg.type}`}>
                        {pwMsg.type === "ok" ? <Check size={13} /> : <AlertTriangle size={13} />}
                        {pwMsg.text}
                      </div>
                    )}
                    {(["current", "next", "confirm"] as const).map(k => (
                      <div className="up-pw-field" key={k}>
                        <label>{pwLabels[k]}</label>
                        <div className="up-pw-wrap">
                          <input
                            type={pwShow[k] ? "text" : "password"}
                            value={pwForm[k]}
                            placeholder="••••••••"
                            onChange={e => setPwForm(f => ({ ...f, [k]: e.target.value }))}
                          />
                          <button className="up-pw-toggle" type="button"
                            onClick={() => setPwShow(s => ({ ...s, [k]: !s[k] }))}>
                            {pwShow[k] ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      className="up-btn-primary"
                      onClick={changePassword}
                      disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}
                      type="button"
                    >
                      {pwSaving ? <><div className="up-spin-sm" /> Saving...</> : <><Lock size={14} /> Update Password</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications */}
              <div className="up-sblock">
                <div className="up-sblock-head"><Bell size={16} strokeWidth={2} /> Notifications</div>
                {[
                  { label: "New likes on my posts",   on: true  },
                  { label: "Comments on my posts",    on: true  },
                  { label: "Place review updates",    on: true  },
                  { label: "Community announcements", on: false },
                ].map((item, i) => (
                  <div className="up-toggle-row" key={i}>
                    <span>{item.label}</span>
                    <label className="up-toggle">
                      <input type="checkbox" defaultChecked={item.on} />
                      <span className="up-toggle-track" />
                    </label>
                  </div>
                ))}
              </div>

              {/* Privacy */}
              <div className="up-sblock">
                <div className="up-sblock-head"><Shield size={16} strokeWidth={2} /> Privacy</div>
                {[
                  { label: "Show my profile to others", on: true  },
                  { label: "Show my saved places",      on: false },
                ].map((item, i) => (
                  <div className="up-toggle-row" key={i}>
                    <span>{item.label}</span>
                    <label className="up-toggle">
                      <input type="checkbox" defaultChecked={item.on} />
                      <span className="up-toggle-track" />
                    </label>
                  </div>
                ))}
              </div>

              {/* Danger zone */}
              <div className="up-sblock up-sblock--danger">
                <div className="up-sblock-head up-sblock-head--danger">
                  <AlertTriangle size={16} strokeWidth={2} /> Danger Zone
                </div>
                <div className="up-sblock-body">
                  <button className="up-danger-row" onClick={handleLogout} type="button">
                    <LogOut size={16} strokeWidth={2} />
                    <div>
                      <div className="up-danger-title">Log out</div>
                      <div className="up-danger-desc">Sign out of your LoKally account</div>
                    </div>
                  </button>
                  <button className="up-danger-row up-danger-row--del" onClick={() => setShowDeleteModal(true)} type="button">
                    <Trash2 size={16} strokeWidth={2} />
                    <div>
                      <div className="up-danger-title">Delete Account</div>
                      <div className="up-danger-desc">Permanently remove your account and all data</div>
                    </div>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <EditModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSaved={fetchUser}
        />
      )}

      {/* ── Delete Account Modal ── */}
      {showDeleteModal && (
        <div className="up-modal-overlay" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>
          <div className="up-del-modal" onClick={e => e.stopPropagation()}>
            <div className="up-del-icon"><Trash2 size={28} strokeWidth={1.8} /></div>
            <h2>Delete your account?</h2>
            <p>This is <strong>permanent</strong> and cannot be undone. All your posts, places and data will be removed forever.</p>
            <p className="up-del-hint">Type <strong>DELETE</strong> to confirm:</p>
            <input
              className="up-del-input"
              value={deleteConfirm}
              autoFocus
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
            <div className="up-del-btns">
              <button className="up-btn-ghost" type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>
                Cancel
              </button>
              <button className="up-btn-danger" type="button"
                onClick={deleteAccount} disabled={deleteConfirm !== "DELETE"}>
                <Trash2 size={14} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}