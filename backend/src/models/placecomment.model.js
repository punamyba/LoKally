import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PlaceComment = sequelize.define(
  "PlaceComment",
  {
    id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    place_id:  { type: DataTypes.INTEGER, allowNull: false },
    user_id:   { type: DataTypes.INTEGER, allowNull: false },
    parent_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    text:      { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: "place_comments",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

(async () => {
  const { default: Place } = await import("./place.model.js");
  const { default: User }  = await import("./user.model.js");
  Place.hasMany(PlaceComment, { foreignKey: "place_id", as: "comments" });
  PlaceComment.belongsTo(Place, { foreignKey: "place_id" });
  PlaceComment.belongsTo(User,  { foreignKey: "user_id", as: "user" });
  // Self-referential for replies
  PlaceComment.hasMany(PlaceComment,   { foreignKey: "parent_id", as: "replies" });
  PlaceComment.belongsTo(PlaceComment, { foreignKey: "parent_id", as: "parent" });
})();

export default PlaceComment;