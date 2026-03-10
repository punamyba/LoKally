import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Op } from "sequelize";
import { User } from "../models/index.js";
import sendMail from "../services/mailer.js";

/* Generates 6 digit OTP */
const generateOtp = () => crypto.randomInt(100000, 999999).toString();

/* Generates random token for reset session */
const generateSessionToken = () => crypto.randomBytes(32).toString("hex");

/* REGISTER */
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

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await User.create({
      first_name,
      last_name,
      email,
      phone,
      dob,
      address,
      gender,
      password: hashedPassword,
      is_verified: false,
      verification_token: verificationToken,
    });

    try {
      const verifyLink = `${process.env.BACKEND_URL || "http://localhost:5001"}/api/auth/verify-email/${verificationToken}`;

      await sendMail({
        to: email,
        subject: "Verify your email",
        html: `
          <h3>Verify your email</h3>
          <p>Click the link below to verify your account:</p>
          <a href="${verifyLink}">${verifyLink}</a>
        `,
      });
    } catch (e) {
      console.error("Register email failed:", e.message);
    }

    return res
      .status(201)
      .json({ message: "Registered successfully! Please verify your email" });
  } catch (err) {
    console.error("registerUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* LOGIN */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

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
      { id: user.id, email: user.email, role: user.role },
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
        role: user.role,
      },
    });
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* FORGOT PASSWORD - SEND OTP */
export const forgotPasswordSendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ message: "If account exists, code was sent." });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ message: "If account exists, code was sent." });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await user.update({
      reset_code_hash: otpHash,
      reset_code_expires: new Date(Date.now() + 10 * 60 * 1000),
      reset_session_hash: null,
      reset_session_expires: null,
    });

    try {
      await sendMail({
        to: email,
        subject: "Password reset code",
        html: `
          <p>Your password reset code is:</p>
          <h2>${otp}</h2>
          <p>This code expires in 10 minutes.</p>
        `,
      });
    } catch (e) {
      console.error("Forgot password email failed:", e.message);
    }

    return res.json({ message: "If account exists, code was sent." });
  } catch (err) {
    console.error("forgotPasswordSendCode error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* RESEND OTP */
export const resendForgotCode = async (req, res) => {
  return forgotPasswordSendCode(req, res);
};

/* VERIFY OTP */
export const forgotPasswordVerifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code required" });
    }

    const user = await User.findOne({
      where: {
        email,
        reset_code_hash: { [Op.ne]: null },
        reset_code_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Code expired or invalid" });
    }

    const validOtp = await bcrypt.compare(code, user.reset_code_hash);
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid code" });
    }

    const resetSessionToken = generateSessionToken();
    const resetSessionHash = await bcrypt.hash(resetSessionToken, 10);

    await user.update({
      reset_session_hash: resetSessionHash,
      reset_session_expires: new Date(Date.now() + 10 * 60 * 1000),
    });

    return res.json({ message: "Code verified", resetSessionToken });
  } catch (err) {
    console.error("forgotPasswordVerifyCode error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* RESET PASSWORD */
export const resetPasswordWithSession = async (req, res) => {
  try {
    const { email, resetSessionToken, newPassword } = req.body;

    if (!email || !resetSessionToken || !newPassword) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findOne({
      where: {
        email,
        reset_session_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset session expired or invalid" });
    }

    const validSession = await bcrypt.compare(
      resetSessionToken,
      user.reset_session_hash
    );

    if (!validSession) {
      return res.status(400).json({ message: "Invalid reset session" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      is_verified: true,
      reset_code_hash: null,
      reset_code_expires: null,
      reset_session_hash: null,
      reset_session_expires: null,
    });

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("resetPasswordWithSession error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};