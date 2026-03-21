import { Op } from "sequelize";
import Post from "../models/post.model.js";
import PostLike from "../models/postlike.model.js";
import PostComment from "../models/postcomment.model.js";
import PostBookmark from "../models/postbookmark.model.js";
import PostReport from "../models/postreport.model.js";
import User from "../models/user.model.js";

async function attachUserFlags(posts, userId) {
  if (!userId || posts.length === 0) {
    return posts.map((p) => (p.toJSON ? p.toJSON() : p));
  }

  const ids = posts.map((p) => p.id);

  const [likes, bookmarks] = await Promise.all([
    PostLike.findAll({
      where: { post_id: { [Op.in]: ids }, user_id: userId },
      attributes: ["post_id", "react_type"],
    }),
    PostBookmark.findAll({
      where: { post_id: { [Op.in]: ids }, user_id: userId },
      attributes: ["post_id"],
    }),
  ]);

  const likeMap = Object.fromEntries(likes.map((l) => [l.post_id, l.react_type]));
  const bookmarkSet = new Set(bookmarks.map((b) => b.post_id));

  return posts.map((p) => ({
    ...(p.toJSON ? p.toJSON() : p),
    has_liked: likeMap[p.id] !== undefined,
    liked_type: likeMap[p.id] || "like",
    is_bookmarked: bookmarkSet.has(p.id),
  }));
}

const POST_ATTRS = [
  "id", "user_id", "caption", "images", "place_id",
  "likes_count", "comments_count", "reports_count",
  "is_hidden", "created_at",
];

const AUTHOR_INCLUDE = {
  model: User,
  as: "author",
  attributes: ["id", "first_name", "last_name"],
};

