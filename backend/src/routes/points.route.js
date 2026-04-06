import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware.js";
import * as PointsCtrl from "../controllers/points.controller.js";

const router = express.Router();

router.get("/balance",          authenticateToken, PointsCtrl.getBalance);
router.get("/history",          authenticateToken, PointsCtrl.getHistory);
router.get("/leaderboard",                         PointsCtrl.getLeaderboard); // public
router.get("/admin/user/:userId/history", authenticateToken, requireAdmin, PointsCtrl.getUserHistory);
router.post("/daily-login",     authenticateToken, PointsCtrl.dailyLogin);

export default router;