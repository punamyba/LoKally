import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ConversationMessage = sequelize.define(
  "ConversationMessage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sender_type: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
    },
    // "body" — controller le "body" use garxa
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sender_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    email_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "conversation_messages",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

// Associations — dynamic import to avoid circular dependency
(async () => {
  const { default: ContactConversation } = await import("./contactconversation.model.js");
  const { default: User } = await import("./user.model.js");

  ConversationMessage.belongsTo(ContactConversation, {
    foreignKey: "conversation_id",
    as: "conversation",
  });

  ConversationMessage.belongsTo(User, {
    foreignKey: "sender_user_id",
    as: "sender",
  });
})();

export default ConversationMessage;