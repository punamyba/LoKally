import ContactConversation from "../models/contactconversation.model.js";
import ConversationMessage from "../models/conversationmessage.model.js";
import User from "../models/user.model.js";
import nodemailer from "nodemailer";

// ── Email transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "sandbox.smtp.mailtrap.io",
  port: parseInt(process.env.MAIL_PORT || "2525"),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

function generateRefNumber(id) {
  return `REF-${String(id).padStart(5, "0")}`;
}

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

// ── USER ENDPOINTS ────────────────────────────────────────────────────────────

// POST /api/contact
export const createConversation = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }

    const user_id = req.user?.id || null;

    const conversation = await ContactConversation.create({
      user_id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject?.trim() || "General Inquiry",
      message: message.trim(),
      status: "new",
      allow_user_reply: true,
    });

    const ref_number = generateRefNumber(conversation.id);
    await conversation.update({ ref_number });

    await sendEmail({
      to: conversation.email,
      subject: `[${ref_number}] We received your message — LoKally Support`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <div style="background: linear-gradient(135deg, #167ee0, #1b8d28); padding: 28px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: white; font-size: 22px;">LoKally Support</h1>
          </div>
          <div style="background: #f8fafc; padding: 28px 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Hi <strong>${conversation.name}</strong>,</p>
            <p>We received your message and will reply soon.</p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">Reference Number</p>
              <p style="margin: 0; font-size: 22px; font-weight: 700; color: #167ee0;">${ref_number}</p>
            </div>
            <p style="color: #64748b; font-size: 14px;">Log in to LoKally → Contact Us → My Messages to track this conversation.</p>
          </div>
        </div>
      `,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: {
        id: conversation.id,
        ref_number,
        subject: conversation.subject,
        status: conversation.status,
        created_at: conversation.created_at,
      },
    });
  } catch (err) {
    console.error("createConversation error:", err);
    res.status(500).json({ success: false, message: "Failed to send message." });
  }
};

// GET /api/contact/my-messages
export const getMyConversations = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Login required." });
    }

    const conversations = await ContactConversation.findAll({
      where: { user_id: user.id },
      order: [["created_at", "DESC"]],
      attributes: ["id", "ref_number", "subject", "status", "allow_user_reply", "created_at", "updated_at"],
    });

    res.json({ success: true, data: conversations });
  } catch (err) {
    console.error("getMyConversations error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch messages." });
  }
};

// GET /api/contact/my-messages/:id
export const getMyConversationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Login required." });
    }

    const conversation = await ContactConversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const isOwner = conversation.user_id === user.id || conversation.email === user.email;
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const messages = await ConversationMessage.findAll({
      where: { conversation_id: id },
      order: [["created_at", "ASC"]],
      attributes: ["id", "sender_type", "body", "created_at"],
    });

    res.json({
      success: true,
      data: {
        id: conversation.id,
        ref_number: conversation.ref_number,
        subject: conversation.subject,
        message: conversation.message,
        status: conversation.status,
        allow_user_reply: conversation.allow_user_reply,
        name: conversation.name,
        email: conversation.email,
        created_at: conversation.created_at,
        messages,
      },
    });
  } catch (err) {
    console.error("getMyConversationDetail error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch conversation." });
  }
};

// POST /api/contact/my-messages/:id/reply
export const userReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ success: false, message: "Login required." });
    if (!body?.trim()) return res.status(400).json({ success: false, message: "Reply cannot be empty." });

    const conversation = await ContactConversation.findByPk(id);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found." });

    const isOwner = conversation.user_id === user.id || conversation.email === user.email;
    if (!isOwner) return res.status(403).json({ success: false, message: "Access denied." });

    if (!conversation.allow_user_reply) {
      return res.status(403).json({ success: false, message: "Replies are disabled for this conversation." });
    }
    if (conversation.status === "closed") {
      return res.status(400).json({ success: false, message: "This conversation is closed." });
    }

    const newMessage = await ConversationMessage.create({
      conversation_id: id,
      sender_type: "user",
      sender_user_id: user.id,
      body: body.trim(),
    });

    await conversation.update({ status: "open" });

    res.status(201).json({
      success: true,
      message: "Reply sent.",
      data: {
        id: newMessage.id,
        sender_type: "user",
        body: newMessage.body,
        created_at: newMessage.created_at,
      },
    });
  } catch (err) {
    console.error("userReply error:", err);
    res.status(500).json({ success: false, message: "Failed to send reply." });
  }
};

// ── ADMIN ENDPOINTS ───────────────────────────────────────────────────────────

// GET /api/contact/admin
export const adminGetConversations = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const conversations = await ContactConversation.findAll({
      where,
      order: [["created_at", "DESC"]],
      attributes: ["id", "ref_number", "name", "email", "subject", "status", "allow_user_reply", "created_at", "updated_at"],
    });

    const counts = {
      new: await ContactConversation.count({ where: { status: "new" } }),
      open: await ContactConversation.count({ where: { status: "open" } }),
      replied: await ContactConversation.count({ where: { status: "replied" } }),
      closed: await ContactConversation.count({ where: { status: "closed" } }),
    };

    res.json({ success: true, data: conversations, counts });
  } catch (err) {
    console.error("adminGetConversations error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch conversations." });
  }
};

// GET /api/contact/admin/:id
export const adminGetConversationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await ContactConversation.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: ["id", "first_name", "last_name", "email"], required: false },
      ],
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    if (conversation.status === "new") {
      await conversation.update({ status: "open" });
    }

    const messages = await ConversationMessage.findAll({
      where: { conversation_id: id },
      order: [["created_at", "ASC"]],
      include: [
        { model: User, as: "sender", attributes: ["id", "first_name", "last_name"], required: false },
      ],
    });

    res.json({
      success: true,
      data: {
        id: conversation.id,
        ref_number: conversation.ref_number,
        name: conversation.name,
        email: conversation.email,
        subject: conversation.subject,
        message: conversation.message,
        status: conversation.status,
        allow_user_reply: conversation.allow_user_reply,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        user: conversation.user || null,
        messages,
      },
    });
  } catch (err) {
    console.error("adminGetConversationDetail error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch conversation." });
  }
};

// POST /api/contact/admin/:id/reply
export const adminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const adminUser = req.user;

    if (!body?.trim()) {
      return res.status(400).json({ success: false, message: "Reply cannot be empty." });
    }

    const conversation = await ContactConversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const newMessage = await ConversationMessage.create({
      conversation_id: id,
      sender_type: "admin",
      sender_user_id: adminUser?.id || null,
      body: body.trim(),
    });

    await conversation.update({ status: "replied" });

    const emailSent = await sendEmail({
      to: conversation.email,
      subject: `Re: [${conversation.ref_number}] ${conversation.subject} — LoKally Support`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <div style="background: linear-gradient(135deg, #167ee0, #1b8d28); padding: 28px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: white; font-size: 22px;">LoKally Support</h1>
            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">${conversation.ref_number}</p>
          </div>
          <div style="background: #f8fafc; padding: 28px 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Hi <strong>${conversation.name}</strong>,</p>
            <p>Our support team has replied:</p>
            <div style="background: white; border-left: 4px solid #167ee0; padding: 16px 20px; margin: 20px 0;">
              <p style="margin: 0; white-space: pre-wrap;">${body.trim()}</p>
            </div>
            <p style="color: #64748b; font-size: 14px;">Log in to LoKally → Contact Us → My Messages to reply.</p>
          </div>
        </div>
      `,
    });

    if (emailSent) await newMessage.update({ email_sent: true });

    res.json({
      success: true,
      message: "Reply sent.",
      data: {
        id: newMessage.id,
        sender_type: "admin",
        body: newMessage.body,
        created_at: newMessage.created_at,
      },
    });
  } catch (err) {
    console.error("adminReply error:", err);
    res.status(500).json({ success: false, message: "Failed to send reply." });
  }
};

