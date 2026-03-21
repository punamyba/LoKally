import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import User from "../models/user.model.js";
import Place from "../models/place.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── GET /api/user/profile ──────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password","verification_token","reset_code_hash","reset_session_hash","reset_code_expires","reset_session_expires"] },
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/user/profile ──────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, bio, phone, address, dob, gender } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    const updates = {};
    if (first_name !== undefined) updates.first_name = first_name.trim();
    if (last_name  !== undefined) updates.last_name  = last_name.trim();
    if (bio        !== undefined) updates.bio        = bio.trim();
    if (phone      !== undefined) updates.phone      = phone.trim();
    if (address    !== undefined) updates.address    = address.trim();
    if (dob        !== undefined) updates.dob        = dob || null;
    if (gender     !== undefined) updates.gender     = gender;
    await user.update(updates);
    const updated = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password","verification_token","reset_code_hash","reset_session_hash","reset_code_expires","reset_session_expires"] },
    });
    return res.json({ success: true, data: updated, message: "Profile updated." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/user/profile-picture ────────────────────────────────────────
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded." });
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user.avatar && user.avatar.startsWith("/uploads/")) {
      try {
        const oldPath = path.resolve("." + user.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch {}
    }
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    await user.update({ avatar: imageUrl });
    return res.json({ success: true, data: { profile_picture: imageUrl }, message: "Profile picture updated." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/user/profile-picture ──────────────────────────────────────
export const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user.avatar && user.avatar.startsWith("/uploads/")) {
      try {
        const oldPath = path.resolve("." + user.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch {}
    }
    await user.update({ avatar: null });
    return res.json({ success: true, message: "Profile picture removed." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/user/password ─────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ success: false, message: "Both passwords required." });
    if (new_password.length < 6) return res.status(400).json({ success: false, message: "Min 6 characters." });
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (!user.password) return res.status(400).json({ success: false, message: "Google users cannot change password." });
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Current password is incorrect." });
    await user.update({ password: await bcrypt.hash(new_password, 10) });
    return res.json({ success: true, message: "Password changed." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/user/account ───────────────────────────────────────────────
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user.avatar && user.avatar.startsWith("/uploads/")) {
      try {
        const oldPath = path.resolve("." + user.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch {}
    }
    await user.destroy();
    return res.json({ success: true, message: "Account deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/user/my-posts ─────────────────────────────────────────────────
export const getMyPosts = async (req, res) => {
  try {
    const { default: Post }         = await import("../models/post.model.js");
    const { default: PostLike }     = await import("../models/postlike.model.js").catch(() => ({ default: null }));
    const { default: PostBookmark } = await import("../models/postbookmark.model.js").catch(() => ({ default: null }));

    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { count, rows } = await Post.findAndCountAll({
      where:   { user_id: req.user.id },
      order:   [["created_at", "DESC"]],
      include: [{ model: User, as: "author", attributes: ["id","first_name","last_name","avatar"] }],
      limit, offset,
    });

    const userId = req.user.id;
    const posts  = await Promise.all(rows.map(async post => {
      const p = post.toJSON();
      if (PostLike) {
        const like   = await PostLike.findOne({ where: { post_id: p.id, user_id: userId } });
        p.has_liked  = !!like;
        p.liked_type = like?.react_type || "like";
      } else { p.has_liked = false; p.liked_type = "like"; }
      if (PostBookmark) {
        const bm        = await PostBookmark.findOne({ where: { post_id: p.id, user_id: userId } });
        p.is_bookmarked = !!bm;
      } else { p.is_bookmarked = false; }
      return p;
    }));

    return res.json({ success: true, data: posts, total: count, page, pages: Math.ceil(count / limit) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/user/my-places ────────────────────────────────────────────────
export const getMyPlaces = async (req, res) => {
  try {
    const places = await Place.findAll({
      where: { submitted_by: req.user.id },
      order: [["created_at", "DESC"]],
    });
    return res.json({ success: true, data: places });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/user/public/:userId ───────────────────────────────────────────
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: ["id","first_name","last_name","bio","avatar","gender","role","created_at"],
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/user/public/:userId/posts ────────────────────────────────────
export const getPublicUserPosts = async (req, res) => {
  try {
    const { default: Post }         = await import("../models/post.model.js");
    const { default: PostLike }     = await import("../models/postlike.model.js").catch(() => ({ default: null }));
    const { default: PostBookmark } = await import("../models/postbookmark.model.js").catch(() => ({ default: null }));

    const userId   = parseInt(req.params.userId);
    const viewerId = req.user?.id;

    const rows = await Post.findAll({
      where:   { user_id: userId, is_hidden: false },
      order:   [["created_at", "DESC"]],
      include: [{ model: User, as: "author", attributes: ["id","first_name","last_name","avatar"] }],
      limit:   30,
    });

    const posts = await Promise.all(rows.map(async post => {
      const p = post.toJSON();
      if (viewerId && PostLike) {
        const like   = await PostLike.findOne({ where: { post_id: p.id, user_id: viewerId } });
        p.has_liked  = !!like;
        p.liked_type = like?.react_type || "like";
      } else { p.has_liked = false; p.liked_type = "like"; }
      if (viewerId && PostBookmark) {
        const bm        = await PostBookmark.findOne({ where: { post_id: p.id, user_id: viewerId } });
        p.is_bookmarked = !!bm;
      } else { p.is_bookmarked = false; }
      return p;
    }));

    return res.json({ success: true, data: posts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/user/public/:userId/places ── NEW ─────────────────────────────
export const getPublicUserPlaces = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const places = await Place.findAll({
      where:  { submitted_by: userId, status: "approved" },
      order:  [["created_at", "DESC"]],
      limit:  30,
    });
    return res.json({ success: true, data: places });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};