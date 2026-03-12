import { Op } from "sequelize";
import PlaceLike      from "../models/placelike.model.js";
import PlaceComment   from "../models/placecomment.model.js";
import PlaceRating    from "../models/placerating.model.js";
import PlaceVisit     from "../models/placevisit.model.js";
import PlaceTag       from "../models/placetag.model.js";
import PlaceCondition from "../models/placecondition.model.js";
import { User }       from "../models/index.js";

/* ── helpers ─────────────────────────────────────────────── */
const userId = (req) => req.user?.id;

/* ══════════════════════════════════════════════════════════
   LIKES
══════════════════════════════════════════════════════════ */

// GET /api/places/:id/likes
export const getLikes = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = userId(req);

    const likes = await PlaceLike.findAll({
      where: { place_id: id },
      include: [{ model: User, as: "user", attributes: ["id","first_name","last_name"] }],
    });

    const likedByMe = uid ? likes.some(l => l.user_id === uid) : false;

    return res.json({
      count: likes.length,
      likedByMe,
      users: likes.map(l => l.user),
    });
  } catch (err) {
    console.error("getLikes:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/places/:id/like  (toggle)
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = userId(req);

    const existing = await PlaceLike.findOne({ where: { place_id: id, user_id: uid } });
    if (existing) {
      await existing.destroy();
      return res.json({ liked: false });
    }
    await PlaceLike.create({ place_id: id, user_id: uid });
    return res.json({ liked: true });
  } catch (err) {
    console.error("toggleLike:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════
   COMMENTS
══════════════════════════════════════════════════════════ */

// GET /api/places/:id/comments
export const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await PlaceComment.findAll({
      where: { place_id: id, parent_id: null }, // top-level only
      include: [
        { model: User, as: "user", attributes: ["id","first_name","last_name","avatar"] },
        {
          model: PlaceComment, as: "replies",
          include: [{ model: User, as: "user", attributes: ["id","first_name","last_name","avatar"] }],
          order: [["created_at", "ASC"]],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.json(comments);
  } catch (err) {
    console.error("getComments:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/places/:id/comments
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, parent_id } = req.body;
    const uid = userId(req);

    if (!text?.trim()) return res.status(400).json({ message: "Comment text required" });

    const comment = await PlaceComment.create({
      place_id:  id,
      user_id:   uid,
      parent_id: parent_id || null,
      text:      text.trim(),
    });

    // Return with user info
    const full = await PlaceComment.findByPk(comment.id, {
      include: [{ model: User, as: "user", attributes: ["id","first_name","last_name","avatar"] }],
    });

    return res.status(201).json(full);
  } catch (err) {
    console.error("addComment:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/places/comments/:commentId
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const uid = userId(req);

    const comment = await PlaceComment.findByPk(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.user_id !== uid && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await comment.destroy();
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteComment:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════
   RATINGS
══════════════════════════════════════════════════════════ */

// GET /api/places/:id/ratings
export const getRatings = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = userId(req);

    const ratings = await PlaceRating.findAll({ where: { place_id: id } });

    const total = ratings.length;
    const avg   = total ? (ratings.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : "0.0";

    // Distribution
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => dist[r.rating]++);

    const myRating = uid ? ratings.find(r => r.user_id === uid)?.rating || 0 : 0;

    return res.json({ avg: parseFloat(avg), total, dist, myRating });
  } catch (err) {
    console.error("getRatings:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/places/:id/rate
export const ratePlace = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const uid = userId(req);

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be 1–5" });
    }

    await PlaceRating.upsert({ place_id: id, user_id: uid, rating });

    // Return updated stats
    const ratings = await PlaceRating.findAll({ where: { place_id: id } });
    const total = ratings.length;
    const avg   = (ratings.reduce((s, r) => s + r.rating, 0) / total).toFixed(1);
    const dist  = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => dist[r.rating]++);

    return res.json({ avg: parseFloat(avg), total, dist, myRating: rating });
  } catch (err) {
    console.error("ratePlace:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════
   VISITS
══════════════════════════════════════════════════════════ */

// GET /api/places/:id/visits
export const getVisits = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = userId(req);

    const visits = await PlaceVisit.findAll({
      where: { place_id: id },
      include: [{ model: User, as: "user", attributes: ["id","first_name","last_name"] }],
    });

    const visitedByMe = uid ? visits.some(v => v.user_id === uid) : false;

    return res.json({ count: visits.length, visitedByMe, users: visits.map(v => v.user) });
  } catch (err) {
    console.error("getVisits:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/places/:id/visit (toggle)
export const toggleVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = userId(req);

    const existing = await PlaceVisit.findOne({ where: { place_id: id, user_id: uid } });
    if (existing) {
      await existing.destroy();
      return res.json({ visited: false });
    }
    await PlaceVisit.create({ place_id: id, user_id: uid });
    return res.json({ visited: true });
  } catch (err) {
    console.error("toggleVisit:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════
   TAGS
══════════════════════════════════════════════════════════ */

// GET /api/places/:id/tags
export const getTags = async (req, res) => {
  try {
    const tags = await PlaceTag.findAll({ where: { place_id: req.params.id } });
    return res.json(tags.map(t => t.tag));
  } catch (err) {
    console.error("getTags:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/places/:id/tags  (admin or submitter)
export const updateTags = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body; // string[]

    if (!Array.isArray(tags)) return res.status(400).json({ message: "tags must be array" });

    // Delete existing, insert new
    await PlaceTag.destroy({ where: { place_id: id } });
    if (tags.length > 0) {
      await PlaceTag.bulkCreate(tags.map(tag => ({ place_id: id, tag })));
    }

    return res.json({ tags });
  } catch (err) {
    console.error("updateTags:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════
   CONDITIONS  (admin only update)
══════════════════════════════════════════════════════════ */

// GET /api/places/:id/conditions
export const getConditions = async (req, res) => {
  try {
    let cond = await PlaceCondition.findOne({ where: { place_id: req.params.id } });
    if (!cond) {
      // Return defaults if not set yet
      cond = { trail: "Good", road: "Paved", best_time: "Oct–Mar", difficulty: "Moderate", note: null };
    }
    return res.json(cond);
  } catch (err) {
    console.error("getConditions:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/places/:id/conditions  (admin only)
export const updateConditions = async (req, res) => {
  try {
    const { id } = req.params;
    const { trail, road, best_time, difficulty, note } = req.body;
    const uid = userId(req);

    const [cond, created] = await PlaceCondition.findOrCreate({
      where: { place_id: id },
      defaults: { trail, road, best_time, difficulty, note, updated_by: uid },
    });

    if (!created) {
      await cond.update({ trail, road, best_time, difficulty, note, updated_by: uid });
    }

    return res.json(cond);
  } catch (err) {
    console.error("updateConditions:", err);
    return res.status(500).json({ message: "Server error" });
  }
};