import { Place, User } from "../models/db.sync.js";

const placeWithUser = {
  include: [
    { model: User, as: "submitter", attributes: ["id", "first_name", "last_name", "email"] },
    { model: User, as: "approver", attributes: ["id", "first_name", "last_name"] },
  ],
};

/* STATS + pending preview */
export const getStats = async (req, res) => {
  try {
    const [users, places, pending, approved, rejected] = await Promise.all([
      User.count(),
      Place.count(),
      Place.count({ where: { status: "pending" } }),
      Place.count({ where: { status: "approved" } }),
      Place.count({ where: { status: "rejected" } }),
    ]);

    const pendingPreview = await Place.findAll({
      where: { status: "pending" },
      ...placeWithUser,
      order: [["created_at", "DESC"]],
      limit: 5,
    });

    res.json({ success: true, data: { stats: { users, places, pending, approved, rejected }, pendingPreview } });
  } catch (err) {
    console.error("admin getStats error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ALL PLACES with optional status filter */
export const getPlaces = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      where.status = status;
    }

    const places = await Place.findAll({
      where,
      ...placeWithUser,
      order: [["created_at", "DESC"]],
    });

    res.json({ success: true, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* APPROVE */
export const approvePlace = async (req, res) => {
  try {
    const place = await Place.findByPk(req.params.id);
    if (!place)
      return res.status(404).json({ success: false, message: "Place feuna" });

    await place.update({
      status: "approved",
      approved_by: req.user.id,
      approved_at: new Date(),
      rejected_reason: null,
    });

    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* REJECT */
export const rejectPlace = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason)
      return res.status(400).json({ success: false, message: "Reason chainxa" });

    const place = await Place.findByPk(req.params.id);
    if (!place)
      return res.status(404).json({ success: false, message: "Place feuna" });

    await place.update({
      status: "rejected",
      approved_by: req.user.id,
      rejected_reason: reason,
    });

    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ALL USERS */
export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password", "reset_code_hash", "reset_session_hash", "verification_token"] },
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ADMIN ADD PLACE (auto approved) */
export const addPlace = async (req, res) => {
  try {
    const { name, address, description, category, lat, lng } = req.body;
    if (!name || !address || !lat || !lng)
      return res.status(400).json({ success: false, message: "name, address, lat, lng chainxa" });

    const image = req.file ? `/uploads/places/${req.file.filename}` : null;

    const place = await Place.create({
      name,
      address,
      description: description || "",
      category: category || null,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      image,
      submitted_by: req.user.id,
      status: "approved",
      approved_by: req.user.id,
      approved_at: new Date(),
    });

    res.status(201).json({ success: true, data: place });
  } catch (err) {
    console.error("admin addPlace error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ADMIN UPDATE PLACE */
export const updatePlace = async (req, res) => {
  try {
    const place = await Place.findByPk(req.params.id);
    if (!place)
      return res.status(404).json({ success: false, message: "Place feuna" });

    const { name, address, description, category, lat, lng, status } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (address) updates.address = address;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (lat) updates.lat = parseFloat(lat);
    if (lng) updates.lng = parseFloat(lng);
    if (status) updates.status = status;
    if (req.file) updates.image = `/uploads/places/${req.file.filename}`;

    await place.update(updates);
    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ADMIN DELETE PLACE */
export const deletePlace = async (req, res) => {
  try {
    const affected = await Place.destroy({ where: { id: req.params.id } });
    if (affected === 0)
      return res.status(404).json({ success: false, message: "Place feuna" });
    res.json({ success: true, message: "Place delete vayo" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};