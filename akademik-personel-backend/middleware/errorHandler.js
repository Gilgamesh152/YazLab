/**
 * errorHandler.js
 *
 * Global hata işleme middleware'i
 * Uygulamadan gelen tüm hataları yakalayıp formatlar ve istemciye gönderir
 */

const errorHandler = (err, req, res, next) => {
  console.error("Sunucu hatası:", err);

  // Hata kodunu belirle (varsayılan: 500 - Sunucu Hatası)
  const statusCode = err.statusCode || 500;

  // Hata yanıtını hazırla
  const errorResponse = {
    success: false,
    message: err.message || "Sunucu hatası",
    // Üretim modunda stack trace gösterme
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  // Özel hata tiplerini kontrol et
  if (err.name === "ValidationError") {
    // Mongoose validation hatası
    return res.status(400).json({
      success: false,
      message: "Doğrulama hatası",
      errors: Object.values(err.errors).map((val) => val.message),
    });
  }

  if (err.code === 11000) {
    // MongoDB duplicate key hatası
    return res.status(400).json({
      success: false,
      message: "Bu kayıt zaten mevcut",
    });
  }

  // Postgres hata kodlarını kontrol et
  if (err.code === "23505") {
    // Unique constraint violation
    return res.status(400).json({
      success: false,
      message: "Bu kayıt zaten mevcut",
      detail: err.detail,
    });
  }

  // Hata yanıtını döndür
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
