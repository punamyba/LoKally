import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware.js";
import * as RewardCtrl from "../controllers/platformreward.controller.js";

const router = express.Router();

// User routes
router.get("/",                        RewardCtrl.getRewards);
router.post("/:id/redeem", authenticateToken, RewardCtrl.redeemReward);
router.get("/my-vouchers", authenticateToken, RewardCtrl.getMyVouchers);

// Admin routes
router.post("/",                       authenticateToken, requireAdmin, RewardCtrl.createReward);
router.put("/:id",                     authenticateToken, requireAdmin, RewardCtrl.updateReward);
router.delete("/:id",                  authenticateToken, requireAdmin, RewardCtrl.deleteReward);
router.patch("/voucher/:code/use",     authenticateToken, requireAdmin, RewardCtrl.markVoucherUsed);
router.get("/admin/redemptions",       authenticateToken, requireAdmin, RewardCtrl.getAllRedemptions);

export default router;