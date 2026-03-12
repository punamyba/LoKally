import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PlaceCondition = sequelize.define(
  "PlaceCondition",
  {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    place_id:   { type: DataTypes.INTEGER, allowNull: false, unique: true },
    trail:      { type: DataTypes.STRING(50),  defaultValue: "Good" },
    road:       { type: DataTypes.STRING(50),  defaultValue: "Paved" },
    best_time:  { type: DataTypes.STRING(100), defaultValue: "Oct–Mar" },
    difficulty: { type: DataTypes.STRING(50),  defaultValue: "Moderate" },
    updated_by: { type: DataTypes.INTEGER,     allowNull: true },
    note:       { type: DataTypes.TEXT,        allowNull: true },
  },
  {
    tableName: "place_conditions",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

(async () => {
  const { default: Place } = await import("./place.model.js");
  const { default: User }  = await import("./user.model.js");
  Place.hasOne(PlaceCondition,    { foreignKey: "place_id", as: "condition" });
  PlaceCondition.belongsTo(Place, { foreignKey: "place_id" });
  PlaceCondition.belongsTo(User,  { foreignKey: "updated_by", as: "updatedBy" });
})();

export default PlaceCondition;