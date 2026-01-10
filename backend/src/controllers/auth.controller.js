import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

/* =========================
   HELPERS
========================= */
const generateOtp = () => crypto.randomInt(100000, 999999).toString();
const generateSessionToken = () => crypto.randomBytes(32).toString("hex");

/* =========================
   REGISTER USER
========================= */
export const registerUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      dob,
      address,
      gender,
      password,
      confirm_password,
    } = req.body;

    if (!email || !password || !confirm_password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await pool.query(
      `
      INSERT INTO users
      (first_name, last_name, email, phone, dob, address, gender, password, is_verified, verification_token)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,$9)
      `,
      [
        first_name,
        last_name,
        email,
        phone,
        dob,
        address,
        gender,
        hashedPassword,
        verificationToken,
      ]
    );

    try {
      const verifyLink = `http://localhost:5001/api/verify-email/${verificationToken}`;
      await sendEmail(email, verifyLink);
    } catch (e) {
      console.error("Register email failed:", e.message);
    }

    return res.status(201).json({
      message: "Registered successfully! Please verify your email",
    });
  } catch (err) {
    console.error("registerUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   LOGIN USER
========================= */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result.rows[0];

    if (!user.is_verified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   FORGOT PASSWORD (SEND OTP)
========================= */
export const forgotPasswordSendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ message: "If account exists, code was sent." });
    }

    const userRes = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (userRes.rows.length === 0) {
      return res.json({ message: "If account exists, code was sent." });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await pool.query(
      `
      UPDATE users
      SET reset_code_hash=$1,
          reset_code_expires=NOW() + INTERVAL '10 minutes',
          reset_session_hash=NULL,
          reset_session_expires=NULL
      WHERE email=$2
      `,
      [otpHash, email]
    );

    try {
      await sendEmail(
        email,
        "Password reset code",
        `
          <p>Your password reset code is:</p>
          <h2>${otp}</h2>
          <p>This code expires in 10 minutes.</p>
        `
      );
    } catch (e) {
      console.error("Forgot password email failed:", e.message);
    }

    return res.json({ message: "If account exists, code was sent." });
  } catch (err) {
    console.error("forgotPasswordSendCode error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   RESEND OTP
========================= */
export const resendForgotCode = async (req, res) => {
  return forgotPasswordSendCode(req, res);
};

/* =========================
   VERIFY OTP  (FIXED – NO TIMEZONE BUG)
========================= */
export const forgotPasswordVerifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code required" });
    }

    const result = await pool.query(
      `
      SELECT id, reset_code_hash
      FROM users
      WHERE email = $1
        AND reset_code_hash IS NOT NULL
        AND reset_code_expires > NOW()
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Code expired or invalid" });
    }

    const user = result.rows[0];

    const validOtp = await bcrypt.compare(code, user.reset_code_hash);
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid code" });
    }

    const resetSessionToken = generateSessionToken();
    const resetSessionHash = await bcrypt.hash(resetSessionToken, 10);

    await pool.query(
      `
      UPDATE users
      SET reset_session_hash=$1,
          reset_session_expires=NOW() + INTERVAL '10 minutes'
      WHERE id=$2
      `,
      [resetSessionHash, user.id]
    );

    return res.json({
      message: "Code verified",
      resetSessionToken,
    });
  } catch (err) {
    console.error("forgotPasswordVerifyCode error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPasswordWithSession = async (req, res) => {
  try {
    const { email, resetSessionToken, newPassword } = req.body;

    if (!email || !resetSessionToken || !newPassword) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const result = await pool.query(
      `
      SELECT id, reset_session_hash
      FROM users
      WHERE email=$1
        AND reset_session_expires > NOW()
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Reset session expired or invalid" });
    }

    const user = result.rows[0];

    const validSession = await bcrypt.compare(
      resetSessionToken,
      user.reset_session_hash
    );

    if (!validSession) {
      return res.status(400).json({ message: "Invalid reset session" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
       SET password=$1,
           is_verified=true,
           reset_code_hash=NULL,
           reset_code_expires=NULL,
           reset_session_hash=NULL,
           reset_session_expires=NULL
       WHERE id=$2`,
      [hashedPassword, user.id]
    );
    

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("resetPasswordWithSession error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
