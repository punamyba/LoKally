import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authMiddleware from "../middleware/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const router = express.Router();

// local folder: backend/uploads/profiles
const uploadDir = path.resolve("uploads/profiles");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, and WEBP files are allowed."));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Own profile ───────────────────────────────────────────────────────────
router.get("/profile",  authMiddleware, userController.getProfile);
router.put("/profile",  authMiddleware, userController.updateProfile);

router.post(
  "/profile-picture",
  authMiddleware,
  (req, res, next) => {
    console.log("profile-picture route hit");
    console.log("req.user:", req.user);

    upload.single("profile_picture")(req, res, function (err) {
      if (err) {
        console.error("multer error full:", err);
        console.error("multer error message:", err?.message);
        console.error("multer error stack:", err?.stack);
        return res.status(500).json({
          success: false,
          message: err.message || "Upload failed",
        });
      }
      console.log("multer passed, req.file:", req.file);
      next();
    });
  },
  userController.uploadProfilePicture
);

router.delete("/profile-picture", authMiddleware, userController.deleteProfilePicture);
router.put("/password",           authMiddleware, userController.changePassword);
router.delete("/account",         authMiddleware, userController.deleteAccount);
router.get("/my-posts",           authMiddleware, userController.getMyPosts);
router.get("/my-places",          authMiddleware, userController.getMyPlaces);

// ── Public profile routes (aruko profile herna) ───────────────────────────
router.get("/public/:userId",         authMiddleware, userController.getPublicProfile);
router.get("/public/:userId/posts",   authMiddleware, userController.getPublicUserPosts);
router.get("/public/:userId/places",  authMiddleware, userController.getPublicUserPlaces);

export default router;