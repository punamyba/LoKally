import pool from "../config/db.js";

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    //  Finding user by token
    const result = await pool.query(
      "SELECT id FROM users WHERE verification_token=$1",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).send("Invalid or expired verification link");
    }

    //  Verify user
    await pool.query(
      "UPDATE users SET is_verified=true, verification_token=null WHERE id=$1",
      [result.rows[0].id]
    );

    //  Response
    res.send("Email verified successfully 🎉 You can login now.");

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
