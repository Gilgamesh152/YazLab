/**
 * Firebase yapılandırması
 * Bu modül Firebase Storage ve bildirim hizmetlerini yapılandırır
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Servis hesabı anahtarı
let serviceAccount;
let isConfigured = false;

try {
  // Production ortamında servis hesabı bilgileri doğrudan env'den alınır
  if (
    process.env.NODE_ENV === "production" &&
    process.env.FIREBASE_PROJECT_ID
  ) {
    serviceAccount = {
      type: process.env.FIREBASE_TYPE || "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri:
        process.env.FIREBASE_AUTH_URI ||
        "https://accounts.google.com/o/oauth2/auth",
      token_uri:
        process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url:
        process.env.FIREBASE_AUTH_PROVIDER_CERT_URL ||
        "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    };

    console.log("Firebase yapılandırması env değişkenlerinden yüklendi");
    isConfigured = true;
  } else {
    // Development ortamında servis hesabı anahtarı dosyadan yüklenir
    const serviceAccountPath = path.join(
      __dirname,
      "../serviceAccountKey.json"
    );

    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
      console.log(
        "Firebase yapılandırması serviceAccountKey.json dosyasından yüklendi"
      );
      isConfigured = true;
    } else {
      // Geliştirme ortamı için mock hesap
      console.warn(
        "Firebase servis hesabı dosyası bulunamadı, mock yapılandırma kullanılıyor"
      );

      serviceAccount = {
        type: "service_account",
        project_id: "dev-akademik-personel",
        private_key_id: "mock_key_id",
        private_key:
          "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj\nMzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu\nNMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ\n-----END PRIVATE KEY-----\n",
        client_email: "mock@dev-akademik-personel.iam.gserviceaccount.com",
        client_id: "000000000000000000000",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url:
          "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-abcde%40dev-akademik-personel.iam.gserviceaccount.com",
      };

      // Mock yapılandırmayla devam etmek için
      isConfigured = true;
    }
  }

  // Firebase admin SDK'sını başlat (eğer yapılandırma başarılı olduysa)
  if (isConfigured && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket:
        process.env.FIREBASE_STORAGE_BUCKET ||
        "dev-akademik-personel.appspot.com",
    });
    console.log("Firebase başarıyla yapılandırıldı");
  }
} catch (error) {
  console.error("Firebase yapılandırma hatası:", error.message);
  console.warn(
    "Firebase hizmetleri devre dışı bırakıldı, yerel depolama kullanılacak"
  );
  isConfigured = false;
}

// Storage ve bildirim hizmetlerini güvenli şekilde al
let bucket = null;
let messaging = null;

try {
  if (isConfigured) {
    const storage = admin.storage();
    bucket = storage.bucket();
    messaging = admin.messaging();
  }
} catch (error) {
  console.error("Firebase servisleri başlatılamadı:", error.message);
}

/**
 * Dosya yükleme fonksiyonu - Yerel dosya desteği eklenmiş
 * @param {Object} file - Yüklenecek dosya
 * @param {string} filePath - Depolama yolu
 * @returns {Promise<string>} - Yüklenen dosyanın URL'si
 */
const uploadFile = async (file, filePath) => {
  // Firebase yapılandırılmadıysa yerel depolama kullan
  if (!bucket) {
    return uploadToLocalStorage(file, filePath);
  }

  try {
    const fileName = `${filePath}/${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on("error", (error) => {
        console.error("Firebase yükleme hatası, yerel depolamaya geçiliyor");
        // Firebase'e yükleme başarısız olursa yerel depolamaya geç
        uploadToLocalStorage(file, filePath).then(resolve).catch(reject);
      });

      blobStream.on("finish", async () => {
        try {
          // Dosyayı genel erişime açık hale getir
          await fileUpload.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          resolve({
            success: true,
            url: publicUrl,
            filePath: fileName,
            provider: "firebase",
          });
        } catch (error) {
          console.error("Firebase yükleme tamamlama hatası:", error);
          // Hata durumunda yerel depolamaya geç
          uploadToLocalStorage(file, filePath).then(resolve).catch(reject);
        }
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error("Firebase Storage yükleme hatası:", error);
    // Herhangi bir hata durumunda yerel depolamaya geç
    return uploadToLocalStorage(file, filePath);
  }
};

/**
 * Yerel depolamaya dosya yükleme
 * @param {Object} file - Yüklenecek dosya
 * @param {string} folder - Klasör yolu
 * @returns {Promise<Object>} - Yükleme sonucu
 */
const uploadToLocalStorage = async (file, folder) => {
  const uploadsDir = path.join(__dirname, "../uploads");
  const folderPath = path.join(uploadsDir, folder);

  try {
    // Klasörlerin var olduğundan emin ol
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = path.join(folderPath, fileName);

    // Dosyayı yaz
    fs.writeFileSync(filePath, file.buffer);

    const publicUrl = `/uploads/${folder}/${fileName}`;

    return {
      success: true,
      url: publicUrl,
      filePath: `${folder}/${fileName}`,
      provider: "local",
    };
  } catch (error) {
    console.error("Yerel depolama hatası:", error);
    throw new Error(`Dosya yüklenemedi: ${error.message}`);
  }
};

/**
 * Dosya silme fonksiyonu - Yerel dosya desteği eklenmiş
 * @param {string} fileUrl - Silinecek dosyanın URL'si
 * @param {string} provider - Depolama sağlayıcısı ('firebase' veya 'local')
 * @returns {Promise<Object>}
 */
const deleteFile = async (fileUrl, provider = "firebase") => {
  try {
    if (!fileUrl)
      return { success: false, message: "Dosya URL'i belirtilmedi" };

    if (provider === "firebase" && bucket) {
      // Firebase'den dosya silme
      const fileName = fileUrl.split(`${bucket.name}/`)[1];
      if (!fileName) return { success: false, message: "Geçersiz dosya yolu" };

      await bucket.file(fileName).delete();
      return { success: true, message: `Dosya silindi: ${fileName}` };
    } else if (provider === "local") {
      // Yerel depolamadan dosya silme
      const filePath = path.join(__dirname, "..", fileUrl);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true, message: `Dosya silindi: ${fileUrl}` };
      } else {
        return { success: false, message: "Dosya bulunamadı" };
      }
    } else {
      return {
        success: false,
        message: "Desteklenmeyen depolama sağlayıcısı veya yapılandırma yok",
      };
    }
  } catch (error) {
    console.error("Dosya silme hatası:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Bildirim gönderme fonksiyonu
 * @param {string} token - Hedef cihaz token'ı
 * @param {Object} data - Bildirim verisi
 * @returns {Promise<string|Object>} - Bildirim ID'si veya hata nesnesi
 */
const sendNotification = async (token, data) => {
  try {
    if (!messaging) {
      console.warn(
        "Firebase Messaging yapılandırılmadı, bildirim gönderilemiyor"
      );
      return { success: false, message: "Bildirim servisi yapılandırılmadı" };
    }

    const message = {
      token,
      notification: {
        title: data.title,
        body: data.body,
      },
      data: data.additionalData || {},
    };

    const response = await messaging.send(message);
    console.log("Bildirim başarıyla gönderildi:", response);
    return { success: true, id: response };
  } catch (error) {
    console.error("Bildirim gönderme hatası:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  admin,
  bucket,
  messaging,
  isConfigured,
  uploadFile,
  deleteFile,
  sendNotification,
  serviceAccount,
};
