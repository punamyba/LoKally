import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "sandbox.smtp.mailtrap.io",
  port: Number(process.env.MAIL_PORT || 2525),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ── Base send ─────────────────────────────────────────────────
export const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: process.env.MAIL_FROM || "LoKally Nepal <support@lokally.com>",
    to,
    subject,
    html,
  });
};

// ── Shared layout helpers ─────────────────────────────────────
const logo = `
  <tr><td align="center" style="padding-bottom:24px;">
    <div style="background:linear-gradient(135deg,#1a7fe8,#0d9488);border-radius:16px;padding:12px 24px;display:inline-block;">
      <span style="font-size:20px;font-weight:800;color:#fff;font-family:'Segoe UI',sans-serif;">🏔️ LoKally</span>
    </div>
  </td></tr>`;

const footer = `
  <tr><td align="center" style="padding:20px 0 8px;">
    <p style="margin:0;font-size:12px;color:#8696aa;">© 2026 LoKally Nepal · Discover Hidden Gems</p>
  </td></tr>`;

const wrapper = (inner) => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        ${logo}
        <tr><td style="background:#fff;border-radius:24px;box-shadow:0 4px 32px rgba(0,0,0,0.08);overflow:hidden;">
          ${inner}
        </td></tr>
        ${footer}
      </table>
    </td></tr>
  </table>
