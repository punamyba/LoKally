import express from "express";
import {
  createConversation,
  getMyConversations,
  getMyConversationDetail,
  userReply,
  adminGetConversations,
  adminGetConversationDetail,
  adminReply,
  adminUpdateStatus,
  adminToggleUserReply,
  adminDeleteConversation,
} from "../controllers/contact.controller.js";

import authMiddleware, { adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── USER ROUTES ───────────────────────────────────────────────────────────────

// POST /api/contact              → submit contact form (guest or logged-in)
router.post("/", authMiddleware, createConversation);

// GET  /api/contact/my-messages  → user's conversation list
router.get("/my-messages", authMiddleware, getMyConversations);

// GET  /api/contact/my-messages/:id  → single conversation + all messages
router.get("/my-messages/:id", authMiddleware, getMyConversationDetail);

// POST /api/contact/my-messages/:id/reply  → user sends a reply
router.post("/my-messages/:id/reply", authMiddleware, userReply);

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────

// GET    /api/contact/admin              → all conversations
router.get("/admin", authMiddleware, adminOnly, adminGetConversations);

// GET    /api/contact/admin/:id          → single conversation + full thread
router.get("/admin/:id", authMiddleware, adminOnly, adminGetConversationDetail);

// POST   /api/contact/admin/:id/reply    → admin replies (saves + emails user)
router.post("/admin/:id/reply", authMiddleware, adminOnly, adminReply);

// PATCH  /api/contact/admin/:id/status   → change status
router.patch("/admin/:id/status", authMiddleware, adminOnly, adminUpdateStatus);

// PATCH  /api/contact/admin/:id/toggle-reply → enable/disable user reply
router.patch("/admin/:id/toggle-reply", authMiddleware, adminOnly, adminToggleUserReply);

// DELETE /api/contact/admin/:id          → permanently delete conversation
router.delete("/admin/:id", authMiddleware, adminOnly, adminDeleteConversation);

export default router;