import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PlaceRating = sequelize.define(
  "PlaceRating",
  {
    id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    place_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id:  { type: DataTypes.INTEGER, allowNull: false },
    rating:   { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  },
  {
    tableName: "place_ratings",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ unique: true, fields: ["place_id", "user_id"] }],
  }
);

(async () => {
  const { default: Place } = await import("./place.model.js");
  const { default: User }  = await import("./user.model.js");
  Place.hasMany(PlaceRating, { foreignKey: "place_id", as: "ratings" });
  PlaceRating.belongsTo(Place, { foreignKey: "place_id" });
  PlaceRating.belongsTo(User,  { foreignKey: "user_id", as: "user" });
})();

export default PlaceRating;