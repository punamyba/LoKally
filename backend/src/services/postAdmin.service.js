// postAdmin.service.js — pure business logic, no req/res

import { Op } from "sequelize";
import Post       from "../models/post.model.js";
import PostReport from "../models/postreport.model.js";
import User       from "../models/user.model.js";

// ── FETCH ALL POSTS (admin view) ──────────────────────────────────────────────

export const fetchAdminPosts = async ({ filter, page, limit }) => {
  const offset = (page - 1) * limit;

  // build where clause based on filter
  let where = {};
  if (filter === "reported") where = { reports_count: { [Op.gt]: 0 } };
  if (filter === "hidden")   where = { is_hidden: true };

  const { count: totalFiltered, rows: posts } = await Post.findAndCountAll({
    where,
    attributes: ["id", "user_id", "caption", "images", "likes_count", "comments_count", "reports_count", "is_hidden", "created_at"],
    include: [{ model: User, as: "author", attributes: ["id", "first_name", "last_name"] }],
    order:    [["created_at", "DESC"]],
    limit, offset,
    distinct: true, // needed for accurate count when using include
  });

  // get all tab counts in one query instead of 3 separate COUNT calls
  const [[countRow]] = await Post.sequelize.query(`
    SELECT
      COUNT(*)                                            AS total,
      SUM(CASE WHEN reports_count > 0 THEN 1 ELSE 0 END) AS reported,
      SUM(CASE WHEN is_hidden = true  THEN 1 ELSE 0 END)  AS hidden
    FROM posts
  `);

  const counts = {
    total:    parseInt(countRow.total    || 0),
    reported: parseInt(countRow.reported || 0),
    hidden:   parseInt(countRow.hidden   || 0),
  };

  return { posts, counts, totalFiltered, page, limit };
};

// ── FETCH SINGLE POST (admin view) ────────────────────────────────────────────

export const fetchAdminPost = async (postId) => {
  const post = await Post.findByPk(postId, {
    include: [{ model: User, as: "author", attributes: ["id", "first_name", "last_name", "email"] }],
  });
  if (!post) return { notFound: true };

  // include non-dismissed reports with reporter info
  const reports = await PostReport.findAll({
    where:   { post_id: post.id, dismissed: false },
    include: [{ model: User, as: "reporter", attributes: ["id", "first_name", "last_name"] }],
    order:   [["created_at", "DESC"]],
  });

  return { post: { ...post.toJSON(), reports } };
};

// ── HIDE / UNHIDE ─────────────────────────────────────────────────────────────

export const hidePost = async (postId) => {
  const post = await Post.findByPk(postId);
  if (!post) return { notFound: true };
  await post.update({ is_hidden: true });
  return { ok: true };
};

export const unhidePost = async (postId) => {
  const post = await Post.findByPk(postId);
  if (!post) return { notFound: true };
  await post.update({ is_hidden: false });
  return { ok: true };
};

// ── DELETE ────────────────────────────────────────────────────────────────────

export const deletePost = async (postId) => {
  const post = await Post.findByPk(postId);
  if (!post) return { notFound: true };
  await post.destroy(); // hard delete — no cascade needed here (admin action)
  return { deleted: true };
};

// ── DISMISS REPORTS ───────────────────────────────────────────────────────────

export const dismissReports = async (postId) => {
  const post = await Post.findByPk(postId);
  if (!post) return { notFound: true };

  // mark all reports as dismissed and reset counters + visibility
  await PostReport.update({ dismissed: true }, { where: { post_id: postId } });
  await post.update({ reports_count: 0, is_hidden: false });
  return { ok: true };
};

// ── FETCH ALL REPORTS ─────────────────────────────────────────────────────────

export const fetchReports = async ({ page, limit }) => {
  const offset = (page - 1) * limit;

  return PostReport.findAll({
    where:   { dismissed: false }, // only active reports
    order:   [["created_at", "DESC"]],
    limit, offset,
    include: [
      { model: User, as: "reporter", attributes: ["id", "first_name", "last_name"] },
      {
        model: Post, as: "post",
        include: [{ model: User, as: "author", attributes: ["id", "first_name", "last_name"] }],
      },
    ],
  });
};