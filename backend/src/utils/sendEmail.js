import nodemailer from "nodemailer";

const sendEmail = async (to, link) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"LoKally" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your email",
    html: `
      <h3>Verify your email</h3>
      <p>Click the link below:</p>
      <a href="${link}">${link}</a>
    `,
  });
};

export default sendEmail;
