import express from "express";
import { authMiddleware, adminOnly } from "../middleware/auth.middleware.js";
import upload from "../middleware/placeUpload.middleware.js";
import * as AdminController from "../controllers/admin.controller.js";

const router = express.Router();

// First auth check, then admin check
router.use(authMiddleware, adminOnly);

router.get("/stats", AdminController.getStats);
router.get("/places", AdminController.getPlaces);
router.patch("/places/:id/approve", AdminController.approvePlace);
router.patch("/places/:id/reject", AdminController.rejectPlace);
router.get("/users", AdminController.getUsers);

router.post("/places", upload.array("images", 20), AdminController.addPlace);

router.put("/places/:id", upload.single("image"), AdminController.updatePlace);
router.delete("/places/:id", AdminController.deletePlace);

export default router;