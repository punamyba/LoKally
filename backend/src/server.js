import "dotenv/config";

import app from "./app.js";
import sequelize from "./config/db.js";
import "./models/index.js";
import User from "./models/user.model.js";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected");

    // Normal sync — sabai tables (naya table banaucha, existing chhuँdaina)
    await sequelize.sync();
    console.log("Models synced");

    // Users table matra alter — bio, location, website columns add hune
    await User.sync({ alter: true });
    console.log("User model updated");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server start error:", error);
  }
};

startServer();