</body></html>`;

const reasonBox = (reason) => reason ? `
  <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;padding:14px 16px;margin-bottom:16px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#92400e;">Reason</p>
    <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;">${reason}</p>
  </div>` : "";

// ── Place Approved ────────────────────────────────────────────
export const sendPlaceApprovedEmail = async ({ to, firstName, placeName }) => {
  return sendEmail({
    to,
    subject: `"${placeName}" is now live — LoKally Nepal`,
    html: wrapper(`
      <div style="height:5px;background:linear-gradient(90deg,#16a34a,#0d9488,#1a7fe8);"></div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="background:linear-gradient(145deg,#f0fdf4,#e8fdf4);padding:36px 20px 28px;">
          <div style="width:72px;height:72px;background:linear-gradient(135deg,#16a34a,#0d9488);border-radius:50%;display:inline-block;text-align:center;line-height:72px;font-size:32px;">✅</div>
          <br/>
          <div style="margin-top:16px;display:inline-block;background:rgba(22,163,74,0.1);border:1.5px solid rgba(22,163,74,0.25);border-radius:99px;padding:4px 14px;">
            <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#16a34a;">● Place Approved</span>
          </div>
        </td></tr>
        <tr><td style="padding:28px 36px 32px;">
          <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0d1117;letter-spacing:-0.5px;">Your place is live! 🎉</h1>
          <p style="margin:0 0 16px;font-size:14.5px;color:#4a5568;line-height:1.7;">Hi <strong>${firstName}</strong>,</p>
          <p style="margin:0 0 24px;font-size:14.5px;color:#4a5568;line-height:1.7;">
            Great news! Your place <strong style="color:#16a34a;">"${placeName}"</strong> has been approved and is now live on LoKally Nepal. Travellers can now discover and visit your place.
          </p>
          <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:12px 14px;">
            <p style="margin:0;font-size:12.5px;color:#166534;line-height:1.55;">🌟 Thank you for contributing to LoKally Nepal!</p>
          </div>
        </td></tr>
      </table>`),
  });
};

// ── Place Rejected ────────────────────────────────────────────
export const sendPlaceRejectedEmail = async ({ to, firstName, placeName, reason }) => {
  return sendEmail({
    to,
    subject: `Update on your place submission — LoKally Nepal`,
    html: wrapper(`
      <div style="height:5px;background:linear-gradient(90deg,#dc2626,#e11d48,#f59e0b);"></div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="background:linear-gradient(145deg,#fff5f5,#fef2f2);padding:36px 20px 28px;">
          <div style="width:72px;height:72px;background:linear-gradient(135deg,#dc2626,#e11d48);border-radius:50%;display:inline-block;text-align:center;line-height:72px;font-size:32px;">📋</div>
          <br/>
          <div style="margin-top:16px;display:inline-block;background:rgba(220,38,38,0.1);border:1.5px solid rgba(220,38,38,0.25);border-radius:99px;padding:4px 14px;">
            <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#dc2626;">● Submission Update</span>
          </div>
        </td></tr>
        <tr><td style="padding:28px 36px 32px;">
          <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0d1117;letter-spacing:-0.5px;">Submission Update</h1>
          <p style="margin:0 0 16px;font-size:14.5px;color:#4a5568;line-height:1.7;">Hi <strong>${firstName}</strong>,</p>
          <p style="margin:0 0 16px;font-size:14.5px;color:#4a5568;line-height:1.7;">
            We reviewed your place <strong>"${placeName}"</strong> and were unable to approve it at this time.
          </p>
          ${reasonBox(reason)}
          <p style="margin:0;font-size:14px;color:#4a5568;line-height:1.7;">You're welcome to update and resubmit after addressing the above.</p>
        </td></tr>
      </table>`),
  });
};

// ── Place Deleted ─────────────────────────────────────────────
export const sendPlaceDeletedEmail = async ({ to, firstName, placeName, reason }) => {
  return sendEmail({
    to,
    subject: `Your place has been removed — LoKally Nepal`,
    html: wrapper(`
      <div style="height:5px;background:linear-gradient(90deg,#dc2626,#b91c1c);"></div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="background:linear-gradient(145deg,#fff5f5,#fef2f2);padding:36px 20px 28px;">
          <div style="width:72px;height:72px;background:linear-gradient(135deg,#dc2626,#b91c1c);border-radius:50%;display:inline-block;text-align:center;line-height:72px;font-size:32px;">🗑️</div>
          <br/>
          <div style="margin-top:16px;display:inline-block;background:rgba(220,38,38,0.1);border:1.5px solid rgba(220,38,38,0.25);border-radius:99px;padding:4px 14px;">
            <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#dc2626;">● Place Removed</span>
          </div>
        </td></tr>
        <tr><td style="padding:28px 36px 32px;">
          <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0d1117;letter-spacing:-0.5px;">Place Removed</h1>
          <p style="margin:0 0 16px;font-size:14.5px;color:#4a5568;line-height:1.7;">Hi <strong>${firstName}</strong>,</p>
          <p style="margin:0 0 16px;font-size:14.5px;color:#4a5568;line-height:1.7;">
            Your place <strong>"${placeName}"</strong> has been removed from LoKally Nepal by our moderation team.
          </p>
          ${reasonBox(reason)}
          <div style="background:#fff5f5;border:1.5px solid #fecaca;border-radius:10px;padding:12px 14px;">
            <p style="margin:0;font-size:12.5px;color:#7f1d1d;line-height:1.55;">If you believe this was a mistake, please contact our support team.</p>
          </div>
        </td></tr>
      </table>`),
  });
};

// ── Content Hidden ────────────────────────────────────────────
export const sendContentHiddenEmail = async ({ to, firstName, contentType, reason }) => {
  return sendEmail({
    to,
    subject: `Your content has been hidden — LoKally Nepal`,
    html: wrapper(`
      <div style="height:5px;background:linear-gradient(90deg,#f59e0b,#d97706);"></div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="background:linear-gradient(145deg,#fffbeb,#fef3c7);padding:36px 20px 28px;">
          <div style="width:72px;height:72px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:50%;display:inline-block;text-align:center;line-height:72px;font-size:32px;">🚫</div>
          <br/>
          <div style="margin-top:16px;display:inline-block;background:rgba(245,158,11,0.15);border:1.5px solid rgba(245,158,11,0.3);border-radius:99px;padding:4px 14px;">
            <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b45309;">● Content Hidden</span>
          </div>
        </td></tr>
        <tr><td style="padding:28px 36px 32px;">
          <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0d1117;letter-spacing:-0.5px;">Content Hidden</h1>
          <p style="margin:0 0 16px;font-size:14.5px;color:#4a5568;line-height:1.7;">Hi <strong>${firstName}</strong>,</p>
          <p style="margin:0 0 16px;font-size:14.5px;color:#4a5568;line-height:1.7;">
            Your ${contentType || "content"} has been hidden from public view by our moderation team.
          </p>
          ${reasonBox(reason)}
          <p style="margin:0;font-size:13px;color:#6b7280;">Please review our community guidelines to ensure your content follows our policies.</p>
        </td></tr>
      </table>`),
  });
};

// ── Warning ───────────────────────────────────────────────────
export const sendWarningEmail = async ({ to, firstName, contentType, reason }) => {
  return sendEmail({
    to,
    subject: `Content Warning — LoKally Nepal`,
    html: wrapper(`
      <div style="height:5px;background:linear-gradient(90deg,#f59e0b,#dc2626);"></div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="background:linear-gradient(145deg,#fffbeb,#fff5f5);padding:36px 20px 28px;">
          <div style="width:72px;height:72px;background:linear-gradient(135deg,#f59e0b,#dc2626);border-radius:50%;display:inline-block;text-align:center;line-height:72px;font-size:32px;">⚠️</div>
          <br/>
          <div style="margin-top:16px;display:inline-block;background:rgba(220,38,38,0.1);border:1.5px solid rgba(220,38,38,0.25);border-radius:99px;padding:4px 14px;">
            <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#dc2626;">● Content Warning</span>
          </div>
        </td></tr>
        <tr><td style="padding:28px 36px 32px;">
          <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0d1117;letter-spacing:-0.5px;">Content Warning</h1>
          <p style="margin:0 0 16px;font-size:14.5px;color:#4a5568;line-height:1.7;">Hi <strong>${firstName}</strong>,</p>
          <p style="margin:0 0 16px;font-size:14.5px;color:#4a5568;line-height:1.7;">
            Your ${contentType || "content"} on LoKally Nepal has been flagged by our moderation team.
          </p>
          ${reasonBox(reason)}
          <div style="background:#fff5f5;border:1.5px solid #fecaca;border-radius:10px;padding:12px 14px;">
            <p style="margin:0;font-size:12.5px;color:#7f1d1d;line-height:1.55;">🔒 Repeated violations may result in account suspension.</p>
          </div>
        </td></tr>
      </table>`),
  });
};

// ── Report Status Updated ─────────────────────────────────────
export const sendReportStatusEmail = async ({ to, firstName, status }) => {
  const s = {
    resolved:  { label: "Resolved",  emoji: "✅", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", msg: "The reported content has been reviewed and appropriate action has been taken. Thank you for helping keep LoKally Nepal safe." },
    dismissed: { label: "Dismissed", emoji: "📋", color: "#475569", bg: "#f8fafc", border: "#e2e8f0", msg: "After review, we found the reported content does not violate our community guidelines." },
    open:      { label: "In Review", emoji: "🔍", color: "#1a7fe8", bg: "#f0f7ff", border: "#bfdbfe", msg: "Your report is currently being reviewed by our moderation team. We will get back to you soon." },
  }[status];
  if (!s) return;

  return sendEmail({
    to,
    subject: `Report update: ${s.label} — LoKally Nepal`,
    html: wrapper(`
      <div style="height:5px;background:linear-gradient(90deg,#1a7fe8,#0d9488);"></div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="background:linear-gradient(145deg,${s.bg},#fff);padding:36px 20px 28px;">
          <div style="width:72px;height:72px;background:${s.color};border-radius:50%;display:inline-block;text-align:center;line-height:72px;font-size:32px;">${s.emoji}</div>
          <br/>
          <div style="margin-top:16px;display:inline-block;background:${s.bg};border:1.5px solid ${s.border};border-radius:99px;padding:4px 14px;">
            <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${s.color};">● Report ${s.label}</span>
          </div>
        </td></tr>
        <tr><td style="padding:28px 36px 32px;">
          <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0d1117;letter-spacing:-0.5px;">Report ${s.label}</h1>
          <p style="margin:0 0 16px;font-size:14.5px;color:#4a5568;line-height:1.7;">Hi <strong>${firstName}</strong>,</p>
          <p style="margin:0 0 24px;font-size:14.5px;color:#4a5568;line-height:1.7;">${s.msg}</p>
          <div style="background:${s.bg};border:1.5px solid ${s.border};border-radius:10px;padding:12px 14px;">
            <p style="margin:0;font-size:12.5px;color:${s.color};line-height:1.55;">Thank you for helping keep LoKally Nepal safe and accurate. 🏔️</p>
          </div>
        </td></tr>
      </table>`),
  });
};

export default sendEmail;