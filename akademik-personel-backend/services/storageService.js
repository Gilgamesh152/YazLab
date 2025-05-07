const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const firebaseConfig = require("../config/firebase");

/**
 * Dosya depolama işlemlerini yöneten servis
 */
class StorageService {
  constructor() {
    this.isFirebaseInitialized = firebaseConfig.isConfigured;
    this.bucket = firebaseConfig.bucket;

    // Yerel depolama için uploads klasörünü hazırla
    this.uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Dosyayı Storage'a yükler (Firebase veya yerel)
   * @param {Object} file - Express dosya nesnesi
   * @param {String} folder - Yüklenecek klasör yolu
   * @param {String} customFileName - Özel dosya adı (isteğe bağlı)
   * @returns {Promise<Object>} - Yükleme sonucu
   */
  async uploadFile(file, folder, customFileName) {
    // Firebase yapılandırılmış ve kullanılabilir mi kontrol et
    if (this.isFirebaseInitialized && this.bucket) {
      return this.uploadToFirebase(file, folder, customFileName);
    } else {
      console.log("Firebase kullanılamıyor, yerel depolama kullanılıyor");
      return this.uploadToLocalStorage(file, folder, customFileName);
    }
  }

  /**
   * Dosyayı Firebase Storage'a yükler
   * @param {Object} file - Express dosya nesnesi
   * @param {String} folder - Yüklenecek klasör yolu
   * @param {String} customFileName - Özel dosya adı (isteğe bağlı)
   * @returns {Promise<Object>} - Yükleme sonucu
   */
  async uploadToFirebase(file, folder, customFileName) {
    try {
      // Dosya adı oluşturma (özel ad veya otomatik)
      const fileName =
        customFileName || `${uuidv4()}${path.extname(file.originalname)}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Firebase Storage'a yükle
      const fileUpload = this.bucket.file(filePath);

      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
          },
        },
        resumable: false,
      });

      return new Promise((resolve, reject) => {
        stream.on("error", (error) => {
          console.error("Firebase yükleme hatası:", error);
          // Hata durumunda yerel depolamaya geç
          this.uploadToLocalStorage(file, folder, customFileName)
            .then(resolve)
            .catch(reject);
        });

        stream.on("finish", async () => {
          try {
            // Dosyayı halka açık yap
            await fileUpload.makePublic();

            // Dosya URL'ini getir
            const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${filePath}`;

            resolve({
              success: true,
              fileName,
              filePath,
              publicUrl,
              contentType: file.mimetype,
              originalName: file.originalname,
              size: file.size,
              provider: "firebase",
            });
          } catch (error) {
            console.error("Firebase dosya yayınlama hatası:", error);
            // Hata durumunda yerel depolamaya geç
            this.uploadToLocalStorage(file, folder, customFileName)
              .then(resolve)
              .catch(reject);
          }
        });

