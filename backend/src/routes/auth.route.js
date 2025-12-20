import express from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";
import { verifyEmail } from "../controllers/verifyEmail.controller.js";

const router = express.Router();

// auth
router.post("/register", registerUser);
router.post("/login", loginUser);

// email verification
router.get("/verify-email/:token", verifyEmail);

export default router;
