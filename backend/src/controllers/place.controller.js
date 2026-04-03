// place.controller.js
// Only handles: request parsing, validation, calling service, sending response.
// Zero business logic here — all logic lives in place.service.js

import * as PlaceService from "../services/place.service.js";

// ── PUBLIC ────────────────────────────────────────────────────────────────────

export const getPlaces = async (req, res) => {
  try {
    const places = await PlaceService.fetchApprovedPlaces();
    res.json({ success: true, data: places });
  } catch (err) {
    console.error("getPlaces error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPlaceById = async (req, res) => {
  try {
    const result = await PlaceService.fetchPlaceById(req.params.id);
    if (result.notFound)
      return res.status(404).json({ success: false, message: "Place not found" });
    res.json({ success: true, data: result.place });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getFeaturedPlaces = async (req, res) => {
  try {
    const places = await PlaceService.fetchFeaturedPlaces();
    res.json({ success: true, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPlaceStats = async (req, res) => {
  try {
    const data = await PlaceService.fetchPlaceStats();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── USER ──────────────────────────────────────────────────────────────────────

export const createPlace = async (req, res) => {
  const { name, address, lat, lng } = req.body;

  if (!name || !name.trim())    return res.status(400).json({ success: false, message: "Name is required" });
  if (!address || !address.trim()) return res.status(400).json({ success: false, message: "Address is required" });
  if (!lat || isNaN(parseFloat(lat))) return res.status(400).json({ success: false, message: "Valid latitude is required" });
  if (!lng || isNaN(parseFloat(lng))) return res.status(400).json({ success: false, message: "Valid longitude is required" });

  try {
    const place = await PlaceService.createPlace({
      ...req.body,
      files:  req.files,   // multiple images from multer
      file:   req.file,    // single image fallback
      userId: req.user.id,
    });
    res.status(201).json({ success: true, data: place });
  } catch (err) {
    console.error("createPlace error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updatePlace = async (req, res) => {
  const { lat, lng } = req.body;

  if (lat && isNaN(parseFloat(lat))) // only validate if provided — partial update allowed
    return res.status(400).json({ success: false, message: "Invalid latitude" });
  if (lng && isNaN(parseFloat(lng)))
    return res.status(400).json({ success: false, message: "Invalid longitude" });

  try {
    const result = await PlaceService.updateUserPlace({
      placeId: req.params.id,
      userId:  req.user.id,
      fields:  req.body,
      file:    req.file,
    });
    if (result.notFound)
      return res.status(403).json({ success: false, message: "Place not found or you are not the owner" });
    res.json({ success: true, data: result.place });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deletePlace = async (req, res) => {
  try {
    const result = await PlaceService.deleteUserPlace({
      placeId: req.params.id,
      userId:  req.user.id,
    });
    if (result.notFound)
      return res.status(403).json({ success: false, message: "Place not found or you are not the owner" });
    res.json({ success: true, message: "Place deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const reportPlace = async (req, res) => {
  const { reason, note } = req.body;

  if (!reason?.trim()) // reason tells admin why it was reported
    return res.status(400).json({ success: false, message: "Report reason is required" });

  try {
    const result = await PlaceService.reportPlace({
      placeId: req.params.id,
      userId:  req.user.id,
      reason,
      note,
    });
    if (result.notFound)        return res.status(404).json({ success: false, message: "Place not found" });
    if (result.alreadyReported) return res.status(409).json({ success: false, message: "You have already reported this place" });

    res.json({ success: true, message: "Report submitted successfully" });
  } catch (err) {
    console.error("reportPlace error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};