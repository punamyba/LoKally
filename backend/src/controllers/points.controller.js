import * as PointsService from "../services/points.service.js";

export const getBalance = async (req, res) => {
  try {
    const result = await PointsService.fetchBalance(req.user.id);
    if (result.notFound) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("getBalance error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getHistory = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const data  = await PointsService.fetchHistory(req.user.id, page, limit);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getHistory error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const data = await PointsService.fetchLeaderboard(20);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getLeaderboard error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const dailyLogin = async (req, res) => {
  try {
    const result = await PointsService.handleDailyLogin(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("dailyLogin error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const data  = await PointsService.fetchHistory(userId, page, limit);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getUserHistory error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};