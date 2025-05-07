/**
 * constants.js
 * Bu dosya, uygulama genelinde kullanılan sabit değerleri içerir.
 */

// Kullanıcı rolleri
const ROLES = {
  ADMIN: 1,
  MANAGER: 2,
  APPLICANT: 3,
  JURY: 4,
};

// Rol adları
const ROLE_NAMES = {
  1: "Admin",
  2: "Yönetici",
  3: "Aday",
  4: "Jüri Üyesi",
};

// Akademik kadrolar
const POSITION_TYPES = {
  DR_OGR_UYESI: "dr_ogr_uyesi",
  DOCENT: "docent",
  PROFESOR: "profesor",
};

// Akademik kadro adları
const POSITION_NAMES = {
  dr_ogr_uyesi: "Dr. Öğr. Üyesi",
  docent: "Doçent",
  profesor: "Profesör",
};

// Başvuru durumları
const APPLICATION_STATUS = {
  PENDING: "beklemede",
  REVIEWING: "incelemede",
  APPROVED: "onaylandi",
  REJECTED: "reddedildi",
};

// Başvuru durumu adları
const APPLICATION_STATUS_NAMES = {
  beklemede: "Beklemede",
  incelemede: "İncelemede",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
};

// Jüri kararları
const JURY_DECISIONS = {
  POSITIVE: "olumlu",
  NEGATIVE: "olumsuz",
};

// Jüri kararı adları
const JURY_DECISION_NAMES = {
  olumlu: "Olumlu",
  olumsuz: "Olumsuz",
};

// Q kategorileri
const Q_CATEGORIES = {
  Q1: "q1",
  Q2: "q2",
  Q3: "q3",
  Q4: "q4",
};

// Q kategorisi adları
const Q_CATEGORY_NAMES = {
  q1: "Q1",
  q2: "Q2",
  q3: "Q3",
  q4: "Q4",
};

// Belge kategorileri (Tablo 3'e göre)
const DOCUMENT_CATEGORIES = {
  A: "Makaleler",
  B: "Bilimsel Toplantı Faaliyetleri",
  C: "Kitaplar",
  D: "Atıflar",
  E: "Eğitim Öğretim Faaliyetleri",
  F: "Tez Yöneticiliği",
  G: "Patentler",
  H: "Araştırma Projeleri",
  I: "Editörlük, Yayın Kurulu Üyeliği ve Hakemlik Faaliyetleri",
  J: "Ödüller",
  K: "İdari Görevler ve Üniversiteye Katkı Faaliyetleri",
  L: "Güzel Sanatlar Faaliyetleri",
};

// Belge alt kategorileri (Tablo 3'teki A.1, A.2, vb. için)
const DOCUMENT_SUBCATEGORIES = {
  // Makaleler (A)
  A1: "SCI-E, SSCI veya AHCI kapsamındaki dergilerde yayımlanmış makale (Q1 olarak taranan dergide)",
  A2: "SCI-E, SSCI veya AHCI kapsamındaki dergilerde yayımlanmış makale (Q2 olarak taranan dergide)",
  A3: "SCI-E, SSCI veya AHCI kapsamındaki dergilerde yayımlanmış makale (Q3 olarak taranan dergide)",
  A4: "SCI-E, SSCI veya AHCI kapsamındaki dergilerde yayımlanmış makale (Q4 olarak taranan dergide)",
  A5: "ESCI tarafından taranan dergilerde yayımlanmış makale",
  A6: "Scopus tarafından taranan dergilerde yayımlanmış makale",
  A7: "Uluslararası diğer indekslerde taranan dergilerde yayımlanmış makale",
  A8: "ULAKBİM TR Dizin tarafından taranan ulusal hakemli dergilerde yayımlanmış makale",
  A9: "8. madde dışındaki ulusal hakemli dergilerde yayımlanmış makale",

  // Diğer kategoriler burada tanımlanabilir
  // Tam listede çok fazla alt kategori olduğu için örnek olarak sadece Makale (A) kategorisi gösterilmiştir
};

// Bilimsel alanlar (Temel alanlar)
const SCIENTIFIC_AREAS = {
  HEALTH_SCIENCES: "health_sciences",
  SCIENCE_MATH: "science_math",
  ENGINEERING: "engineering",
  AGRICULTURE: "agriculture",
  FORESTRY: "forestry",
  EDUCATION: "education",
  PHILOLOGY: "philology",
  ARCHITECTURE: "architecture",
  PLANNING: "planning",
  SOCIAL_SCIENCES: "social_sciences",
  HUMANITIES: "humanities",
  ADMINISTRATIVE_SCIENCES: "administrative_sciences",
  SPORTS_SCIENCES: "sports_sciences",
  LAW: "law",
  THEOLOGY: "theology",
  ARTS: "arts",
};

