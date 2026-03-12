import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PlaceVisit = sequelize.define(
  "PlaceVisit",
  {
    id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    place_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id:  { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "place_visits",
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
  Place.hasMany(PlaceVisit, { foreignKey: "place_id", as: "visits" });
  PlaceVisit.belongsTo(Place, { foreignKey: "place_id" });
  PlaceVisit.belongsTo(User,  { foreignKey: "user_id", as: "user" });
})();

export default PlaceVisit;