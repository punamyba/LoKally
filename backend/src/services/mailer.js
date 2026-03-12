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

const sendMail = async ({ to, subject, text, html }) => {
  return transporter.sendMail({
    from: process.env.MAIL_FROM || "support@lokally.com",
    to,
    subject,
    text,
    html,
  });
};

export default sendMail;