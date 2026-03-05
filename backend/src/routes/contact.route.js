import express from "express";
import {
  createContactMessage,
  adminListMessages,
  adminGetMessage,
  adminUpdateStatus,
  adminReplyToMessage,
  adminToggleAllowReply,
  userGetThreadByEmail,
} from "../controllers/contact.controller.js";

import authMiddleware, { adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public
router.post("/", createContactMessage);

// Optional user thread demo (by email)
router.get("/thread", userGetThreadByEmail);

// Admin protected
router.get("/admin", authMiddleware, adminOnly, adminListMessages);
router.get("/admin/:id", authMiddleware, adminOnly, adminGetMessage);
router.patch("/admin/:id/status", authMiddleware, adminOnly, adminUpdateStatus);
router.patch("/admin/:id/allow-reply", authMiddleware, adminOnly, adminToggleAllowReply);
router.post("/admin/:id/reply", authMiddleware, adminOnly, adminReplyToMessage);

export default router;