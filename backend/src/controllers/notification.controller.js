import Notification from "../models/notification.model.js";
import User         from "../models/user.model.js";

// ── GET /api/notifications ─────────────────────────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where:   { user_id: req.user.id },
      order:   [["created_at", "DESC"]],
      limit:   40,
      include: [
        {
          model:      User,
          as:         "actor",
          attributes: ["id", "first_name", "last_name", "avatar"],
        },
      ],
    });
    return res.json({ success: true, data: notifications });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/notifications/unread-count ────────────────────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { user_id: req.user.id, is_read: false },
    });
    return res.json({ success: true, count });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/notifications/read-all ───────────────────────────────────────
export const markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/notifications/:id/read ───────────────────────────────────────
export const markOneRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { id: req.params.id, user_id: req.user.id } }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/notifications/fcm-token ─────────────────────────────────────
export const saveFcmToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    await User.update({ fcm_token }, { where: { id: req.user.id } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── Helper: create a notification (called from other controllers) ──────────
export const createNotification = async ({
  user_id,
  actor_id,
  type,
  post_id  = null,
  place_id = null,
  message,
}) => {
  try {
    if (user_id === actor_id) return; // don't notify yourself
    await Notification.create({ user_id, actor_id, type, post_id, place_id, message });
  } catch (err) {
    console.error("createNotification error:", err.message);
  }
};