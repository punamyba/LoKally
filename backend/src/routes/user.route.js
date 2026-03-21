import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.config.js";
import authMiddleware from "../middleware/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const router = express.Router();

// Cloudinary storage config for profile pictures
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "lokally/profile-pictures",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    // Auto convert to WebP for smaller size without quality loss
    format:         "webp",
    transformation: [
      {
        width:   400,
        height:  400,
        crop:    "fill",
        gravity: "face",  // Auto focus on face
        quality: "auto",  // Best quality automatically
      },
    ],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max upload
});

// Profile
router.get("/profile",          authMiddleware, userController.getProfile);
router.put("/profile",          authMiddleware, userController.updateProfile);

// Profile picture
router.post  ("/profile-picture", authMiddleware, upload.single("profile_picture"), userController.uploadProfilePicture);
router.delete("/profile-picture", authMiddleware, userController.deleteProfilePicture);

// Password and account
router.put   ("/password",  authMiddleware, userController.changePassword);
router.delete("/account",   authMiddleware, userController.deleteAccount);

// User content
router.get("/my-posts",  authMiddleware, userController.getMyPosts);
router.get("/my-places", authMiddleware, userController.getMyPlaces);

export default router;