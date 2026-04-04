import express from "express";
import {
  getLikes, toggleLike,
  getComments, addComment, deleteComment,
  getRatings, ratePlace,
  getTags, updateTags,
  getConditions, updateConditions,
} from "../controllers/placeFeatures.controller.js";
import { authenticateToken, requireAdmin, optionalAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// LIKES
router.get ("/:id/likes", optionalAuth, getLikes);
router.post("/:id/like",  authenticateToken, toggleLike);

// COMMENTS
router.get   ("/:id/comments",                    getComments);
router.post  ("/:id/comments", authenticateToken, addComment);
router.delete("/comments/:commentId", authenticateToken, deleteComment);

// RATINGS — optionalAuth so logged-in users get myRating, guests get 0
router.get ("/:id/ratings", optionalAuth, getRatings);
router.post("/:id/rate",    authenticateToken, ratePlace);

// TAGS
router.get("/:id/tags",                  getTags);
router.put("/:id/tags",    authenticateToken, updateTags);

// CONDITIONS
router.get("/:id/conditions",                                getConditions);
router.put("/:id/conditions", authenticateToken, requireAdmin, updateConditions);

export default router;