import express from "express";
import cors from "cors";

import routes from "./routes/index.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";

const app = express();

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());

// ================== ROUTES ==================

// public routes
app.use("/api", authRoutes);        // /api/login, /api/register

// protected routes
app.use("/api/user", userRoutes);   // /api/user/profile

// optional test / other routes
app.use("/api", routes);

export default app;
