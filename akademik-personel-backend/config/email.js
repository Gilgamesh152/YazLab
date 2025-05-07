/**
 * email.js
 *
 * E-posta servisinin yapılandırması
 * Nodemailer için gerekli ayarları içerir
 */

// Ortam değişkenlerinden e-posta ayarlarını al veya varsayılan değerleri kullan
const emailConfig = {
  // SMTP sunucu ayarları
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587", 10),
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports

  // Kimlik doğrulama ayarları
  auth: {
    user: process.env.EMAIL_USER || "akademik.basvuru@kocaeli.edu.tr",
    pass: process.env.EMAIL_PASSWORD || "your-email-password",
  },

  // Gönderici bilgileri
  from: {
    name:
      process.env.EMAIL_FROM_NAME ||
      "Kocaeli Üniversitesi Akademik Başvuru Sistemi",
    address:
      process.env.EMAIL_FROM_ADDRESS || "akademik.basvuru@kocaeli.edu.tr",
  },

  // Uygulama adı - e-posta şablonlarında kullanılabilir
  appName: "Akademik Personel Başvuru Sistemi",

  // E-posta gönderme limitleri
  rateLimits: {
    maxConnections: 5,
    maxMessages: 100, // Bir bağlantı başına maksimum mesaj sayısı
  },

  // Hata mesajları
  errorMessages: {
    invalidRecipient: "Geçersiz alıcı e-posta adresi",
    sendFailed: "E-posta gönderimi başarısız oldu",
    templateNotFound: "E-posta şablonu bulunamadı",
  },
};

module.exports = emailConfig;
