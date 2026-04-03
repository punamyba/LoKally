import * as PlaceVisitService from "../services/placevisit.service.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// ── Multer setup for visit photos ─────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/visits/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `visit-${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const visitUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ── USER ──────────────────────────────────────────────────────────────────────

export const submitVisit = async (req, res) => {
  const { visit_date, experience } = req.body;

  if (!visit_date) {
    return res
      .status(400)
      .json({ success: false, message: "Visit date is required" });
  }

  try {
    const result = await PlaceVisitService.submitVisit({
      place_id: req.params.id,
      user_id: req.user.id,
      visit_date,
      experience,
      file: req.file,
    });

    if (result.duplicate) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending or approved visit for this place",
      });
    }

    return res.json({
      success: true,
      message: "Visit submitted for review!",
      data: result.visit,
    });
  } catch (err) {
    console.error("submitVisit error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

export const getMyVisits = async (req, res) => {
  try {
    const data = await PlaceVisitService.fetchMyVisits(req.user.id);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("getMyVisits error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

export const removeVisit = async (req, res) => {
  try {
    const result = await PlaceVisitService.removeVisit({
      place_id: req.params.id,
      user_id: req.user.id,
    });

    if (result.notFound) {
      return res
        .status(404)
        .json({ success: false, message: "No approved visit found" });
    }

    return res.json({ success: true, message: "Visit removed" });
  } catch (err) {
    console.error("removeVisit error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

export const getPlaceVisitStatus = async (req, res) => {
  try {
    const data = await PlaceVisitService.fetchPlaceVisitStatus(
      parseInt(req.params.id, 10),
      parseInt(req.user.id, 10)
    );

    return res.json({ success: true, ...data });
  } catch (err) {
    console.error("getPlaceVisitStatus error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// ── ADMIN ─────────────────────────────────────────────────────────────────────

export const getAdminVisits = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }

  const { status = "pending", page = 1, limit = 20 } = req.query;

  try {
    const data = await PlaceVisitService.fetchAdminVisits({
      status,
      page: Number(page),
      limit: Number(limit),
    });

    return res.json({
      success: true,
      data: data.rows,
      total: data.total,
      page: data.page,
    });
  } catch (err) {
    console.error("getAdminVisits error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

export const approveVisit = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }

  try {
    const result = await PlaceVisitService.approveVisit(req.params.id);

    if (result.notFound) {
      return res
        .status(404)
        .json({ success: false, message: "Visit not found" });
    }

    return res.json({ success: true, message: "Visit approved" });
  } catch (err) {
    console.error("approveVisit error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

export const rejectVisit = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }

  const { reason } = req.body;

  try {
    const result = await PlaceVisitService.rejectVisit(req.params.id, reason);

    if (result.notFound) {
      return res
        .status(404)
        .json({ success: false, message: "Visit not found" });
    }

    return res.json({ success: true, message: "Visit rejected" });
  } catch (err) {
    console.error("rejectVisit error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

export const unapproveVisit = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }

  try {
    const result = await PlaceVisitService.unapproveVisit(req.params.id);

    if (result.notFound) {
      return res
        .status(404)
        .json({ success: false, message: "Visit not found" });
    }

    return res.json({ success: true, message: "Visit removed" });
  } catch (err) {
    console.error("unapproveVisit error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};