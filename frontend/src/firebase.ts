// frontend/src/firebase.ts
// ─────────────────────────────────────────────────────────────────────────────
// Firebase FCM setup for LoKally Nepal push notifications
// ─────────────────────────────────────────────────────────────────────────────
// SETUP STEPS:
// 1. Go to https://console.firebase.google.com
// 2. Create project "LoKally Nepal"
// 3. Add web app → copy firebaseConfig below
// 4. Go to Project Settings → Cloud Messaging → copy VAPID key
// 5. Run: npm install firebase
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp }        from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app       = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const API       = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// ── Request permission + save FCM token to backend ────────────────────────
export async function requestNotificationPermission(): Promise<void> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return;

    // Save token to backend
    const authToken = localStorage.getItem("token") || "";
    await fetch(`${API}/notifications/fcm-token`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${authToken}`,
      },
      body: JSON.stringify({ fcm_token: token }),
    });

    console.log("FCM token saved:", token.slice(0, 20) + "...");
  } catch (err) {
    console.error("FCM permission error:", err);
  }
}

// ── Listen for foreground messages ─────────────────────────────────────────
export function onForegroundMessage(callback: (payload: any) => void) {
  return onMessage(messaging, callback);
}

export { messaging };