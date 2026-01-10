import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/*
  Backward compatible:
  - sendEmail(to, link) for verification link
  - sendEmail(to, subject, html) for OTP/reset
*/
const sendEmail = async (to, arg2, arg3) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  let subject = "";
  let html = "";

  if (typeof arg2 === "string" && arg2.startsWith("http") && !arg3) {
    subject = "Verify your email";
    html = `
      <h3>Verify your email</h3>
      <p>Click the link below:</p>
      <a href="${arg2}">${arg2}</a>
    `;
  } else {
    subject = arg2;
    html = arg3;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

export default sendEmail;
