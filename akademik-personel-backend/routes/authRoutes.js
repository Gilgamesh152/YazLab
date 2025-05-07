/**
 * authRoutes.js
 *
 * Kimlik doğrulama için API rotalarını tanımlar
 * Giriş, kayıt, şifre sıfırlama işlemleri için endpoint'leri içerir
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  validateLogin,
  validateRegister,
  validatePasswordReset,
} = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");

// Kullanıcı kaydı
router.post("/register", validateRegister, authController.register);

// Kullanıcı girişi
router.post("/login", validateLogin, authController.login);

// Kullanıcı çıkışı
router.post("/logout", authenticate, authController.logout);

// Token doğrulama (oturum kontrolü)
router.get("/verify-token", authenticate, authController.verifyToken);

// Şifre sıfırlama isteği
router.post("/forgot-password", authController.forgotPassword);

// Şifre sıfırlama
router.post(
  "/reset-password",
  validatePasswordReset,
  authController.resetPassword
);

// TC Kimlik No doğrulama
router.post("/verify-tc", authController.verifyTCKimlik);

// Kullanıcı bilgilerini getir
router.get("/me", authenticate, authController.getUserInfo);

// Kullanıcı bilgilerini güncelle
router.put("/me", authenticate, authController.updateUserInfo);

module.exports = router;
