import { useState, useRef } from "react";
import { Image, X, MapPin } from "lucide-react";
import { communityApi } from "../communityApi";
import type { Post } from "../CommunityTypes";
import "./CreatePost.css";

interface Props {
  currentUser: { id: number; first_name: string; last_name: string };
  onCreated: (post: Post) => void;
}

export default function CreatePost({ currentUser, onCreated }: Props) {
  const [open, setOpen]         = useState(false);
  const [caption, setCaption]   = useState("");
  const [files, setFiles]       = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = `${currentUser.first_name[0]}${currentUser.last_name?.[0] ?? ""}`.toUpperCase();

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

  const submit = async () => {
    if (!caption.trim() && files.length === 0) { setErr("Write something or add a photo!"); return; }
    setLoading(true); setErr("");
    try {
      const fd = new FormData();
      if (caption.trim()) fd.append("caption", caption.trim());
      files.forEach(f => fd.append("images", f));
      const r = await communityApi.createPost(fd);
      if (r.success) {
        onCreated(r.data);
        setCaption(""); setFiles([]); previews.forEach(URL.revokeObjectURL); setPreviews([]); setOpen(false);
      } else setErr(r.message || "Failed.");
    } catch { setErr("Something went wrong."); }
    setLoading(false);
  };

  const cancel = () => {
    setCaption(""); setFiles([]); previews.forEach(URL.revokeObjectURL); setPreviews([]); setOpen(false); setErr("");
  };

  return (
    <div className={`cp ${open ? "cp--open" : ""}`}>

      {/* Collapsed trigger */}
      {!open && (
        <div className="cp-trigger" onClick={() => setOpen(true)}>
          <div className="cp-av">{initials}</div>
          <div className="cp-placeholder">
            What's on your mind, {currentUser.first_name}?
          </div>
          <button className="cp-photo-btn" onClick={e => { e.stopPropagation(); setOpen(true); }}>
            <Image size={16} /> Photo
          </button>
        </div>
      )}

      {/* Expanded */}
      {open && (
        <>
          <div className="cp-head">
            <div className="cp-av">{initials}</div>
            <div>
              <div className="cp-username">{currentUser.first_name} {currentUser.last_name}</div>
              <div className="cp-scope">🌏 Public</div>
            </div>
          </div>

          {err && <div className="cp-err">{err}</div>}

          <textarea
            className="cp-textarea"
            placeholder={`What's on your mind, ${currentUser.first_name}?`}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            autoFocus
            rows={3}
          />

          {/* Previews */}
          {previews.length > 0 && (
            <div className={`cp-previews cp-previews--${Math.min(previews.length, 3)}`}>
              {previews.map((src, i) => (
                <div key={i} className="cp-preview-wrap">
                  <img src={src} alt="" className="cp-preview-img" />
                  <button className="cp-remove" onClick={() => removeFile(i)}>
                    <X size={11} strokeWidth={3} />
                  </button>
                </div>
              ))}
              {files.length < 10 && (
                <button className="cp-add-more" onClick={() => fileRef.current?.click()}>+ More</button>
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="cp-toolbar">
            <span className="cp-toolbar-label">Add to post</span>
            <div className="cp-toolbar-btns">
              <button className="cp-tool cp-tool--green" title="Photos" onClick={() => fileRef.current?.click()}>
                <Image size={19} />
              </button>
              <button className="cp-tool cp-tool--blue" title="Location" disabled>
                <MapPin size={19} />
              </button>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => addFiles(e.target.files)} />

          <div className="cp-footer">
            <button className="cp-cancel" onClick={cancel} disabled={loading}>Cancel</button>
            <button className="cp-submit" onClick={submit} disabled={loading}>
              {loading ? "Posting…" : "Post"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}