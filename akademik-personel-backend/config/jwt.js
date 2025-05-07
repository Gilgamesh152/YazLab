/**
 * jwt.js
 *
 * JWT (JSON Web Token) yapılandırma dosyası
 * Token oluşturma, doğrulama ve yenileme ile ilgili ayarları içerir
 */

// Ortam değişkenlerinden JWT ayarlarını al veya varsayılan değerleri kullan
const jwtConfig = {
  // JWT imzalama anahtarı
  secretKey: process.env.JWT_SECRET_KEY || "akademik-basvuru-gizli-anahtar",

  // Token geçerlilik süresi
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",

  // Şifre sıfırlama token'ı için ayrı bir anahtar
  resetPasswordSecretKey:
    process.env.JWT_RESET_PASSWORD_SECRET_KEY ||
    "sifre-sifirlama-gizli-anahtar",

  // Şifre sıfırlama token'ı geçerlilik süresi
  resetPasswordExpiresIn: process.env.JWT_RESET_PASSWORD_EXPIRES_IN || "1h",

  // Token yenileme için ayrı bir anahtar (opsiyonel)
  refreshSecretKey:
    process.env.JWT_REFRESH_SECRET_KEY || "yenileme-gizli-anahtar",

  // Yenileme token'ı geçerlilik süresi
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // Token'ı cookie olarak gönderme ayarları
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 saat (milisaniye cinsinden)
  },

  // Hata mesajları
  errors: {
    tokenMissing: "Token gereklidir",
    tokenInvalid: "Geçersiz token",
    tokenExpired: "Token süresi doldu",
    accessDenied: "Erişim reddedildi",
  },
};

module.exports = jwtConfig;
