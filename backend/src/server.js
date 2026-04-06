import "dotenv/config";

import app        from "./app.js";
import sequelize  from "./config/db.js";
import "./models/index.js";
import User          from "./models/user.model.js";
import Notification  from "./models/notification.model.js";
import PostReport    from "./models/postreport.model.js";
import Place         from "./models/place.model.js";
import PlaceVisit    from "./models/placevisit.model.js";
import PointsHistory   from "./models/pointshistory.model.js";
import PlatformReward  from "./models/platformreward.model.js";
import RedeemedVoucher from "./models/redeemedvoucher.model.js";

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

    await PostReport.sync({ alter: true });
    console.log("PostReport model updated");

    await Place.sync({ alter: true });
    console.log("Place model updated");

    await PlaceVisit.sync({ alter: true });
    console.log("PlaceVisit model updated");

    await PointsHistory.sync({ alter: true });
    console.log("PointsHistory model updated");

    await PlatformReward.sync({ alter: true });
    console.log("PlatformReward model updated");

    await RedeemedVoucher.sync({ alter: true });
    console.log("RedeemedVoucher model updated");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server start error:", error);
  }
};

startServer();