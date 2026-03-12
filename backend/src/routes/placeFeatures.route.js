import express from "express";
import {
  getLikes, toggleLike,
  getComments, addComment, deleteComment,
  getRatings, ratePlace,
  getVisits, toggleVisit,
  getTags, updateTags,
  getConditions, updateConditions,
} from "../controllers/placeFeatures.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// LIKES
router.get ("/:id/likes",  authenticateToken, getLikes);
router.post("/:id/like",   authenticateToken, toggleLike);

// COMMENTS
router.get   ("/:id/comments",              getComments);          // public
router.post  ("/:id/comments", authenticateToken, addComment);
router.delete("/comments/:commentId", authenticateToken, deleteComment);

// RATINGS
router.get ("/:id/ratings",              getRatings);              // public
router.post("/:id/rate",   authenticateToken, ratePlace);

// VISITS
router.get ("/:id/visits",               getVisits);               // public
router.post("/:id/visit",  authenticateToken, toggleVisit);

// TAGS
router.get("/:id/tags",                  getTags);                 // public
router.put("/:id/tags",    authenticateToken, updateTags);

// CONDITIONS
router.get("/:id/conditions",                               getConditions);   // public
router.put("/:id/conditions", authenticateToken, requireAdmin, updateConditions); // admin only

export default router;