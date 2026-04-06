import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const RedeemedVoucher = sequelize.define(
  "RedeemedVoucher",
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
    reward_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    uuid_code: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    qr_data: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    points_spent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "used", "expired"),
      allowNull: false,
      defaultValue: "active",
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "redeemed_vouchers",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

import User          from "./user.model.js";
import PlatformReward from "./platformreward.model.js";

RedeemedVoucher.belongsTo(User,           { foreignKey: "user_id",   as: "user"   });
RedeemedVoucher.belongsTo(PlatformReward, { foreignKey: "reward_id", as: "reward" });
User.hasMany(RedeemedVoucher,             { foreignKey: "user_id",   as: "redeemedVouchers" });
PlatformReward.hasMany(RedeemedVoucher,   { foreignKey: "reward_id", as: "redemptions"      });

export default RedeemedVoucher;