// place.service.js — pure business logic, no req/res

import { Place, User } from "../models/index.js";
import PostReport from "../models/postreport.model.js";
import { MapPlaceDTO, FeaturedPlaceDTO, PlaceDetailDTO } from "../DTOs/place.dto.js";

// ── PUBLIC ────────────────────────────────────────────────────────────────────

export const fetchApprovedPlaces = async () => {
  const places = await Place.findAll({
    where: { status: "approved" },
    order: [["created_at", "DESC"]],
  });
  return places.map(MapPlaceDTO); // map markers — sirf necessary fields
};

export const fetchPlaceById = async (id) => {
  const place = await Place.findOne({
    where:   { id, status: "approved" },
    include: [{ model: User, as: "submitter", attributes: ["id", "first_name", "last_name"] }],
  });
  if (!place) return { notFound: true };
  return { place: PlaceDetailDTO(place) }; // detail page — sabai fields
};

export const fetchFeaturedPlaces = async () => {
  const places = await Place.findAll({
    where: { status: "approved", is_featured: true },
    order: [["created_at", "DESC"]],
  });
  return places.map(FeaturedPlaceDTO); // home page cards — image + description
};

export const fetchPlaceStats = async () => {
  const [total, approved, users] = await Promise.all([
    Place.count(),
    Place.count({ where: { status: "approved" } }),
    User.count(),
  ]);
  return { total, approved, users };
};

// ── USER ──────────────────────────────────────────────────────────────────────

export const createPlace = async ({ name, address, description, category, lat, lng, files, file, userId }) => {
  let imageValue = null;
  if (files && files.length > 0) {
    const paths = files.map(f => `/uploads/places/${f.filename}`);
    imageValue = paths.length === 1 ? paths[0] : JSON.stringify(paths);
  } else if (file) {
    imageValue = `/uploads/places/${file.filename}`;
  }

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
  const place = await Place.findOne({ where: { id: placeId, submitted_by: userId } });
  if (!place) return { notFound: true };

  const { name, address, description, category, lat, lng } = fields;
  const updates = { name, address, description, category };
  if (lat)  updates.lat   = parseFloat(lat);
  if (lng)  updates.lng   = parseFloat(lng);
  if (file) updates.image = `/uploads/places/${file.filename}`;

  await place.update(updates);
  return { place };
};

export const deleteUserPlace = async ({ placeId, userId }) => {
  const affected = await Place.destroy({ where: { id: placeId, submitted_by: userId } });
  if (affected === 0) return { notFound: true };
  return { deleted: true };
};

export const reportPlace = async ({ placeId, userId, reason, note }) => {
  const place = await Place.findByPk(placeId);
  if (!place) return { notFound: true };

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