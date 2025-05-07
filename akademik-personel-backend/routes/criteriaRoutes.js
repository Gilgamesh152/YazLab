const express = require("express");
const router = express.Router();
const criteriaController = require("../controllers/criteriaController");
const { authenticate } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");

// Tüm kriterleri getirme
router.get("/", authenticate, criteriaController.getCriteria);

// İlana ait kriterler
router.get(
  "/announcement/:ilan_id",
  authenticate,
  criteriaController.getAnnouncementCriteria
);

// İlana kriter ekleme
router.post(
  "/announcement/:ilan_id",
  authenticate,
  roleCheck(["yonetici", "admin"]),
  criteriaController.createAnnouncementCriteria
);

// Temel kriterler
router.get(
  "/base/:faculty_id/:departman_id/:kadro_id",
  authenticate,
  criteriaController.getBaseCriteria
);

// Temel kriterleri güncelleme
router.put(
  "/base/:faculty_id/:departman_id/:kadro_id",
  authenticate,
  roleCheck(["yonetici", "admin"]),
  criteriaController.updateBaseCriteria
);

// Belge türlerini getirme
router.get(
  "/document-types",
  authenticate,
  criteriaController.getDocumentTypes
);

// Belge kategorisi ekleme
router.post(
  "/document-categories",
  authenticate,
  roleCheck(["yonetici", "admin"]),
  criteriaController.addDocumentCategory
);

// Belge türü ekleme
router.post(
  "/documents",
  authenticate,
  roleCheck(["yonetici", "admin"]),
  criteriaController.addDocumentType
);

module.exports = router;
