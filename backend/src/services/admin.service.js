// admin.service.js — pure business logic, no req/res

import { Place, User, PostReport, Post } from "../models/index.js";
import { Op } from "sequelize";
import Notification from "../models/notification.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── STATS ─────────────────────────────────────────────────────────────────────

export const fetchStats = async () => {
  // run all count queries at the same time instead of one by one
  const [users, places, pending, approved, rejected] = await Promise.all([
    User.count(),
    Place.count(),
    Place.count({ where: { status: "pending" } }),
    Place.count({ where: { status: "approved" } }),
    Place.count({ where: { status: "rejected" } }),
  ]);

  // latest 5 pending places with who submitted and who approved them
  const pendingPreview = await Place.findAll({
    where: { status: "pending" },
    include: [
      { model: User, as: "submitter", attributes: ["id", "first_name", "last_name", "email"] },
      { model: User, as: "approver",  attributes: ["id", "first_name", "last_name"] },
    ],
    order: [["created_at", "DESC"]],
    limit: 5,
  });

  return { stats: { users, places, pending, approved, rejected }, pendingPreview };
};

// ── CHART DATA ────────────────────────────────────────────────────────────────

export const fetchChartData = async () => {
  const Sequelize = Place.sequelize.Sequelize;

  // top 7 categories by approved place count
  const categoryData = await Place.findAll({
    where: { status: "approved" },
    attributes: [
      "category",
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
    ],
    group: ["category"],
    order: [[Sequelize.literal("count"), "DESC"]],
    limit: 7,
    raw: true,
  });

  // submitted vs approved count per month for the last 9 months
  // TO_CHAR is PostgreSQL — formats timestamp → "Jan", "2026-01" etc.
  const monthlyData = await Place.findAll({
    attributes: [
      [Sequelize.fn("TO_CHAR", Sequelize.col("created_at"), "Mon"),     "month"],     // "Jan", "Feb" ...
      [Sequelize.fn("TO_CHAR", Sequelize.col("created_at"), "YYYY-MM"), "yearMonth"], // "2026-01" used for sorting
      [Sequelize.fn("COUNT", Sequelize.col("id")), "submitted"],
      // conditional sum — counts only approved rows
      [Sequelize.literal("SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)"), "approved"],
    ],
    where: {
      created_at: {
        [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 9)), // 9 months back from today
      },
    },
    group: [
      Sequelize.fn("TO_CHAR", Sequelize.col("created_at"), "YYYY-MM"),
      Sequelize.fn("TO_CHAR", Sequelize.col("created_at"), "Mon"),
    ],
    order: [[Sequelize.fn("TO_CHAR", Sequelize.col("created_at"), "YYYY-MM"), "ASC"]], // oldest → newest
    raw: true,
  });

  return { categoryData, monthlyData };
};

// ── PLACES ────────────────────────────────────────────────────────────────────

