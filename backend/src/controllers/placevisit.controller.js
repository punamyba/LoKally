import PlaceVisit from "../models/placevisit.model.js";
import Place from "../models/place.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { sendEmail } from "../Utils/email.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// ── Multer setup for visit photos ──────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/visits/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `visit-${Date.now()}${path.extname(file.originalname)}`);
  },
});
export const visitUpload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Submit visit ───────────────────────────────────────────────
export const submitVisit = async (req, res) => {
  try {
    const { id: place_id } = req.params;
    const user_id = req.user.id;
    const { visit_date, experience } = req.body;

    if (!visit_date) return res.status(400).json({ success: false, message: "Visit date required" });

    // check duplicate pending/approved
    const existing = await PlaceVisit.findOne({
      where: { place_id, user_id, status: ["pending", "approved"] }
    });
    if (existing) return res.status(409).json({ success: false, message: "You already have a pending or approved visit for this place" });

    const photo = req.file ? `/uploads/visits/${req.file.filename}` : null;

    const visit = await PlaceVisit.create({
      place_id, user_id, visit_date, experience: experience?.trim() || null, photo,
    });

    return res.json({ success: true, message: "Visit submitted for review!", data: visit });
  } catch (err) {
    console.error("submitVisit:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Get my visits ──────────────────────────────────────────────
export const getMyVisits = async (req, res) => {
  try {
    const visits = await PlaceVisit.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Place, as: "place", attributes: ["id", "name", "image"] }],
      order: [["created_at", "DESC"]],
    });
    return res.json({ success: true, data: visits });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── ADMIN: get all pending visits ─────────────────────────────
export const getAdminVisits = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });
    const { status = "pending", page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await PlaceVisit.findAndCountAll({
      where: status !== "all" ? { status } : {},
      include: [
        { model: Place, as: "place", attributes: ["id", "name", "image", "address"] },
        { model: User,  as: "user",  attributes: ["id", "first_name", "last_name", "email"] },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit), offset: parseInt(offset),
    });

    return res.json({ success: true, data: rows, total: count, page: parseInt(page) });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── ADMIN: approve visit ───────────────────────────────────────
export const approveVisit = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });
    const visit = await PlaceVisit.findByPk(req.params.id, {
      include: [
        { model: Place, as: "place", attributes: ["id", "name"] },
        { model: User,  as: "user",  attributes: ["id", "first_name", "last_name", "email"] },
      ],
    });
    if (!visit) return res.status(404).json({ success: false, message: "Visit not found" });

    await visit.update({ status: "approved", points_awarded: true });

    // notify user
    await Notification.create({
      user_id: visit.user_id,
      type: "visit_approved",
      message: `Your visit to "${visit.place?.name}" was approved!`,
      place_id: visit.place_id,
    });

    // email
    try {
      await sendEmail({
        to: visit.user.email,
        subject: "Visit Approved — LoKally Nepal",
        html: `<p>Hi ${visit.user.first_name},</p>
               <p>Your visit to <strong>${visit.place?.name}</strong> has been approved! 🎉</p>
               <p>Your visit has been verified and your "Visited" badge is now showing on your profile.</p>`,
      });
    } catch {}

    return res.json({ success: true, message: "Visit approved" });
  } catch (err) {
    console.error("approveVisit:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── ADMIN: reject visit ────────────────────────────────────────
export const rejectVisit = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });
    const { reason } = req.body;
    const visit = await PlaceVisit.findByPk(req.params.id, {
      include: [
        { model: Place, as: "place", attributes: ["id", "name"] },
        { model: User,  as: "user",  attributes: ["id", "first_name", "last_name", "email"] },
      ],
    });
    if (!visit) return res.status(404).json({ success: false, message: "Visit not found" });

    await visit.update({ status: "rejected" });

    // notify user
    await Notification.create({
      user_id: visit.user_id,
      type: "visit_rejected",
      message: `Your visit to "${visit.place?.name}" was not approved.${reason ? ` Reason: ${reason}` : ""}`,
      place_id: visit.place_id,
    });

    try {
      await sendEmail({
        to: visit.user.email,
        subject: "Visit Submission Update — LoKally Nepal",
        html: `<p>Hi ${visit.user.first_name},</p>
               <p>Unfortunately your visit submission for <strong>${visit.place?.name}</strong> was not approved.</p>
               ${reason ? `<p>Reason: ${reason}</p>` : ""}
               <p>You can resubmit with clearer proof of visit.</p>`,
      });
    } catch {}

    return res.json({ success: true, message: "Visit rejected" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── User: remove visit ─────────────────────────────────────────
export const removeVisit = async (req, res) => {
  try {
    const { id: place_id } = req.params;
    const user_id = req.user.id;
    const visit = await PlaceVisit.findOne({ where: { place_id, user_id, status: "approved" } });
    if (!visit) return res.status(404).json({ success: false, message: "No approved visit found" });

    await visit.destroy();
    return res.json({ success: true, message: "Visit removed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── ADMIN: unapprove / remove visit ───────────────────────────
export const unapproveVisit = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });
    const visit = await PlaceVisit.findByPk(req.params.id, {
      include: [{ model: User, as: "user", attributes: ["id", "first_name", "last_name", "email"] }],
    });
    if (!visit) return res.status(404).json({ success: false, message: "Visit not found" });

    await visit.destroy();
    return res.json({ success: true, message: "Visit removed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Get visit status for a place (for PlaceDetails page) ──────
export const getPlaceVisitStatus = async (req, res) => {
  try {
    const place_id = parseInt(req.params.id);
    const user_id  = parseInt(req.user.id);
    const visit = await PlaceVisit.findOne({
      where: { place_id, user_id, status: "approved" }
    });
    return res.json({ success: true, visitedByMe: !!visit, visitId: visit?.id || null });
  } catch (err) {
    console.error("getPlaceVisitStatus:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};