const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const storageService = require("../services/storageService");

// Desteklenen dosya türleri
const ALLOWED_FILE_TYPES = {
  documents: [".pdf", ".doc", ".docx", ".xls", ".xlsx"],
  images: [".jpg", ".jpeg", ".png"],
};

// Maksimum dosya boyutu (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Dosya filtresi - izin verilen dosya türlerini kontrol eder
const fileFilter = (allowedTypes) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Desteklenmeyen dosya türü. İzin verilen türler: ${allowedTypes.join(
          ", "
        )}`
      ),
      false
    );
  }
};

// Geçici olarak disk'e kaydetmek için storage tanımı
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/temp");
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// Firebase Storage'a yüklemek için storage tanımı
const firebaseStorage = multer.memoryStorage();

// Belge yükleme middleware'i
const uploadDocument = multer({
  storage: firebaseStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: fileFilter(ALLOWED_FILE_TYPES.documents),
}).single("file");

// Birden fazla belge yükleme middleware'i
const uploadDocuments = multer({
  storage: firebaseStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: fileFilter(ALLOWED_FILE_TYPES.documents),
}).array("documents", 10); // Maksimum 10 dosya

// Profil resmi yükleme middleware'i
const uploadProfileImage = multer({
  storage: firebaseStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: fileFilter(ALLOWED_FILE_TYPES.images),
}).single("profileImage");

// Firebase Storage'a yükleme middleware'i
const uploadToFirebase = async (req, res, next) => {
  try {
    // Dosya yoksa devam et
    if (!req.file && !req.files) {
      return next();
    }

    // Tek dosya yükleme
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileType = path.extname(req.file.originalname).substring(1);
      const folder = req.baseUrl.split("/")[1]; // Örn: /applications -> applications
      const uniqueFilename = `${uuidv4()}.${fileType}`;

      // Firebase'e yükle
      const downloadUrl = await storageService.uploadFile(
        fileBuffer,
        `${folder}/${uniqueFilename}`,
        req.file.mimetype
      );

      req.file.firebaseUrl = downloadUrl;
    }

    // Çoklu dosya yükleme
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const fileBuffer = file.buffer;
        const fileType = path.extname(file.originalname).substring(1);
        const folder = req.baseUrl.split("/")[1];
        const uniqueFilename = `${uuidv4()}.${fileType}`;

        // Firebase'e yükle
        const downloadUrl = await storageService.uploadFile(
          fileBuffer,
          `${folder}/${uniqueFilename}`,
          file.mimetype
        );

        file.firebaseUrl = downloadUrl;
        return file;
      });

      await Promise.all(uploadPromises);
    }

    next();
  } catch (error) {
    console.error("Dosya yükleme hatası:", error);
    return res
      .status(500)
      .json({ message: "Dosya yükleme sırasında bir hata oluştu." });
  }
};

// Hata yakalama middleware'i
const handleUploadErrors = (req, res, next) => {
  uploadDocument(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message:
            "Dosya boyutu çok büyük. Maksimum dosya boyutu 10MB olmalıdır.",
        });
      }
      return res
        .status(400)
        .json({ message: `Dosya yükleme hatası: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

module.exports = {
  uploadDocument,
  uploadDocuments,
  uploadProfileImage,
  uploadToFirebase,
  handleUploadErrors,
};
