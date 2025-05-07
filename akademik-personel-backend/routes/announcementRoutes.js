// routes/announcementRoutes.js
const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");

// Controller fonksiyonlarını içe aktar
const announcementController = require("../controllers/announcementController");

// @route   GET /api/announcements
// @desc    Tüm ilanları getir
// @access  Public
router.get("/", announcementController.getAllAnnouncements);

// @route   GET /api/announcements/active
// @desc    Aktif ilanları getir
// @access  Public
router.get("/active", announcementController.getActiveAnnouncements);

// @route   GET /api/announcements/faculty/:facultyId
// @desc    Fakülteye göre ilanları getir
// @access  Public
router.get(
  "/faculty/:facultyId",
  announcementController.getAnnouncementsByFaculty
);

// @route   GET /api/announcements/position/:positionId
// @desc    Kadroya göre ilanları getir
// @access  Public
router.get(
  "/position/:positionId",
  announcementController.getAnnouncementsByPosition
);

// @route   GET /api/announcements/:id
// @desc    İlan detayını getir
// @access  Public
router.get("/:id", announcementController.getAnnouncementById);

// @route   POST /api/announcements
// @desc    Yeni ilan oluştur
// @access  Private/Admin
router.post(
  "/",
  [
    authenticate,
    roleCheck(["admin"]),
    [
      check("ilan_baslik", "İlan başlığı gereklidir").not().isEmpty(),
      check("ilan_aciklama", "İlan açıklaması gereklidir").not().isEmpty(),
      check("faculty_id", "Fakülte ID gereklidir").isNumeric(),
      check("departman_id", "Departman ID gereklidir").isNumeric(),
      check("kadro_id", "Kadro ID gereklidir").isNumeric(),
      check("baslangic_tarih", "Başlangıç tarihi gereklidir").isDate(),
      check("bitis_tarih", "Bitiş tarihi gereklidir").isDate(),
    ],
  ],
  announcementController.createAnnouncement
);

// @route   PUT /api/announcements/:id
// @desc    İlanı güncelle
// @access  Private/Admin
router.put(
  "/:id",
  [
    authenticate,
    roleCheck(["admin"]),
    [
      check("ilan_baslik", "İlan başlığı gereklidir").not().isEmpty(),
      check("ilan_aciklama", "İlan açıklaması gereklidir").not().isEmpty(),
      check("faculty_id", "Fakülte ID gereklidir").isNumeric(),
      check("departman_id", "Departman ID gereklidir").isNumeric(),
      check("kadro_id", "Kadro ID gereklidir").isNumeric(),
      check("baslangic_tarih", "Başlangıç tarihi gereklidir").isDate(),
      check("bitis_tarih", "Bitiş tarihi gereklidir").isDate(),
    ],
  ],
  announcementController.updateAnnouncement
);

// @route   DELETE /api/announcements/:id
// @desc    İlanı sil
// @access  Private/Admin
router.delete(
  "/:id",
  authenticate,
  roleCheck(["admin"]),
  announcementController.deleteAnnouncement
);

module.exports = router;
