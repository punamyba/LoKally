import { useState, useRef, useEffect } from "react";
import { Image, X, MapPin, Globe, Lock, Tag, ChevronDown } from "lucide-react";
import { communityApi } from "../communityApi";
import type { Post } from "../CommunityTypes";
import "./CreatePost.css";
import { refreshPoints } from "../../../../shared/utils/pointsEvent";

const SERVER = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001";

function getAvatarUrl(avatar?: string | null): string | null {
  if (!avatar) return null;
  if (avatar.includes("|||")) return avatar.split("|||")[1];
  if (avatar.startsWith("http")) return avatar;
  if (avatar.startsWith("/")) return `${SERVER}${avatar}`;
  return null;
}

const QUICK_TAGS = [
  "Peaceful", "Scenic", "Hiking", "Adventure", "Photography",
  "Sunrise", "Wildlife", "Cultural", "Historical", "Hidden Gem",
  "Family Friendly", "Budget Friendly", "Trekking", "Waterfall",
];

interface Props {
  currentUser: { id: number; first_name: string; last_name: string; avatar?: string | null };
  onCreated: (post: Post) => void;
}

export default function CreatePost({ currentUser, onCreated }: Props) {
  const [open, setOpen]             = useState(false);
  const [caption, setCaption]       = useState("");
  const [files, setFiles]           = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker]     = useState(false);
  const [showVisibility, setShowVisibility]   = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("currentUser") || "{}"); } catch { return {}; }
  })();
  const avatar   = currentUser.avatar || storedUser.avatar;
  const picUrl   = getAvatarUrl(avatar);
  const initials = `${currentUser.first_name[0]}${currentUser.last_name?.[0] ?? ""}`.toUpperCase();

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaption(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    const arr = Array.from(fl).slice(0, 10 - files.length);
    setPreviews(p => [...p, ...arr.map(f => URL.createObjectURL(f))]);
    setFiles(p => [...p, ...arr]);
  };

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(p => p.filter((_, j) => j !== i));
    setPreviews(p => p.filter((_, j) => j !== i));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const submit = async () => {
    if (!caption.trim() && files.length === 0) {
      setError("Write something or add a photo!"); return;
    }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      if (caption.trim()) fd.append("caption", caption.trim());
      files.forEach(f => fd.append("images", f));
      fd.append("visibility", visibility);
      if (selectedTags.length > 0) fd.append("tags", JSON.stringify(selectedTags));
      const r = await communityApi.createPost(fd);
      if (r.success) {
        onCreated(r.data);
        refreshPoints(); // post created = +15 pts
        resetForm();
      } else setError(r.message || "Failed.");
    } catch { setError("Something went wrong."); }
    setLoading(false);
  };

  const resetForm = () => {
    setCaption(""); setFiles([]);
    previews.forEach(URL.revokeObjectURL);
    setPreviews([]); setOpen(false); setError("");
    setSelectedTags([]); setVisibility("public");
    setShowTagPicker(false);
  };

  return (
    <div className={`create-post ${open ? "create-post--open" : ""}`}>

      {!open && (
        <div className="cp-trigger" onClick={() => setOpen(true)}>
          <div className="cp-avatar">
            {picUrl
              ? <img src={picUrl} alt={initials} className="cp-avatar-img" />
              : <span className="cp-avatar-initials">{initials}</span>}
          </div>
          <div className="cp-placeholder">
            What's on your mind, {currentUser.first_name}?
          </div>
          <button className="cp-photo-trigger" onClick={e => { e.stopPropagation(); setOpen(true); }}>
            <Image size={16} /> Photo
          </button>
        </div>
      )}

      {open && (
        <div className="cp-form">
          <div className="cp-author-row">
            <div className="cp-avatar">
              {picUrl
                ? <img src={picUrl} alt={initials} className="cp-avatar-img" />
                : <span className="cp-avatar-initials">{initials}</span>}
            </div>
            <div className="cp-author-info">
              <div className="cp-author-name">{currentUser.first_name} {currentUser.last_name}</div>
              <div className="cp-visibility-wrap">
                <button className="cp-visibility-btn" onClick={() => setShowVisibility(v => !v)}>
                  {visibility === "public"
                    ? <><Globe size={12} /> Public</>
                    : <><Lock size={12} /> Only Me</>}
                  <ChevronDown size={11} />
                </button>
                {showVisibility && (
                  <div className="cp-visibility-dropdown">
                    <button onClick={() => { setVisibility("public"); setShowVisibility(false); }}
                      className={visibility === "public" ? "active" : ""}>
                      <Globe size={14} /> Public
                      <span>Everyone can see</span>
                    </button>
                    <button onClick={() => { setVisibility("private"); setShowVisibility(false); }}
                      className={visibility === "private" ? "active" : ""}>
                      <Lock size={14} /> Only Me
                      <span>Only you can see</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && <div className="cp-error">{error}</div>}

          <textarea
            ref={textareaRef}
            className="cp-textarea"
            placeholder={`What's on your mind, ${currentUser.first_name}?`}
            value={caption}
            onChange={handleCaptionChange}
            autoFocus
          />

          {selectedTags.length > 0 && (
            <div className="cp-selected-tags">
              {selectedTags.map(tag => (
                <span key={tag} className="cp-selected-tag">
                  #{tag}
                  <button onClick={() => toggleTag(tag)}><X size={10} strokeWidth={3} /></button>
                </span>
              ))}
            </div>
          )}

          {previews.length > 0 && (
            <div className={`cp-previews cp-previews--${Math.min(previews.length, 3)}`}>
              {previews.map((src, i) => (
                <div key={i} className="cp-preview-item">
                  <img src={src} alt="" className="cp-preview-img" />
                  <button className="cp-preview-remove" onClick={() => removeFile(i)}>
                    <X size={11} strokeWidth={3} />
                  </button>
                </div>
              ))}
              {files.length < 10 && (
                <button className="cp-add-more" onClick={() => fileRef.current?.click()}>+ More</button>
              )}
            </div>
          )}

          {showTagPicker && (
            <div className="cp-tag-picker">
              <div className="cp-tag-picker-title">Select tags</div>
              <div className="cp-tag-grid">
                {QUICK_TAGS.map(tag => (
                  <button key={tag}
                    className={`cp-tag-option ${selectedTags.includes(tag) ? "cp-tag-option--active" : ""}`}
                    onClick={() => toggleTag(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="cp-toolbar">
            <span className="cp-toolbar-label">Add to post</span>
            <div className="cp-toolbar-actions">
              <button className="cp-tool cp-tool--green" title="Photos"
                onClick={() => fileRef.current?.click()}>
                <Image size={19} />
              </button>
              <button className={`cp-tool cp-tool--purple ${showTagPicker ? "cp-tool--active" : ""}`}
                title="Tags" onClick={() => setShowTagPicker(t => !t)}>
                <Tag size={19} />
              </button>
              <button className="cp-tool cp-tool--blue" title="Location" disabled>
                <MapPin size={19} />
              </button>
            </div>
          </div>

          <input ref={fileRef} type="file" accept="image/*" multiple hidden
            onChange={e => addFiles(e.target.files)} />

          <div className="cp-footer">
            <button className="cp-cancel-btn" onClick={resetForm} disabled={loading}>Cancel</button>
            <button className="cp-post-btn" onClick={submit} disabled={loading}>
              {loading ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}