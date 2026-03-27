import express from "express";
import axios from "axios";
import authMiddleware from "../middleware/auth.middleware.js";
import Place from "../models/place.model.js";
import { Op } from "sequelize";

const router = express.Router();
const AI_URL = process.env.AI_API_URL || "http://127.0.0.1:8000";

// Helper — enrich AI results with DB images
async function enrichWithDB(aiList) {
  return Promise.all(
    aiList.map(async (item) => {
      if (!item?.id) return null;
      const match = await Place.findOne({
        where: { id: item.id, status: "approved" },
        attributes: ["id", "name", "address", "image", "category", "lat", "lng"],
      });
      return {
        id:               match?.id       || item.id,
        name:             match?.name     || item.name,
        address:          match?.address  || item.address,
        image:            match?.image    || null,
        category:         match?.category || item.category,
        lat:              match?.lat      || item.latitude,
        lng:              match?.lng      || item.longitude,
        similarity_score: item.similarity_score || null,
        distance_km:      item.distance_km      || null,
        tags:             item.tags             || [],
        in_lokally:       !!match,
        source:           item.source || "ai_knn",
      };
    })
  ).then(list => list.filter(Boolean));
}

// ── 1. AI SEARCH — name/tag/category bata ────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { place_name, limit = 6 } = req.query;
    if (!place_name)
      return res.status(400).json({ success: false, message: "place_name required" });

    const n = parseInt(limit);
    let aiList = [];

    try {
      const aiRes = await axios.get(`${AI_URL}/recommend`, {
        params: { place_name, n },
        timeout: 8000,
      });
      if (Array.isArray(aiRes.data)) aiList = aiRes.data;
    } catch (_) {
      console.log("[AI] FastAPI unavailable, using DB fallback");
    }

    if (aiList.length > 0) {
      const enriched = await enrichWithDB(aiList);
      return res.json({ success: true, source: "ai_knn", data: enriched });
    }

    // DB fallback
    const searched = await Place.findOne({
      where: {
        [Op.or]: [
          { name:     { [Op.iLike]: `%${place_name}%` } },
          { address:  { [Op.iLike]: `%${place_name}%` } },
          { category: { [Op.iLike]: `%${place_name}%` } },
        ],
        status: "approved",
      },
    });

    if (!searched) return res.json({ success: true, data: [] });

    const similar = await Place.findAll({
      where: {
        category: searched.category,
        status:   "approved",
        id:       { [Op.ne]: searched.id },
      },
      limit: n - 1,
      order: [["created_at", "DESC"]],
    });

    return res.json({
      success: true,
      source: "db_fallback",
      data: [searched, ...similar].map(p => ({
        id: p.id, name: p.name, address: p.address,
        image: p.image, category: p.category,
        lat: p.lat, lng: p.lng,
        in_lokally: true, source: "db_fallback",
      })),
    });
  } catch (err) {
    console.error("Recommendation error:", err.message);
    return res.status(500).json({ success: false, message: "Recommendation failed" });
  }
});

// ── 2. NEARBY — 15km radius, same locality ───────────────────
router.get("/nearby", authMiddleware, async (req, res) => {
  try {
    const { place_name, place_id, radius_km = 15, limit = 8 } = req.query;

    let searchedPlace = null;
    if (place_id) {
      searchedPlace = await Place.findByPk(parseInt(place_id), {
        attributes: ["id", "name", "lat", "lng", "category"],
      });
    } else if (place_name) {
      searchedPlace = await Place.findOne({
        where: {
          [Op.or]: [
            { name:    { [Op.iLike]: `%${place_name}%` } },
            { address: { [Op.iLike]: `%${place_name}%` } },
          ],
          status: "approved",
        },
        attributes: ["id", "name", "lat", "lng", "category"],
      });
    }

    if (!searchedPlace || !searchedPlace.lat || !searchedPlace.lng) {
      return res.json({ success: true, data: [], searched_place: null });
    }

    const lat = parseFloat(searchedPlace.lat);
    const lng = parseFloat(searchedPlace.lng);
    const n   = parseInt(limit);
    const r   = parseFloat(radius_km);

    // Try FastAPI nearby
    let aiList = [];
    try {
      const aiRes = await axios.get(`${AI_URL}/nearby`, {
        params: { lat, lng, radius_km: r, exclude_id: searchedPlace.id, n },
        timeout: 8000,
      });
      if (Array.isArray(aiRes.data)) aiList = aiRes.data;
    } catch (_) {}

    if (aiList.length > 0) {
      const enriched = await enrichWithDB(aiList);
      return res.json({
        success: true,
        source: "ai_nearby",
        searched_place: { name: searchedPlace.name, lat, lng },
        data: enriched,
      });
    }

    // DB fallback — raw SQL haversine
    const [results] = await Place.sequelize.query(`
      SELECT
        p.id, p.name, p.address, p.image, p.category, p.lat, p.lng,
        ROUND(
          (6371 * acos(
            cos(radians(:lat)) * cos(radians(p.lat)) *
            cos(radians(p.lng) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(p.lat))
          ))::numeric, 1
        ) AS distance_km
      FROM places p
      WHERE p.status = 'approved'
        AND p.id != :excludeId
        AND p.lat IS NOT NULL
        AND p.lng IS NOT NULL
        AND (6371 * acos(
          cos(radians(:lat)) * cos(radians(p.lat)) *
          cos(radians(p.lng) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(p.lat))
        )) <= :radius
      ORDER BY distance_km ASC
      LIMIT :limit
    `, {
      replacements: { lat, lng, excludeId: searchedPlace.id, radius: r, limit: n },
    });

    return res.json({
      success: true,
      source: "db_nearby",
      searched_place: { name: searchedPlace.name, lat, lng },
      data: results.map(p => ({
        id: p.id, name: p.name, address: p.address,
        image: p.image, category: p.category,
        lat: p.lat, lng: p.lng,
        distance_km: p.distance_km,
        source: "db_nearby",
      })),
    });
  } catch (err) {
    console.error("Nearby error:", err.message);
    return res.status(500).json({ success: false, message: "Nearby failed" });
  }
});

