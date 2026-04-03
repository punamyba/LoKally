// placeFeatures.controller.js
// Only handles: request parsing, validation, calling service, sending response.
// Zero business logic here — all logic lives in placeFeatures.service.js

import * as PlaceFeaturesService from "../services/placeFeatures.service.js";

// ── LIKES ─────────────────────────────────────────────────────────────────────

export const getLikes = async (req, res) => {
  try {
    const data = await PlaceFeaturesService.fetchLikes(req.params.id, req.user?.id);
    res.json(data);
  } catch (err) {
    console.error("getLikes error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const result = await PlaceFeaturesService.toggleLike(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    console.error("toggleLike error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── COMMENTS ──────────────────────────────────────────────────────────────────

export const getComments = async (req, res) => {
  try {
    const comments = await PlaceFeaturesService.fetchComments(req.params.id);
    res.json(comments);
  } catch (err) {
    console.error("getComments error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const addComment = async (req, res) => {
  const { text, parent_id } = req.body;

  if (!text?.trim()) // empty comment not allowed
    return res.status(400).json({ message: "Comment text is required" });

  try {
    const comment = await PlaceFeaturesService.addComment({
      placeId:   req.params.id,
      userId:    req.user.id,
      text,
      parent_id, // null = top-level comment, id = reply to another comment
    });
    res.status(201).json(comment);
  } catch (err) {
    console.error("addComment error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const result = await PlaceFeaturesService.deleteComment(
      req.params.commentId,
      req.user.id,
      req.user.role
    );

    if (result.notFound) return res.status(404).json({ message: "Comment not found" });
    if (result.forbidden) return res.status(403).json({ message: "You are not allowed to delete this comment" });

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("deleteComment error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── RATINGS ───────────────────────────────────────────────────────────────────

export const getRatings = async (req, res) => {
  try {
    const data = await PlaceFeaturesService.fetchRatings(req.params.id, req.user?.id);
    res.json(data);
  } catch (err) {
    console.error("getRatings error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const ratePlace = async (req, res) => {
  const { rating } = req.body;

  if (!rating || isNaN(rating))        // must be a number
    return res.status(400).json({ message: "Rating is required" });
  if (rating < 1 || rating > 5)        // only 1–5 stars allowed
    return res.status(400).json({ message: "Rating must be between 1 and 5" });

  try {
    const data = await PlaceFeaturesService.ratePlace(req.params.id, req.user.id, Number(rating));
    res.json(data);
  } catch (err) {
    console.error("ratePlace error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── VISITS ────────────────────────────────────────────────────────────────────

export const getVisits = async (req, res) => {
  try {
    const data = await PlaceFeaturesService.fetchVisits(req.params.id, req.user?.id);
    res.json(data);
  } catch (err) {
    console.error("getVisits error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleVisit = async (req, res) => {
  try {
    const result = await PlaceFeaturesService.toggleVisit(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    console.error("toggleVisit error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── TAGS ──────────────────────────────────────────────────────────────────────

export const getTags = async (req, res) => {
  try {
    const tags = await PlaceFeaturesService.fetchTags(req.params.id);
    res.json(tags);
  } catch (err) {
    console.error("getTags error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTags = async (req, res) => {
  const { tags } = req.body;

  if (!Array.isArray(tags)) // tags must be a string array e.g. ["hiking", "lake"]
    return res.status(400).json({ message: "tags must be an array of strings" });

  if (tags.some(t => typeof t !== "string" || !t.trim())) // no empty strings in array
    return res.status(400).json({ message: "Each tag must be a non-empty string" });

  try {
    const result = await PlaceFeaturesService.updateTags(req.params.id, tags);
    res.json(result);
  } catch (err) {
    console.error("updateTags error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── CONDITIONS ────────────────────────────────────────────────────────────────

export const getConditions = async (req, res) => {
  try {
    const data = await PlaceFeaturesService.fetchConditions(req.params.id);
    res.json(data);
  } catch (err) {
    console.error("getConditions error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateConditions = async (req, res) => {
  const { trail, road, best_time, difficulty, note } = req.body;

  if (!trail && !road && !best_time && !difficulty) // at least one field required
    return res.status(400).json({ message: "At least one condition field is required" });

  try {
    const data = await PlaceFeaturesService.updateConditions({
      placeId: req.params.id,
      trail, road, best_time, difficulty, note,
      userId: req.user.id,
    });
    res.json(data);
  } catch (err) {
    console.error("updateConditions error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};