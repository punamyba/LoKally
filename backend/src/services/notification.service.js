// notification.service.js — pure business logic, no req/res

import Notification from "../models/notification.model.js";
import User         from "../models/user.model.js";

// ── FETCH NOTIFICATIONS ───────────────────────────────────────────────────────

export const fetchNotifications = async (userId) => {
  // latest 40 notifications with actor info (who triggered the notification)
  return Notification.findAll({
    where:   { user_id: userId },
    order:   [["created_at", "DESC"]],
    limit:   40,
    include: [
      {
        model:      User,
        as:         "actor",
        attributes: ["id", "first_name", "last_name", "avatar"],
        required:   false, // actor can be null for system notifications
      },
    ],
  });
};

// ── UNREAD COUNT ──────────────────────────────────────────────────────────────

export const fetchUnreadCount = async (userId) => {
  return Notification.count({
    where: { user_id: userId, is_read: false },
  });
};

// ── MARK ALL READ ─────────────────────────────────────────────────────────────

export const markAllRead = async (userId) => {
  // bulk update — only touches unread ones to avoid unnecessary writes
  await Notification.update(
    { is_read: true },
    { where: { user_id: userId, is_read: false } }
  );
  return { ok: true };
};

// ── MARK ONE READ ─────────────────────────────────────────────────────────────

export const markOneRead = async (notificationId, userId) => {
  // user_id in where clause ensures users can only mark their own notifications
  await Notification.update(
    { is_read: true },
    { where: { id: notificationId, user_id: userId } }
  );
  return { ok: true };
};

// ── SAVE FCM TOKEN ────────────────────────────────────────────────────────────

export const saveFcmToken = async (userId, fcmToken) => {
  // FCM token used for push notifications on mobile devices
  await User.update({ fcm_token: fcmToken }, { where: { id: userId } });
  return { ok: true };
};

// ── CREATE NOTIFICATION (helper — called from other services) ─────────────────

export const createNotification = async ({ user_id, actor_id, type, post_id = null, place_id = null, message }) => {
  try {
    if (user_id === actor_id) return; // never notify a user about their own actions
    await Notification.create({ user_id, actor_id, type, post_id, place_id, message });
  } catch (err) {
    console.error("createNotification error:", err.message);
  }
};