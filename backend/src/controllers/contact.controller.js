import { Op } from "sequelize";
import { ContactMessage, ContactReply } from "../models/db.sync.js";
import { sendMail } from "../services/mailer.js";

// Public: User submits contact form
// POST /api/contact
export const createContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Name, email, message are required" });
    }

    if (String(message).trim().length < 10) {
      return res.status(400).json({ success: false, message: "Message must be at least 10 characters" });
    }

    if (String(message).length > 2000) {
      return res.status(400).json({ success: false, message: "Message is too long" });
    }

    const ticket = await ContactMessage.create({
      name: String(name).trim(),
      email: String(email).trim(),
      subject: String(subject || "General Inquiry").trim(),
      message: String(message).trim(),
      status: "new",
      allow_user_reply: false,
    });

    // Thread style: store first user message as a reply row
    await ContactReply.create({
      contact_message_id: ticket.id,
      sender: "user",
      reply_text: String(message).trim(),
    });

    return res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    console.error("createContactMessage error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin: list tickets
// GET /api/contact/admin?status=new&q=search
export const adminListMessages = async (req, res) => {
  try {
    const { status, q } = req.query;

    const where = {};

    if (status && ["new", "in_progress", "replied", "closed"].includes(String(status))) {
      where.status = String(status);
    }

    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: term } },
        { email: { [Op.iLike]: term } },
        { subject: { [Op.iLike]: term } },
      ];
    }

    const items = await ContactMessage.findAll({
      where,
      order: [["created_at", "DESC"]],
    });

    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("adminListMessages error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin: get one ticket + replies
// GET /api/contact/admin/:id
export const adminGetMessage = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const msg = await ContactMessage.findByPk(id, {
      include: [{ model: ContactReply, as: "replies", order: [["created_at", "ASC"]] }],
    });

    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    return res.json({ success: true, data: msg });
  } catch (err) {
    console.error("adminGetMessage error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin: update ticket status
// PATCH /api/contact/admin/:id/status
export const adminUpdateStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!["new", "in_progress", "replied", "closed"].includes(String(status))) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const msg = await ContactMessage.findByPk(id);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });

    await msg.update({ status: String(status) });

    return res.json({ success: true, data: msg });
  } catch (err) {
    console.error("adminUpdateStatus error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin: toggle allow_user_reply
// PATCH /api/contact/admin/:id/allow-reply
export const adminToggleAllowReply = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { allow_user_reply } = req.body;

    const msg = await ContactMessage.findByPk(id);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });

    await msg.update({ allow_user_reply: Boolean(allow_user_reply) });

    return res.json({ success: true, data: msg });
  } catch (err) {
    console.error("adminToggleAllowReply error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin: reply (save reply row + send email)
// POST /api/contact/admin/:id/reply
export const adminReplyToMessage = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reply } = req.body;

    if (!reply || String(reply).trim().length < 2) {
      return res.status(400).json({ success: false, message: "Reply is required" });
    }

    const msg = await ContactMessage.findByPk(id);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });

    // Save reply
    await ContactReply.create({
      contact_message_id: msg.id,
      sender: "admin",
      reply_text: String(reply).trim(),
    });

    await msg.update({
      status: "replied",
      replied_at: new Date(),
    });

    // Send email (Mailtrap)
    try {
      await sendMail({
        to: msg.email,
        subject: `Re: ${msg.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <p>Hello ${msg.name},</p>
            <p>We received your message:</p>
            <blockquote style="border-left: 4px solid #ddd; padding-left: 10px;">
              ${msg.message}
            </blockquote>
            <p>Admin reply:</p>
            <blockquote style="border-left: 4px solid #22c55e; padding-left: 10px;">
              ${String(reply).trim()}
            </blockquote>
            <p>Thank you,<br/>LoKally Support</p>
          </div>
        `,
      });
    } catch (e) {
      console.error("Reply email failed:", e.message);
      // Do not fail the API if email fails
    }

    // Return updated message with replies
    const updated = await ContactMessage.findByPk(id, {
      include: [{ model: ContactReply, as: "replies" }],
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("adminReplyToMessage error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// User: view a ticket thread by email (simple demo)
// GET /api/contact/thread?email=you@gmail.com
export const userGetThreadByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "email is required" });

    const tickets = await ContactMessage.findAll({
      where: { email: String(email).trim() },
      include: [{ model: ContactReply, as: "replies" }],
      order: [["created_at", "DESC"]],
    });

    return res.json({ success: true, data: tickets });
  } catch (err) {
    console.error("userGetThreadByEmail error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};