// place.service.js — pure business logic, no req/res

import { Place, User } from "../models/index.js";
import PostReport from "../models/postreport.model.js";

// ── PUBLIC ────────────────────────────────────────────────────────────────────

export const fetchApprovedPlaces = async () => {
  // only approved places shown to public — pending/rejected hidden
  return Place.findAll({
    where: { status: "approved" },
    include: [{ model: User, as: "submitter", attributes: ["id", "first_name", "last_name"] }],
    order: [["created_at", "DESC"]],
  });
};

export const fetchPlaceById = async (id) => {
  const place = await Place.findOne({
    where: { id, status: "approved" }, // non-approved places return notFound to public
    include: [{ model: User, as: "submitter", attributes: ["id", "first_name", "last_name"] }],
  });
  if (!place) return { notFound: true };
  return { place };
};

export const fetchFeaturedPlaces = async () => {
  // only admin-marked (is_featured: true) approved places
  return Place.findAll({
    where: { status: "approved", is_featured: true },
    order: [["created_at", "DESC"]],
  });
};

export const fetchPlaceStats = async () => {
  // run all three counts in parallel for speed
  const [total, approved, users] = await Promise.all([
    Place.count(),
    Place.count({ where: { status: "approved" } }),
    User.count(),
  ]);
  return { total, approved, users };
};

// ── USER ──────────────────────────────────────────────────────────────────────

export const createPlace = async ({ name, address, description, category, lat, lng, files, file, userId }) => {
  // build image value — single string if 1 file, JSON array if multiple
  let imageValue = null;
  if (files && files.length > 0) {
    const paths = files.map(f => `/uploads/places/${f.filename}`);
    imageValue = paths.length === 1 ? paths[0] : JSON.stringify(paths);
  } else if (file) {
    imageValue = `/uploads/places/${file.filename}`;
  }

  // user-submitted places always start as pending — must be approved by admin
  return Place.create({
    name,
    address,
    description:  description || "",
    category:     category || null,
    lat:          parseFloat(lat),
    lng:          parseFloat(lng),
    image:        imageValue,
    submitted_by: userId,
    status:       "pending",
  });
};

export const updateUserPlace = async ({ placeId, userId, fields, file }) => {
  // findOne with submitted_by ensures user can only edit their own places
  const place = await Place.findOne({ where: { id: placeId, submitted_by: userId } });
  if (!place) return { notFound: true }; // covers both "not found" and "not owner"

  const { name, address, description, category, lat, lng } = fields;
  const updates = { name, address, description, category };
  if (lat)  updates.lat   = parseFloat(lat);
  if (lng)  updates.lng   = parseFloat(lng);
  if (file) updates.image = `/uploads/places/${file.filename}`; // replace image if new one uploaded

  await place.update(updates);
  return { place };
};

export const deleteUserPlace = async ({ placeId, userId }) => {
  // destroy with submitted_by check — user can only delete their own places
  const affected = await Place.destroy({ where: { id: placeId, submitted_by: userId } });
  if (affected === 0) return { notFound: true }; // 0 rows = not found or not owner
  return { deleted: true };
};

export const reportPlace = async ({ placeId, userId, reason, note }) => {
  const place = await Place.findByPk(placeId);
  if (!place) return { notFound: true };

  // one report per user per place — prevent spam
  const existing = await PostReport.findOne({ where: { place_id: placeId, user_id: userId } });
  if (existing) return { alreadyReported: true };

  await PostReport.create({
    place_id: placeId,
    user_id:  userId,
    reason:   reason.trim(),
    note:     note?.trim() || null,
  });

  return { ok: true };
};