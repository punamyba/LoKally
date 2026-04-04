import bcrypt from "bcrypt";
import User  from "../models/user.model.js";
import Post  from "../models/post.model.js";
import Place from "../models/place.model.js";
import { NavbarUserDTO, ProfileDTO, PublicProfileDTO } from "../DTOs/user.dto.js";

// ── PROFILE ───────────────────────────────────────────────────────────────────

// navbar/dropdown ko lagi — sirf naam ra avatar
export const fetchMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };
  return { user: NavbarUserDTO(user) }; // DTO apply — unnecessary fields hataucha
};

// full profile page ko lagi
export const fetchProfile = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };
  return { user: ProfileDTO(user) }; // DTO apply — email, bio etc. include garcha
};

export const updateProfile = async (userId, body, file) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };

  const updateData = {
    first_name: body.first_name?.trim() || user.first_name,
    last_name:  body.last_name?.trim()  || user.last_name,
    bio:        body.bio?.trim()        || null,
    gender:     body.gender             || null,
  };

  if (file) updateData.avatar = `/uploads/profiles/${file.filename}`;

  await user.update(updateData);

  const updated = await User.findByPk(userId);
  return { user: ProfileDTO(updated) }; // updated user lai DTO apply
};

// ── PROFILE PICTURE ───────────────────────────────────────────────────────────

export const uploadProfilePicture = async (userId, file) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };

  const avatar = `/uploads/profiles/${file.filename}`;
  await user.update({ avatar });
  return { avatar };
};

export const deleteProfilePicture = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };

  await user.update({ avatar: null });
  return { ok: true };
};

// ── PASSWORD ──────────────────────────────────────────────────────────────────

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user)          return { notFound: true };
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

  await user.destroy();
  return { ok: true };
};

// ── OWN CONTENT ───────────────────────────────────────────────────────────────

export const fetchMyPosts = async (userId) => {
  return Post.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
  });
};

export const fetchMyPlaces = async (userId) => {
  return Place.findAll({
    where: { submitted_by: userId },
    order: [["created_at", "DESC"]],
  });
};

// ── PUBLIC PROFILE ────────────────────────────────────────────────────────────

export const fetchPublicProfile = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };
  return { user: PublicProfileDTO(user) }; // email hide garcha
};

export const fetchPublicUserPosts = async (userId) => {
  return Post.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
  });
};

export const fetchPublicUserPlaces = async (userId) => {
  return Place.findAll({
    where: { submitted_by: userId },
    order: [["created_at", "DESC"]],
  });
};