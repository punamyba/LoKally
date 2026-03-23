// Stores as JSON string if multiple, single path if one image

import { Place, User, PostReport } from "../models/index.js";

const placeWithUser = {
  include: [
    { model: User, as: "submitter", attributes: ["id", "first_name", "last_name", "email"] },
    { model: User, as: "approver",  attributes: ["id", "first_name", "last_name"] },
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
    if (status && ["pending", "approved", "rejected"].includes(status)) where.status = status;
    const places = await Place.findAll({ where, ...placeWithUser, order: [["created_at", "DESC"]] });
    res.json({ success: true, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* APPROVE */
export const approvePlace = async (req, res) => {
  try {
    const place = await Place.findByPk(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: "Place feuna" });
    await place.update({ status: "approved", approved_by: req.user.id, approved_at: new Date(), rejected_reason: null });
    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* REJECT */
export const rejectPlace = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: "Reason chainxa" });
    const place = await Place.findByPk(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: "Place feuna" });
    await place.update({ status: "rejected", approved_by: req.user.id, rejected_reason: reason });
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
    const { name, address, description, category, lat, lng, is_featured } = req.body;
    if (!name || !address || !lat || !lng)
      return res.status(400).json({ success: false, message: "name, address, lat, lng chainxa" });

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
      description:  description || "",
      category:     category || null,
      lat:          parseFloat(lat),
      lng:          parseFloat(lng),
      image:        imageValue,
      submitted_by: req.user.id,
      status:       "approved",
      approved_by:  req.user.id,
      approved_at:  new Date(),
      is_featured:  is_featured === "true" || is_featured === true,
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
    if (!place) return res.status(404).json({ success: false, message: "Place feuna" });

    const { name, address, description, category, lat, lng, status } = req.body;
    const updates = {};
    if (name)                    updates.name        = name;
    if (address)                 updates.address     = address;
    if (description !== undefined) updates.description = description;
    if (category !== undefined)    updates.category    = category;
    if (lat)                     updates.lat         = parseFloat(lat);
    if (lng)                     updates.lng         = parseFloat(lng);
    if (status)                  updates.status      = status;
    if (req.file)                updates.image       = `/uploads/places/${req.file.filename}`;

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
    if (affected === 0) return res.status(404).json({ success: false, message: "Place feuna" });
    res.json({ success: true, message: "Place delete vayo" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* TOGGLE FEATURED */
export const toggleFeatured = async (req, res) => {
  try {
    const place = await Place.findByPk(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: "Place feuna" });
    await place.update({ is_featured: !place.is_featured });
    res.json({
      success: true,
      is_featured: place.is_featured,
      message: place.is_featured ? "Featured banayo!" : "Featured hatayo!",
    });
  } catch (err) {
    console.error("toggleFeatured error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── GET REPORTS FOR A POST ─────────────────────────────────────── */
export const getPostReports = async (req, res) => {
  try {
    const { id } = req.params;
    const reports = await PostReport.findAll({
      where: { post_id: id },
      include: [
        {
          model: User,
          as: "reporter",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: reports });
  } catch (err) {
    console.error("getPostReports error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch reports." });
  }
};


/* ── GET ALL REPORTS (posts + places) ──────────────────────────── */
export const getAllReports = async (req, res) => {
  try {
    const { type } = req.query;
    let reports = [];

    if (!type || type === "post") {
      const postReports = await PostReport.findAll({
        include: [
          { model: User, as: "reporter", attributes: ["id", "first_name", "last_name", "email"] },
          {
            association: "post",
            attributes: ["id", "caption", "images"],
            include: [{ model: User, as: "author", attributes: ["id", "first_name", "last_name", "email"] }],
          },
        ],
        order: [["created_at", "DESC"]],
      });
      reports = [...reports, ...postReports.map(r => ({ ...r.toJSON(), post_id: r.post_id }))];
    }

    // Place reports can be added here when PlaceReport model exists

    res.json({ success: true, data: reports });
  } catch (err) {
    console.error("getAllReports error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── DISMISS A REPORT ──────────────────────────────────────────── */
export const dismissReport = async (req, res) => {
  try {
    const report = await PostReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    await report.destroy();
    res.json({ success: true, message: "Report dismissed" });
  } catch (err) {
    console.error("dismissReport error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── WARN USER ─────────────────────────────────────────────────── */
export const warnUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, contentType } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // In-app notification — dynamic import so missing model doesn't crash
    try {
      const models = await import("../models/index.js");
      const NotifModel = models.Notification || models.default?.Notification;
      if (NotifModel) {
        await NotifModel.create({
          user_id: user.id,
          type: "warning",
          message: `Your ${contentType || "content"} has been flagged: ${reason || "Policy violation"}. Please review our community guidelines.`,
          is_read: false,
        });
      }
    } catch (notifErr) {
      console.warn("Notification create failed:", notifErr.message);
    }

    // Email — dynamic import so missing util doesn't crash server
    try {
      const { sendEmail } = await import("../utils/email.js");
      await sendEmail({
        to: user.email,
        subject: "Content Warning — LoKally Nepal",
        html: `
          <p>Hi ${user.first_name},</p>
          <p>Your ${contentType || "content"} on LoKally Nepal has been flagged by our moderation team.</p>
          <p><strong>Reason:</strong> ${reason || "Policy violation"}</p>
          <p>Please review our community guidelines to ensure your content follows our policies.</p>
          <p>Repeated violations may result in account suspension.</p>
          <br/><p>— LoKally Nepal Team</p>
        `,
      });
    } catch (emailErr) {
      console.warn("Email send failed (utils/email.js may not exist):", emailErr.message);
    }

    res.json({ success: true, message: "Warning sent to user" });
  } catch (err) {
    console.error("warnUser error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── UPDATE REPORT STATUS ──────────────────────────────────────── */
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["new", "open", "resolved", "dismissed"];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    const report = await PostReport.findByPk(id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    await report.update({ status });
    res.json({ success: true, data: report });
  } catch (err) {
    console.error("updateReportStatus error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};