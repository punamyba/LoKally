// post.service.js — pure business logic, no req/res

import { Op } from "sequelize";
import Post         from "../models/post.model.js";
import PostLike     from "../models/postlike.model.js";
import PostComment  from "../models/postcomment.model.js";
import PostBookmark from "../models/postbookmark.model.js";
import PostReport   from "../models/postreport.model.js";
import User         from "../models/user.model.js";
import { createNotification } from "./notification.service.js";
import { PostDTO } from "../DTOs/post.dto.js";

const POST_ATTRS = [
  "id", "user_id", "caption", "images", "place_id",
  "likes_count", "comments_count", "created_at",
];

const AUTHOR_INCLUDE = {
  model:      User,
  as:         "author",
  attributes: ["id", "first_name", "last_name", "avatar"],
};

// attaches liked/bookmarked flags per post for the current user
async function attachUserFlags(posts, userId) {
  if (!userId || posts.length === 0)
    return posts.map((p) => (p.toJSON ? p.toJSON() : p));

  const ids = posts.map((p) => p.id);
  const [likes, bookmarks] = await Promise.all([
    PostLike.findAll({
      where:      { post_id: { [Op.in]: ids }, user_id: userId },
      attributes: ["post_id", "react_type"],
    }),
    PostBookmark.findAll({
      where:      { post_id: { [Op.in]: ids }, user_id: userId },
      attributes: ["post_id"],
    }),
  ]);

  const likeMap     = Object.fromEntries(likes.map((l) => [l.post_id, l.react_type]));
  const bookmarkSet = new Set(bookmarks.map((b) => b.post_id));

  return posts.map((p) => ({
    ...(p.toJSON ? p.toJSON() : p),
    has_liked:     likeMap[p.id] !== undefined,
    liked_type:    likeMap[p.id] || "like",
    is_bookmarked: bookmarkSet.has(p.id),
  }));
}

async function cascadeDeletePost(postId) {
  await PostLike.destroy    ({ where: { post_id: postId } });
  await PostComment.destroy ({ where: { post_id: postId } });
  await PostBookmark.destroy({ where: { post_id: postId } });
  await PostReport.destroy  ({ where: { post_id: postId } });
  await Post.destroy        ({ where: { id: postId } });
}

// ── FEED ──────────────────────────────────────────────────────────────────────

export const fetchFeed = async ({ page, limit, userId }) => {
  const offset = (page - 1) * limit;
  const posts  = await Post.findAll({
    where: { is_hidden: false },
    attributes: POST_ATTRS,
    include: [AUTHOR_INCLUDE],
    order: [["created_at", "DESC"]],
    limit, offset, subQuery: false,
  });
  const withFlags = await attachUserFlags(posts, userId);
  return withFlags.map(PostDTO); // apply DTO — remove reports_count, is_hidden etc.
};

export const fetchTrending = async ({ page, limit, userId }) => {
  const offset = (page - 1) * limit;
  const posts  = await Post.findAll({
    where: { is_hidden: false },
    attributes: POST_ATTRS,
    include: [AUTHOR_INCLUDE],
    order: [["likes_count", "DESC"], ["created_at", "DESC"]],
    limit, offset, subQuery: false,
  });
  const withFlags = await attachUserFlags(posts, userId);
  return withFlags.map(PostDTO);
};

export const fetchSaved = async ({ page, limit, userId }) => {
  const offset    = (page - 1) * limit;
  const bookmarks = await PostBookmark.findAll({
    where:      { user_id: userId },
    attributes: ["post_id"],
    order:      [["created_at", "DESC"]],
    limit, offset,
  });

  const postIds = bookmarks.map((b) => b.post_id);
  if (postIds.length === 0) return [];

  const posts = await Post.findAll({
    where:      { id: { [Op.in]: postIds }, is_hidden: false },
    attributes: POST_ATTRS,
    include:    [AUTHOR_INCLUDE],
  });

  const postMap = Object.fromEntries(posts.map((p) => [p.id, p]));
  const ordered = postIds.map((id) => postMap[id]).filter(Boolean);
  const withFlags = await attachUserFlags(ordered, userId);
  return withFlags.map(PostDTO);
};

// ── SINGLE POST ───────────────────────────────────────────────────────────────

export const fetchPost = async (postId, userId) => {
  const post = await Post.findByPk(postId, { include: [AUTHOR_INCLUDE] });
  if (!post || post.is_hidden) return { notFound: true };

  const [withFlags] = await attachUserFlags([post], userId);
  return { post: PostDTO(withFlags) };
};

export const fetchLikers = async (postId) => {
  const likes = await PostLike.findAll({
    where:   { post_id: postId },
    include: [{ model: User, as: "liker", attributes: ["id", "first_name", "last_name", "avatar"] }],
    order:   [["created_at", "DESC"]],
  });
  return likes.map((l) => ({
    user_id:    l.user_id,
    react_type: l.react_type,
    first_name: l.liker?.first_name,
    last_name:  l.liker?.last_name,
    avatar:     l.liker?.avatar || null,
  }));
};

export const fetchComments = async (postId) => {
  const topLevel = await PostComment.findAll({
    where:   { post_id: postId, parent_id: null, is_hidden: false },
    order:   [["created_at", "ASC"]],
    include: [{ model: User, as: "commenter", attributes: ["id", "first_name", "last_name", "avatar"] }],
  });

  const parentIds = topLevel.map((c) => c.id);
  const replies   = parentIds.length > 0
    ? await PostComment.findAll({
        where:   { parent_id: { [Op.in]: parentIds }, is_hidden: false },
        order:   [["created_at", "ASC"]],
        include: [{ model: User, as: "commenter", attributes: ["id", "first_name", "last_name", "avatar"] }],
      })
    : [];

  const replyMap = {};
  replies.forEach((r) => {
    if (!replyMap[r.parent_id]) replyMap[r.parent_id] = [];
    replyMap[r.parent_id].push({ ...r.toJSON(), user: r.commenter });
  });

  return topLevel.map((c) => ({
    ...c.toJSON(),
    user:    c.commenter,
    replies: replyMap[c.id] || [],
  }));
};

