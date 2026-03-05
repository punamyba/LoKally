import express from "express";
import authMiddleware, { adminOnly } from "../middleware/auth.middleware.js";
import upload from "../middleware/placeupload.middleware.js";
import * as AdminController from "../controllers/admin.controller.js";

const router = express.Router();

/*
  All /api/admin routes are protected:
  - First: user must be logged in (authMiddleware)
  - Second: user must be admin (adminOnly)
*/
router.use(authMiddleware, adminOnly);

router.get("/stats", AdminController.getStats);
router.get("/places", AdminController.getPlaces);
router.patch("/places/:id/approve", AdminController.approvePlace);
router.patch("/places/:id/reject", AdminController.rejectPlace);
router.get("/users", AdminController.getUsers);

// Supports up to 20 images
router.post("/places", upload.array("images", 20), AdminController.addPlace);

router.put("/places/:id", upload.single("image"), AdminController.updatePlace);
router.delete("/places/:id", AdminController.deletePlace);

export default router;