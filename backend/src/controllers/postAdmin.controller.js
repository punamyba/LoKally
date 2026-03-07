import { Op }       from "sequelize";
import Post         from "../models/post.model.js";
import PostReport   from "../models/postreport.model.js";
import User         from "../models/user.model.js";

// GET /api/admin/posts?filter=all|reported|hidden&page=1
export const adminGetPosts = async (req, res) => {
  try {
    const filter = req.query.filter || "all";
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = 20;
    const offset = (page - 1) * limit;

    let where = {};
    if (filter === "reported") where = { reports_count: { [Op.gt]: 0 } };
    if (filter === "hidden")   where = { is_hidden: true };

    const posts = await Post.findAll({
      where,
      order: [["created_at", "DESC"]],
      limit,
      offset,
      include: [{ model: User, as: "author", attributes: ["id", "first_name", "last_name", "email"] }],
    });

    return res.json({ success: true, data: posts });
  } catch (err) {
    console.error("adminGetPosts:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/posts/:id
export const adminGetPost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{ model: User, as: "author", attributes: ["id", "first_name", "last_name", "email"] }],
    });
    if (!post) return res.status(404).json({ success: false, message: "Not found" });

    const reports = await PostReport.findAll({
      where: { post_id: post.id, dismissed: false },
      include: [{ model: User, as: "reporter", attributes: ["id", "first_name", "last_name"] }],
      order: [["created_at", "DESC"]],
    });

    return res.json({ success: true, data: { ...post.toJSON(), reports } });
  } catch (err) {
    console.error("adminGetPost:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/admin/posts/:id/hide
export const adminHidePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Not found" });
    await post.update({ is_hidden: true });
    return res.json({ success: true, message: "Post hidden" });
  } catch (err) {
    console.error("adminHidePost:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/admin/posts/:id/unhide
export const adminUnhidePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Not found" });
    await post.update({ is_hidden: false });
    return res.json({ success: true, message: "Post visible again" });
  } catch (err) {
    console.error("adminUnhidePost:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/admin/posts/:id
export const adminDeletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Not found" });
    await post.destroy();
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("adminDeletePost:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/admin/posts/:id/dismiss-reports
export const adminDismissReports = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Not found" });

    await PostReport.update({ dismissed: true }, { where: { post_id: post.id } });
    await post.update({ reports_count: 0 });

    return res.json({ success: true, message: "Reports dismissed" });
  } catch (err) {
    console.error("adminDismissReports:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/posts/reports
export const adminGetReports = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = 20;
    const offset = (page - 1) * limit;

    const reports = await PostReport.findAll({
      where: { dismissed: false },
      order: [["created_at", "DESC"]],
      limit,
      offset,
      include: [
        { model: User, as: "reporter", attributes: ["id", "first_name", "last_name"] },
        { model: Post, as: "post",
          include: [{ model: User, as: "author", attributes: ["id", "first_name", "last_name"] }],
        },
      ],
    });

    return res.json({ success: true, data: reports });
  } catch (err) {
    console.error("adminGetReports:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};