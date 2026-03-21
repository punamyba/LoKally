export const getVerifyEmailHTML = (verifyLink) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <tr><td align="center" style="padding-bottom:24px;">
          <div style="background:linear-gradient(135deg,#1a7fe8,#0d9488);border-radius:16px;padding:12px 24px;display:inline-block;">
            <span style="font-size:20px;font-weight:800;color:#fff;font-family:'Segoe UI',sans-serif;">🏔️ LoKally</span>
          </div>
        </td></tr>

        <tr><td style="background:#fff;border-radius:24px;box-shadow:0 4px 32px rgba(0,0,0,0.08);overflow:hidden;">
          <div style="height:5px;background:linear-gradient(90deg,#1a7fe8,#0d9488,#16a34a);"></div>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="background:linear-gradient(145deg,#f0f7ff,#e8fdf4);padding:36px 20px 28px;">
              <div style="width:72px;height:72px;background:linear-gradient(135deg,#1a7fe8,#0d9488);border-radius:50%;display:inline-block;text-align:center;line-height:72px;font-size:32px;">✉️</div>
              <br/>
              <div style="margin-top:16px;display:inline-block;background:rgba(22,163,74,0.1);border:1.5px solid rgba(22,163,74,0.25);border-radius:99px;padding:4px 14px;">
                <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#16a34a;">● Account Verification</span>
              </div>
            </td></tr>

            <tr><td style="padding:28px 36px 16px;">
              <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0d1117;letter-spacing:-0.5px;">Verify your email address</h1>
              <p style="margin:0 0 24px;font-size:14.5px;color:#4a5568;line-height:1.7;">
                Welcome to <strong style="color:#1a7fe8;">LoKally Nepal</strong>! You're one step away from discovering Nepal's hidden treasures. Click below to verify your email and activate your account.
              </p>
            </td></tr>

            <tr><td align="center" style="padding:0 36px 24px;">
              <a href="${verifyLink}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1a7fe8,#0d9488);color:#fff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 6px 20px rgba(26,127,232,0.3);">
                ✅ &nbsp; Verify My Email
              </a>
            </td></tr>

            <tr><td style="padding:0 36px;"><div style="height:1px;background:#e8edf3;"></div></td></tr>

            <tr><td style="padding:16px 36px;">
              <p style="margin:0;font-size:12.5px;color:#8696aa;line-height:1.6;">Button not working? Copy and paste this link:</p>
              <p style="margin:4px 0 0;"><a href="${verifyLink}" style="font-size:11.5px;color:#1a7fe8;word-break:break-all;">${verifyLink}</a></p>
            </td></tr>

            <tr><td style="padding:0 36px 28px;">
              <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;padding:12px 14px;">
                <p style="margin:0;font-size:12.5px;color:#92400e;line-height:1.55;">⚠️ &nbsp;<strong>Didn't request this?</strong> You can safely ignore this email.</p>
              </div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:20px 0 8px;">
          <p style="margin:0;font-size:12px;color:#8696aa;">© 2026 LoKally Nepal · Discover Hidden Gems</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

export const getPasswordResetHTML = (otpCode) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <tr><td align="center" style="padding-bottom:24px;">
          <div style="background:linear-gradient(135deg,#1a7fe8,#0d9488);border-radius:16px;padding:12px 24px;display:inline-block;">
            <span style="font-size:20px;font-weight:800;color:#fff;font-family:'Segoe UI',sans-serif;">🏔️ LoKally</span>
          </div>
        </td></tr>

        <tr><td style="background:#fff;border-radius:24px;box-shadow:0 4px 32px rgba(0,0,0,0.08);overflow:hidden;">
          <div style="height:5px;background:linear-gradient(90deg,#dc2626,#e11d48,#f59e0b);"></div>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="background:linear-gradient(145deg,#0c1e40,#1a2744);padding:36px 20px 28px;">
              <div style="width:72px;height:72px;background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.15);border-radius:50%;display:inline-block;text-align:center;line-height:72px;font-size:32px;">🔐</div>
              <br/>
              <div style="margin-top:16px;display:inline-block;background:rgba(245,158,11,0.15);border:1.5px solid rgba(245,158,11,0.3);border-radius:99px;padding:4px 14px;">
                <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#f59e0b;">● Password Reset</span>
              </div>
            </td></tr>

            <tr><td style="padding:28px 36px 16px;">
              <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#0d1117;letter-spacing:-0.5px;">Reset your password</h1>
              <p style="margin:0 0 24px;font-size:14.5px;color:#4a5568;line-height:1.7;">
                Use the code below to reset your <strong style="color:#1a7fe8;">LoKally</strong> account password. This code is valid for <strong style="color:#dc2626;">10 minutes only</strong>.
              </p>
            </td></tr>

            <tr><td align="center" style="padding:0 36px 28px;">
              <div style="background:linear-gradient(145deg,#f8faff,#f0f7ff);border:2px dashed #1a7fe8;border-radius:16px;padding:24px 20px;text-align:center;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8696aa;">YOUR RESET CODE</p>
                <div style="font-size:44px;font-weight:800;letter-spacing:10px;color:#0d1117;font-family:'Courier New',monospace;">${otpCode}</div>
                <p style="margin:8px 0 0;font-size:12px;color:#dc2626;font-weight:600;">⏱ Expires in 10 minutes</p>
              </div>
            </td></tr>

            <tr><td style="padding:0 36px;"><div style="height:1px;background:#e8edf3;"></div></td></tr>

            <tr><td style="padding:16px 36px 28px;">
              <div style="background:#fff5f5;border:1.5px solid #fecaca;border-radius:10px;padding:12px 14px;">
                <p style="margin:0;font-size:12.5px;color:#7f1d1d;line-height:1.55;">🔒 &nbsp;<strong>Didn't request this?</strong> Ignore this email. Your password will remain unchanged. Never share this code with anyone.</p>
              </div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:20px 0 8px;">
          <p style="margin:0;font-size:12px;color:#8696aa;">© 2026 LoKally Nepal · Discover Hidden Gems</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;