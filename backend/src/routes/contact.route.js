import express from "express";
import {
  createContactMessage,
  adminListMessages,
  adminGetMessage,
  adminUpdateStatus,
  adminReplyToMessage,
} from "../controllers/contact.controller.js";

import authMiddleware, { adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

/*
  Public route: user submits contact form
*/
router.post("/", createContactMessage);

/*
  Admin routes: protected
*/
router.get("/admin", authMiddleware, adminOnly, adminListMessages);
router.get("/admin/:id", authMiddleware, adminOnly, adminGetMessage);
router.patch("/admin/:id/status", authMiddleware, adminOnly, adminUpdateStatus);
router.post("/admin/:id/reply", authMiddleware, adminOnly, adminReplyToMessage);

export default router;