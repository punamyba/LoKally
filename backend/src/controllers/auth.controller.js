import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

/* REGISTER USER */
export const registerUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      dob,
      address,
      gender,
      password,
      confirm_password,
    } = req.body;

    // 1️ Basic validation
    if (!email || !password || !confirm_password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // 2️ Check existing user
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // 3️ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️ Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 5️ Insert user (NOT verified yet)
    await pool.query(
      `INSERT INTO users
      (first_name, last_name, email, phone, dob, address, gender, password, is_verified, verification_token)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        first_name,
        last_name,
        email,
        phone,
        dob,
        address,
        gender,
        hashedPassword,
        false,
        verificationToken,
      ]
    );

    // 6️ Send verification email
    const verifyLink = `http://localhost:5001/api/verify-email/${verificationToken}`;
    await sendEmail(email, verifyLink);

    // 7️ Response
    res.status(201).json({
      message: "Registered successfully! Please verify your email 📧",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * =========================
 * LOGIN USER
 * =========================
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️ Validate
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // 2️ Find user
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // 3️ Check email verification
    if (!user.is_verified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
      });
    }

    // 4️ Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 5️ Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 6️ Response
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
