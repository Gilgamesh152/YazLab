const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");

// Bildirim rotaları - Controller fonksiyon isimleri düzeltildi
router.get("/", authenticate, notificationController.getUserNotifications);

router.get(
  "/unread-count",
  authenticate,
  notificationController.getUnreadNotificationCount
);

router.get(
  "/unread",
  authenticate,
  notificationController.getUnreadNotifications
);

router.put(
  "/:notification_id/read",
  authenticate,
  notificationController.markNotificationAsRead
);

router.put(
  "/read-all",
  authenticate,
  notificationController.markAllAsRead // Fonksiyon ismi düzeltildi
);

// Bildirim gönderme rotaları
router.post(
  "/create",
  authenticate,
  roleCheck(["admin", "yonetici"]), // "yönetici" yerine "yonetici" kullandık
  notificationController.createNotification
);

router.post(
  "/send-bulk",
  authenticate,
  roleCheck(["admin", "yonetici"]), // "yönetici" yerine "yonetici" kullandık
  notificationController.sendBulkNotification
);

module.exports = router;
