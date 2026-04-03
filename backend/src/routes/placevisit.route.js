import express from "express";
import {
  submitVisit,
  getMyVisits,
  getAdminVisits,
  approveVisit,
  rejectVisit,
  unapproveVisit,
  removeVisit,
  getPlaceVisitStatus,
  visitUpload,
} from "../controllers/placevisit.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/my-visits", authMiddleware, getMyVisits);
router.get("/admin/visits", authMiddleware, getAdminVisits);
router.patch("/admin/visits/:id/approve", authMiddleware, approveVisit);
router.patch("/admin/visits/:id/reject", authMiddleware, rejectVisit);
router.patch("/admin/visits/:id/unapprove", authMiddleware, unapproveVisit);

router.post("/:id/visit-submit", authMiddleware, visitUpload.single("photo"), submitVisit);
router.delete("/:id/visit", authMiddleware, removeVisit);
router.get("/:id/visit-status", authMiddleware, getPlaceVisitStatus);

export default router;