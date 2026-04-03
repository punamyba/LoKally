// admin.controller.js
// Only handles: request parsing, validation, calling service, sending response.
// Zero business logic here — all logic lives in admin.service.js

import * as AdminService from "../services/admin.service.js";

// ── STATS ─────────────────────────────────────────────────────────────────────

export const getStats = async (req, res) => {
  try {
    const data = await AdminService.fetchStats();
    res.json({ success: true, data });
  } catch (err) {
    console.error("getStats error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── CHART DATA ────────────────────────────────────────────────────────────────

export const getChartData = async (req, res) => {
  try {
    const data = await AdminService.fetchChartData();
    res.json({ success: true, data });
  } catch (err) {
    console.error("getChartData error:", err.message);
    res.status(500).json({ success: false, message: "Server error", detail: err.message });
  }
};

// ── PLACES ────────────────────────────────────────────────────────────────────

export const getPlaces = async (req, res) => {
  try {
    const places = await AdminService.fetchPlaces(req.query.status); // optional ?status= filter
    res.json({ success: true, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const approvePlace = async (req, res) => {
  try {
    const result = await AdminService.approvePlaceById(req.params.id, req.user.id); // pass admin id for audit trail
    if (result.notFound) return res.status(404).json({ success: false, message: "Place not found" });
    res.json({ success: true, data: result.place });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const rejectPlace = async (req, res) => {
  const { reason } = req.body;
  if (!reason || reason.trim() === "") // reason is required — stored for submitter to see
    return res.status(400).json({ success: false, message: "Rejection reason is required" });

  try {
    const result = await AdminService.rejectPlaceById(req.params.id, req.user.id, reason);
    if (result.notFound) return res.status(404).json({ success: false, message: "Place not found" });
    res.json({ success: true, data: result.place });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addPlace = async (req, res) => {
  const { name, address, lat, lng } = req.body;
  if (!name || !address || !lat || !lng) // all four are required to create a valid map pin
    return res.status(400).json({ success: false, message: "name, address, lat and lng are required" });
  if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) // lat/lng must be real numbers
    return res.status(400).json({ success: false, message: "lat and lng must be valid numbers" });

  try {
    const place = await AdminService.createPlace({
      ...req.body,
      files:   req.files,    // multiple images from multer
      file:    req.file,     // single image fallback
      adminId: req.user.id,  // auto-approved as this admin
    });
    res.status(201).json({ success: true, data: place });
  } catch (err) {
    console.error("addPlace error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updatePlace = async (req, res) => {
  try {
    const result = await AdminService.updatePlaceById(req.params.id, req.body, req.files); // files appended, not replaced
    if (result.notFound) return res.status(404).json({ success: false, message: "Place not found" });
    res.json({ success: true, data: result.place });
  } catch (err) {
    console.error("updatePlace error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deletePlaceImage = async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) // without a url we don't know which image to remove
    return res.status(400).json({ success: false, message: "imageUrl is required" });

  try {
    const result = await AdminService.deletePlaceImageById(req.params.id, imageUrl);
    if (result.notFound) return res.status(404).json({ success: false, message: "Place not found" });
    res.json({ success: true, message: "Image deleted successfully", remaining: result.remaining });
  } catch (err) {
    console.error("deletePlaceImage error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deletePlace = async (req, res) => {
  try {
    const result = await AdminService.deletePlaceById(req.params.id);
    if (!result.deleted) return res.status(404).json({ success: false, message: "Place not found" }); // 0 rows affected = not found
    res.json({ success: true, message: "Place deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const toggleFeatured = async (req, res) => {
  try {
    const result = await AdminService.toggleFeaturedById(req.params.id);
    if (result.notFound) return res.status(404).json({ success: false, message: "Place not found" });
    res.json({
      success: true,
      is_featured: result.is_featured,
      message: result.is_featured ? "Featured banayo!" : "Featured hatayo!", // message reflects new state
    });
  } catch (err) {
    console.error("toggleFeatured error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── USERS ─────────────────────────────────────────────────────────────────────

export const getUsers = async (req, res) => {
  try {
    const users = await AdminService.fetchUsers(); // sensitive fields already excluded in service
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── REPORTS ───────────────────────────────────────────────────────────────────

export const getPostReports = async (req, res) => {
  try {
    const reports = await AdminService.fetchPostReports(req.params.id); // reports for one specific post
    res.json({ success: true, data: reports });
  } catch (err) {
    console.error("getPostReports error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch reports." });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const reports = await AdminService.fetchAllReports(req.query.type); // ?type=post|place|hidden
    res.json({ success: true, data: reports });
  } catch (err) {
    console.error("getAllReports error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const dismissReport = async (req, res) => {
  try {
    const result = await AdminService.dismissReportById(req.params.id); // permanently deletes the report
    if (result.notFound) return res.status(404).json({ success: false, message: "Report not found" });
    res.json({ success: true, message: "Report dismissed" });
  } catch (err) {
    console.error("dismissReport error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateReportStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ["new", "open", "resolved", "dismissed"];
  if (!status || !allowed.includes(status)) // only these 4 are valid workflow states
    return res.status(400).json({ success: false, message: "Invalid status" });

  try {
    const result = await AdminService.updateReportStatusById(req.params.id, status);
    if (result.notFound) return res.status(404).json({ success: false, message: "Report not found" });
    res.json({ success: true, data: result.report });
  } catch (err) {
    console.error("updateReportStatus error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── WARN USER ─────────────────────────────────────────────────────────────────

export const warnUser = async (req, res) => {
  const { reason, contentType, post_id, place_id } = req.body;
  if (!reason || reason.trim() === "") // reason is shown to the user in their notification
    return res.status(400).json({ success: false, message: "Rejection reason is required" });

  try {
    const result = await AdminService.warnUserById({
      userId: req.params.id,
      reason,
      contentType, // "post" or "place" — used in notification message
      post_id,
      place_id,
    });
    if (result.notFound) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "Warning sent to user" });
  } catch (err) {
    console.error("warnUser error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── NOTIFY REPORTER ───────────────────────────────────────────────────────────

export const notifyReporter = async (req, res) => {
  const { reporter_id, action } = req.body;
  if (!reporter_id) // need to know who filed the report
    return res.status(400).json({ success: false, message: "reporter_id is required" });
  if (!action) // action determines which message to send (dismissed/hidden/deleted/resolved)
    return res.status(400).json({ success: false, message: "action is required" });

  try {
    const result = await AdminService.notifyReporterById(req.body); // passes full body — service picks what it needs
    if (result.notFound) return res.status(404).json({ success: false, message: "Reporter not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("notifyReporter error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── HIDE / UNHIDE POST ────────────────────────────────────────────────────────

export const hidePost = async (req, res) => {
  try {
    const result = await AdminService.hidePostById(req.params.id); // sets is_hidden = true + notifies owner
    if (result.notFound) return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, message: "Post hidden" });
  } catch (err) {
    console.error("hidePost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const unhidePost = async (req, res) => {
  try {
    const result = await AdminService.unhidePostById(req.params.id); // sets is_hidden = false, no notification needed
    if (result.notFound) return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, message: "Post unhidden" });
  } catch (err) {
    console.error("unhidePost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};