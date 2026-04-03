import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const UserPreference = sequelize.define("UserPreference", {
  id:                  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:             { type: DataTypes.INTEGER, allowNull: false, unique: true },
  notif_likes:         { type: DataTypes.BOOLEAN, defaultValue: true },
  notif_comments:      { type: DataTypes.BOOLEAN, defaultValue: true },
  notif_places:        { type: DataTypes.BOOLEAN, defaultValue: true },
  notif_announcements: { type: DataTypes.BOOLEAN, defaultValue: false },
  privacy_public:      { type: DataTypes.BOOLEAN, defaultValue: true },
  privacy_saved:       { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: "user_preferences",
  underscored: true,
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

(async () => {
  const { default: User } = await import("./user.model.js");
  UserPreference.belongsTo(User, { foreignKey: "user_id", as: "user" });
  User.hasOne(UserPreference, { foreignKey: "user_id", as: "preferences" });
})();

export default UserPreference;
