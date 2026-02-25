import { Router } from "express";
import { geocodeSearch } from "../controllers/geocode.controller.js";

const router = Router();

// Public endpoint
// Example: GET /api/geocode?q=Mustang
router.get("/", geocodeSearch);

export default router;