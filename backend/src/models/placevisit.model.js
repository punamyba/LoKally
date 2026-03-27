import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PlaceVisit = sequelize.define(
  "PlaceVisit",
  {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    place_id:    { type: DataTypes.INTEGER, allowNull: false },
    user_id:     { type: DataTypes.INTEGER, allowNull: false },
    visit_date:  { type: DataTypes.DATEONLY, allowNull: false },
    experience:  { type: DataTypes.TEXT, allowNull: true },
    photo:       { type: DataTypes.STRING(500), allowNull: true },
    status:      { type: DataTypes.STRING(20), defaultValue: "pending" }, // pending | approved | rejected
  },
  {
    tableName: "place_visits",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

(async () => {
  const { default: Place } = await import("./place.model.js");
  const { default: User }  = await import("./user.model.js");
  PlaceVisit.belongsTo(Place, { foreignKey: "place_id", as: "place" });
  PlaceVisit.belongsTo(User,  { foreignKey: "user_id",  as: "user"  });
})();

export default PlaceVisit;