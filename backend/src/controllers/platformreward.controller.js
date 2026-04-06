import * as RewardService from "../services/platformreward.service.js";

// ── PUBLIC ────────────────────────────────────────────────────────────────────

export const getRewards = async (req, res) => {
  try {
    const data = await RewardService.fetchRewards();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const redeemReward = async (req, res) => {
  try {
    const result = await RewardService.redeemReward(req.user.id, req.params.id);
    if (result.notFound)       return res.status(404).json({ success: false, message: "Reward not found" });
    if (result.outOfStock)     return res.status(400).json({ success: false, message: "This reward is out of stock" });
    if (result.expired)        return res.status(400).json({ success: false, message: "This reward has expired" });
    if (result.alreadyRedeemed)return res.status(409).json({ success: false, message: "You already have an active voucher for this reward" });
    if (result.insufficient)   return res.status(400).json({ success: false, message: "Not enough points" });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("redeemReward error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyVouchers = async (req, res) => {
  try {
    const data = await RewardService.fetchUserVouchers(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── ADMIN ─────────────────────────────────────────────────────────────────────

export const createReward = async (req, res) => {
  const { title, partner_name, points_required } = req.body;
  if (!title?.trim())        return res.status(400).json({ success: false, message: "Title is required" });
  if (!partner_name?.trim()) return res.status(400).json({ success: false, message: "Partner name is required" });
  if (!points_required)      return res.status(400).json({ success: false, message: "Points required is required" });

  try {
    const reward = await RewardService.createReward(req.body);
    res.status(201).json({ success: true, data: reward });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateReward = async (req, res) => {
  try {
    const result = await RewardService.updateReward(req.params.id, req.body);
    if (result.notFound) return res.status(404).json({ success: false, message: "Reward not found" });
    res.json({ success: true, data: result.reward });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteReward = async (req, res) => {
  try {
    const result = await RewardService.deleteReward(req.params.id);
    if (result.notFound) return res.status(404).json({ success: false, message: "Reward not found" });
    res.json({ success: true, message: "Reward deactivated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const markVoucherUsed = async (req, res) => {
  const { code } = req.params;
  if (!code) return res.status(400).json({ success: false, message: "Voucher code is required" });
  try {
    const result = await RewardService.markVoucherUsed(code);
    if (result.notFound)   return res.status(404).json({ success: false, message: "Voucher not found" });
    if (result.alreadyUsed)return res.status(409).json({ success: false, message: "Voucher already used" });
    res.json({ success: true, message: "Voucher marked as used" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllRedemptions = async (req, res) => {
  try {
    const data = await RewardService.fetchAllRedemptions();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};