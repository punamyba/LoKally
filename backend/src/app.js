import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { syncDB } from "./models/db.sync.js";   

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import placeRoutes from "./routes/place.route.js";
import adminRoutes from "./routes/admin.route.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/admin", adminRoutes);

// DB connect + model sync
syncDB();   //  replaces createPlacesTable()

export default app;