// Bilimsel alan adları
const SCIENTIFIC_AREA_NAMES = {
  health_sciences: "Sağlık Bilimleri",
  science_math: "Fen Bilimleri ve Matematik",
  engineering: "Mühendislik",
  agriculture: "Ziraat",
  forestry: "Orman ve Su Ürünleri",
  education: "Eğitim Bilimleri",
  philology: "Filoloji",
  architecture: "Mimarlık",
  planning: "Planlama ve Tasarım",
  social_sciences: "Sosyal Bilimler",
  humanities: "Beşeri Bilimler",
  administrative_sciences: "İdari Bilimler",
  sports_sciences: "Spor Bilimleri",
  law: "Hukuk",
  theology: "İlahiyat",
  arts: "Güzel Sanatlar",
};

// Temel alan grupları (Yönerge Tablo 1 ve 2'ye göre)
const AREA_GROUPS = {
  GROUP1: "group1", // Sağlık Bilimleri, Fen Bilimleri ve Matematik, Mühendislik, Ziraat, Orman ve Su Ürünleri
  GROUP2: "group2", // Eğitim Bilimleri, Filoloji, Mimarlık, Planlama ve Tasarım, Sosyal, Beşeri ve İdari Bilimler ve Spor Bilimleri
  GROUP3: "group3", // Hukuk ve İlahiyat
  GROUP4: "group4", // Güzel Sanatlar (Konservatuvar dahil)
};

// Temel alan grubu adları
const AREA_GROUP_NAMES = {
  group1: "Sağlık, Fen, Matematik, Mühendislik, Ziraat, Orman ve Su Ürünleri",
  group2:
    "Eğitim, Filoloji, Mimarlık, Tasarım, Sosyal Bilimler ve Spor Bilimleri",
  group3: "Hukuk ve İlahiyat",
  group4: "Güzel Sanatlar",
};

// Temel alanların gruplara göre dağılımı
const AREAS_BY_GROUP = {
  group1: [
    "health_sciences",
    "science_math",
    "engineering",
    "agriculture",
    "forestry",
  ],
  group2: [
    "education",
    "philology",
    "architecture",
    "planning",
    "social_sciences",
    "humanities",
    "administrative_sciences",
    "sports_sciences",
  ],
  group3: ["law", "theology"],
  group4: ["arts"],
};

// Puan hesaplama kriterleri (Dr. Öğr. Üyesi, Doçent, Profesör)
const POINT_REQUIREMENTS = {
  DR_OGR_UYESI: {
    group1: {
      MINIMUM_A1_A4: 45,
      MINIMUM_A1_A5: 5,
      TOTAL_POINTS: 100,
    },
    group2: {
      MINIMUM_A1_A6: 40,
      TOTAL_POINTS: 100,
    },
    group3: {
      MINIMUM_A1_A6: 50,
      TOTAL_POINTS: 100,
    },
    group4: {
      MINIMUM_A1_A8: 10,
      TOTAL_POINTS: 200,
    },
  },
  DOCENT: {
    group1: {
      MINIMUM_A1_A4: 125,
      MINIMUM_F1_F2: 15,
      MINIMUM_H1_H17: 20,
      TOTAL_POINTS: 250,
    },
    group2: {
      MINIMUM_A1_A6: 75,
      MINIMUM_F1_F2: 15,
      MINIMUM_H1_H17: 20,
      TOTAL_POINTS: 250,
    },
    group3: {
      MINIMUM_A1_A6: 60,
      MINIMUM_F1_F2: 15,
      MINIMUM_H1_H22: 10,
      TOTAL_POINTS: 250,
    },
    group4: {
      MINIMUM_A1_A8: 20,
      MINIMUM_F1_F2: 15,
      MINIMUM_H1_H22: 10,
      TOTAL_POINTS: 350,
    },
  },
  PROFESOR: {
    group1: {
      MINIMUM_A1_A4: 125,
      MINIMUM_F1_F2: 15,
      MINIMUM_H1_H17: 20,
      TOTAL_POINTS: 250,
    },
    group2: {
      MINIMUM_A1_A6: 75,
      MINIMUM_F1_F2: 15,
      MINIMUM_H1_H17: 20,
      TOTAL_POINTS: 250,
    },
    group3: {
      MINIMUM_A1_A6: 60,
      MINIMUM_F1_F2: 15,
      MINIMUM_H1_H22: 10,
      TOTAL_POINTS: 250,
    },
    group4: {
      MINIMUM_A1_A8: 20,
      MINIMUM_F1_F2: 15,
      MINIMUM_H1_H22: 10,
      TOTAL_POINTS: 350,
    },
  },
};

