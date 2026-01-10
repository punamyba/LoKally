import express from "express";
import {
  registerUser,
  loginUser,
  forgotPasswordSendCode,
  forgotPasswordVerifyCode,
  resendForgotCode,
  resetPasswordWithSession,
} from "../controllers/auth.controller.js";

import { verifyEmail } from "../controllers/verifyEmail.controller.js";

const router = express.Router();

/* Existing */
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify-email/:token", verifyEmail);

/* New forgot/reset flow */
router.post("/forgot-password", forgotPasswordSendCode);
router.post("/forgot-password/verify", forgotPasswordVerifyCode);
router.post("/forgot-password/resend", resendForgotCode);
router.post("/reset-password", resetPasswordWithSession);

export default router;
