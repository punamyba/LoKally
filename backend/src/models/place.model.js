import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Place = sequelize.define(
  "Place",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    lng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    submitted_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    rejected_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // ── NEW: admin ley featured mark garna ──────────────────────
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    tableName: "places",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// dynamic import to avoid circular dependency
(async () => {
  const { default: User } = await import("./user.model.js");

  Place.belongsTo(User, {
    foreignKey: "submitted_by",
    as: "submitter",
  });

  Place.belongsTo(User, {
    foreignKey: "approved_by",
    as: "approver",
  });
})();

export default Place;