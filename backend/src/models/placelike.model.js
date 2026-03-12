import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PlaceLike = sequelize.define(
  "PlaceLike",
  {
    id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    place_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id:  { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "place_likes",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ unique: true, fields: ["place_id", "user_id"] }],
  }
);

(async () => {
  const { default: Place } = await import("./place.model.js");
  const { default: User }  = await import("./user.model.js");
  Place.hasMany(PlaceLike, { foreignKey: "place_id", as: "likes" });
  PlaceLike.belongsTo(Place, { foreignKey: "place_id" });
  PlaceLike.belongsTo(User,  { foreignKey: "user_id", as: "user" });
})();

export default PlaceLike;