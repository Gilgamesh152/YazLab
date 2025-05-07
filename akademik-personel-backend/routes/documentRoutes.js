const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");
const { authenticate } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");

// Belge tipleri rotaları
router.get("/", authenticate, documentController.getAllDocuments);

// Belge kategorileri rotaları - doğru sıralamada eklendi
router.get("/categories", authenticate, documentController.getAllCategories);

router.get("/categories/:id", authenticate, documentController.getCategoryById);

// Belge kategorisine göre belgeler
router.get(
  "/by-category/:categoryId",
  authenticate,
  documentController.getDocumentsByCategory
);

// Belge detayını getir
router.get("/:id", authenticate, documentController.getDocumentById);

// Belge güncelle
router.put(
  "/:id",
  authenticate,
  roleCheck(["admin", "yonetici"]), // "yönetici" yerine "yonetici" kullandık
  documentController.updateDocument
);

// Belge sil
router.delete(
  "/:id",
  authenticate,
  roleCheck(["admin", "yonetici"]), // "yönetici" yerine "yonetici" kullandık
  documentController.deleteDocument
);

// Kategori güncelle
router.put(
  "/categories/:id",
  authenticate,
  roleCheck(["admin", "yonetici"]), // "yönetici" yerine "yonetici" kullandık
  documentController.updateCategory
);

// Kategori sil
router.delete(
  "/categories/:id",
  authenticate,
  roleCheck(["admin", "yonetici"]), // "yönetici" yerine "yonetici" kullandık
  documentController.deleteCategory
);

// Belge puanları rotaları
router.put(
  "/:id/points",
  authenticate,
  roleCheck(["admin", "yonetici"]), // "yönetici" yerine "yonetici" kullandık
  documentController.updateDocumentPoints
);

// Belge doğrulama rotaları
router.put(
  "/verify/:id",
  authenticate,
  roleCheck(["admin", "yonetici"]), // "yönetici" yerine "yonetici" kullandık
  documentController.verifyDocument
);

// Belge görüntüleme
router.get("/view/:document_id", authenticate, documentController.viewDocument);

module.exports = router;
