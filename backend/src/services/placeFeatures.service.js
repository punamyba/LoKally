// placeFeatures.service.js — handles all place interactions: likes, comments, ratings, visits, tags, conditions
// pure business logic only — no req/res here, all HTTP handling is in the controller

import { Op } from "sequelize";
import PlaceLike      from "../models/placelike.model.js";
import PlaceComment   from "../models/placecomment.model.js";
import PlaceRating    from "../models/placerating.model.js";
import PlaceVisit     from "../models/placevisit.model.js";
import PlaceTag       from "../models/placetag.model.js";
import PlaceCondition from "../models/placecondition.model.js";
import Place          from "../models/place.model.js";
import { User }       from "../models/index.js";
import { earnPoints } from "./points.service.js";

// ── LIKES ─────────────────────────────────────────────────────────────────────

// returns total like count, whether the current user has liked, and who liked
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

// toggles like on/off — awards +5 pts on like, no deduction on unlike
export const toggleLike = async (placeId, userId) => {
  const existing = await PlaceLike.findOne({ where: { place_id: placeId, user_id: userId } });

  if (existing) {
    await existing.destroy(); // user unliked — remove record, points stay
    return { liked: false };
  }

  await PlaceLike.create({ place_id: placeId, user_id: userId }); // new like

  // reward the user who liked (+5 pts)
  try {
    await earnPoints({
      userId,
      action:      "like_given",
      description: "Liked a place",
      referenceId: placeId,
    });
  } catch (e) { console.warn("place like_given points failed:", e.message); }

  return { liked: true };
};

// ── COMMENTS ──────────────────────────────────────────────────────────────────

// returns all top-level comments with their nested replies and author info
export const fetchComments = async (placeId) => {
  return PlaceComment.findAll({
    where:   { place_id: placeId, parent_id: null }, // top-level only — replies come nested
    include: [
      { model: User, as: "user", attributes: ["id", "first_name", "last_name", "avatar"] },
      {
        model:   PlaceComment,
        as:      "replies",
        include: [{ model: User, as: "user", attributes: ["id", "first_name", "last_name", "avatar"] }],
        order:   [["created_at", "ASC"]], // replies oldest first so thread reads top-down
      },
    ],
    order: [["created_at", "DESC"]], // newest comments at the top
  });
};

// creates a comment or reply — awards points only on top-level comments, not replies
export const addComment = async ({ placeId, userId, text, parent_id }) => {
  const comment = await PlaceComment.create({
    place_id:  placeId,
    user_id:   userId,
    parent_id: parent_id || null, // null = top-level comment, id = reply to another comment
    text:      text.trim(),
  });

  // only award points for top-level comments — replies don't count
  if (!parent_id) {
    // reward the commenter (+8 pts)
    try {
      await earnPoints({
        userId,
        action:      "comment_written",
        description: "Commented on a place",
        referenceId: placeId,
      });
    } catch (e) { console.warn("place comment_written points failed:", e.message); }

    // reward the place owner for receiving engagement (+4 pts) — skip if owner comments on own place
    try {
      const place = await Place.findByPk(placeId, { attributes: ["submitted_by"] });
      if (place && place.submitted_by !== userId) {
        await earnPoints({
          userId:      place.submitted_by,
          action:      "received_comment",
          description: "Someone commented on your place",
          referenceId: placeId,
        });
      }
    } catch (e) { console.warn("place received_comment points failed:", e.message); }
  }

  // re-fetch with author info so frontend can render immediately without a second request
  return PlaceComment.findByPk(comment.id, {
    include: [{ model: User, as: "user", attributes: ["id", "first_name", "last_name", "avatar"] }],
  });
};

// deletes a comment — only the author or an admin can delete
export const deleteComment = async (commentId, userId, userRole) => {
  const comment = await PlaceComment.findByPk(commentId);
  if (!comment) return { notFound: true };
  if (comment.user_id !== userId && userRole !== "admin") return { forbidden: true }; // guard: not owner and not admin
  await comment.destroy();
  return { deleted: true };
};

