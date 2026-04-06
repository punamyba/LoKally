import { Op } from "sequelize";
import PlaceVisit    from "../models/placevisit.model.js";
import Place         from "../models/place.model.js";
import User          from "../models/user.model.js";
import Notification  from "../models/notification.model.js";
import { sendEmail } from "../Utils/email.js";
import { earnPoints } from "./points.service.js";

// ── USER ──────────────────────────────────────────────────────────────────────

// submits a visit request — only one pending or approved visit allowed per place per user
export const submitVisit = async ({ place_id, user_id, visit_date, experience, file }) => {
  const existing = await PlaceVisit.findOne({
    where: {
      place_id,
      user_id,
      status: { [Op.in]: ["pending", "approved"] },
    },
  });

  if (existing) return { duplicate: true };

  const photo = file ? `/uploads/visits/${file.filename}` : null;

  const visit = await PlaceVisit.create({
    place_id,
    user_id,
    visit_date,
    experience: experience?.trim() || null,
    photo,
    status: "pending",
  });

  // reward user for submitting a visit (+10 pts)
  await earnPoints({
    userId:      user_id,
    action:      "visit_submitted",
    description: "Submitted a visit for review",
    referenceId: visit.id,
  });

  return { visit };
};

// returns all visits for the current user with place details
export const fetchMyVisits = async (userId) => {
  return PlaceVisit.findAll({
    where:   { user_id: userId },
    include: [{ model: Place, as: "place", attributes: ["id", "name", "image"] }],
    order:   [["created_at", "DESC"]],
  });
};

// removes an approved visit — user can undo their visited status
export const removeVisit = async ({ place_id, user_id }) => {
  const visit = await PlaceVisit.findOne({
    where: { place_id, user_id, status: "approved" },
  });

  if (!visit) return { notFound: true };

  await visit.destroy();
  return { removed: true };
};

// checks if the current user has an approved visit for a place
export const fetchPlaceVisitStatus = async (place_id, user_id) => {
  const visit = await PlaceVisit.findOne({
    where: { place_id, user_id, status: "approved" },
  });

  return {
    visitedByMe: !!visit,
    visitId:     visit?.id || null,
  };
};

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// returns paginated list of visits filtered by status
export const fetchAdminVisits = async ({ status, page, limit }) => {
  const safePage  = Number(page)  > 0 ? Number(page)  : 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : 20;
  const offset    = (safePage - 1) * safeLimit;
  const where     = status && status !== "all" ? { status } : {};

  const { count, rows } = await PlaceVisit.findAndCountAll({
    where,
    include: [
      { model: Place, as: "place", attributes: ["id", "name", "image", "address"] },
      { model: User,  as: "user",  attributes: ["id", "first_name", "last_name", "email"] },
    ],
    order: [["created_at", "DESC"]],
    limit: safeLimit,
    offset,
  });

  return { rows, total: count, page: safePage };
};

// approves a visit — rewards user with bonus points and notifies them
export const approveVisit = async (visitId) => {
  const visit = await PlaceVisit.findByPk(visitId, {
    include: [
      { model: Place, as: "place", attributes: ["id", "name"] },
      { model: User,  as: "user",  attributes: ["id", "first_name", "last_name", "email"] },
    ],
  });

  if (!visit) return { notFound: true };

  await visit.update({ status: "approved" });

  // reward user for having their visit approved (+25 pts)
  try {
    await earnPoints({
      userId:      visit.user_id,
      action:      "visit_approved",
      description: `Visit to "${visit.place?.name}" was approved`,
      referenceId: visit.id,
    });
  } catch (e) { console.warn("Visit approved points failed:", e.message); }

  // reward place owner for someone visiting their place (+8 pts)
  try {
    const place = await Place.findByPk(visit.place_id, { attributes: ["id", "submitted_by"] });
    if (place && place.submitted_by !== visit.user_id) {
      await earnPoints({
        userId:      place.submitted_by,
        action:      "someone_visited_place",
        description: `Someone visited your place "${visit.place?.name}"`,
        referenceId: visit.id,
      });
    }
  } catch (e) { console.warn("Place owner visit points failed:", e.message); }

  // notify the user their visit was approved
  await Notification.create({
    user_id:  visit.user_id,
    type:     "visit_approved",
    message:  `Your visit to "${visit.place?.name}" was approved! You earned 25 bonus points.`,
    place_id: visit.place_id,
  });

  // send approval email
  try {
    await sendEmail({
      to:      visit.user.email,
      subject: "Visit Approved - LoKally Nepal",
      html: `
        <p>Hi ${visit.user.first_name},</p>
        <p>Your visit to <strong>${visit.place?.name}</strong> has been approved.</p>
        <p>Your visit has been verified and your Visited badge is now showing on your profile.</p>
      `,
    });
  } catch (e) { console.error("approveVisit email error:", e); }

  return { ok: true };
};

// rejects a visit and notifies the user with reason
export const rejectVisit = async (visitId, reason) => {
  const visit = await PlaceVisit.findByPk(visitId, {
    include: [
      { model: Place, as: "place", attributes: ["id", "name"] },
      { model: User,  as: "user",  attributes: ["id", "first_name", "last_name", "email"] },
    ],
  });

  if (!visit) return { notFound: true };

  await visit.update({ status: "rejected" });

  await Notification.create({
    user_id:  visit.user_id,
    type:     "visit_rejected",
    message:  `Your visit to "${visit.place?.name}" was not approved.${reason ? ` Reason: ${reason}` : ""}`,
    place_id: visit.place_id,
  });

  try {
    await sendEmail({
      to:      visit.user.email,
      subject: "Visit Submission Update - LoKally Nepal",
      html: `
        <p>Hi ${visit.user.first_name},</p>
        <p>Unfortunately your visit submission for <strong>${visit.place?.name}</strong> was not approved.</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ""}
        <p>You can resubmit with clearer proof of visit.</p>
      `,
    });
  } catch (e) { console.error("rejectVisit email error:", e); }

  return { ok: true };
};

// removes an approved visit — admin can undo an approval
export const unapproveVisit = async (visitId) => {
  const visit = await PlaceVisit.findByPk(visitId, {
    include: [{ model: User, as: "user", attributes: ["id", "first_name", "last_name", "email"] }],
  });

  if (!visit) return { notFound: true };

  await visit.destroy();
  return { removed: true };
};