// points.service.js — all points earn/spend/balance logic

import User          from "../models/user.model.js";
import PointsHistory from "../models/pointshistory.model.js";
import { Op }        from "sequelize";
import sequelize     from "../config/db.js";

// ── POINTS CONFIG ─────────────────────────────────────────────────────────────

export const POINTS = {
  place_submitted:        20,
  place_approved:         50,
  photo_uploaded:         10,
  visit_submitted:        10,
  visit_approved:         25,
  review_written:         10,
  post_created:           15,
  like_given:              5,
  comment_written:         8,
  received_like:           4,
  received_comment:        4,
  someone_visited_place:   8,
  daily_login:             5,
  streak_7_days:          30,
  streak_30_days:         100,
  report_resolved:        10,   // ← NEW: report approve/resolve भएमा
};

// ── LEVELS CONFIG ─────────────────────────────────────────────────────────────

export const LEVELS = [
  { name: "Newcomer",         emoji: "🌱", min: 0    },
  { name: "Explorer",         emoji: "🗺️", min: 100  },
  { name: "Trail Finder",     emoji: "🏔️", min: 300  },
  { name: "Hidden Gem Hunter",emoji: "⭐", min: 700  },
  { name: "LoKally Legend",   emoji: "🏆", min: 1500 },
];

export const getLevel = (totalPoints) => {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (totalPoints >= l.min) level = l;
  }
  const idx  = LEVELS.indexOf(level);
  const next = LEVELS[idx + 1] || null;
  return {
    ...level,
    next_level:        next,
    points_to_next:    next ? next.min - totalPoints : 0,
    progress_percent:  next
      ? Math.round(((totalPoints - level.min) / (next.min - level.min)) * 100)
      : 100,
  };
};

// ── CORE: earn points ─────────────────────────────────────────────────────────

export const earnPoints = async ({ userId, action, description, referenceId = null }) => {
  const pts = POINTS[action];
  if (!pts) return null;

  await PointsHistory.create({
    user_id:      userId,
    points:       pts,
    action,
    description:  description || action.replace(/_/g, " "),
    reference_id: referenceId,
  });

  await User.increment("total_points", { by: pts, where: { id: userId } });

  return pts;
};

// ── CORE: spend points (redeem) ───────────────────────────────────────────────

export const spendPoints = async ({ userId, points, action, description }) => {
  const user = await User.findByPk(userId);
  if (!user) return { notFound: true };
  if ((user.total_points || 0) < points) return { insufficient: true };

  await PointsHistory.create({
    user_id:     userId,
    points:      -points,
    action,
    description: description || "Points redeemed",
  });

  await User.decrement("total_points", { by: points, where: { id: userId } });
  return { ok: true };
};

// ── GET BALANCE ───────────────────────────────────────────────────────────────

export const fetchBalance = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "total_points"],
  });
  if (!user) return { notFound: true };

  const totalEarned = await PointsHistory.sum("points", {
    where: { user_id: userId, points: { [Op.gt]: 0 } },
  }) || 0;

  const totalSpent = await PointsHistory.sum("points", {
    where: { user_id: userId, points: { [Op.lt]: 0 } },
  }) || 0;

  return {
    current:      user.total_points || 0,
    total_earned: totalEarned,
    total_spent:  Math.abs(totalSpent),
    level:        getLevel(totalEarned),
  };
};

// ── GET HISTORY ───────────────────────────────────────────────────────────────

export const fetchHistory = async (userId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return PointsHistory.findAll({
    where:  { user_id: userId },
    order:  [["created_at", "DESC"]],
    limit,
    offset,
  });
};

// ── LEADERBOARD ───────────────────────────────────────────────────────────────

export const fetchLeaderboard = async (limit = 20) => {
  const users = await User.findAll({
    attributes: ["id", "first_name", "last_name", "avatar", "total_points"],
    order:      [["total_points", "DESC"]],
    limit,
    where:      { total_points: { [Op.gt]: 0 } },
  });

  return users.map((u, i) => ({
    rank:         i + 1,
    id:           u.id,
    first_name:   u.first_name,
    last_name:    u.last_name,
    avatar:       u.avatar,
    total_points: u.total_points || 0,
    level:        getLevel(u.total_points || 0),
  }));
};

// ── DAILY LOGIN ───────────────────────────────────────────────────────────────

export const handleDailyLogin = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alreadyLogged = await PointsHistory.findOne({
    where: {
      user_id: userId,
      action:  "daily_login",
      created_at: { [Op.gte]: today },
    },
  });

  if (alreadyLogged) return { alreadyRewarded: true };

  await earnPoints({ userId, action: "daily_login", description: "Daily login bonus" });

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayLogin = await PointsHistory.findOne({
    where: {
      user_id: userId,
      action:  "daily_login",
      created_at: { [Op.gte]: yesterday, [Op.lt]: today },
    },
  });

  let streak = 1;
  if (yesterdayLogin) {
    const recentLogins = await PointsHistory.findAll({
      where:  { user_id: userId, action: "daily_login" },
      order:  [["created_at", "DESC"]],
      limit:  31,
    });

    for (let i = 1; i < recentLogins.length; i++) {
      const prev = new Date(recentLogins[i].created_at);
      const curr = new Date(recentLogins[i - 1].created_at);
      prev.setHours(0,0,0,0); curr.setHours(0,0,0,0);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else break;
    }
  }

  let streakBonus = null;
  if (streak === 7) {
    await earnPoints({ userId, action: "streak_7_days", description: "7 day login streak bonus!" });
    streakBonus = { days: 7, points: POINTS.streak_7_days };
  } else if (streak === 30) {
    await earnPoints({ userId, action: "streak_30_days", description: "30 day login streak bonus!" });
    streakBonus = { days: 30, points: POINTS.streak_30_days };
  }

  return { rewarded: true, points: POINTS.daily_login, streak, streakBonus };
};