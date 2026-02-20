import sequelize from "../config/db.js";
import User from "./user.model.js";
import Place from "./place.model.js";

// Associations
Place.belongsTo(User, { foreignKey: "submitted_by", as: "submitter" });
User.hasMany(Place, { foreignKey: "submitted_by", as: "places" });
Place.belongsTo(User, { foreignKey: "approved_by", as: "approver" });

const syncDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected via Sequelize");
    await sequelize.sync({ alter: true });
    console.log("Models synced");
  } catch (err) {
    console.error("DB sync error:", err.message);
    process.exit(1);
  }
};

export { sequelize, User, Place, syncDB };