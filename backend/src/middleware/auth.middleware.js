import jwt from "jsonwebtoken";

/*
  JWT auth middleware
  Header format: Authorization: Bearer <token>
  Sets req.user = decoded payload
*/
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Invalid authorization format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/*
  Admin-only middleware
  Use after authMiddleware
*/
export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  return next();
}

/*
  Default export for old imports (backward compatible)
*/
export default authMiddleware;