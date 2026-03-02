import nodemailer from "nodemailer";

/*
  Creates SMTP transporter using .env credentials (Mailtrap)
*/
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) throw new Error("SMTP_HOST missing in .env");
  if (!user) throw new Error("SMTP_USER missing in .env");
  if (!pass) throw new Error("SMTP_PASS missing in .env");

  return nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
  });
}

/*
  Sends email via SMTP.
*/
export async function sendMail({ to, subject, text, html }) {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || "no-reply@lokally.test";

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}