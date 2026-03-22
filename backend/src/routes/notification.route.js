import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
  saveFcmToken,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/",             authMiddleware, getNotifications);
router.get("/unread-count", authMiddleware, getUnreadCount);
router.put("/read-all",     authMiddleware, markAllRead);
router.put("/:id/read",     authMiddleware, markOneRead);
router.post("/fcm-token",   authMiddleware, saveFcmToken);

export default router;