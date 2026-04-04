import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authMiddleware from "../middleware/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const router = express.Router();

const profileDir = "uploads/profiles";
if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, profileDir),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `profile-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error("Only jpg, jpeg, png, webp allowed"));
    cb(null, true);
  },
});

const handleSingleUpload = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message || "Upload failed" });
    next();
  });
};

// Navbar ko lagi — sirf naam, avatar, email, role matra
router.get("/me", authMiddleware, userController.getMe);

// Own profile
router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, handleSingleUpload("avatar"), userController.updateProfile);

// Profile picture
router.post("/profile-picture",   authMiddleware, handleSingleUpload("profile_picture"), userController.uploadProfilePicture);
router.delete("/profile-picture", authMiddleware, userController.deleteProfilePicture);

// Password and account
router.put("/password",   authMiddleware, userController.changePassword);
router.delete("/account", authMiddleware, userController.deleteAccount);

// Own content
router.get("/my-posts",  authMiddleware, userController.getMyPosts);
router.get("/my-places", authMiddleware, userController.getMyPlaces);

// Public profile
router.get("/public/:userId",        authMiddleware, userController.getPublicProfile);
router.get("/public/:userId/posts",  authMiddleware, userController.getPublicUserPosts);
router.get("/public/:userId/places", authMiddleware, userController.getPublicUserPlaces);

export default router;