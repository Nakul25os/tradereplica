const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

const extractToken = (req) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.replace("Bearer ", "").trim();
};

const loadUserFromToken = async (req, res, next, required) => {
  const token = extractToken(req);

  if (!token) {
    if (required) {
      return res.status(401).json({ message: "Authentication required." });
    }

    return next();
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);

    if (!user) {
      if (!required) {
        req.user = null;
        return next();
      }

      return res.status(401).json({ message: "Session is no longer valid." });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (!required) {
      req.user = null;
      return next();
    }

    if (required) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
  }
};

const requireAuth = (req, res, next) =>
  loadUserFromToken(req, res, next, true);

const optionalAuth = (req, res, next) =>
  loadUserFromToken(req, res, next, false);

module.exports = {
  requireAuth,
  optionalAuth,
};
