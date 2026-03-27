import express from "express";
import authMiddleware, { adminOnly } from "../middleware/auth.middleware.js";
import upload from "../middleware/placeupload.middleware.js";
import * as AdminController from "../controllers/admin.controller.js";
import * as PostController from "../controllers/post.controller.js";

const router = express.Router();

router.use(authMiddleware, adminOnly);

router.get("/stats", AdminController.getStats);
router.get("/places", AdminController.getPlaces);
router.patch("/places/:id/approve", AdminController.approvePlace);
router.patch("/places/:id/reject", AdminController.rejectPlace);
router.get("/users", AdminController.getUsers);

// Supports up to 20 images
router.post("/places", upload.array("images", 20), AdminController.addPlace);

// Update place — multiple images support
router.put("/places/:id", upload.array("images", 20), AdminController.updatePlace);

// Delete specific image from place
router.delete("/places/:id/image", AdminController.deletePlaceImage);

router.delete("/places/:id", AdminController.deletePlace);
router.patch("/places/:id/feature", AdminController.toggleFeatured);

router.get("/posts/:id/reports", AdminController.getPostReports);
router.get("/reports", AdminController.getAllReports);
router.patch("/reports/:id/dismiss", AdminController.dismissReport);
router.patch("/reports/:id/status", AdminController.updateReportStatus);
router.post("/users/:id/warn", AdminController.warnUser);
router.post("/notify-reporter", AdminController.notifyReporter);
router.patch("/posts/:id/hide", PostController.adminHidePost);
router.patch("/posts/:id/unhide", PostController.adminUnhidePost);
router.delete("/posts/:id", PostController.adminDeletePost);

export default router;