// ================================================================
// controllers/place.controller.js
// ================================================================
// Controller = route bata request auxa, model call garxa,
//              response (JSON) pathauxa
//
// Flow:
// Frontend --> Route --> Controller --> Model --> PostgreSQL DB
// PostgreSQL DB --> Model --> Controller --> Frontend (JSON)
// ================================================================

import * as PlaceModel from "../models/place.model.js";

// ----------------------------------------------------------------
// 1. GET ALL PLACES
// ----------------------------------------------------------------
// Route:  GET /api/places
// Access: Public -- token chainaa
// Kaam:   Sabai places list garera pathauxa (explore map ko lagi)

export const getPlaces = async (req, res) => {
  try {
    const places = await PlaceModel.getAllPlaces();
    res.json({ success: true, data: places });
  } catch (err) {
    console.error("getPlaces error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------------------------------------------
// 2. GET SINGLE PLACE BY ID
// ----------------------------------------------------------------
// Route:  GET /api/places/:id   eg: /api/places/3
// Access: Public
// Kaam:   URL bata id liyera tyo ek ota place matra pathauxa

export const getPlaceById = async (req, res) => {
  try {
    const place = await PlaceModel.getPlaceById(req.params.id);
    // req.params.id = URL ko :id part -- eg: /api/places/3 bhaye id = "3"

    if (!place) {
      return res.status(404).json({ success: false, message: "Place feuna" });
    }

    res.json({ success: true, data: place });
  } catch (err) {
    console.error("getPlaceById error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------------------------------------------
// 3. GET FEATURED PLACES
// ----------------------------------------------------------------
// Route:  GET /api/places/featured
// Access: Public
// Kaam:   Home page ko lagi top 6 places pathauxa

export const getFeaturedPlaces = async (req, res) => {
  try {
    const places = await PlaceModel.getFeaturedPlaces();
    res.json({ success: true, data: places });
  } catch (err) {
    console.error("getFeaturedPlaces error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------------------------------------------
// 4. GET STATS / COUNTS
// ----------------------------------------------------------------
// Route:  GET /api/places/stats
// Access: Public
// Kaam:   Home page ma dekhauney numbers pathauxa
// Return: { total: 12, verified: 5, users: 30 }

export const getPlaceStats = async (req, res) => {
  try {
    const stats = await PlaceModel.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("getPlaceStats error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------------------------------------------
// 5. CREATE NEW PLACE
// ----------------------------------------------------------------
// Route:  POST /api/places
// Access: Protected -- JWT token chainxa
// Kaam:   Form data + image liyera DB ma save garxa
//
// Frontend ley multipart/form-data pathauxa:
//   text fields: name, address, description, category, lat, lng
//   file field:  image (jpeg/png/webp max 5MB)

export const createPlace = async (req, res) => {
  try {
    const { name, address, description, category, lat, lng } = req.body;
    // req.body  = form ko text fields
    // req.file  = multer ley process gareko image file

    // required fields check
    if (!name || !address || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "name, address, lat, lng chainxa",
      });
    }

    // image path set gara
    // req.file aayo = user ley image upload garyo -> path save garxa
    // req.file naaayo = image upload garena -> null rakhxa
    const image = req.file ? `/uploads/places/${req.file.filename}` : null;
    // frontend ley yo path use garxa image dekhaunn:
    // http://localhost:5001/uploads/places/filename.jpg

    // req.user.id = auth middleware ley JWT decode garera set gareko
    const place = await PlaceModel.insertPlace({
      name,
      address,
      description: description || "",
      category:    category    || null,
      lat:         parseFloat(lat),  // string -> number
      lng:         parseFloat(lng),
      image,
      created_by: req.user.id,
    });

    res.status(201).json({ success: true, data: place });
    // 201 = "Created" HTTP status
  } catch (err) {
    console.error("createPlace error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------------------------------------------
// 6. UPDATE PLACE
// ----------------------------------------------------------------
// Route:  PUT /api/places/:id
// Access: Protected + sirf owner ley garna sakxa
// Kaam:   Place details update garxa
//         Model ma created_by check hunxa -- arko ko update garna milena

export const updatePlace = async (req, res) => {
  try {
    const { name, address, description, category, lat, lng } = req.body;

    const fields = { name, address, description, category, lat, lng };

    // naya image aayo bhane path thap, naraye existing image change hudaina
    if (req.file) {
      fields.image = `/uploads/places/${req.file.filename}`;
    }

    const affected = await PlaceModel.updatePlace(req.params.id, req.user.id, fields);

    if (affected === 0) {
      return res.status(403).json({
        success: false,
        message: "Place feuna ya timi owner hoina",
        // 403 = Forbidden
      });
    }

    const updated = await PlaceModel.getPlaceById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updatePlace error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------------------------------------------
// 7. DELETE PLACE
// ----------------------------------------------------------------
// Route:  DELETE /api/places/:id
// Access: Protected + sirf owner ley garna sakxa

export const deletePlace = async (req, res) => {
  try {
    const affected = await PlaceModel.deletePlace(req.params.id, req.user.id);

    if (affected === 0) {
      return res.status(403).json({
        success: false,
        message: "Place feuna ya timi owner hoina",
      });
    }

    res.json({ success: true, message: "Place delete vayo" });
  } catch (err) {
    console.error("deletePlace error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};