// ── RATINGS ───────────────────────────────────────────────────────────────────

// builds a rating summary object from raw rating rows
const buildRatingSummary = (ratings, myRating = 0) => {
  const total = ratings.length;
  const avg   = total ? parseFloat((ratings.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)) : 0.0;
  const dist  = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; // distribution: how many gave each star
  ratings.forEach(r => dist[r.rating]++);
  return { avg, total, dist, myRating };
};

// returns the rating summary and the current user's own rating if they've rated
export const fetchRatings = async (placeId, userId) => {
  const ratings  = await PlaceRating.findAll({ where: { place_id: placeId } });
  const myRating = userId ? (ratings.find(r => r.user_id === userId)?.rating || 0) : 0;
  return buildRatingSummary(ratings, myRating);
};

// saves or updates a rating — awards +10 pts only on the first rating, not on updates
export const ratePlace = async (placeId, userId, rating) => {
  const existing = await PlaceRating.findOne({ where: { place_id: placeId, user_id: userId } });

  await PlaceRating.upsert({ place_id: placeId, user_id: userId, rating }); // insert or update

  // only award points the first time — changing your rating doesn't earn more
  if (!existing) {
    try {
      await earnPoints({
        userId,
        action:      "review_written",
        description: "Rated a place",
        referenceId: placeId,
      });
    } catch (e) { console.warn("ratePlace review_written points failed:", e.message); }
  }

  // re-fetch all ratings to return the updated aggregate
  const ratings = await PlaceRating.findAll({ where: { place_id: placeId } });
  return buildRatingSummary(ratings, rating);
};

// ── VISITS ────────────────────────────────────────────────────────────────────

// returns visit count, whether the current user has visited, and who visited
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

// toggles visited status — note: this is the quick toggle, not the verified visit submission flow
export const toggleVisit = async (placeId, userId) => {
  const existing = await PlaceVisit.findOne({ where: { place_id: placeId, user_id: userId } });

  if (existing) {
    await existing.destroy(); // unmark as visited
    return { visited: false };
  }

  await PlaceVisit.create({ place_id: placeId, user_id: userId }); // mark as visited
  return { visited: true };
};

// ── TAGS ──────────────────────────────────────────────────────────────────────

// returns all tags for a place as a plain string array
export const fetchTags = async (placeId) => {
  const tags = await PlaceTag.findAll({ where: { place_id: placeId } });
  return tags.map(t => t.tag);
};

// replaces all tags for a place — delete-all-then-insert is simpler than diffing
export const updateTags = async (placeId, tags) => {
  await PlaceTag.destroy({ where: { place_id: placeId } }); // wipe existing tags
  if (tags.length > 0) {
    await PlaceTag.bulkCreate(tags.map(tag => ({ place_id: placeId, tag }))); // insert new ones
  }
  return { tags };
};

// ── CONDITIONS ────────────────────────────────────────────────────────────────

// returns current trail/road conditions — returns safe defaults if admin hasn't set them yet
export const fetchConditions = async (placeId) => {
  const cond = await PlaceCondition.findOne({ where: { place_id: placeId } });
  if (!cond) return { trail: "Good", road: "Paved", best_time: "Oct–Mar", difficulty: "Moderate", note: null };
  return cond;
};

// creates conditions on first save, updates on subsequent saves — findOrCreate handles the branch
export const updateConditions = async ({ placeId, trail, road, best_time, difficulty, note, userId }) => {
  const [cond, created] = await PlaceCondition.findOrCreate({
    where:    { place_id: placeId },
    defaults: { trail, road, best_time, difficulty, note, updated_by: userId },
  });

  if (!created) {
    await cond.update({ trail, road, best_time, difficulty, note, updated_by: userId }); // update existing
  }

  return cond;
};