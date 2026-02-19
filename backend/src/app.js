// src/app.js

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes/index.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";

import placeRoutes from "./routes/place.routes.js";
import { createPlacesTable } from "./models/place.model.js";

const app = express();

// ESModule ma __dirname banauna
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// uploads public (images serve)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// routes (existing)
app.use("/api", authRoutes);      // /api/login, /api/register
app.use("/api/user", userRoutes); // /api/user/profile

// places route MUST be before generic /api routes
app.use("/api/places", placeRoutes);

// keep last
app.use("/api", routes);

// table init
createPlacesTable()
  .then(() => console.log("places table ready"))
  .catch((err) => console.error("places table error:", err.message));

export default app;
