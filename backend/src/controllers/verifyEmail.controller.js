import { User } from "../models/index.js";

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ where: { verification_token: token } });

    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?verify=invalid`
      );
    }

    await user.update({
      is_verified: true,
      verification_token: null,
    });

    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?verify=success`
    );
  } catch (err) {
    console.error("verifyEmail error:", err);
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?verify=error`
    );
  }
};