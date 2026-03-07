import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import placeRoutes from "./routes/place.route.js";
import adminRoutes from "./routes/admin.route.js";
import contactRoutes from "./routes/contact.route.js";
import postRoutes from "./routes/post.route.js";
import postAdminRoutes from "./routes/postadmin.route.js";

import "./models/index.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* AUTH ROUTES */
app.use("/api/auth", authRoutes);

/* OTHER ROUTES */
app.use("/api/user", userRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

/* COMMUNITY POSTS */
app.use("/api/posts", postRoutes);
app.use("/api/admin/posts", postAdminRoutes);

export default app;