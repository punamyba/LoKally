// notification.controller.js
// Only handles: request parsing, validation, calling service, sending response.
// Zero business logic here — all logic lives in notification.service.js

import * as NotificationService from "../services/notification.service.js";

// ── GET /api/notifications ────────────────────────────────────────────────────

export const getNotifications = async (req, res) => {
  try {
    const data = await NotificationService.fetchNotifications(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getNotifications error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/notifications/unread-count ───────────────────────────────────────

export const getUnreadCount = async (req, res) => {
  try {
    const count = await NotificationService.fetchUnreadCount(req.user.id);
    res.json({ success: true, count });
  } catch (err) {
    console.error("getUnreadCount error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PUT /api/notifications/read-all ──────────────────────────────────────────

export const markAllRead = async (req, res) => {
  try {
    await NotificationService.markAllRead(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error("markAllRead error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PUT /api/notifications/:id/read ──────────────────────────────────────────

export const markOneRead = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) // id must be a valid number
    return res.status(400).json({ success: false, message: "Valid notification ID is required" });

  try {
    await NotificationService.markOneRead(id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error("markOneRead error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── POST /api/notifications/fcm-token ────────────────────────────────────────

export const saveFcmToken = async (req, res) => {
  const { fcm_token } = req.body;

  if (!fcm_token || typeof fcm_token !== "string" || !fcm_token.trim())
    return res.status(400).json({ success: false, message: "FCM token is required" });

  try {
    await NotificationService.saveFcmToken(req.user.id, fcm_token.trim());
    res.json({ success: true });
  } catch (err) {
    console.error("saveFcmToken error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── HELPER EXPORT (called from other controllers) ─────────────────────────────
// re-export so other controllers can still import from here if needed

export const { createNotification } = NotificationService;