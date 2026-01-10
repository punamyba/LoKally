import pool from "../config/db.js";

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      "SELECT id FROM users WHERE verification_token=$1",
      [token]
    );

    if (result.rows.length === 0) {
      // ❌ invalid token → frontend error page
      return res.redirect("http://localhost:5173/?verify=invalid");
    }

    // ✅ verify user
    await pool.query(
      "UPDATE users SET is_verified=true, verification_token=null WHERE id=$1",
      [result.rows[0].id]
    );

    // ✅ redirect to frontend login page
    return res.redirect("http://localhost:5173/?verify=success");

  } catch (err) {
    console.error(err);
    return res.redirect("http://localhost:5173/?verify=error");
  }
};
