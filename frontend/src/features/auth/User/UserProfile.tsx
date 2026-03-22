import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, Edit3, X, MapPin, Bookmark, BadgeCheck,
  ImageIcon, ChevronRight, AlertTriangle, Check,
  Plus, Settings, Mail, User, Save, Send,
} from "lucide-react";
import Navbar from "../Components/Layout/Navbar/Navbar";
import PostCard from "../Community/PostCard/PostCard";
import type { Post } from "../Community/CommunityTypes";
import "./UserProfile.css";

type Tab = "posts" | "places" | "saved";

type UserData = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  bio?: string;
  address?: string;
  gender?: string;
  dob?: string;
  created_at?: string;
  avatar?: string;
  role?: string;
  google_id?: string;
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

const API    = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const SERVER = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001";

// LOCAL storage avatar — /uploads/profiles/xxx.jpg
const getAvatarUrl = (avatar?: string | null): string | null => {
  if (!avatar) return null;
  if (avatar.includes("|||")) return avatar.split("|||")[1]; // cloudinary legacy
  if (avatar.startsWith("http")) return avatar;              // google oauth
  if (avatar.startsWith("/")) return `${SERVER}${avatar}`;  // local storage
  return null;
};

const toUrl = (p?: string | null): string | null => {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `${SERVER}${p}`;
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

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  return <div className="up-initials">{initials || "U"}</div>;
}

