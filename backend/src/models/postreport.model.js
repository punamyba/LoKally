import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PostReport = sequelize.define(
  "PostReport",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    post_id:  { type: DataTypes.INTEGER, allowNull: true },   // null for place reports
    place_id: { type: DataTypes.INTEGER, allowNull: true },   // null for post reports
    user_id:  { type: DataTypes.INTEGER, allowNull: false },

    reason:    { type: DataTypes.STRING(255), allowNull: false },
    note:      { type: DataTypes.TEXT,        allowNull: true  },
    status:    { type: DataTypes.STRING(20),  defaultValue: "new" },
    dismissed: { type: DataTypes.BOOLEAN,     defaultValue: false },
  },
  {
    tableName: "post_reports",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

(async () => {
  const { default: Post }  = await import("./post.model.js");
  const { default: User }  = await import("./user.model.js");
  const { default: Place } = await import("./place.model.js");

  PostReport.belongsTo(Post,  { foreignKey: "post_id",  as: "post"     });
  PostReport.belongsTo(User,  { foreignKey: "user_id",  as: "reporter" });
  PostReport.belongsTo(Place, { foreignKey: "place_id", as: "place"    });
})();

export default PostReport;