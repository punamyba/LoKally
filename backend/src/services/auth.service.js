// auth.service.js — pure business logic, no req/res

import bcrypt from "bcrypt";
import jwt    from "jsonwebtoken";
import crypto from "crypto";
import { Op } from "sequelize";
import { User }          from "../models/index.js";
import sendMail          from "./mailer.js";
import { handleDailyLogin } from "./points.service.js";
import { getVerifyEmailHTML, getPasswordResetHTML } from "../utils/authEmailtemp.js";

// generates a random 6-digit OTP string
const generateOtp = () => crypto.randomInt(100000, 999999).toString();

// generates a 32-byte random hex token for session tracking
const generateSessionToken = () => crypto.randomBytes(32).toString("hex");

// ── REGISTER ──────────────────────────────────────────────────────────────────

// creates a new user account and sends a verification email
export const registerUser = async ({ first_name, last_name, email, phone, dob, address, gender, password }) => {
  // check if email is already taken
  const existing = await User.findOne({ where: { email } });
  if (existing) return { conflict: true };

  const hashedPassword    = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  await User.create({
    first_name, last_name, email, phone, dob, address, gender,
    password:           hashedPassword,
    is_verified:        false,
    verification_token: verificationToken,
  });

  // send verification email — failure won't break registration
  try {
    const verifyLink = `${process.env.BACKEND_URL || "http://localhost:5001"}/api/auth/verify-email/${verificationToken}`;
    await sendMail({
      to:      email,
      subject: "Verify your email - LoKally Nepal",
      html:    getVerifyEmailHTML(verifyLink),
      text:    `Verify your email using this link: ${verifyLink}`,
    });
  } catch (e) { console.error("Register email failed:", e.message); }

  return { ok: true };
};

// ── VERIFY EMAIL ──────────────────────────────────────────────────────────────

// marks the user as verified using the one-time token from the email link
export const verifyEmail = async (token) => {
  const user = await User.findOne({ where: { verification_token: token } });
  if (!user) return { invalid: true };

  // clear the token so it can't be reused
  await user.update({ is_verified: true, verification_token: null });
  return { ok: true };
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────

// verifies credentials, signs a JWT, and handles daily login points
export const loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user)            return { notFound: true };
  if (!user.is_verified) return { unverified: true };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { wrongPassword: true };

  // sign JWT with user id, email, role — expires in 1 day
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  // handle daily login points and streak — non-blocking
  let loginPoints = null;
  try {
    loginPoints = await handleDailyLogin(user.id);
  } catch (e) { console.warn("Daily login points failed:", e.message); }

  return {
    ok: true,
    token,
    user:        { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role },
    loginPoints, // null if already rewarded today, { rewarded, points, streak } otherwise
  };
};

// ── FORGOT PASSWORD — SEND OTP ────────────────────────────────────────────────

// sends a 6-digit OTP to the user's email for password reset
export const sendForgotPasswordCode = async (email) => {
  const user = await User.findOne({ where: { email } });
  // always return ok — prevents email enumeration attacks
  if (!user) return { ok: true };

  const otp     = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10); // store hashed, never plain

  await user.update({
    reset_code_hash:       otpHash,
    reset_code_expires:    new Date(Date.now() + 10 * 60 * 1000), // 10 minute expiry
    reset_session_hash:    null,
    reset_session_expires: null,
  });

  try {
    await sendMail({
      to:      email,
      subject: "Password Reset Code - LoKally Nepal",
      html:    getPasswordResetHTML(otp),
      text:    `Your LoKally password reset code is: ${otp}`,
    });
  } catch (e) { console.error("Forgot password email failed:", e.message); }

  return { ok: true };
};

// ── FORGOT PASSWORD — VERIFY OTP ──────────────────────────────────────────────

// verifies the OTP and returns a short-lived session token for the reset step
export const verifyForgotPasswordCode = async (email, code) => {
  const user = await User.findOne({
    where: {
      email,
      reset_code_hash:    { [Op.ne]: null },
      reset_code_expires: { [Op.gt]: new Date() }, // must not be expired
    },
  });
  if (!user) return { invalid: true };

  const validOtp = await bcrypt.compare(code, user.reset_code_hash);
  if (!validOtp) return { wrongCode: true };

  // issue a short-lived session token for the next step
  const resetSessionToken = generateSessionToken();
  const resetSessionHash  = await bcrypt.hash(resetSessionToken, 10);

  await user.update({
    reset_session_hash:    resetSessionHash,
    reset_session_expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes to reset
  });

  return { ok: true, resetSessionToken };
};

// ── RESET PASSWORD ────────────────────────────────────────────────────────────

// resets the password using the session token from the OTP step
export const resetPassword = async (email, resetSessionToken, newPassword) => {
  const user = await User.findOne({
    where: {
      email,
      reset_session_expires: { [Op.gt]: new Date() }, // session must still be valid
    },
  });
  if (!user) return { expired: true };

  const validSession = await bcrypt.compare(resetSessionToken, user.reset_session_hash);
  if (!validSession) return { invalidSession: true };

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // update password and clear all reset fields so they cannot be reused
  await user.update({
    password:              hashedPassword,
    is_verified:           true,
    reset_code_hash:       null,
    reset_code_expires:    null,
    reset_session_hash:    null,
    reset_session_expires: null,
  });

  return { ok: true };
};