// Yayın sayısı gereksinimleri (Dr. Öğr. Üyesi, Doçent, Profesör)
const PUBLICATION_REQUIREMENTS = {
  DR_OGR_UYESI: {
    group1: {
      A1_A2: 1,
      A1_A4: 2,
      A1_A5: 1,
      PRIMARY_AUTHOR: 1,
      TOTAL: 4,
    },
    group2: {
      A1_A4: 1,
      A1_A6: 3,
      PRIMARY_AUTHOR: 1,
      TOTAL: 4,
    },
    group3: {
      A1_A6: 4,
      PRIMARY_AUTHOR: 1,
      TOTAL: 4,
    },
    group4: {
      A1_A8: 1,
      PRIMARY_AUTHOR: 1,
      TOTAL: 1,
      PERSONAL_EXHIBITIONS: 2,
      GROUP_EXHIBITIONS: 8,
    },
  },
  DOCENT: {
    group1: {
      A1_A2: 3,
      A1_A4: 4,
      PRIMARY_AUTHOR: 2,
      TOTAL: 7,
      THESIS_SUPERVISION: true,
      PROJECTS: true,
    },
    group2: {
      A1_A4: 2,
      A1_A6: 4,
      PRIMARY_AUTHOR: 2,
      TOTAL: 6,
      THESIS_SUPERVISION: true,
      PROJECTS: true,
    },
    group3: {
      A1_A4: 1,
      A1_A5: 1,
      A1_A6: 4,
      PRIMARY_AUTHOR: 2,
      TOTAL: 6,
      THESIS_SUPERVISION: true,
      PROJECTS: true,
    },
    group4: {
      A1_A6: 1,
      A1_A8: 2,
      PRIMARY_AUTHOR: 2,
      TOTAL: 3,
      PERSONAL_EXHIBITIONS: 3,
      GROUP_EXHIBITIONS: 12,
      THESIS_SUPERVISION: true,
      PROJECTS: true,
    },
  },
  PROFESOR: {
    group1: {
      A1_A2: 3,
      A1_A4: 4,
      PRIMARY_AUTHOR: 3,
      TOTAL: 7,
      THESIS_SUPERVISION: true,
      PROJECTS: true,
    },
    group2: {
      A1_A4: 2,
      A1_A6: 4,
      PRIMARY_AUTHOR: 3,
      TOTAL: 6,
      THESIS_SUPERVISION: true,
      PROJECTS: true,
    },
    group3: {
      A1_A4: 1,
      A1_A5: 1,
      A1_A6: 4,
      PRIMARY_AUTHOR: 3,
      TOTAL: 6,
      THESIS_SUPERVISION: true,
      PROJECTS: true,
    },
    group4: {
      A1_A6: 1,
      A1_A8: 2,
      PRIMARY_AUTHOR: 3,
      TOTAL: 3,
      PERSONAL_EXHIBITIONS: 5,
      GROUP_EXHIBITIONS: 20,
      THESIS_SUPERVISION: true,
      PROJECTS: true,
    },
  },
};

// API durum kodları
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

// API yanıt mesajları
const API_MESSAGES = {
  SUCCESS: "İşlem başarılı",
  ERROR: "Bir hata oluştu",
  NOT_FOUND: "Kayıt bulunamadı",
  UNAUTHORIZED: "Bu işlem için yetkiniz bulunmamaktadır",
  FORBIDDEN: "Bu kaynağa erişim izniniz bulunmamaktadır",
  VALIDATION_ERROR: "Girilen bilgilerde hata var",
  LOGIN_REQUIRED: "Giriş yapmanız gerekmektedir",
  DUPLICATE_RECORD: "Bu kayıt zaten mevcut",
  INVALID_CREDENTIALS: "Geçersiz TC kimlik no veya şifre",
  APPLICATION_SUBMITTED: "Başvurunuz alınmıştır",
  APPLICATION_UPDATED: "Başvurunuz güncellenmiştir",
  APPLICATION_CANCELED: "Başvurunuz iptal edilmiştir",
  DOCUMENT_UPLOADED: "Belge başarıyla yüklendi",
  EVALUATION_SUBMITTED: "Değerlendirmeniz kaydedilmiştir",
  JURY_ASSIGNED: "Jüri üyeleri atanmıştır",
  FINAL_DECISION_MADE: "Nihai karar verilmiştir",
  NOTIFICATION_SENT: "Bildirim gönderilmiştir",
};

