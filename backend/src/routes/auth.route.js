import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

import {
  registerUser,
  loginUser,
  forgotPasswordSendCode,
  forgotPasswordVerifyCode,
  resendForgotCode,
  resetPasswordWithSession,
} from "../controllers/auth.controller.js";
import { verifyEmail } from "../controllers/verifyEmail.controller.js";

import "../config/passport.js";

const router = express.Router();

/* Auth routes */
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPasswordSendCode);
router.post("/forgot-password/verify", forgotPasswordVerifyCode);
router.post("/forgot-password/resend", resendForgotCode);
router.post("/reset-password", resetPasswordWithSession);

/* Google OAuth */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/?google=failed`,
  }),
  (req, res) => {
    const user = req.user;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userPayload = encodeURIComponent(
      JSON.stringify({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      })
    );

    res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/google-callback?token=${token}&user=${userPayload}`
    );
  }
);

export default router;