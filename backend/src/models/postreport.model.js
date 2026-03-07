import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PostReport = sequelize.define(
  "PostReport",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    post_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },

    reason:    { type: DataTypes.STRING(255), allowNull: false },
    dismissed: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "post_reports",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { unique: true, fields: ["post_id", "user_id"] }, // one report per user per post
    ],
  }
);

(async () => {
  const { default: Post } = await import("./post.model.js");
  const { default: User } = await import("./user.model.js");

  PostReport.belongsTo(Post, { foreignKey: "post_id", as: "post" });
  PostReport.belongsTo(User, { foreignKey: "user_id", as: "reporter" });
})();

export default PostReport;