// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");

/**
 * Kendi kullanıcısı veya admin/yönetici kontrolü için middleware
 */
const checkSelfOrAdmin = (req, res, next) => {
  const requestedUserId = req.params.id;
  const loggedInUserId = req.user.user_id;
  const userRole = req.user.role;

  // Kullanıcı kendi bilgilerini değiştiriyorsa veya admin/yönetici ise izin ver
  if (
    requestedUserId == loggedInUserId ||
    ["admin", "yönetici", "manager"].includes(userRole.toLowerCase())
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Bu işlem için yetkiniz bulunmamaktadır.",
  });
};

/**
 * @route   GET /api/users
 * @desc    Get all users (admin/manager only)
 * @access  Private
 */
router.get(
  "/",
  authenticate,
  roleCheck(["admin", "yönetici", "manager"]),
  userController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (authenticated user or admin/manager)
 */
router.get("/:id", authenticate, checkSelfOrAdmin, userController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Create a new user (admin only)
 * @access  Private
 */
router.post("/", authenticate, roleCheck(["admin"]), userController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user information
 * @access  Private (own user or admin)
 */
router.put("/:id", authenticate, checkSelfOrAdmin, userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user (admin only)
 * @access  Private
 */
router.delete(
  "/:id",
  authenticate,
  roleCheck(["admin"]),
  userController.deleteUser
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Change user role
 * @access  Private (admin only)
 */
router.put(
  "/:id/role",
  authenticate,
  roleCheck(["admin"]),
  userController.changeUserRole
);

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (admin only)
 */
router.put(
  "/:id/reset-password",
  authenticate,
  roleCheck(["admin"]),
  userController.resetUserPassword
);

/**
 * @route   PUT /api/users/:id/status
 * @desc    Change user status (active/inactive)
 * @access  Private (admin only)
 */
router.put(
  "/:id/status",
  authenticate,
  roleCheck(["admin"]),
  userController.changeUserStatus
);

module.exports = router;
