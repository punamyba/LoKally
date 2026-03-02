import ContactMessage from "../models/contactMessage.model.js";
import { sendMail } from "../services/mailer.js";

/*
  Public: Create a contact message (User form submit)
  POST /api/contact
*/
export const createContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (String(message).length > 2000) {
      return res.status(400).json({ success: false, message: "Message is too long" });
    }

    const saved = await ContactMessage.create({
      name: String(name).trim(),
      email: String(email).trim(),
      subject: String(subject).trim(),
      message: String(message).trim(),
      status: "new",
    });

    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("createContactMessage error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/*
  Admin: List messages
  GET /api/contact/admin?status=new
*/
export const adminListMessages = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status && ["new", "in_progress", "replied", "closed"].includes(String(status))) {
      where.status = status;
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

/*
  Admin: Get single message
  GET /api/contact/admin/:id
*/
export const adminGetMessage = async (req, res) => {
  try {
    const msg = await ContactMessage.findByPk(req.params.id);
    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    return res.json({ success: true, data: msg });
  } catch (err) {
    console.error("adminGetMessage error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/*
  Admin: Update status only
  PATCH /api/contact/admin/:id/status
*/
export const adminUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["new", "in_progress", "replied", "closed"].includes(String(status))) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const msg = await ContactMessage.findByPk(req.params.id);
    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    await msg.update({ status });
    return res.json({ success: true, data: msg });
  } catch (err) {
    console.error("adminUpdateStatus error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/*
  Admin: Reply to message and send email
  POST /api/contact/admin/:id/reply
*/
export const adminReplyToMessage = async (req, res) => {
  try {
    const { reply } = req.body;

    if (!reply || String(reply).trim().length < 2) {
      return res.status(400).json({ success: false, message: "Reply is required" });
    }

    const msg = await ContactMessage.findByPk(req.params.id);
    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Save reply in DB first
    await msg.update({
      admin_reply: String(reply).trim(),
      replied_at: new Date(),
      status: "replied",
    });

    // Send email to user (Mailtrap)
    try {
      await sendMail({
        to: msg.email,
        subject: `Re: ${msg.subject}`,
        html: `
          <p>Hello ${msg.name},</p>
          <p>Your message:</p>
          <blockquote>${msg.message}</blockquote>
          <p>Admin reply:</p>
          <blockquote>${msg.admin_reply}</blockquote>
          <p>Thank you,<br/>Lokally Support</p>
        `,
      });
    } catch (e) {
      console.error("Reply email failed:", e.message);
      // Do not fail reply saving if email fails
    }

    return res.json({ success: true, data: msg });
  } catch (err) {
    console.error("adminReplyToMessage error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};