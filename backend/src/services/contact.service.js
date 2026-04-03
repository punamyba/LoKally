// contact.service.js — pure business logic, no req/res

import ContactConversation from "../models/contactconversation.model.js";
import ConversationMessage from "../models/conversationmessage.model.js";
import User from "../models/user.model.js";
import nodemailer from "nodemailer";
import { getContactConfirmationHTML, getAdminReplyHTML } from "../Utils/contactusmailtemp.js";

// ── Email transporter ─────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "sandbox.smtp.mailtrap.io",
  port: parseInt(process.env.MAIL_PORT || "2525"),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// pads conversation id to 5 digits — e.g. id=3 → "REF-00003"
function generateRefNumber(id) {
  return `REF-${String(id).padStart(5, "0")}`;
}

// shared email sender — returns true/false so callers can track if it worked
async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: `"LoKally Support" <${process.env.MAIL_FROM || "support@lokally.com"}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("Email send failed:", err.message);
    return false;
  }
}

// ── USER — CREATE CONVERSATION ────────────────────────────────────────────────

export const createConversation = async ({ name, email, subject, message, user_id }) => {
  const conversation = await ContactConversation.create({
    user_id: user_id || null,  // null if submitted by a guest (not logged in)
    name:    name.trim(),
    email:   email.trim().toLowerCase(),
    subject: subject?.trim() || "General Inquiry", // default subject if not provided
    message: message.trim(),
    status:  "new",
    allow_user_reply: true,
  });

  // generate ref number after creation so we have the db-assigned id
  const ref_number = generateRefNumber(conversation.id);
  await conversation.update({ ref_number });

  // send confirmation email to the user — non-blocking
  await sendEmail({
    to: conversation.email,
    subject: `[${ref_number}] We received your message — LoKally Support`,
    html: getContactConfirmationHTML({ name: conversation.name, ref_number }),
  });

  return {
    id:         conversation.id,
    ref_number,
    subject:    conversation.subject,
    status:     conversation.status,
    created_at: conversation.created_at,
  };
};

// ── USER — GET MY CONVERSATIONS ───────────────────────────────────────────────

export const getMyConversations = async (userId) => {
  return ContactConversation.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
    attributes: ["id", "ref_number", "subject", "status", "allow_user_reply", "created_at", "updated_at"],
  });
};

// ── USER — GET SINGLE CONVERSATION DETAIL ────────────────────────────────────

export const getConversationDetail = async (conversationId) => {
  const conversation = await ContactConversation.findByPk(conversationId);
  if (!conversation) return { notFound: true };

  const messages = await ConversationMessage.findAll({
    where: { conversation_id: conversationId },
    order: [["created_at", "ASC"]], // oldest first for chat-style display
    attributes: ["id", "sender_type", "body", "created_at"],
  });

  return { conversation, messages };
};

// ── USER — REPLY TO CONVERSATION ─────────────────────────────────────────────

export const userReply = async ({ conversationId, userId, body }) => {
  const conversation = await ContactConversation.findByPk(conversationId);
  if (!conversation)                return { notFound: true };
  if (!conversation.allow_user_reply) return { replyDisabled: true }; // admin can lock a thread
  if (conversation.status === "closed") return { closed: true };       // closed threads can't be replied to

  // check ownership by user id
  if (conversation.user_id !== userId) return { forbidden: true };

  const newMessage = await ConversationMessage.create({
    conversation_id: conversationId,
    sender_type:     "user",
    sender_user_id:  userId,
    body:            body.trim(),
  });

  await conversation.update({ status: "open" }); // re-opens conversation when user replies

  return {
    id:          newMessage.id,
    sender_type: "user",
    body:        newMessage.body,
    created_at:  newMessage.created_at,
  };
};

// ── ADMIN — GET ALL CONVERSATIONS ─────────────────────────────────────────────

export const adminGetConversations = async (statusFilter) => {
  const where = statusFilter ? { status: statusFilter } : {}; // no filter = return all

  const conversations = await ContactConversation.findAll({
    where,
    order: [["created_at", "DESC"]],
    attributes: ["id", "ref_number", "name", "email", "subject", "status", "allow_user_reply", "created_at", "updated_at"],
  });

  // count all statuses in parallel for the tab badges in admin UI
  const counts = {
    new:     await ContactConversation.count({ where: { status: "new" } }),
    open:    await ContactConversation.count({ where: { status: "open" } }),
    replied: await ContactConversation.count({ where: { status: "replied" } }),
    closed:  await ContactConversation.count({ where: { status: "closed" } }),
  };

  return { conversations, counts };
};

// ── ADMIN — GET SINGLE CONVERSATION DETAIL ────────────────────────────────────

export const adminGetConversationDetail = async (conversationId) => {
  const conversation = await ContactConversation.findByPk(conversationId, {
    include: [
      { model: User, as: "user", attributes: ["id", "first_name", "last_name", "email"], required: false },
    ],
  });
  if (!conversation) return { notFound: true };

  // auto-advance status from "new" to "open" when admin opens it
  if (conversation.status === "new") {
    await conversation.update({ status: "open" });
  }

  const messages = await ConversationMessage.findAll({
    where: { conversation_id: conversationId },
    order: [["created_at", "ASC"]],
    include: [
      { model: User, as: "sender", attributes: ["id", "first_name", "last_name"], required: false },
    ],
  });

  return { conversation, messages };
};

// ── ADMIN — REPLY ─────────────────────────────────────────────────────────────

export const adminReply = async ({ conversationId, body, adminId }) => {
  const conversation = await ContactConversation.findByPk(conversationId);
  if (!conversation) return { notFound: true };

  const newMessage = await ConversationMessage.create({
    conversation_id: conversationId,
    sender_type:     "admin",
    sender_user_id:  adminId || null,
    body:            body.trim(),
  });

  await conversation.update({ status: "replied" }); // mark as replied so user knows to check

  // notify user by email with the reply content
  const emailSent = await sendEmail({
    to:      conversation.email,
    subject: `Re: [${conversation.ref_number}] ${conversation.subject} — LoKally Support`,
    html:    getAdminReplyHTML({ name: conversation.name, ref_number: conversation.ref_number, replyBody: body.trim() }),
  });

  if (emailSent) await newMessage.update({ email_sent: true }); // track whether email was delivered

  return {
    id:          newMessage.id,
    sender_type: "admin",
    body:        newMessage.body,
    created_at:  newMessage.created_at,
  };
};

// ── ADMIN — UPDATE STATUS ─────────────────────────────────────────────────────

export const adminUpdateStatus = async (conversationId, status) => {
  const conversation = await ContactConversation.findByPk(conversationId);
  if (!conversation) return { notFound: true };
  await conversation.update({ status });
  return { status };
};

// ── ADMIN — TOGGLE USER REPLY ─────────────────────────────────────────────────

export const adminToggleUserReply = async (conversationId) => {
  const conversation = await ContactConversation.findByPk(conversationId);
  if (!conversation) return { notFound: true };

  const newValue = !conversation.allow_user_reply; // flip true↔false
  await conversation.update({ allow_user_reply: newValue });
  return { allow_user_reply: newValue };
};

// ── ADMIN — DELETE CONVERSATION ───────────────────────────────────────────────

export const adminDeleteConversation = async (conversationId) => {
  const conversation = await ContactConversation.findByPk(conversationId);
  if (!conversation) return { notFound: true };

  await ConversationMessage.destroy({ where: { conversation_id: conversationId } }); // delete messages first (FK constraint)
  await conversation.destroy();
  return { deleted: true };
};