import axios from "axios";

// This controller searches a location name (e.g. "Mustang") and returns lat/lng
export const geocodeSearch = async (req, res) => {
  try {
    // Read query from URL: /api/geocode?q=Mustang
    const q = String(req.query.q || "").trim();

    // If user did not send query, return 400
    if (!q) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }

    // Call OpenStreetMap Nominatim API to get coordinates
    const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        format: "json",
        q,
        limit: 6,            // return max 6 results
        addressdetails: 1,
      },
      headers: {
        "Accept-Language": "en",
        // Nominatim requires User-Agent header for identification
        "User-Agent": "lokally-nepal/1.0 (geocode)",
      },
      timeout: 8000,
    });

    // Convert API response to clean format for frontend
    const results = (data || []).map((r) => ({
      display_name: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      type: r.type,
    }));

    // Send results back to frontend
    return res.json({ success: true, data: results });
  } catch (err) {
    console.error("geocodeSearch error:", err?.message);

    // If anything fails (network, API down), return server error
    return res.status(500).json({ success: false, message: "Geocoding failed" });
  }
};