// ── Edit Profile Modal ─────────────────────────────────────────────────────
function EditModal({ user, onClose, onSaved }: { user: UserData; onClose: () => void; onSaved: () => void; }) {
  const [form, setForm] = useState({
    first_name: user.first_name || "",
    last_name:  user.last_name  || "",
    bio:        user.bio        || "",
    phone:      user.phone      || "",
    address:    user.address    || "",
    dob:        user.dob        || "",
    gender:     user.gender     || "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok"|"err"; text: string }|null>(null);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch(`${API}/user/profile`, { method: "PUT", headers: authHeader(), body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) { setMsg({ type: "ok", text: "Profile saved!" }); setTimeout(() => { onSaved(); onClose(); }, 700); }
      else setMsg({ type: "err", text: d.message || "Update failed." });
    } catch { setMsg({ type: "err", text: "Could not reach server." }); }
    setSaving(false);
  };

  return (
    <div className="up-overlay" onClick={onClose}>
      <div className="up-modal" onClick={e => e.stopPropagation()}>
        <div className="up-modal-head">
          <h2>Edit Profile</h2>
          <button className="up-modal-x" onClick={onClose} type="button"><X size={17} strokeWidth={2.5} /></button>
        </div>
        <div className="up-modal-body">
          {msg && <div className={`up-alert up-alert--${msg.type}`}>{msg.type==="ok"?<Check size={13}/>:<AlertTriangle size={13}/>}{msg.text}</div>}
          <div className="up-form-grid">
            <div className="up-field"><label>First Name</label><input value={form.first_name} placeholder="First name" onChange={e=>setForm(f=>({...f,first_name:e.target.value}))}/></div>
            <div className="up-field"><label>Last Name</label><input value={form.last_name} placeholder="Last name" onChange={e=>setForm(f=>({...f,last_name:e.target.value}))}/></div>
            <div className="up-field up-field--full"><label>Bio</label><textarea rows={3} value={form.bio} placeholder="Tell the community about yourself..." onChange={e=>setForm(f=>({...f,bio:e.target.value}))}/></div>
            <div className="up-field"><label>Phone</label><input value={form.phone} placeholder="+977 98XXXXXXXX" onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
            <div className="up-field"><label>Date of Birth</label><input type="date" value={form.dob} onChange={e=>setForm(f=>({...f,dob:e.target.value}))}/></div>
            <div className="up-field up-field--full"><label>Address</label><input value={form.address} placeholder="Your address" onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></div>
            <div className="up-field"><label>Gender</label>
              <select value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>
        <div className="up-modal-foot">
          <button className="up-btn-ghost" onClick={onClose} type="button">Cancel</button>
          <button className="up-btn-primary" onClick={save} disabled={saving} type="button">
            {saving?<><div className="up-spin-sm"/>Saving...</>:<><Save size={14}/>Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile Picture Modal ─────────────────────────────────────────────────
function PicModal({ onClose, onConfirm, uploading }: { onClose:()=>void; onConfirm:(f:File)=>void; uploading:boolean; }) {
  const [preview, setPreview] = useState<string|null>(null);
  const [file, setFile] = useState<File|null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <div className="up-overlay" onClick={onClose}>
      <div className="up-modal up-modal--sm" onClick={e=>e.stopPropagation()}>
        <div className="up-modal-head">
          <h2>Update Profile Picture</h2>
          <button className="up-modal-x" onClick={onClose} type="button"><X size={17} strokeWidth={2.5}/></button>
        </div>
        <div className="up-modal-body">
          {!preview
            ? <div className="up-upload-zone" onClick={()=>ref.current?.click()}><Camera size={32} strokeWidth={1.5}/><p>Click to choose a photo</p><span>JPG, PNG, WEBP — max 10MB</span></div>
            : <div className="up-preview-wrap"><img src={preview} alt="Preview" className="up-preview-img"/><p>This will be your new profile picture</p></div>
          }
          <input ref={ref} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style={{display:"none"}} onChange={handleFile}/>
        </div>
        <div className="up-modal-foot">
          <button className="up-btn-ghost" onClick={onClose} type="button">Cancel</button>
          {preview && <button className="up-btn-ghost" type="button" onClick={()=>{setPreview(null);setFile(null);}}>Choose different</button>}
          {file && <button className="up-btn-primary" onClick={()=>onConfirm(file)} disabled={uploading} type="button">{uploading?<><div className="up-spin-sm"/>Uploading...</>:<><Check size={14}/>Update</>}</button>}
        </div>
      </div>
    </div>
  );
}

// ── Create Post Modal ────────────────────────────────────────────────────
function CreatePostModal({ user, onClose, onCreated }: { user: UserData; onClose:()=>void; onCreated:()=>void; }) {
  const [caption, setCaption] = useState("");
  const [images,  setImages]  = useState<File[]>([]);
  const [previews,setPreviews]= useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const picUrl  = getAvatarUrl(user.avatar);
  const initials = `${user.first_name?.[0]||""}${user.last_name?.[0]||""}`.toUpperCase();

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    setImages(files);
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_,idx)=>idx!==i));
    setPreviews(prev => prev.filter((_,idx)=>idx!==i));
  };

  const submit = async () => {
    if (!caption.trim() && images.length === 0) { setError("Add a caption or image."); return; }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("caption", caption.trim());
      images.forEach(img => fd.append("images", img));
      const r = await fetch(`${API}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")||""}` },
        body: fd,
      });
      const d = await r.json();
      if (d.success) { onCreated(); onClose(); }
      else setError(d.message || "Failed to post.");
    } catch { setError("Server error."); }
    setLoading(false);
  };

  return (
    <div className="up-overlay" onClick={onClose}>
      <div className="up-modal" onClick={e=>e.stopPropagation()}>
        <div className="up-modal-head">
          <h2>Create Post</h2>
          <button className="up-modal-x" onClick={onClose} type="button"><X size={17} strokeWidth={2.5}/></button>
        </div>
        <div className="up-modal-body">
          <div className="up-cp-author">
            {picUrl
              ? <img src={picUrl} alt={initials} className="up-cp-ava-img"/>
              : <div className="up-cp-ava">{initials}</div>
            }
            <div className="up-cp-name">{user.first_name} {user.last_name}</div>
          </div>
          <textarea
            className="up-cp-textarea"
            rows={4}
            placeholder="What's on your mind?"
            value={caption}
            onChange={e=>setCaption(e.target.value)}
            autoFocus
          />
          {previews.length > 0 && (
            <div className="up-cp-previews">
              {previews.map((url, i) => (
                <div key={i} className="up-cp-thumb">
                  <img src={url} alt=""/>
                  <button className="up-cp-remove" onClick={()=>removeImage(i)} type="button"><X size={12}/></button>
                </div>
              ))}
            </div>
          )}
          {error && <div className="up-alert up-alert--err"><AlertTriangle size={13}/>{error}</div>}
          <div className="up-cp-actions">
            <button className="up-cp-img-btn" onClick={()=>fileRef.current?.click()} type="button" disabled={images.length>=4}>
              <ImageIcon size={18} strokeWidth={2}/>
              <span>Add Photos {images.length>0?`(${images.length}/4)`:""}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleImages}/>
          </div>
        </div>
        <div className="up-modal-foot">
          <button className="up-btn-ghost" onClick={onClose} type="button">Cancel</button>
          <button className="up-btn-primary" onClick={submit} disabled={loading||(!caption.trim()&&images.length===0)} type="button">
            {loading?<><div className="up-spin-sm"/>Posting...</>:<><Send size={14}/>Post</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function UserProfile() {
  const navigate = useNavigate();

  const [user,         setUser]         = useState<UserData|null>(null);
  const [tab,          setTab]          = useState<Tab>("posts");
  const [showEdit,     setShowEdit]     = useState(false);
  const [showPicModal, setShowPicModal] = useState(false);
  const [showCreatePost,setShowCreatePost]=useState(false);
  const [picUploading, setPicUploading] = useState(false);
  const [posts,        setPosts]        = useState<Post[]>([]);
  const [myPlaces,     setMyPlaces]     = useState<Place[]>([]);
  const [savedPosts,   setSavedPosts]   = useState<Post[]>([]);
  const [loadingTab,   setLoadingTab]   = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    fetchUser();
  }, []);

  useEffect(() => { if (!user) return; fetchTabData(tab); }, [tab, user]);

  const fetchUser = async () => {
    try {
      const r = await fetch(`${API}/user/profile`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")||""}` } });
      const d = await r.json();
      if (d.success) { setUser(d.data); localStorage.setItem("currentUser", JSON.stringify(d.data)); }
      else navigate("/");
    } catch { navigate("/"); }
  };

  const fetchTabData = async (t: Tab) => {
    setLoadingTab(true);
    const headers: HeadersInit = { Authorization: `Bearer ${localStorage.getItem("token")||""}` };
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
        if (d.success) setSavedPosts(d.data || []);
      }
    } catch {}
    setLoadingTab(false);
  };

  const handlePicConfirm = async (file: File) => {
    setPicUploading(true);
    const fd = new FormData();
    fd.append("profile_picture", file);
    try {
      const r = await fetch(`${API}/user/profile-picture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")||""}` },
        body: fd,
      });
      const d = await r.json();
      if (d.success) { await fetchUser(); setShowPicModal(false); }
    } catch {}
    setPicUploading(false);
  };

  const handleRemovePic = async () => {
    try {
      await fetch(`${API}/user/profile-picture`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")||""}` } });
      await fetchUser();
    } catch {}
  };

  if (!user) return (
    <div className="up-page"><Navbar/>
      <div className="up-fullload"><div className="up-dot"/><div className="up-dot"/><div className="up-dot"/></div>
    </div>
  );

  const fullName     = `${user.first_name||""} ${user.last_name||""}`.trim() || "Explorer";
  const picUrl       = getAvatarUrl(user.avatar);
  const hasLocalPic  = !!user.avatar && user.avatar.startsWith("/uploads/");
  const joinDate     = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const tabItems: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: "posts",  icon: <ImageIcon size={15} strokeWidth={2}/>, label: "Posts"  },
    { key: "places", icon: <MapPin    size={15} strokeWidth={2}/>, label: "Places" },
    { key: "saved",  icon: <Bookmark  size={15} strokeWidth={2}/>, label: "Saved"  },
  ];

  return (
    <div className="up-page">
      <Navbar/>

      <div className="up-cover">
        <div className="up-cover-grad"/>
        <div className="up-cover-dots"/>
      </div>

      <div className="up-container">
        <div className="up-card">
          {/* Top row */}
          <div className="up-card-top">
            <div className="up-ava-wrap" onClick={()=>setShowPicModal(true)}>
              {picUrl
                ? <img src={picUrl} alt={fullName} className="up-ava-img"/>
                : <InitialsAvatar name={fullName}/>
              }
              <div className="up-ava-overlay"><Camera size={20} strokeWidth={2}/></div>
              <div className="up-ava-online"/>
            </div>

            <div className="up-card-actions">
              {hasLocalPic && (
                <button className="up-remove-btn" onClick={handleRemovePic} type="button">Remove photo</button>
              )}
              <button className="up-settings-btn" onClick={()=>navigate("/settings")} type="button" title="Settings">
                <Settings size={16} strokeWidth={2}/>
              </button>
              <button className="up-edit-btn" onClick={()=>setShowEdit(true)} type="button">
                <Edit3 size={14} strokeWidth={2.5}/> Edit Profile
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="up-name-row">
            <h1 className="up-name">{fullName}</h1>
            {user.role==="admin" && <span className="up-admin-badge"><BadgeCheck size={11} strokeWidth={2.5}/> Admin</span>}
          </div>

          {user.bio
            ? <p className="up-bio">{user.bio}</p>
            : <p className="up-bio up-bio--empty">No bio yet — click Edit Profile to add one</p>
          }

          {/* Chips */}
          <div className="up-chips">
            <span className="up-chip"><Mail size={12} strokeWidth={2}/> {user.email}</span>
            {user.gender && <span className="up-chip"><User size={12} strokeWidth={2}/> {user.gender}</span>}
          </div>

          {/* Stats */}
          <div className="up-stats">
            <div className="up-stat" onClick={()=>setTab("posts")}>
              <div className="up-stat-n">{posts.length}</div>
              <div className="up-stat-l">Posts</div>
            </div>
            <div className="up-stat-sep"/>
            <div className="up-stat" onClick={()=>setTab("places")}>
              <div className="up-stat-n">{myPlaces.length}</div>
              <div className="up-stat-l">Places</div>
            </div>
            <div className="up-stat-sep"/>
            <div className="up-stat" onClick={()=>setTab("saved")}>
              <div className="up-stat-n">{savedPosts.length}</div>
              <div className="up-stat-l">Saved</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="up-tabs">
          {tabItems.map(t => (
            <button key={t.key} className={`up-tab ${tab===t.key?"up-tab--on":""}`} onClick={()=>setTab(t.key)} type="button">
              {t.icon} <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="up-content">
          {loadingTab && <div className="up-loader"><div className="up-dot"/><div className="up-dot"/><div className="up-dot"/></div>}

          {/* POSTS */}
          {tab==="posts" && !loadingTab && (
            <>
              {/* Create post bar */}
              <div className="up-create-bar" onClick={()=>setShowCreatePost(true)}>
                <div className="up-create-ava">
                  {picUrl ? <img src={picUrl} alt=""/> : <span>{fullName[0]}</span>}
                </div>
                <div className="up-create-input">What's on your mind, {user.first_name}?</div>
                <button className="up-create-btn" type="button"><Plus size={15} strokeWidth={2.5}/> Post</button>
              </div>

              {posts.length === 0 ? (
                <div className="up-empty">
                  <div className="up-empty-icon"><ImageIcon size={28} strokeWidth={1.5}/></div>
                  <p className="up-empty-title">No posts yet</p>
                  <p className="up-empty-sub">Share your Nepal adventures!</p>
                </div>
              ) : (
                <div className="up-feed">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post}
                      currentUserId={user.id} isAdmin={user.role==="admin"}
                      onDelete={id=>setPosts(p=>p.filter(x=>x.id!==id))}
                      onHide={(id,hidden)=>setPosts(p=>p.map(x=>x.id===id?{...x,is_hidden:hidden}:x))}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* PLACES */}
          {tab==="places" && !loadingTab && (
            myPlaces.length===0 ? (
              <div className="up-empty">
                <div className="up-empty-icon"><MapPin size={28} strokeWidth={1.5}/></div>
                <p className="up-empty-title">No places added yet</p>
                <p className="up-empty-sub">Share hidden gems of Nepal!</p>
                <button className="up-btn-primary" onClick={()=>navigate("/explore-map")} type="button">
                  <Plus size={14}/> Add a Place
                </button>
              </div>
            ) : (
              <div className="up-place-list">
                {myPlaces.map(place => {
                  const cover = toUrl(place.image);
                  const stMap: Record<string,{cls:string;label:string}> = {
                    approved:{cls:"st--green",label:"Approved"},
                    pending: {cls:"st--amber",label:"Pending"},
                    rejected:{cls:"st--red",  label:"Rejected"},
                  };
                  const st = stMap[place.status||"pending"];
                  return (
                    <div key={place.id} className="up-place-card" onClick={()=>navigate(`/place/${place.id}`)}>
                      <div className="up-place-img">
                        {cover ? <img src={cover} alt={place.name}/> : <div className="up-place-blank"><MapPin size={18} strokeWidth={1.5}/></div>}
                      </div>
                      <div className="up-place-body">
                        <div className="up-place-name">{place.name}</div>
                        <div className="up-place-addr"><MapPin size={11} strokeWidth={2}/> {place.address}</div>
                        <div className="up-place-foot">
                          <span className="up-place-cat">{place.category}</span>
                          <span className={`up-st ${st.cls}`}>{place.status==="approved"&&<BadgeCheck size={10}/>}{st.label}</span>
                          <span className="up-place-time">{timeAgo(place.created_at)}</span>
                        </div>
                      </div>
                      <ChevronRight size={15} strokeWidth={2} className="up-place-arr"/>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* SAVED */}
          {tab==="saved" && !loadingTab && (
            savedPosts.length===0 ? (
              <div className="up-empty">
                <div className="up-empty-icon"><Bookmark size={28} strokeWidth={1.5}/></div>
                <p className="up-empty-title">Nothing saved yet</p>
                <p className="up-empty-sub">Bookmark posts to find them here!</p>
                <button className="up-btn-primary" onClick={()=>navigate("/community")} type="button">
                  <Plus size={14}/> Browse Community
                </button>
              </div>
            ) : (
              <div className="up-feed">
                {savedPosts.map(post => (
                  <PostCard key={post.id} post={post}
                    currentUserId={user.id} isAdmin={user.role==="admin"}
                    onDelete={id=>setSavedPosts(p=>p.filter(x=>x.id!==id))}
                    onHide={(id,hidden)=>setSavedPosts(p=>p.map(x=>x.id===id?{...x,is_hidden:hidden}:x))}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {showEdit && <EditModal user={user} onClose={()=>setShowEdit(false)} onSaved={fetchUser}/>}
      {showPicModal && <PicModal onClose={()=>setShowPicModal(false)} onConfirm={handlePicConfirm} uploading={picUploading}/>}
      {showCreatePost && <CreatePostModal user={user} onClose={()=>setShowCreatePost(false)} onCreated={()=>fetchTabData("posts")}/>}
    </div>
  );
}