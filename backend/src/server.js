import "dotenv/config";

import app from "./app.js";
import sequelize from "./config/db.js";
import "./models/index.js";
import User from "./models/user.model.js";
import Notification from "./models/notification.model.js";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected");

    await sequelize.sync();
    console.log("Models synced");

    await User.sync({ alter: true });
    console.log("User model updated");

    await Notification.sync({ alter: true });
    console.log("Notification model updated");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server start error:", error);
  }
};

startServer();