// platformreward.service.js — rewards browse, redeem, QR generate

import { v4 as uuidv4 }  from "uuid";
import QRCode             from "qrcode";
import PlatformReward     from "../models/platformreward.model.js";
import RedeemedVoucher    from "../models/redeemedvoucher.model.js";
import User               from "../models/user.model.js";
import { spendPoints }    from "./points.service.js";
import { Op }             from "sequelize";

// ── BROWSE REWARDS ────────────────────────────────────────────────────────────

export const fetchRewards = async () => {
  return PlatformReward.findAll({
    where: { is_active: true },
    order: [["points_required", "ASC"]],
  });
};

export const fetchRewardById = async (id) => {
  const reward = await PlatformReward.findByPk(id);
  if (!reward) return { notFound: true };
  return { reward };
};

// ── REDEEM ────────────────────────────────────────────────────────────────────

export const redeemReward = async (userId, rewardId) => {
  const reward = await PlatformReward.findByPk(rewardId);
  if (!reward || !reward.is_active) return { notFound: true };

  // check stock
  if (reward.stock === 0) return { outOfStock: true };

  // check expiry
  if (reward.expires_at && new Date(reward.expires_at) < new Date())
    return { expired: true };

  // check user already redeemed this reward and still active
  const existing = await RedeemedVoucher.findOne({
    where: { user_id: userId, reward_id: rewardId, status: "active" },
  });
  if (existing) return { alreadyRedeemed: true };

  // spend points
  const spend = await spendPoints({
    userId,
    points:      reward.points_required,
    action:      "reward_redeemed",
    description: `Redeemed: ${reward.title}`,
  });

  if (spend.notFound)    return { notFound: true };
  if (spend.insufficient) return { insufficient: true };

  // generate unique code
  const code = uuidv4();

  // generate QR code as base64 image
  const qrData = JSON.stringify({
    code,
    reward:  reward.title,
    partner: reward.partner_name,
    user_id: userId,
  });
  const qrImage = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

  // set expiry — 30 days from now if no reward expiry
  const expiresAt = reward.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const voucher = await RedeemedVoucher.create({
    user_id:      userId,
    reward_id:    rewardId,
    uuid_code:    code,
    qr_data:      qrImage,
    points_spent: reward.points_required,
    status:       "active",
    expires_at:   expiresAt,
  });

  // reduce stock if not unlimited
  if (reward.stock > 0) {
    await reward.decrement("stock");
  }

  return { voucher, reward };
};

// ── USER VOUCHERS ─────────────────────────────────────────────────────────────

export const fetchUserVouchers = async (userId) => {
  return RedeemedVoucher.findAll({
    where:   { user_id: userId },
    include: [{ model: PlatformReward, as: "reward" }],
    order:   [["created_at", "DESC"]],
  });
};

// ── ADMIN: add reward ─────────────────────────────────────────────────────────

export const createReward = async (data) => {
  return PlatformReward.create(data);
};

export const updateReward = async (id, data) => {
  const reward = await PlatformReward.findByPk(id);
  if (!reward) return { notFound: true };
  await reward.update(data);
  return { reward };
};

export const deleteReward = async (id) => {
  const reward = await PlatformReward.findByPk(id);
  if (!reward) return { notFound: true };
  await reward.update({ is_active: false }); // soft delete
  return { ok: true };
};

// ── ADMIN: mark voucher as used ───────────────────────────────────────────────

export const markVoucherUsed = async (code) => {
  const voucher = await RedeemedVoucher.findOne({ where: { uuid_code: code } });
  if (!voucher)               return { notFound: true };
  if (voucher.status === "used") return { alreadyUsed: true };

  await voucher.update({ status: "used", used_at: new Date() });
  return { ok: true };
};

// ── ADMIN: all redemptions ────────────────────────────────────────────────────

export const fetchAllRedemptions = async () => {
  return RedeemedVoucher.findAll({
    include: [
      { model: User,           as: "user",   attributes: ["id", "first_name", "last_name", "email"] },
      { model: PlatformReward, as: "reward", attributes: ["id", "title", "partner_name"] },
    ],
    order: [["created_at", "DESC"]],
  });
};