import { useEffect, useState, useCallback } from "react";
import "./Toast.css";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12l3 3 5-5"/>
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M15 9l-6 6M9 9l6 6"/>
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

function ToastItem({ toast, onClose }: ToastProps) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 4000;

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onClose(toast.id), 320);
  }, [toast.id, onClose]);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 16);

    const timer = setTimeout(handleClose, duration);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [duration, handleClose]);

  return (
    <div className={`toast toast--${toast.type} ${exiting ? "toast--exit" : "toast--enter"}`}>
      <div className="toast-icon-wrap">
        <div className="toast-icon">{ICONS[toast.type]}</div>
      </div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>
      <button className="toast-close" onClick={handleClose}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <div className="toast-progress">
        <div
          className="toast-progress-bar"
          style={{ width: `${progress}%`, transition: "width 16ms linear" }}
        />
      </div>
    </div>
  );
}

// ── Global toast manager ─────────────────────────────────────
type Listener = (toasts: ToastData[]) => void;
let toasts: ToastData[] = [];
const listeners: Set<Listener> = new Set();

const notify = () => listeners.forEach(l => l([...toasts]));

export const toast = {
  show(type: ToastType, title: string, message?: string, duration?: number) {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, type, title, message, duration }];
    notify();
  },
  success(title: string, message?: string) { this.show("success", title, message); },
  error(title: string, message?: string)   { this.show("error",   title, message); },
  info(title: string, message?: string)    { this.show("info",    title, message); },
  warning(title: string, message?: string) { this.show("warning", title, message); },
  remove(id: string) {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  },
};

// ── Toast Container (add once in App.tsx root) ───────────────
export function ToastContainer() {
  const [items, setItems] = useState<ToastData[]>([]);

  useEffect(() => {
    const handler: Listener = (t) => setItems(t);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  return (
    <div className="toast-container">
      {items.map(t => (
        <ToastItem key={t.id} toast={t} onClose={toast.remove} />
      ))}
    </div>
  );
}