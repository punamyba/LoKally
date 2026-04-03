// placeFeatures.service.js — pure business logic, no req/res

import { Op } from "sequelize";
import PlaceLike      from "../models/placelike.model.js";
import PlaceComment   from "../models/placecomment.model.js";
import PlaceRating    from "../models/placerating.model.js";
import PlaceVisit     from "../models/placevisit.model.js";
import PlaceTag       from "../models/placetag.model.js";
import PlaceCondition from "../models/placecondition.model.js";
import { User }       from "../models/index.js";

// ── LIKES ─────────────────────────────────────────────────────────────────────

export const fetchLikes = async (placeId, userId) => {
  const likes = await PlaceLike.findAll({
    where:   { place_id: placeId },
    include: [{ model: User, as: "user", attributes: ["id", "first_name", "last_name"] }],
  });

  return {
    count:     likes.length,
    likedByMe: userId ? likes.some(l => l.user_id === userId) : false, // false for guests
    users:     likes.map(l => l.user),
  };
};

export const toggleLike = async (placeId, userId) => {
  const existing = await PlaceLike.findOne({ where: { place_id: placeId, user_id: userId } });

  if (existing) {
    await existing.destroy(); // unlike
    return { liked: false };
  }

  await PlaceLike.create({ place_id: placeId, user_id: userId }); // like
  return { liked: true };
};

// ── COMMENTS ──────────────────────────────────────────────────────────────────

export const fetchComments = async (placeId) => {
  // fetch top-level comments only — replies are nested inside via "replies" association
  return PlaceComment.findAll({
    where:   { place_id: placeId, parent_id: null },
    include: [
      { model: User, as: "user", attributes: ["id", "first_name", "last_name", "avatar"] },
      {
        model:   PlaceComment,
        as:      "replies",
        include: [{ model: User, as: "user", attributes: ["id", "first_name", "last_name", "avatar"] }],
        order:   [["created_at", "ASC"]], // replies oldest first
      },
    ],
    order: [["created_at", "DESC"]], // top-level newest first
  });
};

export const addComment = async ({ placeId, userId, text, parent_id }) => {
  const comment = await PlaceComment.create({
    place_id:  placeId,
    user_id:   userId,
    parent_id: parent_id || null, // null = top-level, id = reply
    text:      text.trim(),
  });

  // re-fetch with user info so frontend can display immediately without another request
  return PlaceComment.findByPk(comment.id, {
    include: [{ model: User, as: "user", attributes: ["id", "first_name", "last_name", "avatar"] }],
  });
};

export const deleteComment = async (commentId, userId, userRole) => {
  const comment = await PlaceComment.findByPk(commentId);
  if (!comment) return { notFound: true };

  // only owner or admin can delete
  if (comment.user_id !== userId && userRole !== "admin") return { forbidden: true };

  await comment.destroy();
  return { deleted: true };
};

// ── RATINGS ───────────────────────────────────────────────────────────────────

// shared helper — builds rating summary from a list of rating rows
const buildRatingSummary = (ratings, myRating = 0) => {
  const total = ratings.length;
  const avg   = total ? parseFloat((ratings.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)) : 0.0;
  const dist  = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(r => dist[r.rating]++);
  return { avg, total, dist, myRating };
};

export const fetchRatings = async (placeId, userId) => {
  const ratings  = await PlaceRating.findAll({ where: { place_id: placeId } });
  const myRating = userId ? (ratings.find(r => r.user_id === userId)?.rating || 0) : 0;
  return buildRatingSummary(ratings, myRating);
};

export const ratePlace = async (placeId, userId, rating) => {
  // upsert — creates if first time, updates if already rated
  await PlaceRating.upsert({ place_id: placeId, user_id: userId, rating });

  // re-fetch all ratings to return updated summary
  const ratings = await PlaceRating.findAll({ where: { place_id: placeId } });
  return buildRatingSummary(ratings, rating);
};

// ── VISITS ────────────────────────────────────────────────────────────────────

export const fetchVisits = async (placeId, userId) => {
  const visits = await PlaceVisit.findAll({
    where:   { place_id: placeId },
    include: [{ model: User, as: "user", attributes: ["id", "first_name", "last_name"] }],
  });

  return {
    count:       visits.length,
    visitedByMe: userId ? visits.some(v => v.user_id === userId) : false,
    users:       visits.map(v => v.user),
  };
};

export const toggleVisit = async (placeId, userId) => {
  const existing = await PlaceVisit.findOne({ where: { place_id: placeId, user_id: userId } });

  if (existing) {
    await existing.destroy(); // unmark as visited
    return { visited: false };
  }

  await PlaceVisit.create({ place_id: placeId, user_id: userId });
  return { visited: true };
};

// ── TAGS ──────────────────────────────────────────────────────────────────────

export const fetchTags = async (placeId) => {
  const tags = await PlaceTag.findAll({ where: { place_id: placeId } });
  return tags.map(t => t.tag); // return plain string array, not model objects
};

export const updateTags = async (placeId, tags) => {
  // delete all existing tags then re-insert — simpler than diffing
  await PlaceTag.destroy({ where: { place_id: placeId } });
  if (tags.length > 0) {
    await PlaceTag.bulkCreate(tags.map(tag => ({ place_id: placeId, tag })));
  }
  return { tags };
};

// ── CONDITIONS ────────────────────────────────────────────────────────────────

export const fetchConditions = async (placeId) => {
  const cond = await PlaceCondition.findOne({ where: { place_id: placeId } });

  // return sensible defaults if admin hasn't filled it in yet
  if (!cond) return { trail: "Good", road: "Paved", best_time: "Oct–Mar", difficulty: "Moderate", note: null };

  return cond;
};

export const updateConditions = async ({ placeId, trail, road, best_time, difficulty, note, userId }) => {
  // findOrCreate — creates on first update, updates on subsequent calls
  const [cond, created] = await PlaceCondition.findOrCreate({
    where:    { place_id: placeId },
    defaults: { trail, road, best_time, difficulty, note, updated_by: userId },
  });

  if (!created) {
    await cond.update({ trail, road, best_time, difficulty, note, updated_by: userId });
  }

  return cond;
};