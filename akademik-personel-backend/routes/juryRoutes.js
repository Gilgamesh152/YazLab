const express = require("express");
const router = express.Router();
const juryController = require("../controllers/juryController");
const { authenticate } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");

// Tüm jüri üyelerini getir
router.get(
  "/",
  authenticate,
  roleCheck(["admin", "yonetici"]), // Yetkilendirme eklendi
  juryController.getAllJuryMembers
);

// Jüri üyesi detayını getir
router.get(
  "/:id",
  authenticate,
  roleCheck(["admin", "yonetici", "juri"]), // Yetkilendirme eklendi
  juryController.getJuryMemberById
);

// Yeni jüri üyesi ekle
router.post(
  "/",
  authenticate,
  roleCheck(["admin", "yonetici"]), // Yetkilendirme eklendi
  juryController.createJuryMember
);

// Jüri üyesini güncelle
router.put(
  "/:id",
  authenticate,
  roleCheck(["admin", "yonetici"]), // Yetkilendirme eklendi
  juryController.updateJuryMember
);

// Jüri üyesini sil
router.delete(
  "/:id",
  authenticate,
  roleCheck(["admin", "yonetici"]), // Yetkilendirme eklendi
  juryController.deleteJuryMember
);

// Başvuruya jüri üyesi ata
router.post(
  "/assign/:application_id",
  authenticate,
  roleCheck(["admin", "yonetici"]), // Yetkilendirme eklendi
  juryController.assignJuryToApplication
);

// Jüri üyesini başvurudan kaldır
router.delete(
  "/unassign/:juryId/:applicationId",
  authenticate,
  roleCheck(["admin", "yonetici"]), // Yetkilendirme eklendi
  juryController.unassignJuryFromApplication
);

// Başvuruya atanan jüri üyelerini getir
router.get(
  "/application/:application_id",
  authenticate,
  juryController.getApplicationJuryMembers
);

// Jüri üyesinin atandığı başvuruları getir
router.get(
  "/assignments/:jury_id",
  authenticate,
  juryController.getJuryAssignments
);

// TC Kimlik numarasına göre jüri üyesi getir
router.get(
  "/check/:tc_kimlik",
  authenticate,
  roleCheck(["admin", "yonetici"]), // Yetkilendirme eklendi
  juryController.getJuryMemberByTcKimlik
);

module.exports = router;
