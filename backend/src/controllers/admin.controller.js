// Stores as JSON string if multiple, single path if one image

import { Place, User, PostReport, Post } from "../models/index.js";
import { Op } from "sequelize";
import Notification from "../models/notification.model.js";

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
    const place = await Place.findByPk(req.params.id, {
      include: [{ model: User, as: "submitter", attributes: ["id", "first_name", "last_name", "email"] }],
    });
    if (!place) return res.status(404).json({ success: false, message: "Place feuna" });
    await place.update({ status: "approved", approved_by: req.user.id, approved_at: new Date(), rejected_reason: null });

    // Email + notification to submitter
    if (place.submitter) {
      try {
        const { sendPlaceApprovedEmail } = await import("../utils/email.js");
        await sendPlaceApprovedEmail({
          to: place.submitter.email,
          firstName: place.submitter.first_name,
          placeName: place.name,
        });
      } catch (e) { console.warn("Approve email failed:", e.message); }

      try {
        const models = await import("../models/index.js");
        const N = models.Notification || models.default?.Notification;
        if (N) await N.create({
          user_id: place.submitter.id,
          type: "place_approved",
          message: `Your place "${place.name}" has been approved and is now live!`,
          is_read: false,
        });
      } catch (e) { console.warn("Approve notification failed:", e.message); }
    }

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
    const place = await Place.findByPk(req.params.id, {
      include: [{ model: User, as: "submitter", attributes: ["id", "first_name", "last_name", "email"] }],
    });
    if (!place) return res.status(404).json({ success: false, message: "Place feuna" });
    await place.update({ status: "rejected", approved_by: req.user.id, rejected_reason: reason });

    // Email + notification to submitter
    if (place.submitter) {
      try {
        const { sendPlaceRejectedEmail } = await import("../utils/email.js");
        await sendPlaceRejectedEmail({
          to: place.submitter.email,
          firstName: place.submitter.first_name,
          placeName: place.name,
          reason,
        });
      } catch (e) { console.warn("Reject email failed:", e.message); }

      try {
        const models = await import("../models/index.js");
        const N = models.Notification || models.default?.Notification;
        if (N) await N.create({
          user_id: place.submitter.id,
          type: "place_rejected",
          message: `Your place "${place.name}" was not approved. Reason: ${reason}`,
          is_read: false,
        });
      } catch (e) { console.warn("Reject notification failed:", e.message); }
    }

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

    // ── Post reports ──────────────────────────────────────────
    if (!type || type === "post" || type === "hidden") {
      const postReports = await PostReport.findAll({
        where: { post_id: { [Op.ne]: null } },
        include: [
          { model: User, as: "reporter", attributes: ["id", "first_name", "last_name", "email"] },
          {
            association: "post",
            attributes: ["id", "caption", "images", "is_hidden"],
            include: [{ model: User, as: "author", attributes: ["id", "first_name", "last_name", "email"] }],
          },
        ],
        order: [["created_at", "DESC"]],
      });
      let mapped = postReports.map(r => ({ ...r.toJSON(), post_id: r.post_id }));
      if (type === "hidden") mapped = mapped.filter(r => r.post?.is_hidden === true);
      reports = [...reports, ...mapped];
    }

    // ── Place reports ─────────────────────────────────────────
    if (!type || type === "place") {
      const placeReports = await PostReport.findAll({
        where: { place_id: { [Op.ne]: null } },
        include: [
          { model: User, as: "reporter", attributes: ["id", "first_name", "last_name", "email"] },
          {
            association: "place",
            attributes: ["id", "name", "address", "image"],
            include: [{ model: User, as: "submitter", attributes: ["id", "first_name", "last_name", "email"] }],
          },
        ],
        order: [["created_at", "DESC"]],
      });
      reports = [...reports, ...placeReports.map(r => ({ ...r.toJSON(), place_id: r.place_id }))];
    }

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
    const { reason, contentType, post_id, place_id } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // In-app notification to content owner (warned user)
    try {
      await Notification.create({
        user_id: user.id,
        type: "warning",
        post_id: post_id || null,
        place_id: place_id || null,
        message: `⚠️ Warning: Your ${contentType || "content"} has been flagged by our moderation team. Reason: ${reason || "Policy violation"}. Please review our community guidelines to avoid further action.`,
        is_read: false,
      });
    } catch (notifErr) {
      console.warn("Notification create failed:", notifErr.message);
    }

    // Email to warned user
    try {
      const { sendWarningEmail } = await import("../utils/email.js");
      await sendWarningEmail({
        to: user.email,
        firstName: user.first_name,
        contentType: contentType || "content",
        reason: reason || "Policy violation",
      });
    } catch (emailErr) {
      console.warn("Warning email failed:", emailErr.message);
    }

    res.json({ success: true, message: "Warning sent to user" });
  } catch (err) {
    console.error("warnUser error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── NOTIFY REPORTER (dismiss/resolve/hide/delete) ─────────────── */
export const notifyReporter = async (req, res) => {
  try {
    const { reporter_id, action, post_id, place_id } = req.body;
    const reporter = await User.findByPk(reporter_id);
    if (!reporter) return res.status(404).json({ success: false, message: "Reporter not found" });

    const messages = {
      dismissed: "Your report has been reviewed. The reported content was found to not violate our guidelines.",
      hidden:    "Your report has been reviewed. The reported content has been hidden from public view.",
      deleted:   "Your report has been reviewed. The reported content has been permanently removed.",
      resolved:  "Your report has been reviewed and resolved. Thank you for helping keep LoKally Nepal safe!",
    };
    const msg = messages[action] || "Your report has been reviewed by our team. Thank you for helping keep LoKally Nepal safe!";

    try {
      await Notification.create({
        user_id: reporter.id,
        type: "reported",
        post_id: post_id || null,
        place_id: place_id || null,
        message: msg,
        is_read: false,
      });
    } catch (e) { console.warn("Reporter notification failed:", e.message); }

    // Email to reporter
    try {
      const { sendReportStatusEmail } = await import("../utils/email.js");
      const statusMap = { resolved: "resolved", dismissed: "dismissed", hidden: "resolved", deleted: "resolved" };
      await sendReportStatusEmail({
        to: reporter.email,
        firstName: reporter.first_name,
        status: statusMap[action] || "resolved",
      });
    } catch (e) { console.warn("Reporter email failed:", e.message); }

    res.json({ success: true });
  } catch (err) {
    console.error("notifyReporter error:", err.message);
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

/* ── HIDE / UNHIDE POST ────────────────────────────────────────── */
export const hidePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    await post.update({ is_hidden: true });

    // Notify post owner
    try {
      await Notification.create({
        user_id: post.user_id,
        type: "warning",
        post_id: post.id,
        message: "Your post has been hidden by our moderation team for violating community guidelines.",
        is_read: false,
      });
    } catch (e) { console.warn("Hide notification failed:", e.message); }

    try {
      const owner = await User.findByPk(post.user_id);
      if (owner) {
        const { sendContentHiddenEmail } = await import("../utils/email.js");
        await sendContentHiddenEmail({
          to: owner.email,
          firstName: owner.first_name,
          contentType: "post",
        });
      }
    } catch (e) { console.warn("Hide email failed:", e.message); }

    res.json({ success: true, message: "Post hidden" });
  } catch (err) {
    console.error("hidePost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const unhidePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    await post.update({ is_hidden: false });
    res.json({ success: true, message: "Post unhidden" });
  } catch (err) {
    console.error("unhidePost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};