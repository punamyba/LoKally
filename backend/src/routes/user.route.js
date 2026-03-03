import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, (req, res) => {
  return res.json({
    message: "Profile fetched",
    user: req.user,
  });
});

export default router;