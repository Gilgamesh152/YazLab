const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticate } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");

// Rapor rotaları - Controller fonksiyonlarının doğru isimlerle eşleştiğinden emin olun
router.get(
  "/applications",
  authenticate,
  roleCheck(["yönetici", "admin"]),
  reportController.generateStatisticsReport // Fonksiyon ismi düzeltildi
);

router.get(
  "/applications/by-faculty",
  authenticate,
  roleCheck(["yönetici", "admin"]),
  reportController.generateStatisticsReport // Fonksiyon ismi düzeltildi, parametreler query'de gönderilecek
);

router.get(
  "/applications/by-position",
  authenticate,
  roleCheck(["yönetici", "admin"]),
  reportController.generateStatisticsReport // Fonksiyon ismi düzeltildi, parametreler query'de gönderilecek
);

router.get(
  "/applications/by-status",
  authenticate,
  roleCheck(["yönetici", "admin"]),
  reportController.generateStatisticsReport // Fonksiyon ismi düzeltildi, parametreler query'de gönderilecek
);

// Tablo 5 rotaları
router.get(
  "/generate-table5/:application_id",
  authenticate,
  reportController.generateTablo5 // Fonksiyon ismi düzeltildi
);

router.get(
  "/view-table5/:application_id",
  authenticate,
  reportController.viewTablo5 // Fonksiyon ismi düzeltildi
);

// Jüri raporları ve değerlendirme analizleri
router.get(
  "/jury-analysis",
  authenticate,
  roleCheck(["yönetici"]),
  reportController.getJuryEvaluationAnalysis // Fonksiyon ismi düzeltildi
);

router.get(
  "/position-distribution",
  authenticate,
  roleCheck(["yönetici"]),
  reportController.getAcademicPositionDistribution // Fonksiyon ismi düzeltildi
);

// İstatistik raporları
router.get(
  "/statistics",
  authenticate,
  roleCheck(["yönetici", "admin"]),
  reportController.generateStatisticsReport
);

// Tüm istatistik türlerini tek bir endpoint altında toplayabilirsiniz
// ve query parameter ile türünü belirtebilirsiniz
// Örnek: /api/reports/statistics?report_type=faculty
// Örnek: /api/reports/statistics?report_type=position
// Örnek: /api/reports/statistics?report_type=time

module.exports = router;
