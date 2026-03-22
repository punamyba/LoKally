import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Lock, Bell, Shield,
  LogOut, Trash2, Eye, EyeOff, Check,
  AlertTriangle, ChevronRight, BadgeCheck,
} from "lucide-react";
import Navbar from "../Components/Layout/Navbar/Navbar";
import "./Settings.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const authHeader = (): HeadersInit => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  "Content-Type": "application/json",
});

type UserData = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  google_id?: string;
  created_at?: string;
};

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);

  const [pwForm,   setPwForm]   = useState({ current: "", next: "", confirm: "" });
  const [pwShow,   setPwShow]   = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg,    setPwMsg]    = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm,   setDeleteConfirm]   = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    const stored = localStorage.getItem("currentUser");
    if (stored) setUser(JSON.parse(stored));
    // Fetch fresh
    fetch(`${API}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      if (d.success) { setUser(d.data); localStorage.setItem("currentUser", JSON.stringify(d.data)); }
    }).catch(() => {});
  }, []);

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
      if (d.success) { setPwMsg({ type: "ok", text: "Password changed successfully!" }); setPwForm({ current: "", next: "", confirm: "" }); }
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
    <div className="st-page"><Navbar />
      <div className="st-loading"><div className="st-dot"/><div className="st-dot"/><div className="st-dot"/></div>
    </div>
  );

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";
  const isGoogleUser = !!user.google_id;

  const pwLabels: Record<"current"|"next"|"confirm", string> = {
    current: "Current Password",
    next:    "New Password",
    confirm: "Confirm New Password",
  };

  return (
    <div className="st-page">
      <Navbar />

      <div className="st-container">

        {/* Header */}
        <div className="st-header">
          <button className="st-back" onClick={() => navigate("/profile")} type="button">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="st-title">Settings</h1>
            <p className="st-sub">Manage your account preferences</p>
          </div>
        </div>

        <div className="st-body">

          {/* Account Info */}
          <div className="st-section">
            <div className="st-section-head">
              <User size={16} strokeWidth={2} />
              <span>Account Information</span>
            </div>
            <div className="st-section-body">
              <div className="st-row">
                <span className="st-key">Full Name</span>
                <span className="st-val">{user.first_name} {user.last_name}</span>
              </div>
              <div className="st-row">
                <span className="st-key">Email</span>
                <span className="st-val">{user.email}</span>
              </div>
              <div className="st-row">
                <span className="st-key">Role</span>
                <span className="st-val" style={{ textTransform: "capitalize" }}>
                  {user.role || "user"}
                  {user.role === "admin" && (
                    <span className="st-admin-badge"><BadgeCheck size={11} /> Admin</span>
                  )}
                </span>
              </div>
              <div className="st-row">
                <span className="st-key">Member since</span>
                <span className="st-val">{joinDate}</span>
              </div>
              {isGoogleUser && (
                <div className="st-row">
                  <span className="st-key">Sign-in method</span>
                  <span className="st-google-chip">Google Account</span>
                </div>
              )}
              <div className="st-row st-row--action" onClick={() => navigate("/profile")}>
                <span className="st-key">Edit profile info</span>
                <ChevronRight size={16} strokeWidth={2} className="st-arrow" />
              </div>
            </div>
          </div>

          {/* Change Password — hidden for Google users */}
          {!isGoogleUser && (
            <div className="st-section">
              <div className="st-section-head">
                <Lock size={16} strokeWidth={2} />
                <span>Change Password</span>
              </div>
              <div className="st-section-body">
                {pwMsg && (
                  <div className={`st-alert st-alert--${pwMsg.type}`}>
                    {pwMsg.type === "ok" ? <Check size={13} /> : <AlertTriangle size={13} />}
                    {pwMsg.text}
                  </div>
                )}
                {(["current", "next", "confirm"] as const).map(k => (
                  <div className="st-field" key={k}>
                    <label>{pwLabels[k]}</label>
                    <div className="st-pw-wrap">
                      <input
                        type={pwShow[k] ? "text" : "password"}
                        value={pwForm[k]} placeholder="••••••••"
                        onChange={e => setPwForm(f => ({ ...f, [k]: e.target.value }))}
                      />
                      <button className="st-pw-eye" type="button"
                        onClick={() => setPwShow(s => ({ ...s, [k]: !s[k] }))}>
                        {pwShow[k] ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                      </button>
                    </div>
                  </div>
                ))}
                <button className="st-btn-primary" onClick={changePassword} type="button"
                  disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}>
                  {pwSaving
                    ? <><div className="st-spin" /> Saving...</>
                    : <><Lock size={14} /> Update Password</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="st-section">
            <div className="st-section-head">
              <Bell size={16} strokeWidth={2} />
              <span>Notifications</span>
            </div>
            <div className="st-section-body st-section-body--pad0">
              {[
                { label: "New likes on my posts",    desc: "Get notified when someone likes your post",    on: true  },
                { label: "Comments on my posts",     desc: "Get notified when someone comments",           on: true  },
                { label: "Place review updates",     desc: "Updates on your submitted places",             on: true  },
                { label: "Community announcements",  desc: "General announcements from LoKally",          on: false },
              ].map((item, i) => (
                <div className="st-toggle-row" key={i}>
                  <div className="st-toggle-info">
                    <div className="st-toggle-label">{item.label}</div>
                    <div className="st-toggle-desc">{item.desc}</div>
                  </div>
                  <label className="st-toggle">
                    <input type="checkbox" defaultChecked={item.on} />
                    <span className="st-toggle-track" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="st-section">
            <div className="st-section-head">
              <Shield size={16} strokeWidth={2} />
              <span>Privacy</span>
            </div>
            <div className="st-section-body st-section-body--pad0">
              {[
                { label: "Public profile",     desc: "Allow others to view your profile",      on: true  },
                { label: "Show saved places",  desc: "Let others see your bookmarked places",  on: false },
              ].map((item, i) => (
                <div className="st-toggle-row" key={i}>
                  <div className="st-toggle-info">
                    <div className="st-toggle-label">{item.label}</div>
                    <div className="st-toggle-desc">{item.desc}</div>
                  </div>
                  <label className="st-toggle">
                    <input type="checkbox" defaultChecked={item.on} />
                    <span className="st-toggle-track" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="st-section st-section--danger">
            <div className="st-section-head st-section-head--danger">
              <AlertTriangle size={16} strokeWidth={2} />
              <span>Danger Zone</span>
            </div>
            <div className="st-section-body st-section-body--pad0">
              <button className="st-danger-row" onClick={handleLogout} type="button">
                <div className="st-danger-icon st-danger-icon--logout">
                  <LogOut size={16} strokeWidth={2} />
                </div>
                <div className="st-danger-text">
                  <div className="st-danger-title">Log out</div>
                  <div className="st-danger-desc">Sign out of your LoKally account</div>
                </div>
                <ChevronRight size={16} strokeWidth={2} className="st-arrow" />
              </button>
              <button className="st-danger-row st-danger-row--del" onClick={() => setShowDeleteModal(true)} type="button">
                <div className="st-danger-icon st-danger-icon--del">
                  <Trash2 size={16} strokeWidth={2} />
                </div>
                <div className="st-danger-text">
                  <div className="st-danger-title">Delete Account</div>
                  <div className="st-danger-desc">Permanently remove your account and all data</div>
                </div>
                <ChevronRight size={16} strokeWidth={2} className="st-arrow" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="st-overlay" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>
          <div className="st-del-modal" onClick={e => e.stopPropagation()}>
            <div className="st-del-icon"><Trash2 size={26} strokeWidth={1.8} /></div>
            <h2>Delete your account?</h2>
            <p>This is <strong>permanent and cannot be undone</strong>. All your posts, places and data will be removed forever.</p>
            <p className="st-del-hint">Type <strong>DELETE</strong> to confirm:</p>
            <input className="st-del-input" value={deleteConfirm} autoFocus
              onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
            <div className="st-del-btns">
              <button className="st-btn-ghost" type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>Cancel</button>
              <button className="st-btn-danger" type="button"
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