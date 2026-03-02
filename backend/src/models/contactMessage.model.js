import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/*
  Stores messages submitted from Contact Us page.
  Admin can reply and update status.
*/
const ContactMessage = sequelize.define(
  "ContactMessage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },

    subject: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("new", "in_progress", "replied", "closed"),
      allowNull: false,
      defaultValue: "new",
    },

    admin_reply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    replied_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
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