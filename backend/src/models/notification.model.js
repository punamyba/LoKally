import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.model.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      // who receives the notification
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    actor_id: {
      // who triggered it (liked, commented, etc.)
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
      // "like" | "comment" | "place_approved" | "place_rejected"
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    place_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "notifications",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

// Associations
Notification.belongsTo(User, { foreignKey: "actor_id", as: "actor" });

export default Notification;