import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ContactReply = sequelize.define(
  "ContactReply",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    contact_message_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    sender: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
    },

    reply_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "contact_replies",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default ContactReply;