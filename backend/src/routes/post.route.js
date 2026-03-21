import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import postUpload     from "../middleware/postUpload.middleware.js";
import * as PostCtrl  from "../controllers/post.controller.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// ── Optional auth helper ───────────────────────────────────────
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    } catch {
      // invalid token — treat as guest
    }
  }
  next();
}

// ── IMPORTANT: specific routes BEFORE /:id ────────────────────

// GET /api/posts/trending
router.get("/trending", optionalAuth, PostCtrl.getTrending);

// GET /api/posts/saved
router.get("/saved", authMiddleware, PostCtrl.getSaved);

// ── Feed ──────────────────────────────────────────────────────
router.get("/", optionalAuth, PostCtrl.getFeed);

// ── Single post & sub-routes ──────────────────────────────────
router.get("/:id",                        optionalAuth,    PostCtrl.getPost);
router.get("/:id/comments",                               PostCtrl.getComments);
router.get("/:id/likes",                  optionalAuth,    PostCtrl.getLikers);

// ── Auth required ──────────────────────────────────────────────
router.post(  "/",                        authMiddleware, postUpload.array("images", 10), PostCtrl.createPost);
router.delete("/:id",                     authMiddleware, PostCtrl.deletePost);
router.post(  "/:id/like",                authMiddleware, PostCtrl.toggleLike);
router.post(  "/:id/comments",            authMiddleware, PostCtrl.addComment);
router.delete("/:id/comments/:commentId", authMiddleware, PostCtrl.deleteComment);
router.post(  "/:id/bookmark",            authMiddleware, PostCtrl.toggleBookmark);
router.post(  "/:id/report",              authMiddleware, PostCtrl.reportPost);

export default router;