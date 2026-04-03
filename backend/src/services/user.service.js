// user.service.js — pure business logic, no req/res

import bcrypt from "bcryptjs";
import { v2 as cloudinaryV2 } from "cloudinary";
import User  from "../models/user.model.js";
import Post  from "../models/post.model.js";
import Place from "../models/place.model.js";

// fields excluded from all user responses — never expose these
const EXCLUDE_FIELDS = [
  "password", "verification_token", "reset_code_hash",
  "reset_session_hash", "reset_code_expires", "reset_session_expires",
];

// ── PROFILE ───────────────────────────────────────────────────────────────────

export const fetchProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: EXCLUDE_FIELDS },
  });
  if (!user) return { notFound: true };
  return { user };
};

export const updateProfile = async (userId, fields) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };

  const { first_name, last_name, bio, gender, location, website } = fields;

  // only update fields that were sent — keep existing values for missing ones
  await user.update({
    first_name: first_name ?? user.first_name,
    last_name:  last_name  ?? user.last_name,
    bio:        bio        ?? user.bio,
    gender:     gender     ?? user.gender,
    location:   location   ?? user.location,
    website:    website    ?? user.website,
  });

  // re-fetch clean version without sensitive fields
  const updated = await User.findByPk(userId, {
    attributes: { exclude: EXCLUDE_FIELDS },
  });
  return { user: updated };
};

// ── PROFILE PICTURE ───────────────────────────────────────────────────────────

export const uploadProfilePicture = async (userId, file) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };

  const imageUrl = file.path || file.secure_url; // cloudinary returns path or secure_url
  await user.update({ avatar: imageUrl });
  return { avatar: imageUrl };
};

export const deleteProfilePicture = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };

  // delete from cloudinary if image is hosted there
  if (user.avatar && user.avatar.includes("cloudinary")) {
    try {
      const parts    = user.avatar.split("/");
      const fileName = parts[parts.length - 1];
      const publicId = `lokally/profile-pictures/${fileName.split(".")[0]}`;
      await cloudinaryV2.uploader.destroy(publicId);
    } catch (e) { console.warn("Cloudinary delete warning:", e.message); }
  }

  await user.update({ avatar: null });
  return { ok: true };
};

// ── PASSWORD ──────────────────────────────────────────────────────────────────

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };

  // social login users have no password — can't change what doesn't exist
  if (!user.password) return { socialLogin: true };

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return { wrongPassword: true };

  await user.update({ password: await bcrypt.hash(newPassword, 10) });
  return { ok: true };
};

// ── ACCOUNT ───────────────────────────────────────────────────────────────────

export const deleteAccount = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };
  await user.destroy(); // hard delete — cascades handled by DB constraints
  return { deleted: true };
};

// ── OWN CONTENT ───────────────────────────────────────────────────────────────

export const fetchMyPosts = async (userId) => {
  return Post.findAll({
    where:   { user_id: userId },
    include: [{ model: User, as: "author", attributes: ["id", "first_name", "last_name", "avatar"] }],
    order:   [["created_at", "DESC"]],
  });
};

export const fetchMyPlaces = async (userId) => {
  return Place.findAll({
    where: { submitted_by: userId }, // submitted_by not user_id
    order: [["created_at", "DESC"]],
  });
};

// ── PUBLIC PROFILE ────────────────────────────────────────────────────────────

export const fetchPublicProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "first_name", "last_name", "avatar", "bio", "gender", "role", "created_at"],
  });
  if (!user) return { notFound: true };
  return { user };
};

export const fetchPublicUserPosts = async (userId) => {
  return Post.findAll({
    where:   { user_id: userId, is_hidden: false }, // hidden posts not shown on public profile
    include: [{ model: User, as: "author", attributes: ["id", "first_name", "last_name", "avatar"] }],
    order:   [["created_at", "DESC"]],
  });
};

export const fetchPublicUserPlaces = async (userId) => {
  return Place.findAll({
    where: { submitted_by: userId }, // submitted_by not user_id
    order: [["created_at", "DESC"]],
  });
};