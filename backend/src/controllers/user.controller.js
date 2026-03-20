import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Place from "../models/place.model.js";
import cloudinary from "../config/cloudinary.config.js";

// ---------------------------------------------------------------------------
// GET /api/user/profile
// ---------------------------------------------------------------------------
export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: {
        exclude: [
          "password", "verification_token",
          "reset_code_hash", "reset_session_hash",
          "reset_code_expires", "reset_session_expires",
        ],
      },
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("getProfile:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/user/profile
// Body: { first_name, last_name, bio, phone, address, location, website, dob, gender }
// ---------------------------------------------------------------------------
export const updateProfile = async (req, res) => {
  try {
    const {
      first_name, last_name, bio,
      phone, address, location,
      website, dob, gender,
    } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const updates = {};
    if (first_name !== undefined) updates.first_name = first_name.trim();
    if (last_name  !== undefined) updates.last_name  = last_name.trim();
    if (bio        !== undefined) updates.bio        = bio.trim();
    if (phone      !== undefined) updates.phone      = phone.trim();
    if (address    !== undefined) updates.address    = address.trim();
    if (location   !== undefined) updates.location   = location.trim();
    if (website    !== undefined) updates.website    = website.trim();
    if (dob        !== undefined) updates.dob        = dob || null;
    if (gender     !== undefined) updates.gender     = gender;

    await user.update(updates);

    const updated = await User.findByPk(req.user.id, {
      attributes: {
        exclude: [
          "password", "verification_token",
          "reset_code_hash", "reset_session_hash",
          "reset_code_expires", "reset_session_expires",
        ],
      },
    });

    return res.json({ success: true, data: updated, message: "Profile updated successfully." });
  } catch (err) {
    console.error("updateProfile:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/user/profile-picture
// Cloudinary handles upload via multer-storage-cloudinary
// req.file.path = Cloudinary URL
// req.file.filename = public_id for deletion later
// ---------------------------------------------------------------------------
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file uploaded." });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Delete old Cloudinary image if it exists
    // avatar field stores: "cloudinary_public_id|||https://res.cloudinary.com/..."
    // We split by ||| to get public_id for deletion
    if (user.avatar && user.avatar.includes("|||")) {
      const oldPublicId = user.avatar.split("|||")[0];
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (e) {
        // Old image delete fail bhaye pani continue gara
        console.warn("Old image delete failed:", e.message);
      }
    }

    // Store: "public_id|||url" format
    const publicId  = req.file.filename;
    const imageUrl  = req.file.path;
    const avatarVal = `${publicId}|||${imageUrl}`;

    await user.update({ avatar: avatarVal });

    return res.json({
      success: true,
      data:    { profile_picture: imageUrl },
      message: "Profile picture updated.",
    });
  } catch (err) {
    console.error("uploadProfilePicture:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/user/profile-picture
// Removes from Cloudinary and clears avatar field
// ---------------------------------------------------------------------------
export const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Delete from Cloudinary
    if (user.avatar && user.avatar.includes("|||")) {
      const publicId = user.avatar.split("|||")[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.warn("Cloudinary delete failed:", e.message);
      }
    }

    await user.update({ avatar: null });
    return res.json({ success: true, data: { profile_picture: null }, message: "Profile picture removed." });
  } catch (err) {
    console.error("deleteProfilePicture:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/user/password
// Body: { current_password, new_password }
// ---------------------------------------------------------------------------
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password)
      return res.status(400).json({ success: false, message: "Both current and new password are required." });
    if (new_password.length < 6)
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    if (current_password === new_password)
      return res.status(400).json({ success: false, message: "New password must be different from current." });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Google-only users have no password
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "You signed in with Google. Password change is not available.",
      });
    }

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Current password is incorrect." });

    const hashed = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashed });

    return res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("changePassword:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/user/account
// ---------------------------------------------------------------------------
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Delete profile picture from Cloudinary
    if (user.avatar && user.avatar.includes("|||")) {
      const publicId = user.avatar.split("|||")[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.warn("Cloudinary delete failed:", e.message);
      }
    }

    await user.destroy();
    return res.json({ success: true, message: "Account deleted successfully." });
  } catch (err) {
    console.error("deleteAccount:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/user/my-posts  ?page=1&limit=20
// ---------------------------------------------------------------------------
export const getMyPosts = async (req, res) => {
  try {
    const { default: Post } = await import("../models/post.model.js");

    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { count, rows } = await Post.findAndCountAll({
      where:  { user_id: req.user.id },
      order:  [["created_at", "DESC"]],
      limit,
      offset,
    });

    return res.json({
      success: true,
      data:    rows,
      total:   count,
      page,
      pages:   Math.ceil(count / limit),
    });
  } catch (err) {
    console.error("getMyPosts:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/user/my-places
// ---------------------------------------------------------------------------
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