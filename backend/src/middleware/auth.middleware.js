import jwt from "jsonwebtoken";

/*
  Reads JWT token from Authorization header:
  Authorization: Bearer <token>
  Sets req.user = decoded payload
*/
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const parts = authHeader.split(" ");
  const token = parts.length === 2 ? parts[1] : null;

  if (!token) {
    return res.status(401).json({ message: "Invalid authorization format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/*
  Admin-only middleware.
  Use after authMiddleware.
*/
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  return next();
};

/*
  Optional auth — does NOT block the request if no token.
  Sets req.user if token is valid, otherwise req.user = undefined.
  Use for public routes where logged-in users get extra data (e.g. myRating).
*/
export const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    } catch {}
  }
  return next(); // always continue — guests are fine too
};

// Aliases — placeFeatures.route.js le yei naam use garcha
export const authenticateToken = authMiddleware;
export const requireAdmin      = adminOnly;

export default authMiddleware;