import bcrypt from "bcryptjs";
import { v2 as cloudinaryV2 } from "cloudinary";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Place from "../models/place.model.js";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password","verification_token","reset_code_hash","reset_session_hash","reset_code_expires","reset_session_expires"] },
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("getProfile:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const { first_name, last_name, bio, gender, location, website } = req.body;
    await user.update({
      first_name: first_name ?? user.first_name,
      last_name:  last_name  ?? user.last_name,
      bio:        bio        ?? user.bio,
      gender:     gender     ?? user.gender,
      location:   location   ?? user.location,
      website:    website    ?? user.website,
    });
    const updated = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password","verification_token","reset_code_hash","reset_session_hash","reset_code_expires","reset_session_expires"] },
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateProfile:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const imageUrl = req.file.path || req.file.secure_url;
    await user.update({ avatar: imageUrl });
    return res.json({ success: true, message: "Profile picture updated successfully", data: { avatar: imageUrl } });
  } catch (err) {
    console.error("uploadProfilePicture:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const avatar = user.avatar;
    if (avatar && avatar.includes("cloudinary")) {
      try {
        const parts = avatar.split("/");
        const fileName = parts[parts.length - 1];
        const publicId = `lokally/profile-pictures/${fileName.split(".")[0]}`;
        await cloudinaryV2.uploader.destroy(publicId);
      } catch (cloudErr) {
        console.warn("Cloudinary delete warning:", cloudErr.message);
      }
    }
    await user.update({ avatar: null });
    return res.json({ success: true, message: "Profile picture removed successfully" });
  } catch (err) {
    console.error("deleteProfilePicture:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!user.password) return res.status(400).json({ success: false, message: "This account uses social login. Password change is not available." });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ success: false, message: "Current password is incorrect" });
    await user.update({ password: await bcrypt.hash(newPassword, 10) });
    return res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    await user.destroy();
    return res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    console.error("deleteAccount:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { user_id: req.user.id },
      include: [{ model: User, as: "author", attributes: ["id", "first_name", "last_name", "avatar"] }],
      order: [["created_at", "DESC"]],
    });
    return res.json({ success: true, data: posts });
  } catch (err) {
    console.error("getMyPosts:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ← FIXED: user_id → submitted_by
export const getMyPlaces = async (req, res) => {
  try {
    const places = await Place.findAll({
      where: { submitted_by: req.user.id },
      order: [["created_at", "DESC"]],
    });
    return res.json({ success: true, data: places });
  } catch (err) {
    console.error("getMyPlaces:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      attributes: ["id", "first_name", "last_name", "avatar", "bio", "gender", "role", "created_at"],
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("getPublicProfile:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPublicUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.findAll({
      where: { user_id: userId, is_hidden: false },
      include: [{ model: User, as: "author", attributes: ["id", "first_name", "last_name", "avatar"] }],
      order: [["created_at", "DESC"]],
    });
    return res.json({ success: true, data: posts });
  } catch (err) {
    console.error("getPublicUserPosts:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ← FIXED: user_id → submitted_by
export const getPublicUserPlaces = async (req, res) => {
  try {
    const { userId } = req.params;
    const places = await Place.findAll({
      where: { submitted_by: userId },
      order: [["created_at", "DESC"]],
    });
    return res.json({ success: true, data: places });
  } catch (err) {
    console.error("getPublicUserPlaces:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};