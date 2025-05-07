/**
 * validators.js
 * Bu dosya, uygulama genelinde kullanılan doğrulama fonksiyonlarını içerir.
 */

// TC Kimlik numarası doğrulama
const validateTCIdentity = (tcIdentity) => {
  // TC kimlik numarası 11 haneli olmalı ve rakamlardan oluşmalı
  if (!/^\d{11}$/.test(tcIdentity)) {
    return false;
  }

  // Algoritma kontrolü
  let odds = 0;
  let evens = 0;
  let sum = 0;

  for (let i = 0; i < 9; i += 2) {
    odds += parseInt(tcIdentity.charAt(i));
  }

  for (let i = 1; i < 8; i += 2) {
    evens += parseInt(tcIdentity.charAt(i));
  }

  // 10. basamak kontrolü
  const digit10 = (odds * 7 - evens) % 10;
  if (digit10 !== parseInt(tcIdentity.charAt(9))) {
    return false;
  }

  // 11. basamak kontrolü
  for (let i = 0; i < 10; i++) {
    sum += parseInt(tcIdentity.charAt(i));
  }

  const digit11 = sum % 10;
  if (digit11 !== parseInt(tcIdentity.charAt(10))) {
    return false;
  }

  return true;
};

// E-posta doğrulama
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Telefon numarası doğrulama (Türkiye formatı)
const validatePhoneNumber = (phoneNumber) => {
  // 10 haneli, 5 ile başlayan numara (başında 0 olmadan)
  const phoneRegex = /^5[0-9]{9}$/;
  return phoneRegex.test(phoneNumber);
};

// Şifre doğrulama (en az 8 karakter, büyük harf, küçük harf ve rakam içermeli)
const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

// Tarih doğrulama (YYYY-MM-DD formatında)
const validateDate = (dateString) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Dosya tipi doğrulama (PDF, DOC, DOCX, JPG, PNG)
const validateFileType = (fileName) => {
  const allowedExtensions = /(\.pdf|\.doc|\.docx|\.jpg|\.jpeg|\.png)$/i;
  return allowedExtensions.test(fileName);
};

// Dosya boyutu doğrulama (maksimum 10MB)
const validateFileSize = (fileSize) => {
  const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
  return fileSize <= maxSizeInBytes;
};

// Boş değer kontrolü
const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
};

// Sayı kontrolü
const isNumeric = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

// Pozitif sayı kontrolü
const isPositiveNumber = (value) => {
  return isNumeric(value) && parseFloat(value) > 0;
};

// Tarih geçerliliği kontrolü (başlangıç tarihi bitiş tarihinden önce olmalı)
const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};

// İlan başvuru kriterlerinin doğrulanması
const validateAnnouncementCriteria = (criteria) => {
  if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
    return false;
  }

  return criteria.every((criterion) => {
    return (
      isNotEmpty(criterion.criteriaType) && isPositiveNumber(criterion.minPoint)
    );
  });
};

// Başvuru değerlendirme doğrulaması
const validateEvaluation = (evaluation) => {
  if (!evaluation) return false;

  return (
    isNotEmpty(evaluation.juryId) &&
    isNotEmpty(evaluation.applicationId) &&
    isNotEmpty(evaluation.decision) &&
    (evaluation.decision === "olumlu" || evaluation.decision === "olumsuz") &&
    isNotEmpty(evaluation.reportUrl)
  );
};

// QR kod için benzersiz kimlik oluşturma
const generateUniqueId = (length = 10) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = {
  validateTCIdentity,
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateDate,
  validateFileType,
  validateFileSize,
  isNotEmpty,
  isNumeric,
  isPositiveNumber,
  isValidDateRange,
  validateAnnouncementCriteria,
  validateEvaluation,
  generateUniqueId,
};
