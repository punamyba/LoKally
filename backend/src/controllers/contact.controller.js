// contact.controller.js
// Only handles: request parsing, validation, calling service, sending response.
// Zero business logic here — all logic lives in contact.service.js

import * as ContactService from "../services/contact.service.js";

// ── USER — CREATE CONVERSATION ────────────────────────────────────────────────

export const createConversation = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name?.trim())    return res.status(400).json({ success: false, message: "Name is required." });
  if (!email?.trim())   return res.status(400).json({ success: false, message: "Email is required." });
  if (!message?.trim()) return res.status(400).json({ success: false, message: "Message is required." });

  try {
    const data = await ContactService.createConversation({
      name, email, subject, message,
      user_id: req.user?.id || null, // null if guest — contact form works without login
    });
    res.status(201).json({ success: true, message: "Message sent successfully.", data });
  } catch (err) {
    console.error("createConversation error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send message." });
  }
};

// ── USER — GET MY CONVERSATIONS ───────────────────────────────────────────────

export const getMyConversations = async (req, res) => {
  if (!req.user) // must be logged in to see their message history
    return res.status(401).json({ success: false, message: "Login required." });

  try {
    const data = await ContactService.getMyConversations(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getMyConversations error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch messages." });
  }
};

// ── USER — GET SINGLE CONVERSATION DETAIL ────────────────────────────────────

export const getMyConversationDetail = async (req, res) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Login required." });

  try {
    const result = await ContactService.getConversationDetail(req.params.id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "Conversation not found." });

    const { conversation, messages } = result;

    // verify ownership — match by user id or email
    const isOwner = conversation.user_id === req.user.id || conversation.email === req.user.email;
    if (!isOwner)
      return res.status(403).json({ success: false, message: "Access denied." });

    res.json({
      success: true,
      data: {
        id:               conversation.id,
        ref_number:       conversation.ref_number,
        subject:          conversation.subject,
        message:          conversation.message,
        status:           conversation.status,
        allow_user_reply: conversation.allow_user_reply,
        name:             conversation.name,
        email:            conversation.email,
        created_at:       conversation.created_at,
        messages,
      },
    });
  } catch (err) {
    console.error("getMyConversationDetail error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch conversation." });
  }
};

// ── USER — REPLY ──────────────────────────────────────────────────────────────

export const userReply = async (req, res) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Login required." });

  const { body } = req.body;
  if (!body?.trim()) // empty reply shouldn't be allowed
    return res.status(400).json({ success: false, message: "Reply cannot be empty." });

  try {
    const result = await ContactService.userReply({
      conversationId: req.params.id,
      userId: req.user.id,
      body,
    });

    if (result.notFound)     return res.status(404).json({ success: false, message: "Conversation not found." });
    if (result.forbidden)    return res.status(403).json({ success: false, message: "Access denied." });
    if (result.replyDisabled) return res.status(403).json({ success: false, message: "Replies are disabled for this conversation." });
    if (result.closed)       return res.status(400).json({ success: false, message: "This conversation is closed." });

    res.status(201).json({ success: true, message: "Reply sent.", data: result });
  } catch (err) {
    console.error("userReply error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send reply." });
  }
};

// ── ADMIN — GET ALL CONVERSATIONS ─────────────────────────────────────────────

export const adminGetConversations = async (req, res) => {
  try {
    const { conversations, counts } = await ContactService.adminGetConversations(req.query.status);
    res.json({ success: true, data: conversations, counts });
  } catch (err) {
    console.error("adminGetConversations error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch conversations." });
  }
};

// ── ADMIN — GET SINGLE CONVERSATION DETAIL ────────────────────────────────────

export const adminGetConversationDetail = async (req, res) => {
  try {
    const result = await ContactService.adminGetConversationDetail(req.params.id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "Conversation not found." });

    const { conversation, messages } = result;

    res.json({
      success: true,
      data: {
        id:               conversation.id,
        ref_number:       conversation.ref_number,
        name:             conversation.name,
        email:            conversation.email,
        subject:          conversation.subject,
        message:          conversation.message,
        status:           conversation.status,
        allow_user_reply: conversation.allow_user_reply,
        created_at:       conversation.created_at,
        updated_at:       conversation.updated_at,
        user:             conversation.user || null,
        messages,
      },
    });
  } catch (err) {
    console.error("adminGetConversationDetail error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch conversation." });
  }
};

// ── ADMIN — REPLY ─────────────────────────────────────────────────────────────

export const adminReply = async (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) // admin reply also can't be empty
    return res.status(400).json({ success: false, message: "Reply cannot be empty." });

  try {
    const result = await ContactService.adminReply({
      conversationId: req.params.id,
      body,
      adminId: req.user?.id || null,
    });

    if (result.notFound)
      return res.status(404).json({ success: false, message: "Conversation not found." });

    res.json({ success: true, message: "Reply sent.", data: result });
  } catch (err) {
    console.error("adminReply error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send reply." });
  }
};

// ── ADMIN — UPDATE STATUS ─────────────────────────────────────────────────────

export const adminUpdateStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ["new", "open", "replied", "closed"];
  if (!status || !valid.includes(status)) // only these 4 states are allowed
    return res.status(400).json({ success: false, message: "Invalid status. Must be: new, open, replied, or closed." });

  try {
    const result = await ContactService.adminUpdateStatus(req.params.id, status);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "Conversation not found." });

    res.json({ success: true, message: `Marked as ${status}.`, data: { status: result.status } });
  } catch (err) {
    console.error("adminUpdateStatus error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update status." });
  }
};

// ── ADMIN — TOGGLE USER REPLY ─────────────────────────────────────────────────

export const adminToggleUserReply = async (req, res) => {
  try {
    const result = await ContactService.adminToggleUserReply(req.params.id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "Conversation not found." });

    res.json({
      success: true,
      message: `User reply ${result.allow_user_reply ? "enabled" : "disabled"}.`,
      data: { allow_user_reply: result.allow_user_reply },
    });
  } catch (err) {
    console.error("adminToggleUserReply error:", err.message);
    res.status(500).json({ success: false, message: "Failed to toggle." });
  }
};

// ── ADMIN — DELETE CONVERSATION ───────────────────────────────────────────────

export const adminDeleteConversation = async (req, res) => {
  try {
    const result = await ContactService.adminDeleteConversation(req.params.id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "Conversation not found." });

    res.json({ success: true, message: "Conversation deleted." });
  } catch (err) {
    console.error("adminDeleteConversation error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete." });
  }
};