// ── MUTATIONS ─────────────────────────────────────────────────────────────────

export const createPost = async ({ userId, caption, files, place_id }) => {
  const images = files && files.length > 0
    ? JSON.stringify(files.map((f) => `/uploads/posts/${f.filename}`))
    : null;

  const post = await Post.create({
    user_id:  userId,
    caption:  caption?.trim() || null,
    images,
    place_id: place_id || null,
  });

  const full = await Post.findByPk(post.id, { include: [AUTHOR_INCLUDE] });
  return PostDTO({ ...full.toJSON(), has_liked: false, liked_type: "like", is_bookmarked: false });
};

export const updatePost = async ({ postId, userId, caption, existingImages, files }) => {
  const post = await Post.findByPk(postId);
  if (!post) return { notFound: true };
  if (post.user_id !== userId) return { forbidden: true };

  const newImages = files && files.length > 0
    ? files.map((f) => `/uploads/posts/${f.filename}`)
    : [];

  const allImages = [...existingImages, ...newImages];
  const images    = allImages.length > 0 ? JSON.stringify(allImages) : null;

  await post.update({ caption: caption?.trim() || null, images });

  const full = await Post.findByPk(postId, { include: [AUTHOR_INCLUDE] });
  return { post: full };
};

export const deletePost = async (postId, userId, userRole) => {
  const post = await Post.findByPk(postId);
  if (!post) return { notFound: true };
  if (post.user_id !== userId && userRole !== "admin") return { forbidden: true };
  await cascadeDeletePost(post.id);
  return { deleted: true };
};

export const toggleLike = async ({ postId, userId, reactType, user }) => {
  const post = await Post.findByPk(postId);
  if (!post || post.is_hidden) return { notFound: true };

  const existing = await PostLike.findOne({ where: { post_id: postId, user_id: userId } });
  if (existing) {
    if (existing.react_type === reactType) {
      await existing.destroy();
      await post.decrement("likes_count");
      return { liked: false, react_type: null };
    } else {
      await existing.update({ react_type: reactType });
      return { liked: true, react_type: reactType };
    }
  }

  await PostLike.create({ post_id: postId, user_id: userId, react_type: reactType });
  await post.increment("likes_count");
  await createNotification({
    user_id:  post.user_id,
    actor_id: userId,
    type:     "like",
    post_id:  postId,
    message:  `${user.first_name} ${user.last_name} liked your post`,
  });
  return { liked: true, react_type: reactType };
};

export const addComment = async ({ postId, userId, body, parent_id, user }) => {
  const post = await Post.findByPk(postId);
  if (!post || post.is_hidden) return { notFound: true };

  const comment = await PostComment.create({
    post_id:   postId,
    user_id:   userId,
    parent_id: parent_id || null,
    body:      body.trim(),
  });

  if (!parent_id) {
    await post.increment("comments_count");
    await createNotification({
      user_id:  post.user_id,
      actor_id: userId,
      type:     "comment",
      post_id:  postId,
      message:  `${user.first_name} ${user.last_name} commented on your post`,
    });
  }

  const full = await PostComment.findByPk(comment.id, {
    include: [{ model: User, as: "commenter", attributes: ["id", "first_name", "last_name", "avatar"] }],
  });
  return { comment: { ...full.toJSON(), user: full.commenter } };
};

export const deleteComment = async (commentId, userId, userRole) => {
  const comment = await PostComment.findByPk(commentId);
  if (!comment) return { notFound: true };
  if (comment.user_id !== userId && userRole !== "admin") return { forbidden: true };

  const post = await Post.findByPk(comment.post_id);
  await comment.destroy();
  if (!comment.parent_id && post) await post.decrement("comments_count");
  return { deleted: true };
};

export const toggleBookmark = async (postId, userId) => {
  const existing = await PostBookmark.findOne({ where: { post_id: postId, user_id: userId } });
  if (existing) { await existing.destroy(); return { bookmarked: false }; }
  await PostBookmark.create({ post_id: postId, user_id: userId });
  return { bookmarked: true };
};

export const reportPost = async ({ postId, userId, reason }) => {
  const post = await Post.findByPk(postId);
  if (!post) return { notFound: true };

  const exists = await PostReport.findOne({ where: { post_id: postId, user_id: userId } });
  if (exists) return { alreadyReported: true };

  await PostReport.create({ post_id: postId, user_id: userId, reason: reason.trim() });
  await post.increment("reports_count");
  if (post.reports_count + 1 >= 5) await post.update({ is_hidden: true });
  return { ok: true };
};

// ── ADMIN ─────────────────────────────────────────────────────────────────────

export const adminHidePost = async (postId) => {
  const post = await Post.findByPk(postId);
  if (!post) return { notFound: true };
  await post.update({ is_hidden: true });
  return { ok: true };
};

export const adminUnhidePost = async (postId) => {
  const post = await Post.findByPk(postId);
  if (!post) return { notFound: true };
  await post.update({ is_hidden: false });
  return { ok: true };
};

export const adminDeletePost = async (postId) => {
  const post = await Post.findByPk(postId);
  if (!post) return { notFound: true };
  await cascadeDeletePost(post.id);
  return { deleted: true };
};