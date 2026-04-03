// auth.controller.js
// Only handles: request parsing, validation, calling service, sending response.
// Zero business logic here — all logic lives in auth.service.js

import * as AuthService from "../services/auth.service.js";

// ── REGISTER ──────────────────────────────────────────────────────────────────

export const registerUser = async (req, res) => {
  const { email, password, confirm_password } = req.body;

  if (!email || !password || !confirm_password) // all three required to create account
    return res.status(400).json({ message: "Email, password and confirm password are required" });

  if (password !== confirm_password) // must match before we even hit the db
    return res.status(400).json({ message: "Passwords do not match" });

  if (password.length < 6) // minimum password length check
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const result = await AuthService.registerUser(req.body);
    if (result.conflict)
      return res.status(400).json({ message: "Email already registered" });

    res.status(201).json({ message: "Registered successfully! Please verify your email" });
  } catch (err) {
    console.error("registerUser error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── VERIFY EMAIL ──────────────────────────────────────────────────────────────

export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/?verify=invalid`
    );
  }

  try {
    const result = await AuthService.verifyEmail(token);

    if (result.invalid) {
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/?verify=invalid`
      );
    }

    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/?verify=success`
    );
  } catch (err) {
    console.error("verifyEmail error:", err.message);
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/?verify=error`
    );
  }
};
// ── LOGIN ─────────────────────────────────────────────────────────────────────

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) // both required — no partial login attempts
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const result = await AuthService.loginUser(email, password);

    if (result.notFound)
      return res.status(400).json({ message: "No account found with this email" });

    if (result.unverified)
      return res.status(403).json({ message: "Please verify your email before logging in" });

    if (result.wrongPassword)
      return res.status(400).json({ message: "Incorrect password" });

    res.json({ message: "Login successful", token: result.token, user: result.user });
  } catch (err) {
    console.error("loginUser error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── FORGOT PASSWORD — SEND OTP ────────────────────────────────────────────────

export const forgotPasswordSendCode = async (req, res) => {
  const { email } = req.body;

  // even if email is missing, return same response — prevents email enumeration
  if (!email)
    return res.json({ message: "If an account exists, a code was sent." });

  try {
    await AuthService.sendForgotPasswordCode(email);
    res.json({ message: "If an account exists, a code was sent." });
  } catch (err) {
    console.error("forgotPasswordSendCode error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── FORGOT PASSWORD — RESEND OTP ──────────────────────────────────────────────

export const resendForgotCode = async (req, res) => {
  return forgotPasswordSendCode(req, res); // reuse the same handler
};

// ── FORGOT PASSWORD — VERIFY OTP ──────────────────────────────────────────────

export const forgotPasswordVerifyCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) // need both to verify the OTP
    return res.status(400).json({ message: "Email and verification code are required" });

  try {
    const result = await AuthService.verifyForgotPasswordCode(email, code);

    if (result.invalid)
      return res.status(400).json({ message: "Code has expired or does not exist" });

    if (result.wrongCode)
      return res.status(400).json({ message: "Incorrect verification code" });

    // return session token — frontend uses this in the reset password step
    res.json({ message: "Code verified", resetSessionToken: result.resetSessionToken });
  } catch (err) {
    console.error("forgotPasswordVerifyCode error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── RESET PASSWORD ────────────────────────────────────────────────────────────

export const resetPasswordWithSession = async (req, res) => {
  const { email, resetSessionToken, newPassword } = req.body;

  if (!email || !resetSessionToken || !newPassword) // all three needed to complete reset
    return res.status(400).json({ message: "Email, session token and new password are required" });

  if (newPassword.length < 6) // enforce same minimum as registration
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const result = await AuthService.resetPassword(email, resetSessionToken, newPassword);

    if (result.expired)
      return res.status(400).json({ message: "Reset session has expired, please request a new code" });

    if (result.invalidSession)
      return res.status(400).json({ message: "Invalid reset session" });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("resetPasswordWithSession error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};