import { Place, User } from "../models/db.sync.js";

/* PUBLIC: approved places only */
export const getPlaces = async (req, res) => {
  try {
    const places = await Place.findAll({
      where: { status: "approved" },
      include: [{ model: User, as: "submitter", attributes: ["id", "first_name", "last_name"] }],
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: places });
  } catch (err) {
    console.error("getPlaces error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* PUBLIC: single approved place */
export const getPlaceById = async (req, res) => {
  try {
    const place = await Place.findOne({
      where: { id: req.params.id, status: "approved" },
      include: [{ model: User, as: "submitter", attributes: ["id", "first_name", "last_name"] }],
    });
    if (!place)
      return res.status(404).json({ success: false, message: "Place feuna" });
    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* PUBLIC: featured (top 6 approved) */
export const getFeaturedPlaces = async (req, res) => {
  try {
    const places = await Place.findAll({
      where: { status: "approved" },
      order: [["created_at", "DESC"]],
      limit: 6,
    });
    res.json({ success: true, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* PUBLIC: stats */
export const getPlaceStats = async (req, res) => {
  try {
    const total = await Place.count();
    const approved = await Place.count({ where: { status: "approved" } });
    const users = await User.count();
    res.json({ success: true, data: { total, approved, users } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* USER: submit new place (pending) — FIXED: supports multiple images */
export const createPlace = async (req, res) => {
  try {
    const { name, address, description, category, lat, lng } = req.body;
    if (!name || !address || !lat || !lng)
      return res.status(400).json({ success: false, message: "name, address, lat, lng chainxa" });

    // Handle multiple images (req.files array) OR single image (req.file)
    let imageValue = null;
    if (req.files && req.files.length > 0) {
      const paths = req.files.map(f => `/uploads/places/${f.filename}`);
      imageValue = paths.length === 1 ? paths[0] : JSON.stringify(paths);
    } else if (req.file) {
      imageValue = `/uploads/places/${req.file.filename}`;
    }

    const place = await Place.create({
      name,
      address,
      description: description || "",
      category: category || null,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      image: imageValue,
      submitted_by: req.user.id,
      status: "pending",
    });

    res.status(201).json({ success: true, data: place });
  } catch (err) {
    console.error("createPlace error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* USER: update own place */
export const updatePlace = async (req, res) => {
  try {
    const place = await Place.findOne({
      where: { id: req.params.id, submitted_by: req.user.id },
    });
    if (!place)
      return res.status(403).json({ success: false, message: "Place feuna ya timi owner hoina" });

    const { name, address, description, category, lat, lng } = req.body;
    const updates = { name, address, description, category };
    if (lat) updates.lat = parseFloat(lat);
    if (lng) updates.lng = parseFloat(lng);
    if (req.file) updates.image = `/uploads/places/${req.file.filename}`;

    await   place.update(updates);
    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* USER: delete own place */
export const deletePlace = async (req, res) => {
  try {
    const affected = await Place.destroy({
      where: { id: req.params.id, submitted_by: req.user.id },
    });
    if (affected === 0)
      return res.status(403).json({ success: false, message: "Place feuna ya timi owner hoina" });
    res.json({ success: true, message: "Place delete vayo" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};