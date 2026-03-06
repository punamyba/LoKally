import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ContactConversation = sequelize.define(
  "ContactConversation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "General Inquiry",
    },
    // Original first message from user
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("new", "open", "replied", "closed"),
      defaultValue: "new",
    },
    allow_user_reply: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    ref_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
  },
  {
    tableName: "contact_conversations",
    underscored: true,
    timestamps: true,
  }
);

// Associations — dynamic import to avoid circular dependency
(async () => {
  const { default: User } = await import("./user.model.js");
  const { default: ConversationMessage } = await import("./conversationmessage.model.js");

  ContactConversation.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });

  ContactConversation.hasMany(ConversationMessage, {
    foreignKey: "conversation_id",
    as: "messages",
    onDelete: "CASCADE",
  });
})();

export default ContactConversation;