// PATCH /api/contact/admin/:id/status
export const adminUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const valid = ["new", "open", "replied", "closed"];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const conversation = await ContactConversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    await conversation.update({ status });
    res.json({ success: true, message: `Marked as ${status}.`, data: { status } });
  } catch (err) {
    console.error("adminUpdateStatus error:", err);
    res.status(500).json({ success: false, message: "Failed to update status." });
  }
};

// PATCH /api/contact/admin/:id/toggle-reply
export const adminToggleUserReply = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await ContactConversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const newValue = !conversation.allow_user_reply;
    await conversation.update({ allow_user_reply: newValue });

    res.json({
      success: true,
      message: `User reply ${newValue ? "enabled" : "disabled"}.`,
      data: { allow_user_reply: newValue },
    });
  } catch (err) {
    console.error("adminToggleUserReply error:", err);
    res.status(500).json({ success: false, message: "Failed to toggle." });
  }
};

// DELETE /api/contact/admin/:id
export const adminDeleteConversation = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await ContactConversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    await ConversationMessage.destroy({ where: { conversation_id: id } });
    await conversation.destroy();

    res.json({ success: true, message: "Conversation deleted." });
  } catch (err) {
    console.error("adminDeleteConversation error:", err);
    res.status(500).json({ success: false, message: "Failed to delete." });
  }
};