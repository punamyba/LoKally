import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PostBookmark = sequelize.define(
  "PostBookmark",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    post_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "post_bookmarks",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { unique: true, fields: ["post_id", "user_id"] },
    ],
  }
);

(async () => {
  const { default: Post } = await import("./post.model.js");
  const { default: User } = await import("./user.model.js");

  PostBookmark.belongsTo(Post, { foreignKey: "post_id", as: "post" });
  PostBookmark.belongsTo(User, { foreignKey: "user_id", as: "bookmarker" });
})();

export default PostBookmark;