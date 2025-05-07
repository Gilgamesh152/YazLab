// evaluationRoutes.js düzeltme
const express = require("express");
const router = express.Router();
const evaluationController = require("../controllers/evaluationController");
const { authenticate } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");
const { uploadDocument } = require("../middleware/uploadMiddleware");
const { validateEvaluation } = require("../middleware/validate");

// Değerlendirme rotaları
router.get(
  "/application/:application_id",
  authenticate,
  evaluationController.getApplicationEvaluations
);

router.get("/:id", authenticate, evaluationController.getEvaluationReport);

router.post(
  "/application/:application_id",
  authenticate,
  roleCheck(["juri"]), // "jüri üyesi" yerine "juri" kullandık
  validateEvaluation,
  uploadDocument, // uploadMiddleware.single("report") yerine uploadDocument kullandık
  evaluationController.createUpdateEvaluation
);

router.delete(
  "/:id",
  authenticate,
  roleCheck(["juri", "yonetici", "admin"]), // roller düzeltildi
  evaluationController.deleteEvaluation
);

// Jüri raporları
router.get(
  "/:id/report",
  authenticate,
  evaluationController.getEvaluationReport
);

// Jüri bazında değerlendirmeler
router.get(
  "/jury/:juryId",
  authenticate,
  evaluationController.getJuryEvaluations
);

// Yönetici nihai kararı
router.post(
  "/application/:applicationId/final-decision",
  authenticate,
  roleCheck(["yonetici", "admin"]), // "yönetici" yerine "yonetici" kullandık
  evaluationController.submitFinalDecision
);

module.exports = router;
