// backend/src/utils/pushNotification.js
// ─────────────────────────────────────────────────────────────────────────────
// Firebase Admin SDK — send push notifications
// ─────────────────────────────────────────────────────────────────────────────
// SETUP STEPS:
// 1. Firebase Console → Project Settings → Service Accounts
// 2. Generate new private key → save as backend/firebase-service-account.json
// 3. Run: npm install firebase-admin
// ─────────────────────────────────────────────────────────────────────────────

import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Initialize only once
if (!admin.apps.length) {
  try {
    const serviceAccount = require("../../firebase-service-account.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized");
  } catch (err) {
    console.error("Firebase Admin init error:", err.message);
  }
}

// ── Send push to a single FCM token ───────────────────────────────────────
export async function sendPushNotification({ fcm_token, title, body, data = {} }) {
  if (!fcm_token) return;
  try {
    await admin.messaging().send({
      token: fcm_token,
      notification: { title, body },
      data,
      webpush: {
        notification: {
          icon:  "/lokally-icon.png",
          badge: "/lokally-badge.png",
          click_action: "https://lokally.com",
        },
      },
    });
  } catch (err) {
    // Token expired/invalid — clear it from DB
    if (err.code === "messaging/registration-token-not-registered") {
      console.log("Invalid FCM token, clearing from DB");
      // You can add: await User.update({ fcm_token: null }, { where: { fcm_token } });
    } else {
      console.error("Push notification error:", err.message);
    }
  }
}

// ── Example usage in notification.controller.js ───────────────────────────
/*
  import { sendPushNotification } from "../utils/pushNotification.js";

  // After creating in-app notification:
  const recipient = await User.findByPk(user_id, { attributes: ["fcm_token"] });
  if (recipient?.fcm_token) {
    await sendPushNotification({
      fcm_token: recipient.fcm_token,
      title: "LoKally Nepal",
      body:  message,
      data:  { type, post_id: String(post_id || ""), place_id: String(place_id || "") },
    });
  }
*/