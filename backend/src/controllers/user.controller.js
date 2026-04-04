import * as UserService from "../services/user.service.js";

// ── ME — navbar ko lagi ───────────────────────────────────────────────────────

export const getMe = async (req, res) => {
  try {
    const result = await UserService.fetchMe(req.user.id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: result.user });
  } catch (err) {
    console.error("getMe error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PROFILE ───────────────────────────────────────────────────────────────────

export const getProfile = async (req, res) => {
  try {
    const result = await UserService.fetchProfile(req.user.id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: result.user });
  } catch (err) {
    console.error("getProfile error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const result = await UserService.updateProfile(req.user.id, req.body, req.file);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: result.user });
  } catch (err) {
    console.error("updateProfile error:", err.message);
    res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};

// ── PROFILE PICTURE ───────────────────────────────────────────────────────────

export const uploadProfilePicture = async (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No file uploaded" });
  try {
    const result = await UserService.uploadProfilePicture(req.user.id, req.file);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "Profile picture updated successfully", data: { avatar: result.avatar } });
  } catch (err) {
    console.error("uploadProfilePicture error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteProfilePicture = async (req, res) => {
  try {
    const result = await UserService.deleteProfilePicture(req.user.id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "Profile picture removed successfully" });
  } catch (err) {
    console.error("deleteProfilePicture error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PASSWORD ──────────────────────────────────────────────────────────────────

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ success: false, message: "Current password and new password are required" });
  if (newPassword.length < 6)
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
  if (currentPassword === newPassword)
    return res.status(400).json({ success: false, message: "New password must be different from current password" });

  try {
    const result = await UserService.changePassword(req.user.id, currentPassword, newPassword);
    if (result.notFound)      return res.status(404).json({ success: false, message: "User not found" });
    if (result.socialLogin)   return res.status(400).json({ success: false, message: "This account uses social login. Password change is not available." });
    if (result.wrongPassword) return res.status(400).json({ success: false, message: "Current password is incorrect" });
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── ACCOUNT ───────────────────────────────────────────────────────────────────

export const deleteAccount = async (req, res) => {
  try {
    const result = await UserService.deleteAccount(req.user.id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    console.error("deleteAccount error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── OWN CONTENT ───────────────────────────────────────────────────────────────

export const getMyPosts = async (req, res) => {
  try {
    const data = await UserService.fetchMyPosts(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getMyPosts error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyPlaces = async (req, res) => {
  try {
    const data = await UserService.fetchMyPlaces(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getMyPlaces error:", err.message);
    res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};

// ── PUBLIC PROFILE ────────────────────────────────────────────────────────────

export const getPublicProfile = async (req, res) => {
  const { userId } = req.params;
  if (!userId || isNaN(userId))
    return res.status(400).json({ success: false, message: "Valid user ID is required" });
  try {
    const result = await UserService.fetchPublicProfile(userId);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: result.user });
  } catch (err) {
    console.error("getPublicProfile error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPublicUserPosts = async (req, res) => {
  const { userId } = req.params;
  if (!userId || isNaN(userId))
    return res.status(400).json({ success: false, message: "Valid user ID is required" });
  try {
    const data = await UserService.fetchPublicUserPosts(userId);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getPublicUserPosts error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPublicUserPlaces = async (req, res) => {
  const { userId } = req.params;
  if (!userId || isNaN(userId))
    return res.status(400).json({ success: false, message: "Valid user ID is required" });
  try {
    const data = await UserService.fetchPublicUserPlaces(userId);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getPublicUserPlaces error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};