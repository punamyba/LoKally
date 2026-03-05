import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ContactMessage = sequelize.define(
  "ContactMessage",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(180), allowNull: false },

    subject: { type: DataTypes.STRING(180), allowNull: false, defaultValue: "General Inquiry" },

    message: { type: DataTypes.TEXT, allowNull: false },

    status: {
      type: DataTypes.ENUM("new", "in_progress", "replied", "closed"),
      allowNull: false,
      defaultValue: "new",
    },

    allow_user_reply: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    replied_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "contact_messages",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default ContactMessage;