import { Router } from "express";
import authRoutes from "./auth.route.js";
import userRoutes from "./user.route.js";
import geocodeRoutes from "./geocode.route.js"; // Location search route

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/geocode", geocodeRoutes); 

export default router;
