// utils/contactEmailTemplates.js
// All HTML email templates for the contact/support system.
// Each function takes dynamic values and returns a complete HTML string.

// ── CONFIRMATION EMAIL (sent to user after they submit a message) ─────────────

export const getContactConfirmationHTML = ({ name, ref_number }) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
    <div style="background: linear-gradient(135deg, #167ee0, #1b8d28); padding: 28px 32px; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; color: white; font-size: 22px;">LoKally Support</h1>
    </div>
    <div style="background: #f8fafc; padding: 28px 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received your message and will reply soon.</p>
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">Reference Number</p>
        <p style="margin: 0; font-size: 22px; font-weight: 700; color: #167ee0;">${ref_number}</p>
      </div>
      <p style="color: #64748b; font-size: 14px;">Log in to LoKally → Contact Us → My Messages to track this conversation.</p>
    </div>
  </div>
`;

// ── ADMIN REPLY EMAIL (sent to user when admin replies to their message) ───────

export const getAdminReplyHTML = ({ name, ref_number, replyBody }) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
    <div style="background: linear-gradient(135deg, #167ee0, #1b8d28); padding: 28px 32px; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; color: white; font-size: 22px;">LoKally Support</h1>
      <p style="margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">${ref_number}</p>
    </div>
    <div style="background: #f8fafc; padding: 28px 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
      <p>Hi <strong>${name}</strong>,</p>
      <p>Our support team has replied:</p>
      <div style="background: white; border-left: 4px solid #167ee0; padding: 16px 20px; margin: 20px 0;">
        <p style="margin: 0; white-space: pre-wrap;">${replyBody}</p>
      </div>
      <p style="color: #64748b; font-size: 14px;">Log in to LoKally → Contact Us → My Messages to reply.</p>
    </div>
  </div>
`;