// Belge tipi-uzantı eşleştirmeleri
const FILE_TYPES = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

// İzin verilen dosya tipleri
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

// Maksimum dosya boyutu (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Firebase Storage klasör yapısı
const STORAGE_FOLDERS = {
  DOCUMENTS: "documents",
  REPORTS: "reports",
  PROFILE_PICTURES: "profile_pictures",
  EVALUATION_REPORTS: "evaluation_reports",
  TEMP: "temp",
};

// Token süreleri (saniye cinsinden)
const TOKEN_DURATIONS = {
  ACCESS_TOKEN: 3600, // 1 saat
  REFRESH_TOKEN: 2592000, // 30 gün
};

// E-posta şablonları
const EMAIL_TEMPLATES = {
  WELCOME: "welcome",
  PASSWORD_RESET: "password_reset",
  APPLICATION_RECEIVED: "application_received",
  APPLICATION_STATUS_CHANGE: "application_status_change",
  JURY_ASSIGNMENT: "jury_assignment",
  EVALUATION_REMINDER: "evaluation_reminder",
  FINAL_DECISION: "final_decision",
};

// Başvuru kriterleri hesaplama sabitleri
const CALCULATION_CONSTANTS = {
  MAX_D_POINTS: 1500, // Atıflardan alınabilecek maksimum puan
  MAX_E_POINTS: 50, // Eğitim faaliyetlerinden alınabilecek maksimum puan
  MAX_K_POINTS: 50, // İdari görevlerden alınabilecek maksimum puan
};

// Belge kategorisi - puan değerleri eşleştirmesi (Tablo 3)
const DOCUMENT_POINTS = {
  // A kategorisi puanları
  A1: 60, // SCI-E, SSCI veya AHCI (Q1)
  A2: 55, // SCI-E, SSCI veya AHCI (Q2)
  A3: 40, // SCI-E, SSCI veya AHCI (Q3)
  A4: 30, // SCI-E, SSCI veya AHCI (Q4)
  A5: 25, // ESCI
  A6: 20, // Scopus
  A7: 15, // Diğer uluslararası indeksler
  A8: 10, // ULAKBİM TR Dizin
  A9: 8, // Diğer ulusal hakemli dergiler

  // Diğer kategorilerin puanları da eklenebilir
  // Tam liste için Tablo 3'e bakınız
};

// Bildirim tipleri
const NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
};

// İş akışı durumları
const WORKFLOW_STATES = {
  ANNOUNCEMENT_CREATED: "announcement_created",
  APPLICATION_SUBMITTED: "application_submitted",
  APPLICATION_VALIDATED: "application_validated",
  JURY_ASSIGNED: "jury_assigned",
  EVALUATION_STARTED: "evaluation_started",
  EVALUATION_COMPLETED: "evaluation_completed",
  FINAL_DECISION_MADE: "final_decision_made",
  APPLICANT_NOTIFIED: "applicant_notified",
};

module.exports = {
  ROLES,
  ROLE_NAMES,
  POSITION_TYPES,
  POSITION_NAMES,
  APPLICATION_STATUS,
  APPLICATION_STATUS_NAMES,
  JURY_DECISIONS,
  JURY_DECISION_NAMES,
  Q_CATEGORIES,
  Q_CATEGORY_NAMES,
  DOCUMENT_CATEGORIES,
  DOCUMENT_SUBCATEGORIES,
  SCIENTIFIC_AREAS,
  SCIENTIFIC_AREA_NAMES,
  AREA_GROUPS,
  AREA_GROUP_NAMES,
  AREAS_BY_GROUP,
  POINT_REQUIREMENTS,
  PUBLICATION_REQUIREMENTS,
  HTTP_STATUS,
  API_MESSAGES,
  FILE_TYPES,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  STORAGE_FOLDERS,
  TOKEN_DURATIONS,
  EMAIL_TEMPLATES,
  CALCULATION_CONSTANTS,
  DOCUMENT_POINTS,
  NOTIFICATION_TYPES,
  WORKFLOW_STATES,
};
