import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import placeRoutes from "./routes/place.route.js";
import placeFeaturesRoutes from "./routes/placeFeatures.route.js";
import adminRoutes from "./routes/admin.route.js";
import contactRoutes from "./routes/contact.route.js";
import postRoutes from "./routes/post.route.js";
import postAdminRoutes from "./routes/postadmin.route.js";

import "./models/index.js";
import "./config/passport.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin like Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* AUTH */
app.use("/api/auth", authRoutes);

/* PLACES */
app.use("/api/places", placeRoutes);
app.use("/api/places", placeFeaturesRoutes);

/* OTHER */
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

/* COMMUNITY */
app.use("/api/posts", postRoutes);
app.use("/api/admin/posts", postAdminRoutes);

export default app;