import express from "express";
import {
  submitVisit, getMyVisits, getAdminVisits,
  approveVisit, rejectVisit, visitUpload,
} from "../controllers/placevisit.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// user
router.post("/:id/visit-submit", authMiddleware, visitUpload.single("photo"), submitVisit);
router.get("/my-visits",         authMiddleware, getMyVisits);

// admin — role check inside controller
router.get("/admin/visits",               authMiddleware, getAdminVisits);
router.patch("/admin/visits/:id/approve", authMiddleware, approveVisit);
router.patch("/admin/visits/:id/reject",  authMiddleware, rejectVisit);

export default router;