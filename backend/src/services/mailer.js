import nodemailer from "nodemailer";

const isGmail = (process.env.MAIL_SERVICE || "").toLowerCase() === "gmail";

const transporter = nodemailer.createTransport(
  isGmail
    ? {
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      }
    : {
        host: process.env.MAIL_HOST || "sandbox.smtp.mailtrap.io",
        port: Number(process.env.MAIL_PORT || 2525),
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      }
);

const sendMail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from:
        process.env.MAIL_FROM ||
        `"LoKally Nepal" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("sendMail error:", error);
    throw error;
  }
};

export default sendMail;