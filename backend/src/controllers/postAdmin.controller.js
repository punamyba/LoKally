// postAdmin.controller.js
// Only handles: request parsing, validation, calling service, sending response.
// Zero business logic here — all logic lives in postAdmin.service.js

import * as PostAdminService from "../services/postAdmin.service.js";

// ── GET ALL POSTS ─────────────────────────────────────────────────────────────

export const adminGetPosts = async (req, res) => {
  const { filter = "all" } = req.query;
  const VALID_FILTERS = ["all", "reported", "hidden"];

  if (!VALID_FILTERS.includes(filter)) // only these 3 filters allowed
    return res.status(400).json({ success: false, message: `Invalid filter. Must be: ${VALID_FILTERS.join(", ")}` });

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(20, parseInt(req.query.limit) || 12);

  try {
    const result = await PostAdminService.fetchAdminPosts({ filter, page, limit });
    res.json({
      success: true,
      data:    result.posts,
      counts:  result.counts,
      page:    result.page,
      limit:   result.limit,
      hasMore: (page - 1) * limit + result.posts.length < result.totalFiltered,
    });
  } catch (err) {
    console.error("adminGetPosts error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET SINGLE POST ───────────────────────────────────────────────────────────

export const adminGetPost = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) // must be a valid number
    return res.status(400).json({ success: false, message: "Valid post ID is required" });

  try {
    const result = await PostAdminService.fetchAdminPost(id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "Post not found" });

    res.json({ success: true, data: result.post });
  } catch (err) {
    console.error("adminGetPost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── HIDE POST ─────────────────────────────────────────────────────────────────

export const adminHidePost = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id))
    return res.status(400).json({ success: false, message: "Valid post ID is required" });

  try {
    const result = await PostAdminService.hidePost(id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "Post not found" });

    res.json({ success: true, message: "Post hidden" });
  } catch (err) {
    console.error("adminHidePost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── UNHIDE POST ───────────────────────────────────────────────────────────────

export const adminUnhidePost = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id))
    return res.status(400).json({ success: false, message: "Valid post ID is required" });

  try {
    const result = await PostAdminService.unhidePost(id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "Post not found" });

    res.json({ success: true, message: "Post visible again" });
  } catch (err) {
    console.error("adminUnhidePost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── DELETE POST ───────────────────────────────────────────────────────────────

export const adminDeletePost = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id))
    return res.status(400).json({ success: false, message: "Valid post ID is required" });

  try {
    const result = await PostAdminService.deletePost(id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "Post not found" });

    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    console.error("adminDeletePost error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── DISMISS REPORTS ───────────────────────────────────────────────────────────

export const adminDismissReports = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id))
    return res.status(400).json({ success: false, message: "Valid post ID is required" });

  try {
    const result = await PostAdminService.dismissReports(id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "Post not found" });

    res.json({ success: true, message: "Reports dismissed" });
  } catch (err) {
    console.error("adminDismissReports error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET ALL REPORTS ───────────────────────────────────────────────────────────

export const adminGetReports = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;

  try {
    const data = await PostAdminService.fetchReports({ page, limit });
    res.json({ success: true, data });
  } catch (err) {
    console.error("adminGetReports error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};