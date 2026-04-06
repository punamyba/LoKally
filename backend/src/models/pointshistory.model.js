import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PointsHistory = sequelize.define(
  "PointsHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "points_history",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

import User from "./user.model.js";

PointsHistory.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(PointsHistory,   { foreignKey: "user_id", as: "pointsHistory" });

export default PointsHistory;