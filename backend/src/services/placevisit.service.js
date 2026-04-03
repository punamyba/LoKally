import { Op } from "sequelize";
import PlaceVisit from "../models/placevisit.model.js";
import Place from "../models/place.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { sendEmail } from "../Utils/email.js";

// ── USER ──────────────────────────────────────────────────────────────────────

export const submitVisit = async ({
  place_id,
  user_id,
  visit_date,
  experience,
  file,
}) => {
  const existing = await PlaceVisit.findOne({
    where: {
      place_id,
      user_id,
      status: {
        [Op.in]: ["pending", "approved"],
      },
    },
  });

  if (existing) {
    return { duplicate: true };
  }

  const photo = file ? `/uploads/visits/${file.filename}` : null;

  const visit = await PlaceVisit.create({
    place_id,
    user_id,
    visit_date,
    experience: experience?.trim() || null,
    photo,
    status: "pending",
  });

  return { visit };
};

export const fetchMyVisits = async (userId) => {
  return await PlaceVisit.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Place,
        as: "place",
        attributes: ["id", "name", "image"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

export const removeVisit = async ({ place_id, user_id }) => {
  const visit = await PlaceVisit.findOne({
    where: {
      place_id,
      user_id,
      status: "approved",
    },
  });

  if (!visit) {
    return { notFound: true };
  }

  await visit.destroy();
  return { removed: true };
};

export const fetchPlaceVisitStatus = async (place_id, user_id) => {
  const visit = await PlaceVisit.findOne({
    where: {
      place_id,
      user_id,
      status: "approved",
    },
  });

  return {
    visitedByMe: !!visit,
    visitId: visit?.id || null,
  };
};

// ── ADMIN ─────────────────────────────────────────────────────────────────────

export const fetchAdminVisits = async ({ status, page, limit }) => {
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : 20;
  const offset = (safePage - 1) * safeLimit;

  const whereClause = status && status !== "all" ? { status } : {};

  const { count, rows } = await PlaceVisit.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Place,
        as: "place",
        attributes: ["id", "name", "image", "address"],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
    order: [["created_at", "DESC"]],
    limit: safeLimit,
    offset,
  });

  return {
    rows,
    total: count,
    page: safePage,
  };
};

export const approveVisit = async (visitId) => {
  const visit = await PlaceVisit.findByPk(visitId, {
    include: [
      {
        model: Place,
        as: "place",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
  });

  if (!visit) {
    return { notFound: true };
  }

  await visit.update({ status: "approved" });

  await Notification.create({
    user_id: visit.user_id,
    type: "visit_approved",
    message: `Your visit to "${visit.place?.name}" was approved!`,
    place_id: visit.place_id,
  });

  try {
    await sendEmail({
      to: visit.user.email,
      subject: "Visit Approved — LoKally Nepal",
      html: `
        <p>Hi ${visit.user.first_name},</p>
        <p>Your visit to <strong>${visit.place?.name}</strong> has been approved! 🎉</p>
        <p>Your visit has been verified and your "Visited" badge is now showing on your profile.</p>
      `,
    });
  } catch (emailErr) {
    console.error("approveVisit email error:", emailErr);
  }

  return { ok: true };
};

export const rejectVisit = async (visitId, reason) => {
  const visit = await PlaceVisit.findByPk(visitId, {
    include: [
      {
        model: Place,
        as: "place",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
  });

  if (!visit) {
    return { notFound: true };
  }

  await visit.update({ status: "rejected" });

  await Notification.create({
    user_id: visit.user_id,
    type: "visit_rejected",
    message: `Your visit to "${visit.place?.name}" was not approved.${
      reason ? ` Reason: ${reason}` : ""
    }`,
    place_id: visit.place_id,
  });

  try {
    await sendEmail({
      to: visit.user.email,
      subject: "Visit Submission Update — LoKally Nepal",
      html: `
        <p>Hi ${visit.user.first_name},</p>
        <p>Unfortunately your visit submission for <strong>${visit.place?.name}</strong> was not approved.</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ""}
        <p>You can resubmit with clearer proof of visit.</p>
      `,
    });
  } catch (emailErr) {
    console.error("rejectVisit email error:", emailErr);
  }

  return { ok: true };
};

export const unapproveVisit = async (visitId) => {
  const visit = await PlaceVisit.findByPk(visitId, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
  });

  if (!visit) {
    return { notFound: true };
  }

  await visit.destroy();
  return { removed: true };
};