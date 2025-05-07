const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const { authenticate } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");
// Update this line to import the correct object from uploadMiddleware
const { uploadDocument } = require("../middleware/uploadMiddleware");

// Başvuru oluşturma
router.post(
  "/",
  authenticate,
  roleCheck(["aday"]),
  applicationController.createApplication
);

// Adayın kendi başvurularını görüntülemesi
router.get(
  "/my-applications",
  authenticate,
  roleCheck(["aday"]),
  applicationController.getUserApplications
);

// Başvuru detayı getirme
router.get(
  "/:application_id",
  authenticate,
  applicationController.getApplicationById
);

// Başvuruya belge yükleme - Fix here: use uploadDocument instead of upload.single
router.post(
  "/:application_id/documents/:document_id",
  authenticate,
  roleCheck(["aday"]),
  uploadDocument,
  applicationController.uploadApplicationDocument
);

// Başvurunun belgelerini görüntüleme
router.get(
  "/:application_id/documents",
  authenticate,
  applicationController.getApplicationDocuments
);

// Belge silme
router.delete(
  "/:application_id/documents/:document_id",
  authenticate,
  roleCheck(["aday"]),
  applicationController.deleteApplicationDocument
);

// Başvuruyu tamamlama
router.post(
  "/:application_id/submit",
  authenticate,
  roleCheck(["aday"]),
  applicationController.submitApplication
);

// Başvuru durumunu güncelleme (Yönetici)
router.put(
  "/:application_id/status",
  authenticate,
  roleCheck(["admin", "yonetici"]),
  applicationController.updateApplicationStatus
);

// İlana yapılan başvuruları görüntüleme (Yönetici)
router.get(
  "/announcements/:ilan_id",
  authenticate,
  roleCheck(["admin", "yonetici"]),
  applicationController.getAnnouncementApplications
);

// Başvuru istatistiklerini getirme (Yönetici)
router.get(
  "/stats/overview",
  authenticate,
  roleCheck(["admin", "yonetici"]),
  applicationController.getApplicationStats
);

module.exports = router;