// GET /api/posts
export const getFeed = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(10, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const posts = await Post.findAll({
      where: { is_hidden: false },
      attributes: POST_ATTRS,
      include: [AUTHOR_INCLUDE],
      order: [["created_at", "DESC"]],
      limit, offset, subQuery: false,
    });

    const data = await attachUserFlags(posts, req.user?.id);
    return res.json({ success: true, data, page, limit, hasMore: data.length === limit });
  } catch (err) {
    console.error("getFeed:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/posts/trending
export const getTrending = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(10, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const posts = await Post.findAll({
      where: { is_hidden: false },
      attributes: POST_ATTRS,
      include: [AUTHOR_INCLUDE],
      order: [["likes_count", "DESC"], ["created_at", "DESC"]],
      limit, offset, subQuery: false,
    });

    const data = await attachUserFlags(posts, req.user?.id);
    return res.json({ success: true, data, page, limit, hasMore: data.length === limit });
  } catch (err) {
    console.error("getTrending:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/posts/saved
export const getSaved = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(10, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    const bookmarks = await PostBookmark.findAll({
      where: { user_id: userId },
      attributes: ["post_id"],
      order: [["created_at", "DESC"]],
      limit, offset,
    });

    const postIds = bookmarks.map((b) => b.post_id);

    if (postIds.length === 0) {
      return res.json({ success: true, data: [], page, limit, hasMore: false });
    }

    const posts = await Post.findAll({
      where: { id: { [Op.in]: postIds }, is_hidden: false },
      attributes: POST_ATTRS,
      include: [AUTHOR_INCLUDE],
    });

    // Keep bookmark order
    const postMap = Object.fromEntries(posts.map((p) => [p.id, p]));
    const ordered = postIds.map((id) => postMap[id]).filter(Boolean);

    const data = await attachUserFlags(ordered, userId);
    return res.json({ success: true, data, page, limit, hasMore: data.length === limit });
  } catch (err) {
    console.error("getSaved:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/posts/:id/likes  — who liked
export const getLikers = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const likes = await PostLike.findAll({
      where: { post_id: postId },
      include: [{
        model: User,
        as: "liker",
        attributes: ["id", "first_name", "last_name"],
      }],
      order: [["created_at", "DESC"]],
    });

    const data = likes.map((l) => ({
      user_id:    l.user_id,
      react_type: l.react_type,
      first_name: l.liker?.first_name,
      last_name:  l.liker?.last_name,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error("getLikers:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/posts/:id
export const getPost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [AUTHOR_INCLUDE],
    });

    if (!post || post.is_hidden) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const [data] = await attachUserFlags([post], req.user?.id);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("getPost:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/posts
export const createPost = async (req, res) => {
  try {
    const { caption, place_id } = req.body;

    if (!caption?.trim() && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ success: false, message: "Caption or image required" });
    }

    let images = null;
    if (req.files && req.files.length > 0) {
      images = JSON.stringify(req.files.map((f) => `/uploads/posts/${f.filename}`));
    }

    const post = await Post.create({
      user_id:  req.user.id,
      caption:  caption?.trim() || null,
      images,
      place_id: place_id || null,
    });

    const full = await Post.findByPk(post.id, { include: [AUTHOR_INCLUDE] });

    return res.status(201).json({
      success: true,
      data: { ...full.toJSON(), has_liked: false, liked_type: "like", is_bookmarked: false },
    });
  } catch (err) {
    console.error("createPost:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/posts/:id
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Not found" });

    if (post.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await post.destroy();
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deletePost:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/posts/:id/like
export const toggleLike = async (req, res) => {
  try {
    const postId   = parseInt(req.params.id);
    const userId   = req.user.id;
    const reactType = req.body.react_type || "like";

    const post = await Post.findByPk(postId);
    if (!post || post.is_hidden) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const existing = await PostLike.findOne({ where: { post_id: postId, user_id: userId } });

    if (existing) {
      if (existing.react_type === reactType) {
        await existing.destroy();
        await post.decrement("likes_count");
        return res.json({ success: true, liked: false, react_type: null });
      } else {
        await existing.update({ react_type: reactType });
        return res.json({ success: true, liked: true, react_type: reactType });
      }
    } else {
      await PostLike.create({ post_id: postId, user_id: userId, react_type: reactType });
      await post.increment("likes_count");
      return res.json({ success: true, liked: true, react_type: reactType });
    }
  } catch (err) {
    console.error("toggleLike:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/posts/:id/comments
export const getComments = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const topLevel = await PostComment.findAll({
      where: { post_id: postId, parent_id: null, is_hidden: false },
      order: [["created_at", "ASC"]],
      include: [{ model: User, as: "commenter", attributes: ["id", "first_name", "last_name"] }],
    });

    const parentIds = topLevel.map((c) => c.id);

    const replies = parentIds.length > 0
      ? await PostComment.findAll({
          where: { parent_id: { [Op.in]: parentIds }, is_hidden: false },
          order: [["created_at", "ASC"]],
          include: [{ model: User, as: "commenter", attributes: ["id", "first_name", "last_name"] }],
        })
      : [];

    const replyMap = {};
    replies.forEach((r) => {
      if (!replyMap[r.parent_id]) replyMap[r.parent_id] = [];
      replyMap[r.parent_id].push({ ...r.toJSON(), user: r.commenter });
    });

    const data = topLevel.map((c) => ({
      ...c.toJSON(),
      user: c.commenter,
      replies: replyMap[c.id] || [],
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error("getComments:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/posts/:id/comments
export const addComment = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { body, parent_id } = req.body;

    if (!body?.trim()) {
      return res.status(400).json({ success: false, message: "Comment cannot be empty" });
    }

    const post = await Post.findByPk(postId);
    if (!post || post.is_hidden) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = await PostComment.create({
      post_id:   postId,
      user_id:   req.user.id,
      parent_id: parent_id || null,
      body:      body.trim(),
    });

    if (!parent_id) await post.increment("comments_count");

    const full = await PostComment.findByPk(comment.id, {
      include: [{ model: User, as: "commenter", attributes: ["id", "first_name", "last_name"] }],
    });

    return res.status(201).json({
      success: true,
      data: { ...full.toJSON(), user: full.commenter },
    });
  } catch (err) {
    console.error("addComment:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/posts/:id/comments/:commentId
export const deleteComment = async (req, res) => {
  try {
    const comment = await PostComment.findByPk(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Not found" });

    if (comment.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const post = await Post.findByPk(comment.post_id);
    await comment.destroy();
    if (!comment.parent_id && post) await post.decrement("comments_count");

    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deleteComment:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


export const toggleBookmark = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    const existing = await PostBookmark.findOne({ where: { post_id: postId, user_id: userId } });

    if (existing) {
      await existing.destroy();
      return res.json({ success: true, bookmarked: false });
    } else {
      await PostBookmark.create({ post_id: postId, user_id: userId });
      return res.json({ success: true, bookmarked: true });
    }
  } catch (err) {
    console.error("toggleBookmark:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/posts/:id/report
export const reportPost = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: "Reason required" });
    }

    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const exists = await PostReport.findOne({ where: { post_id: postId, user_id: userId } });
    if (exists) return res.status(409).json({ success: false, message: "Already reported" });

    await PostReport.create({ post_id: postId, user_id: userId, reason: reason.trim() });
    await post.increment("reports_count");

    if (post.reports_count + 1 >= 5) {
      await post.update({ is_hidden: true });
    }

    return res.json({ success: true, message: "Report submitted" });
  } catch (err) {
    console.error("reportPost:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};