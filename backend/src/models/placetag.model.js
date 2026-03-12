import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const PREDEFINED_TAGS = [
  "Scenic", "Hiking", "Nature", "Historical", "Cultural",
  "Adventure", "Waterfall", "Temple", "Lake", "Mountain",
  "Wildlife", "Photography", "Family Friendly", "Trekking",
  "Camping", "Monastery", "Heritage", "Pilgrimage",
];

const PlaceTag = sequelize.define(
  "PlaceTag",
  {
    id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    place_id: { type: DataTypes.INTEGER, allowNull: false },
    tag:      { type: DataTypes.STRING(100), allowNull: false },
  },
  {
    tableName: "place_tags",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ unique: true, fields: ["place_id", "tag"] }],
  }
);

(async () => {
  const { default: Place } = await import("./place.model.js");
  Place.hasMany(PlaceTag, { foreignKey: "place_id", as: "tags" });
  PlaceTag.belongsTo(Place, { foreignKey: "place_id" });
})();

export default PlaceTag;