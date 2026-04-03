import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import postUpload from "../middleware/postUpload.middleware.js";
import * as PostCtrl from "../controllers/post.controller.js";
import jwt from "jsonwebtoken";

const router = express.Router();

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try { req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET); }
    catch {}
  }
  next();
}

// ── specific named routes FIRST — before /:id to avoid conflicts ──────────────
router.get("/trending", optionalAuth,   PostCtrl.getTrending);
router.get("/saved",    authMiddleware, PostCtrl.getSaved);

// ── root route ────────────────────────────────────────────────────────────────
router.get("/",  optionalAuth,   PostCtrl.getFeed);
router.post("/", authMiddleware, postUpload.array("images", 10), PostCtrl.createPost);

// ── dynamic /:id routes AFTER named routes ────────────────────────────────────
router.get   ("/:id",                   optionalAuth,   PostCtrl.getPost);
router.get   ("/:id/comments",                          PostCtrl.getComments);
router.get   ("/:id/likes",             optionalAuth,   PostCtrl.getLikers);
router.put   ("/:id",                   authMiddleware, postUpload.array("images", 10), PostCtrl.updatePost);
router.delete("/:id",                   authMiddleware, PostCtrl.deletePost);
router.post  ("/:id/like",              authMiddleware, PostCtrl.toggleLike);
router.post  ("/:id/comments",          authMiddleware, PostCtrl.addComment);
router.delete("/:id/comments/:commentId", authMiddleware, PostCtrl.deleteComment);
router.post  ("/:id/bookmark",          authMiddleware, PostCtrl.toggleBookmark);
router.post  ("/:id/report",            authMiddleware, PostCtrl.reportPost);

export default router;