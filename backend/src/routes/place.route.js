import express from "express";
import {
  getPlaces,
  getPlaceById,
  getFeaturedPlaces,
  getPlaceStats,
  createPlace,
  updatePlace,
  deletePlace,
} from "../controllers/place.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import upload from "../middleware/placeupload.middleware.js";

const router = express.Router();

// public
router.get("/featured", getFeaturedPlaces);
router.get("/stats", getPlaceStats);
router.get("/", getPlaces);
router.get("/:id", getPlaceById);

// protected
router.post("/", authMiddleware, upload.array("images", 20), createPlace);
router.put("/:id", authMiddleware, upload.single("image"), updatePlace);
router.delete("/:id", authMiddleware, deletePlace);

export default router;