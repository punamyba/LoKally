import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    // ── Bio ───────────────────────────────────────────
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // ─────────────────────────────────────────────────
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: "user",
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // ── Google OAuth ──────────────────────────────────
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // ─────────────────────────────────────────────────
    reset_code_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_code_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reset_session_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_session_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Associations
import Place from "./place.model.js";
import ContactConversation from "./contactconversation.model.js";

User.hasMany(Place, { foreignKey: "submitted_by", as: "places" });
User.hasMany(ContactConversation, { foreignKey: "user_id", as: "contactConversations" });

export default User;