        // Buffer verisini stream'e gönder
        stream.end(file.buffer);
      });
    } catch (error) {
      console.error("Firebase Storage yükleme hatası:", error);
      // Hata durumunda yerel depolamaya geç
      return this.uploadToLocalStorage(file, folder, customFileName);
    }
  }

  /**
   * Dosyayı yerel depolamaya yükler
   * @param {Object} file - Express dosya nesnesi
   * @param {String} folder - Yüklenecek klasör yolu
   * @param {String} customFileName - Özel dosya adı (isteğe bağlı)
   * @returns {Promise<Object>} - Yükleme sonucu
   */
  async uploadToLocalStorage(file, folder, customFileName) {
    try {
      // Dosya adı oluşturma
      const fileName =
        customFileName || `${uuidv4()}${path.extname(file.originalname)}`;

      // Klasör yolunu oluştur
      const folderPath = folder
        ? path.join(this.uploadsDir, folder)
        : this.uploadsDir;

      // Klasörün var olduğundan emin ol
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Dosyanın tam yolu
      const filePath = path.join(folderPath, fileName);

      // Dosyayı kaydet
      fs.writeFileSync(filePath, file.buffer);

      // Dosya URL'i (web sunucusu üzerinden erişim için)
      const localPath = folder ? `${folder}/${fileName}` : fileName;
      const publicUrl = `/uploads/${localPath}`;

      return {
        success: true,
        fileName,
        filePath: localPath,
        publicUrl,
        contentType: file.mimetype,
        originalName: file.originalname,
        size: file.size,
        provider: "local",
      };
    } catch (error) {
      console.error("Yerel depolama yükleme hatası:", error);
      return {
        success: false,
        error: error.message,
        provider: "local",
      };
    }
  }

  /**
   * Dosyayı siler (Firebase veya yerel)
   * @param {String} filePath - Silinecek dosya yolu
   * @param {String} provider - 'firebase' veya 'local'
   * @returns {Promise<Object>} - Silme sonucu
   */
  async deleteFile(filePath, provider = "firebase") {
    if (provider === "firebase" && this.isFirebaseInitialized && this.bucket) {
      return this.deleteFromFirebase(filePath);
    } else {
      return this.deleteFromLocalStorage(filePath);
    }
  }

  /**
   * Dosyayı Firebase Storage'dan siler
   * @param {String} filePath - Silinecek dosya yolu
   * @returns {Promise<Object>} - Silme sonucu
   */
  async deleteFromFirebase(filePath) {
    try {
      await this.bucket.file(filePath).delete();
      return {
        success: true,
        message: "Dosya başarıyla silindi",
        provider: "firebase",
      };
    } catch (error) {
      console.error("Firebase Storage dosya silme hatası:", error);
      return {
        success: false,
        error: error.message,
        provider: "firebase",
      };
    }
  }

  /**
   * Dosyayı yerel depolamadan siler
   * @param {String} filePath - Silinecek dosya yolu (/uploads/ sonrası)
   * @returns {Promise<Object>} - Silme sonucu
   */
  async deleteFromLocalStorage(filePath) {
    try {
      // /uploads/ ile başlayan URL'den gerçek dosya yolunu çıkar
      const localPath = filePath.startsWith("/uploads/")
        ? filePath.substring(9)
        : filePath;

      const fullPath = path.join(this.uploadsDir, localPath);

      // Dosyanın var olup olmadığını kontrol et
      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          message: "Dosya bulunamadı",
          provider: "local",
        };
      }

      // Dosyayı sil
      fs.unlinkSync(fullPath);

      return {
        success: true,
        message: "Dosya başarıyla silindi",
        provider: "local",
      };
    } catch (error) {
      console.error("Yerel depolama dosya silme hatası:", error);
      return {
        success: false,
        error: error.message,
        provider: "local",
      };
    }
  }

  /**
   * Dosyayı indirir ve geçici bir dizine kaydeder
   * @param {String} filePath - İndirilecek dosya yolu
   * @param {String} destPath - Hedef yol (isteğe bağlı)
   * @param {String} provider - 'firebase' veya 'local'
   * @returns {Promise<Object>} - İndirme sonucu
   */
  async downloadFile(filePath, destPath, provider = "firebase") {
    if (provider === "firebase" && this.isFirebaseInitialized && this.bucket) {
      return this.downloadFromFirebase(filePath, destPath);
    } else {
      return this.copyFromLocalStorage(filePath, destPath);
    }
  }

  /**
   * Dosyayı Firebase Storage'dan indirir
   * @param {String} filePath - İndirilecek dosya yolu
   * @param {String} destPath - Hedef yol (isteğe bağlı)
   * @returns {Promise<Object>} - İndirme sonucu
   */
  async downloadFromFirebase(filePath, destPath) {
    try {
      // Geçici klasörün yolunu belirle
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempPath = destPath || path.join(tempDir, path.basename(filePath));

      // Klasörün varlığını kontrol et ve gerekirse oluştur
      const dirname = path.dirname(tempPath);
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
      }

      // Dosyayı indir
      await this.bucket.file(filePath).download({ destination: tempPath });

      return {
        success: true,
        localPath: tempPath,
        provider: "firebase",
      };
    } catch (error) {
      console.error("Firebase Storage dosya indirme hatası:", error);
      return {
        success: false,
        error: error.message,
        provider: "firebase",
      };
    }
  }

  /**
   * Yerel depodaki dosyayı başka bir konuma kopyalar
   * @param {String} filePath - Kopyalanacak dosya yolu
   * @param {String} destPath - Hedef yol
   * @returns {Promise<Object>} - Kopyalama sonucu
   */
  async copyFromLocalStorage(filePath, destPath) {
    try {
      // /uploads/ ile başlayan URL'den gerçek dosya yolunu çıkar
      const localPath = filePath.startsWith("/uploads/")
        ? filePath.substring(9)
        : filePath;

      const sourcePath = path.join(this.uploadsDir, localPath);

      // Dosyanın var olup olmadığını kontrol et
      if (!fs.existsSync(sourcePath)) {
        return {
          success: false,
          message: "Dosya bulunamadı",
          provider: "local",
        };
      }

      // Hedef yolun klasörünün var olduğundan emin ol
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Dosyayı kopyala
      fs.copyFileSync(sourcePath, destPath);

      return {
        success: true,
        localPath: destPath,
        provider: "local",
      };
    } catch (error) {
      console.error("Yerel depolama dosya kopyalama hatası:", error);
      return {
        success: false,
        error: error.message,
        provider: "local",
      };
    }
  }

  /**
   * Dosyanın URL'ini oluşturur (Firebase için)
   * @param {String} filePath - Dosya yolu
   * @param {Number} expiresIn - Saniye cinsinden URL'in geçerlilik süresi
   * @returns {Promise<Object>} - URL oluşturma sonucu
   */
  async getSignedUrl(filePath, expiresIn = 3600) {
    // Firebase yapılandırılmamışsa uyarı dön
    if (!this.isFirebaseInitialized || !this.bucket) {
      return {
        success: false,
        message: "Firebase yapılandırılmadı, imzalı URL oluşturulamıyor",
        provider: "local",
      };
    }

    try {
      const options = {
        action: "read",
        expires: Date.now() + expiresIn * 1000,
      };

      const [url] = await this.bucket.file(filePath).getSignedUrl(options);

      return {
        success: true,
        url,
        provider: "firebase",
      };
    } catch (error) {
      console.error("Signed URL oluşturma hatası:", error);
      return {
        success: false,
        error: error.message,
        provider: "firebase",
      };
    }
  }
}

// Singleton örneği oluştur ve dışa aktar
module.exports = new StorageService();