export const fetchPlaces = async (status) => {
  const where = {};
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    where.status = status; // filter by status only if provided
  }

  return Place.findAll({
    where,
    include: [
      { model: User, as: "submitter", attributes: ["id", "first_name", "last_name", "email"] },
      { model: User, as: "approver",  attributes: ["id", "first_name", "last_name"] },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const approvePlaceById = async (placeId, adminId) => {
  const place = await Place.findByPk(placeId, {
    include: [{ model: User, as: "submitter", attributes: ["id", "first_name", "last_name", "email"] }],
  });
  if (!place) return { notFound: true };

  await place.update({
    status: "approved",
    approved_by: adminId,   // track which admin approved
    approved_at: new Date(),
    rejected_reason: null,  // clear any old rejection reason
  });

  if (place.submitter) {
    // send approval email — wrapped in try/catch so failure doesn't break the response
    try {
      const { sendPlaceApprovedEmail } = await import("../Utils/email.js");
      await sendPlaceApprovedEmail({
        to: place.submitter.email,
        firstName: place.submitter.first_name,
        placeName: place.name,
      });
    } catch (e) { console.warn("Approve email failed:", e.message); }

    // create in-app notification for the submitter
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

  return { place };
};

export const rejectPlaceById = async (placeId, adminId, reason) => {
  const place = await Place.findByPk(placeId, {
    include: [{ model: User, as: "submitter", attributes: ["id", "first_name", "last_name", "email"] }],
  });
  if (!place) return { notFound: true };

  await place.update({
    status: "rejected",
    approved_by: adminId,      // reusing this field to track who actioned it
    rejected_reason: reason,
  });

  if (place.submitter) {
    try {
      const { sendPlaceRejectedEmail } = await import("../Utils/email.js");
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

  return { place };
};

export const createPlace = async ({ name, address, description, category, lat, lng, is_featured, files, file, adminId }) => {
  // build image value — single string if 1 file, JSON array if multiple
  let imageValue = null;
  if (files && files.length > 0) {
    const paths = files.map(f => `/uploads/places/${f.filename}`);
    imageValue = paths.length === 1 ? paths[0] : JSON.stringify(paths);
  } else if (file) {
    imageValue = `/uploads/places/${file.filename}`;
  }

  // admin-created places skip the review queue — auto approved immediately
  return Place.create({
    name,
    address,
    description:  description || "",
    category:     category || null,
    lat:          parseFloat(lat),
    lng:          parseFloat(lng),
    image:        imageValue,
    submitted_by: adminId,
    status:       "approved",
    approved_by:  adminId,
    approved_at:  new Date(),
    is_featured:  is_featured === "true" || is_featured === true,
  });
};

export const updatePlaceById = async (placeId, fields, files) => {
  const place = await Place.findByPk(placeId);
  if (!place) return { notFound: true };

  const { name, address, description, category, lat, lng, status } = fields;

  // only include fields that were actually sent — partial update
  const updates = {};
  if (name)                      updates.name        = name;
  if (address)                   updates.address     = address;
  if (description !== undefined) updates.description = description;
  if (category    !== undefined) updates.category    = category;
  if (lat)                       updates.lat         = parseFloat(lat);
  if (lng)                       updates.lng         = parseFloat(lng);
  if (status)                    updates.status      = status;

  // if new images uploaded, append them to existing ones (don't replace)
  if (files && files.length > 0) {
    const newPaths = files.map(f => `/uploads/places/${f.filename}`);
    let existing = [];
    try { existing = place.image ? JSON.parse(place.image) : []; }
    catch { existing = place.image ? [place.image] : []; } // handle non-JSON single string
    updates.image = JSON.stringify([...existing, ...newPaths]);
  }

  await place.update(updates);
  return { place };
};

export const deletePlaceImageById = async (placeId, imageUrl) => {
  const place = await Place.findByPk(placeId);
  if (!place) return { notFound: true };

  // parse current images — handle both JSON array and plain string
  let images = [];
  try { images = place.image ? JSON.parse(place.image) : []; }
  catch { images = place.image ? [place.image] : []; }

  const filtered = images.filter(img => img !== imageUrl); // remove the target image
  await place.update({ image: filtered.length > 0 ? JSON.stringify(filtered) : null });

  // also delete the actual file from disk
  try {
    const filePath = path.join(__dirname, "../../", imageUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) { console.warn("File delete failed:", e.message); }

  return { remaining: filtered.length };
};

export const deletePlaceById = async (placeId) => {
  const affected = await Place.destroy({ where: { id: placeId } });
  return { deleted: affected > 0 }; // false if place didn't exist
};

export const toggleFeaturedById = async (placeId) => {
  const place = await Place.findByPk(placeId);
  if (!place) return { notFound: true };
  await place.update({ is_featured: !place.is_featured }); // flip true↔false
  return { is_featured: place.is_featured };
};

// ── USERS ─────────────────────────────────────────────────────────────────────

export const fetchUsers = async () => {
  // exclude all sensitive auth fields before returning
  return User.findAll({
    attributes: { exclude: ["password", "reset_code_hash", "reset_session_hash", "verification_token"] },
    order: [["created_at", "DESC"]],
  });
};

// ── REPORTS ───────────────────────────────────────────────────────────────────

export const fetchPostReports = async (postId) => {
  // all reports filed against one specific post
  return PostReport.findAll({
    where: { post_id: postId },
    include: [{ model: User, as: "reporter", attributes: ["id", "first_name", "last_name", "email"] }],
    order: [["created_at", "DESC"]],
  });
};

export const fetchAllReports = async (type) => {
  let reports = [];

  // fetch post reports — "hidden" is a sub-filter of post reports
  if (!type || type === "post" || type === "hidden") {
    const postReports = await PostReport.findAll({
      where: { post_id: { [Op.ne]: null } }, // only reports linked to a post
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
    if (type === "hidden") mapped = mapped.filter(r => r.post?.is_hidden === true); // extra filter for hidden tab
    reports = [...reports, ...mapped];
  }

  // fetch place reports separately and merge
  if (!type || type === "place") {
    const placeReports = await PostReport.findAll({
      where: { place_id: { [Op.ne]: null } }, // only reports linked to a place
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

  return reports;
};

export const dismissReportById = async (reportId) => {
  const report = await PostReport.findByPk(reportId);
  if (!report) return { notFound: true };
  await report.destroy(); // permanently delete — admin decided it's not a real violation
  return { dismissed: true };
};

export const updateReportStatusById = async (reportId, status) => {
  const report = await PostReport.findByPk(reportId);
  if (!report) return { notFound: true };
  await report.update({ status }); // move report through workflow: new → open → resolved
  return { report };
};

// ── WARN USER ─────────────────────────────────────────────────────────────────

export const warnUserById = async ({ userId, reason, contentType, post_id, place_id }) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };

  // create warning notification visible in user's notification bell
  try {
    await Notification.create({
      user_id: user.id,
      type: "warning",
      post_id: post_id || null,
      place_id: place_id || null,
      message: `⚠️ Warning: Your ${contentType || "content"} has been flagged by our moderation team. Reason: ${reason || "Policy violation"}. Please review our community guidelines to avoid further action.`,
      is_read: false,
    });
  } catch (e) { console.warn("Notification create failed:", e.message); }

  // also send email so they see it even if not logged in
  try {
    const { sendWarningEmail } = await import("../Utils/email.js");
    await sendWarningEmail({
      to: user.email,
      firstName: user.first_name,
      contentType: contentType || "content",
      reason: reason || "Policy violation",
    });
  } catch (e) { console.warn("Warning email failed:", e.message); }

  return { warned: true };
};

// ── NOTIFY REPORTER ───────────────────────────────────────────────────────────

export const notifyReporterById = async ({ reporter_id, action, post_id, place_id }) => {
  const reporter = await User.findByPk(reporter_id);
  if (!reporter) return { notFound: true };

  // pick message based on what action was taken on the reported content
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

  try {
    const { sendReportStatusEmail } = await import("../Utils/email.js");
    // map internal action names to email template status values
    const statusMap = { resolved: "resolved", dismissed: "dismissed", hidden: "resolved", deleted: "resolved" };
    await sendReportStatusEmail({
      to: reporter.email,
      firstName: reporter.first_name,
      status: statusMap[action] || "resolved",
    });
  } catch (e) { console.warn("Reporter email failed:", e.message); }

  return { notified: true };
};

// ── POSTS ─────────────────────────────────────────────────────────────────────

export const hidePostById = async (postId) => {
  const post = await Post.findByPk(postId);
  if (!post) return { notFound: true };

  await post.update({ is_hidden: true }); // hides from public feed

  // notify the post owner why their post was hidden
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
      const { sendContentHiddenEmail } = await import("../Utils/email.js");
      await sendContentHiddenEmail({ to: owner.email, firstName: owner.first_name, contentType: "post" });
    }
  } catch (e) { console.warn("Hide email failed:", e.message); }

  return { hidden: true };
};

export const unhidePostById = async (postId) => {
  const post = await Post.findByPk(postId);
  if (!post) return { notFound: true };
  await post.update({ is_hidden: false }); // restore post to public feed
  return { unhidden: true };
};