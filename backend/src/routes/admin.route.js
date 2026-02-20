import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";
import upload from "../middleware/placeUpload.middleware.js";
import * as AdminController from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/stats", AdminController.getStats);
router.get("/places", AdminController.getPlaces);
router.patch("/places/:id/approve", AdminController.approvePlace);
router.patch("/places/:id/reject", AdminController.rejectPlace);
router.get("/users", AdminController.getUsers);
router.post("/places", upload.single("image"), AdminController.addPlace);
router.put("/places/:id", upload.single("image"), AdminController.updatePlace);
router.delete("/places/:id", AdminController.deletePlace);

export default router;