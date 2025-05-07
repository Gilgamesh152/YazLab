// middleware/auth.js
const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");
const pool = require("../config/db");

/**
 * Middleware to verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secretKey);

    // Get user from database (without password)
    const userResult = await pool.query(
      "SELECT user_id, tc_kimlik, ad, soyad, email, telefon, r.role_name as role " +
        "FROM users u " +
        "JOIN roles r ON u.role_id = r.role_id " +
        "WHERE user_id = $1",
      [decoded.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    // Set user info in request
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = { authenticate };
