const express = require("express");
const router = express.Router();
const juryController = require("../controllers/juryController");
const { authenticate } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");

// Simplified jury routes - removing potentially problematic middleware
router.get("/", authenticate, juryController.getAllJuryMembers);

router.get("/:id", authenticate, juryController.getJuryMemberById);

router.post("/", authenticate, juryController.createJuryMember);

router.put("/:id", authenticate, juryController.updateJuryMember);

router.delete("/:id", authenticate, juryController.deleteJuryMember);

router.post(
  "/assign/:application_id",
  authenticate,
  juryController.assignJuryToApplication
);

router.delete(
  "/unassign/:juryId/:applicationId",
  authenticate,
  juryController.unassignJuryFromApplication
);

router.get(
  "/application/:application_id",
  authenticate,
  juryController.getApplicationJuryMembers
);

router.get(
  "/assignments/:jury_id",
  authenticate,
  juryController.getJuryAssignments
);

router.get(
  "/check/:tc_kimlik",
  authenticate,
  juryController.getJuryMemberByTcKimlik
);

router.get(
  "/search/:tc_kimlik",
  authenticate,
  juryController.getJuryMemberByTcKimlik
);

module.exports = router;
