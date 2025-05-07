/**
 * formatters.js
 *
 * Veri biçimlendirme yardımcı fonksiyonları
 */

/**
 * Tarih biçimlendirme
 * @param {string|Date} date - Biçimlendirilecek tarih
 * @param {Object} options - Biçimlendirme seçenekleri
 * @returns {string} - Biçimlendirilmiş tarih
 */
const formatDate = (date, options = {}) => {
  if (!date) return "";

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return "";
  }

  const defaultOptions = {
    format: "full", // 'full', 'short', 'time', 'datetime', 'sqlDate'
    locale: "tr-TR",
  };

  const opts = { ...defaultOptions, ...options };

  try {
    switch (opts.format) {
      case "full":
        return dateObj.toLocaleDateString(opts.locale, {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

      case "short":
        return dateObj.toLocaleDateString(opts.locale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

      case "time":
        return dateObj.toLocaleTimeString(opts.locale, {
          hour: "2-digit",
          minute: "2-digit",
        });

      case "datetime":
        return dateObj.toLocaleDateString(opts.locale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

      case "sqlDate":
        return dateObj.toISOString().split("T")[0];

      default:
        return dateObj.toLocaleString(opts.locale);
    }
  } catch (error) {
    console.error("Tarih biçimlendirme hatası:", error);

    // Hata durumunda basit ISO formatlı tarih dön
    return dateObj.toISOString().replace("T", " ").substring(0, 19);
  }
};

/**
 * Para birimi biçimlendirme
 * @param {number} amount - Biçimlendirilecek miktar
 * @param {Object} options - Biçimlendirme seçenekleri
 * @returns {string} - Biçimlendirilmiş para birimi
 */
const formatCurrency = (amount, options = {}) => {
  if (amount === undefined || amount === null) return "";

  const defaultOptions = {
    currency: "TRY",
    locale: "tr-TR",
  };

  const opts = { ...defaultOptions, ...options };

  try {
    return new Intl.NumberFormat(opts.locale, {
      style: "currency",
      currency: opts.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error("Para birimi biçimlendirme hatası:", error);

    // Hata durumunda basit biçimlendirme
    return `${amount.toFixed(2)} ${opts.currency}`;
  }
};

/**
 * Sayı biçimlendirme
 * @param {number} number - Biçimlendirilecek sayı
 * @param {Object} options - Biçimlendirme seçenekleri
 * @returns {string} - Biçimlendirilmiş sayı
 */
const formatNumber = (number, options = {}) => {
  if (number === undefined || number === null) return "";

  const defaultOptions = {
    decimalPlaces: 2,
    locale: "tr-TR",
    compact: false,
  };

  const opts = { ...defaultOptions, ...options };

  try {
    const formatOptions = {
      minimumFractionDigits: opts.decimalPlaces,
      maximumFractionDigits: opts.decimalPlaces,
    };

    if (opts.compact) {
      formatOptions.notation = "compact";
      formatOptions.compactDisplay = "short";
    }

    return new Intl.NumberFormat(opts.locale, formatOptions).format(number);
  } catch (error) {
    console.error("Sayı biçimlendirme hatası:", error);

    // Hata durumunda basit biçimlendirme
    return number.toFixed(opts.decimalPlaces);
  }
};

/**
 * Telefon numarası biçimlendirme
 * @param {string} phoneNumber - Biçimlendirilecek telefon numarası
 * @returns {string} - Biçimlendirilmiş telefon numarası
 */
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";

  // Sadece rakamları al
  const digitsOnly = phoneNumber.replace(/\D/g, "");

  // Türkiye telefon numarası formatı: 0(XXX) XXX XX XX
  if (digitsOnly.length === 10) {
    return `0(${digitsOnly.substring(0, 3)}) ${digitsOnly.substring(
      3,
      6
    )} ${digitsOnly.substring(6, 8)} ${digitsOnly.substring(8, 10)}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    return `0(${digitsOnly.substring(1, 4)}) ${digitsOnly.substring(
      4,
      7
    )} ${digitsOnly.substring(7, 9)} ${digitsOnly.substring(9, 11)}`;
  }

  // Diğer durumlarda orjinal numarayı döndür
  return phoneNumber;
};

/**
 * TC Kimlik Numarası biçimlendirme
 * @param {string} tcKimlik - Biçimlendirilecek TC Kimlik Numarası
 * @param {boolean} mask - Maskeleme yapılsın mı?
 * @returns {string} - Biçimlendirilmiş TC Kimlik Numarası
 */
const formatTCKimlik = (tcKimlik, mask = false) => {
  if (!tcKimlik) return "";

  // Sadece rakamları al
  const digitsOnly = String(tcKimlik).replace(/\D/g, "");

  if (digitsOnly.length !== 11) {
    return tcKimlik; // Geçersiz format, orjinal değeri döndür
  }

  if (mask) {
    // Maskelenmiş TC Kimlik Numarası: ilk 3 ve son 2 hane görünür
    return `${digitsOnly.substring(0, 3)}******${digitsOnly.substring(9, 11)}`;
  }

  return digitsOnly;
};

/**
 * İndeks kategori biçimlendirme
 * @param {string} category - İndeks kategorisi (A1, A2, A3, A4, A5, ...)
 * @param {string} type - İndeks tipi (Q1, Q2, Q3, Q4)
 * @returns {string} - Biçimlendirilmiş indeks bilgisi
 */
const formatIndexCategory = (category, type) => {
  if (!category) return "";

  let result = category;

  if (type) {
    result += ` (${type})`;
  }

  // İndeks kategorilerine göre açıklamalar
  const descriptions = {
    A1: "SCI-E, SSCI veya AHCI (Q1)",
    A2: "SCI-E, SSCI veya AHCI (Q2)",
    A3: "SCI-E, SSCI veya AHCI (Q3)",
    A4: "SCI-E, SSCI veya AHCI (Q4)",
    A5: "ESCI",
    A6: "Scopus",
    A7: "Diğer Uluslararası İndeks",
    A8: "ULAKBİM TR Dizin",
    A9: "Diğer Ulusal Hakemli Dergi",
  };

  if (descriptions[category]) {
    return descriptions[category];
  }

  return result;
};

/**
 * Kadro türü formatı
 * @param {string} kadroType - Kadro türü kodu
 * @returns {string} - Biçimlendirilmiş kadro türü
 */
const formatKadroType = (kadroType) => {
  const kadroTypes = {
    dr_ogr_uyesi: "Dr. Öğretim Üyesi",
    docent: "Doçent Dr.",
    profesor: "Prof. Dr.",
  };

  return kadroTypes[kadroType] || kadroType;
};

/**
 * Başvuru durumu biçimlendirme
 * @param {string} status - Başvuru durumu
 * @returns {string} - Biçimlendirilmiş başvuru durumu
 */
const formatApplicationStatus = (status) => {
  const statusMap = {
    pending: "Beklemede",
    under_review: "İnceleniyor",
    approved: "Onaylandı",
    rejected: "Reddedildi",
    completed: "Tamamlandı",
    cancelled: "İptal Edildi",
  };

  return statusMap[status] || status;
};

/**
 * Dosya boyutu biçimlendirme
 * @param {number} bytes - Bayt cinsinden dosya boyutu
 * @param {number} decimals - Ondalık hane sayısı
 * @returns {string} - Biçimlendirilmiş dosya boyutu
 */
const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * URL parametrelerini biçimlendirme
 * @param {Object} params - URL parametreleri
 * @returns {string} - Biçimlendirilmiş URL sorgu dizesi
 */
const formatURLParams = (params) => {
  if (!params || Object.keys(params).length === 0) return "";

  return Object.entries(params)
    .filter(
      ([_, value]) => value !== undefined && value !== null && value !== ""
    )
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
          .join("&");
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join("&");
};

/**
 * İsim biçimlendirme
 * @param {string} firstName - İsim
 * @param {string} lastName - Soyisim
 * @param {string} title - Ünvan
 * @returns {string} - Biçimlendirilmiş tam isim
 */
const formatFullName = (firstName, lastName, title = "") => {
  if (!firstName && !lastName) return "";

  const name = [firstName, lastName].filter(Boolean).join(" ");

  if (title) {
    return `${title} ${name}`;
  }

  return name;
};

module.exports = {
  formatDate,
  formatCurrency,
  formatNumber,
  formatPhoneNumber,
  formatTCKimlik,
  formatIndexCategory,
  formatKadroType,
  formatApplicationStatus,
  formatFileSize,
  formatURLParams,
  formatFullName,
};
