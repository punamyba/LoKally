import sequelize from "../config/db.js";
import { User, Place, ContactMessage, ContactReply } from "./index.js";

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

export { sequelize, User, Place, ContactMessage, ContactReply, syncDB };