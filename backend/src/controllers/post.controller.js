// post.controller.js
// Only handles: request parsing, validation, calling service, sending response.
// Zero business logic here — all logic lives in post.service.js

import * as PostService from "../services/post.service.js";

// ── FEED ──────────────────────────────────────────────────────────────────────

export const getFeed = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(10, parseInt(req.query.limit) || 10);

    const data = await PostService.fetchFeed({ page, limit, userId: req.user?.id });
    res.json({ success: true, data, page, limit, hasMore: data.length === limit });
  } catch (err) {
    console.error("getFeed error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTrending = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(10, parseInt(req.query.limit) || 10);

    const data = await PostService.fetchTrending({ page, limit, userId: req.user?.id });
    res.json({ success: true, data, page, limit, hasMore: data.length === limit });
  } catch (err) {
    console.error("getTrending error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getSaved = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(10, parseInt(req.query.limit) || 10);

    const data = await PostService.fetchSaved({ page, limit, userId: req.user.id });
    res.json({ success: true, data, page, limit, hasMore: data.length === limit });
  } catch (err) {
    console.error("getSaved error full:", err);
console.error("getSaved error message:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── SINGLE POST ───────────────────────────────────────────────────────────────

export const getPost = async (req, res) => {
  try {
    const result = await PostService.fetchPost(req.params.id, req.user?.id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "Post not found" });

    res.json({ success: true, data: result.post });
  } catch (err) {
    console.error("getPost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getLikers = async (req, res) => {
  try {
    const data = await PostService.fetchLikers(parseInt(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    console.error("getLikers error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getComments = async (req, res) => {
  try {
    const data = await PostService.fetchComments(parseInt(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    console.error("getComments error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── MUTATIONS ─────────────────────────────────────────────────────────────────

export const createPost = async (req, res) => {
  const { caption, place_id } = req.body;

  // at least caption or image required
  if (!caption?.trim() && (!req.files || req.files.length === 0))
    return res.status(400).json({ success: false, message: "Caption or image is required" });

  try {
    const data = await PostService.createPost({
      userId: req.user.id,
      caption,
      files:    req.files,
      place_id,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error("createPost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updatePost = async (req, res) => {
  let existingImages = [];
  try { existingImages = JSON.parse(req.body.existingImages || "[]"); }
  catch { existingImages = []; } // invalid JSON → treat as empty

  try {
    const result = await PostService.updatePost({
      postId:         req.params.id,
      userId:         req.user.id,
      caption:        req.body.caption,
      existingImages,
      files:          req.files || [],
    });

    if (result.notFound)  return res.status(404).json({ success: false, message: "Post not found" });
    if (result.forbidden) return res.status(403).json({ success: false, message: "You can only edit your own posts" });

    res.json({ success: true, data: result.post });
  } catch (err) {
    console.error("updatePost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const result = await PostService.deletePost(req.params.id, req.user.id, req.user.role);
    if (result.notFound)  return res.status(404).json({ success: false, message: "Post not found" });
    if (result.forbidden) return res.status(403).json({ success: false, message: "You can only delete your own posts" });

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    console.error("deletePost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const toggleLike = async (req, res) => {
  const reactType = req.body.react_type || "like";

  try {
    const result = await PostService.toggleLike({
      postId:   parseInt(req.params.id),
      userId:   req.user.id,
      reactType,
      user:     req.user, // passed for notification message
    });

    if (result.notFound)
      return res.status(404).json({ success: false, message: "Post not found" });

    res.json({ success: true, liked: result.liked, react_type: result.react_type });
  } catch (err) {
    console.error("toggleLike error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addComment = async (req, res) => {
  const { body, parent_id } = req.body;

  if (!body?.trim()) // empty comment not allowed
    return res.status(400).json({ success: false, message: "Comment cannot be empty" });

  try {
    const result = await PostService.addComment({
      postId:    parseInt(req.params.id),
      userId:    req.user.id,
      body,
      parent_id,
      user:      req.user, // passed for notification message
    });

    if (result.notFound)
      return res.status(404).json({ success: false, message: "Post not found" });

    res.status(201).json({ success: true, data: result.comment });
  } catch (err) {
    console.error("addComment error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const result = await PostService.deleteComment(
      req.params.commentId,
      req.user.id,
      req.user.role
    );

    if (result.notFound)  return res.status(404).json({ success: false, message: "Comment not found" });
    if (result.forbidden) return res.status(403).json({ success: false, message: "You can only delete your own comments" });

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    console.error("deleteComment error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const toggleBookmark = async (req, res) => {
  try {
    const result = await PostService.toggleBookmark(
      parseInt(req.params.id),
      req.user.id
    );
    res.json({ success: true, bookmarked: result.bookmarked });
  } catch (err) {
    console.error("toggleBookmark error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const reportPost = async (req, res) => {
  const { reason } = req.body;

  if (!reason?.trim()) // reason required so admin knows why it was reported
    return res.status(400).json({ success: false, message: "Report reason is required" });

  try {
    const result = await PostService.reportPost({
      postId: parseInt(req.params.id),
      userId: req.user.id,
      reason,
    });

    if (result.notFound)       return res.status(404).json({ success: false, message: "Post not found" });
    if (result.alreadyReported) return res.status(409).json({ success: false, message: "You have already reported this post" });

    res.json({ success: true, message: "Report submitted successfully" });
  } catch (err) {
    console.error("reportPost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── ADMIN ─────────────────────────────────────────────────────────────────────

export const adminHidePost = async (req, res) => {
  try {
    const result = await PostService.adminHidePost(req.params.id);
    if (result.notFound) return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, message: "Post hidden" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminUnhidePost = async (req, res) => {
  try {
    const result = await PostService.adminUnhidePost(req.params.id);
    if (result.notFound) return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, message: "Post unhidden" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminDeletePost = async (req, res) => {
  try {
    const result = await PostService.adminDeletePost(req.params.id);
    if (result.notFound) return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};