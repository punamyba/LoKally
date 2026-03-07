import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PostLike = sequelize.define(
  "PostLike",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    post_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },

    react_type: {
      type: DataTypes.ENUM("like", "love", "wow", "haha", "sad", "angry"),
      defaultValue: "like",
    },
  },
  {
    tableName: "post_likes",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { unique: true, fields: ["post_id", "user_id"] }, // no double-like
    ],
  }
);

(async () => {
  const { default: Post } = await import("./post.model.js");
  const { default: User } = await import("./user.model.js");

  PostLike.belongsTo(Post, { foreignKey: "post_id", as: "post" });
  PostLike.belongsTo(User, { foreignKey: "user_id", as: "liker" });
})();

export default PostLike;