// ── 3. NEAR ME — user current location bata 30km ─────────────
router.get("/near-me", authMiddleware, async (req, res) => {
  try {
    const { lat, lng, radius_km = 30, limit = 8 } = req.query;

    if (!lat || !lng)
      return res.status(400).json({ success: false, message: "lat, lng required" });

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const n       = parseInt(limit);
    const r       = parseFloat(radius_km);

    let aiList = [];
    try {
      const aiRes = await axios.get(`${AI_URL}/near-me`, {
        params: { lat: userLat, lng: userLng, radius_km: r, n },
        timeout: 8000,
      });
      if (Array.isArray(aiRes.data)) aiList = aiRes.data;
    } catch (_) {}

    if (aiList.length > 0) {
      const enriched = await enrichWithDB(aiList);
      return res.json({ success: true, source: "ai_near_me", data: enriched });
    }

    // DB fallback
    const [results] = await Place.sequelize.query(`
      SELECT
        p.id, p.name, p.address, p.image, p.category, p.lat, p.lng,
        ROUND(
          (6371 * acos(
            cos(radians(:lat)) * cos(radians(p.lat)) *
            cos(radians(p.lng) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(p.lat))
          ))::numeric, 1
        ) AS distance_km
      FROM places p
      WHERE p.status = 'approved'
        AND p.lat IS NOT NULL
        AND p.lng IS NOT NULL
        AND (6371 * acos(
          cos(radians(:lat)) * cos(radians(p.lat)) *
          cos(radians(p.lng) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(p.lat))
        )) <= :radius
      ORDER BY distance_km ASC
      LIMIT :limit
    `, {
      replacements: { lat: userLat, lng: userLng, radius: r, limit: n },
    });

    return res.json({
      success: true,
      source: "db_near_me",
      data: results.map(p => ({
        id: p.id, name: p.name, address: p.address,
        image: p.image, category: p.category,
        lat: p.lat, lng: p.lng,
        distance_km: p.distance_km,
        source: "db_near_me",
      })),
    });
  } catch (err) {
    console.error("Near me error:", err.message);
    return res.status(500).json({ success: false, message: "Near me failed" });
  }
});

// ── 4. SIMILAR BY ID — place detail page ─────────────────────
router.get("/similar/:id", authMiddleware, async (req, res) => {
  try {
    const placeId = parseInt(req.params.id);
    const n       = parseInt(req.query.limit || "5");
    let aiList    = [];

    try {
      const aiRes = await axios.get(`${AI_URL}/recommend-by-id`, {
        params: { place_id: placeId, n },
        timeout: 8000,
      });
      if (Array.isArray(aiRes.data)) aiList = aiRes.data;
    } catch (_) {}

    if (aiList.length > 0) {
      const enriched = await enrichWithDB(aiList);
      return res.json({ success: true, data: enriched });
    }

    const current = await Place.findByPk(placeId);
    if (!current) return res.json({ success: true, data: [] });

    const similar = await Place.findAll({
      where: {
        category: current.category,
        status:   "approved",
        id:       { [Op.ne]: placeId },
      },
      limit: n,
      order: [["is_featured", "DESC"], ["created_at", "DESC"]],
    });

    return res.json({
      success: true,
      data: similar.map(p => ({
        id: p.id, name: p.name, address: p.address,
        image: p.image, category: p.category,
        lat: p.lat, lng: p.lng,
        source: "db_fallback",
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;