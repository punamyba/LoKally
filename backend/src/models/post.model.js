import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Post = sequelize.define(
  "Post",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    caption: { type: DataTypes.TEXT, allowNull: true },

    // JSON array string: '["/uploads/posts/a.jpg","/uploads/posts/b.jpg"]'
    images: { type: DataTypes.TEXT, allowNull: true },

    // optional linked place
    place_id: { type: DataTypes.INTEGER, allowNull: true },

    is_hidden:      { type: DataTypes.BOOLEAN, defaultValue: false },
    likes_count:    { type: DataTypes.INTEGER, defaultValue: 0 },
    comments_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    reports_count:  { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "posts",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Associations — same pattern as your ContactConversation model
(async () => {
  const { default: User }           = await import("./user.model.js");
  const { default: PostLike }       = await import("./postlike.model.js");
  const { default: PostComment }    = await import("./postcomment.model.js");
  const { default: PostBookmark }   = await import("./postbookmark.model.js");
  const { default: PostReport }     = await import("./postreport.model.js");

  Post.belongsTo(User, { foreignKey: "user_id", as: "author" });

  Post.hasMany(PostLike,     { foreignKey: "post_id", as: "likes",     onDelete: "CASCADE" });
  Post.hasMany(PostComment,  { foreignKey: "post_id", as: "comments",  onDelete: "CASCADE" });
  Post.hasMany(PostBookmark, { foreignKey: "post_id", as: "bookmarks", onDelete: "CASCADE" });
  Post.hasMany(PostReport,   { foreignKey: "post_id", as: "reports",   onDelete: "CASCADE" });
})();

export default Post;