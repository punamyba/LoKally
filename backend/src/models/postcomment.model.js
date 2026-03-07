import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PostComment = sequelize.define(
  "PostComment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    post_id:   { type: DataTypes.INTEGER, allowNull: false },
    user_id:   { type: DataTypes.INTEGER, allowNull: false },

    // null = top-level comment, number = reply to that comment
    parent_id: { type: DataTypes.INTEGER, allowNull: true },

    body:      { type: DataTypes.TEXT, allowNull: false },
    is_hidden: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "post_comments",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

(async () => {
  const { default: Post } = await import("./post.model.js");
  const { default: User } = await import("./user.model.js");

  PostComment.belongsTo(Post,        { foreignKey: "post_id",   as: "post" });
  PostComment.belongsTo(User,        { foreignKey: "user_id",   as: "commenter" });
  PostComment.belongsTo(PostComment, { foreignKey: "parent_id", as: "parent" });
  PostComment.hasMany(PostComment,   { foreignKey: "parent_id", as: "replies", onDelete: "CASCADE" });
})();

export default PostComment;