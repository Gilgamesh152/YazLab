const pool = require("../config/db");
const { validateApplicationData } = require("../utils/validators");
const notificationService = require("../services/notificationService");
const storageService = require("../services/storageService");
const pointCalculationService = require("../services/pointCalculationService");
const pdfService = require("../services/pdfService");

/**
 * Başvuru oluştur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createApplication = async (req, res) => {
  const client = await pool.connect();

  try {
    const { ilan_id, notes } = req.body;
    const user_id = req.user.user_id;

    // Başvuru verilerini doğrula
    const { error } = validateApplicationData(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // İlanı kontrol et
    const announcementResult = await client.query(
      "SELECT * FROM announcements WHERE ilan_id = $1",
      [ilan_id]
    );

    if (announcementResult.rows.length === 0) {
      return res.status(404).json({ message: "İlan bulunamadı" });
    }

    const announcement = announcementResult.rows[0];

    // İlan süresi kontrolü
    const now = new Date();
    const startDate = new Date(announcement.baslangic_tarih);
    const endDate = new Date(announcement.bitis_tarih);

    if (now < startDate || now > endDate) {
      return res
        .status(400)
        .json({ message: "İlan süresi geçmiş veya henüz başlamamış" });
    }

    // Daha önce aynı ilana başvuru yapılıp yapılmadığını kontrol et
    const existingApplicationResult = await client.query(
      "SELECT * FROM applications WHERE user_id = $1 AND ilan_id = $2",
      [user_id, ilan_id]
    );

    if (existingApplicationResult.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Bu ilana daha önce başvuru yapmışsınız" });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Başvuruyu oluştur
    const applicationResult = await client.query(
      `
      INSERT INTO applications (user_id, ilan_id, basvuru_tarihi, durum, notes)
      VALUES ($1, $2, NOW(), 'beklemede', $3)
      RETURNING *
    `,
      [user_id, ilan_id, notes]
    );

    const application_id = applicationResult.rows[0].application_id;

    // İlana ait tüm kriterleri getir
    const criteriaResult = await client.query(
      `
      SELECT c.*, d.document_type, d.puan
      FROM criteria c
      JOIN documents d ON c.document_id = d.document_id
      WHERE c.ilan_id = $1
    `,
      [ilan_id]
    );

    // İşlemi tamamla
    await client.query("COMMIT");

    // Admin ve yöneticilere bildirim gönder
    const adminManagerResult = await client.query(`
      SELECT u.user_id
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE r.role_name IN ('admin', 'yonetici')
    `);

    // Başvuru yapan kullanıcı bilgilerini getir
    const userResult = await client.query(
      `
      SELECT ad, soyad FROM users WHERE user_id = $1
    `,
      [user_id]
    );

    const user = userResult.rows[0];

    // Fakülte ve bölüm bilgilerini getir
    const detailsResult = await client.query(
      `
      SELECT f.faculty_ad, d.departman_ad, k.kadro_ad
      FROM announcements a
      JOIN faculties f ON a.faculty_id = f.faculty_id
      JOIN departmanlar d ON a.departman_id = d.departman_id
      JOIN kadrolar k ON a.kadro_id = k.kadro_id
      WHERE a.ilan_id = $1
    `,
      [ilan_id]
    );

    const details = detailsResult.rows[0];

    // Admin ve yöneticilere bildirim gönder
    for (const recipient of adminManagerResult.rows) {
      await notificationService.sendNotification({
        user_id: recipient.user_id,
        mesaj: `Yeni başvuru: ${user.ad} ${user.soyad} tarafından ${details.faculty_ad} - ${details.departman_ad} ${details.kadro_ad} ilanına başvuru yapıldı.`,
        tip: "bilgi",
        link: `/manager/applications/${application_id}`,
      });
    }

    // Başvurana bildirim gönder
    await notificationService.sendNotification({
      user_id: user_id,
      mesaj: `Başvurunuz alındı: ${details.faculty_ad} - ${details.departman_ad} ${details.kadro_ad} ilanına başvurunuz başarıyla kaydedildi.`,
      tip: "bilgi",
      link: `/applicant/applications/${application_id}`,
    });

    res.status(201).json({
      message: "Başvuru başarıyla oluşturuldu",
      application: applicationResult.rows[0],
      criteria: criteriaResult.rows,
    });
  } catch (error) {
    // Hata yönetimi iyileştirildi
    await client.query("ROLLBACK");
    console.error("Create application error:", error);
    res.status(500).json({
      message: "Sunucu hatası",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

/**
 * Başvuruya belge ekle/güncelle
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.uploadApplicationDocument = async (req, res) => {
  try {
    const { application_id, document_id } = req.params;
    const { is_baslica_yazar, description } = req.body;
    const user_id = req.user.id;

    // Başvuruyu kontrol et ve kullanıcıya ait olduğunu doğrula
    const applicationResult = await pool.query(
      "SELECT * FROM applications WHERE application_id = $1 AND user_id = $2",
      [application_id, user_id]
    );

    if (applicationResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Başvuru bulunamadı veya erişim yetkiniz yok" });
    }

    // Başvuru durumunu kontrol et
    if (applicationResult.rows[0].durum !== "beklemede") {
      return res.status(400).json({
        message: "Sadece beklemede olan başvurulara belge eklenebilir",
      });
    }

    // Belgeyi kontrol et
    const documentResult = await pool.query(
      "SELECT * FROM documents WHERE document_id = $1",
      [document_id]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ message: "Belge türü bulunamadı" });
    }

    // Dosya kontrolü
    if (!req.file) {
      return res.status(400).json({ message: "Lütfen bir dosya yükleyin" });
    }

    // Dosyayı Firebase Storage'a yükle
    const file = req.file;
    const fileName = `applications/${application_id}/${document_id}_${Date.now()}_${
      file.originalname
    }`;
    const fileURL = await storageService.uploadFile(
      file.buffer,
      fileName,
      file.mimetype
    );

    // Daha önce aynı belge türü için yükleme yapılmış mı kontrol et
    const existingDocumentResult = await pool.query(
      "SELECT * FROM application_documents WHERE application_id = $1 AND document_id = $2",
      [application_id, document_id]
    );

    if (existingDocumentResult.rows.length > 0) {
      // Mevcut belgeyi güncelle
      await pool.query(
        `
        UPDATE application_documents
        SET dosya_url = $1, is_baslica_yazar = $2, description = $3, uploaded_at = NOW()
        WHERE application_id = $4 AND document_id = $5
      `,
        [
          fileURL,
          is_baslica_yazar || false,
          description,
          application_id,
          document_id,
        ]
      );

      res.json({
        message: "Belge başarıyla güncellendi",
        document: {
          application_id,
          document_id,
          dosya_url: fileURL,
          is_baslica_yazar: is_baslica_yazar || false,
          description,
        },
      });
    } else {
      // Yeni belge ekle
      await pool.query(
        `
        INSERT INTO application_documents (application_id, document_id, dosya_url, is_baslica_yazar, description, uploaded_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `,
        [
          application_id,
          document_id,
          fileURL,
          is_baslica_yazar || false,
          description,
        ]
      );

      res.status(201).json({
        message: "Belge başarıyla yüklendi",
        document: {
          application_id,
          document_id,
          dosya_url: fileURL,
          is_baslica_yazar: is_baslica_yazar || false,
          description,
        },
      });
    }

    // Puanı yeniden hesapla
    await pointCalculationService.calculatePoints(application_id);
  } catch (error) {
    console.error("Upload application document error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Başvuruya ait belgeleri getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getApplicationDocuments = async (req, res) => {
  try {
    const { application_id } = req.params;
    const user_id = req.user.id;

    // Başvuruyu kontrol et
    const applicationResult = await pool.query(
      "SELECT * FROM applications WHERE application_id = $1",
      [application_id]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    // Kullanıcının yetkisini kontrol et
    const application = applicationResult.rows[0];

    if (
      application.user_id !== user_id &&
      req.user.role !== "admin" &&
      req.user.role !== "yonetici" &&
      req.user.role !== "juri"
    ) {
      return res
        .status(403)
        .json({ message: "Bu başvuruya erişim yetkiniz yok" });
    }

    // Başvuruya ait belgeleri getir
    const documentsResult = await pool.query(
      `
      SELECT ad.*, d.document_type, d.puan, dc.category_code
      FROM application_documents ad
      JOIN documents d ON ad.document_id = d.document_id
      JOIN document_categories dc ON d.category_id = dc.category_id
      WHERE ad.application_id = $1
      ORDER BY d.document_type
    `,
      [application_id]
    );

    res.json({
      application_id,
      documents: documentsResult.rows,
    });
  } catch (error) {
    console.error("Get application documents error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Başvuru belgesi sil
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteApplicationDocument = async (req, res) => {
  try {
    const { application_id, document_id } = req.params;
    const user_id = req.user.id;

    // Başvuruyu kontrol et ve kullanıcıya ait olduğunu doğrula
    const applicationResult = await pool.query(
      "SELECT * FROM applications WHERE application_id = $1 AND user_id = $2",
      [application_id, user_id]
    );

    if (applicationResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Başvuru bulunamadı veya erişim yetkiniz yok" });
    }

    // Başvuru durumunu kontrol et
    if (applicationResult.rows[0].durum !== "beklemede") {
      return res.status(400).json({
        message: "Sadece beklemede olan başvurulardan belge silinebilir",
      });
    }

    // Belgeyi kontrol et
    const documentResult = await pool.query(
      "SELECT * FROM application_documents WHERE application_id = $1 AND document_id = $2",
      [application_id, document_id]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ message: "Belge bulunamadı" });
    }

    // Dosyayı Firebase'den sil
    const fileURL = documentResult.rows[0].dosya_url;
    if (fileURL) {
      await storageService.deleteFile(fileURL);
    }

    // Belgeyi veritabanından sil
    await pool.query(
      "DELETE FROM application_documents WHERE application_id = $1 AND document_id = $2",
      [application_id, document_id]
    );

    // Puanı yeniden hesapla
    await pointCalculationService.calculatePoints(application_id);

    res.json({ message: "Belge başarıyla silindi" });
  } catch (error) {
    console.error("Delete application document error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Başvuruyu tamamla (Aday)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.submitApplication = async (req, res) => {
  const client = await pool.connect();

  try {
    const { application_id } = req.params;
    const user_id = req.user.id;

    // Başvuruyu kontrol et ve kullanıcıya ait olduğunu doğrula
    const applicationResult = await client.query(
      "SELECT a.*, i.kadro_id FROM applications a JOIN announcements i ON a.ilan_id = i.ilan_id WHERE a.application_id = $1 AND a.user_id = $2",
      [application_id, user_id]
    );

    if (applicationResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Başvuru bulunamadı veya erişim yetkiniz yok" });
    }

    const application = applicationResult.rows[0];

    // Başvuru durumunu kontrol et
    if (application.durum !== "beklemede") {
      return res.status(400).json({ message: "Bu başvuru zaten tamamlanmış" });
    }

    // Kadro türünü belirle
    const kadro_id = application.kadro_id;

    // Kadro bilgilerini getir
    const kadroResult = await client.query(
      "SELECT * FROM kadrolar WHERE kadro_id = $1",
      [kadro_id]
    );
    const kadro = kadroResult.rows[0];

    // Zorunlu belgeleri getir
    const requiredDocumentsResult = await client.query(
      `
      SELECT c.document_id
      FROM criteria c
      WHERE c.ilan_id = $1 AND c.required = true
    `,
      [application.ilan_id]
    );

    // Yüklenen belgeleri getir
    const uploadedDocumentsResult = await client.query(
      `
      SELECT document_id
      FROM application_documents
      WHERE application_id = $1
    `,
      [application_id]
    );

    const uploadedDocumentIds = uploadedDocumentsResult.rows.map(
      (doc) => doc.document_id
    );

    // Eksik zorunlu belge kontrolü
    const missingRequiredDocs = [];

    for (const doc of requiredDocumentsResult.rows) {
      if (!uploadedDocumentIds.includes(doc.document_id)) {
        // Belgenin adını getir
        const docNameResult = await client.query(
          "SELECT document_type FROM documents WHERE document_id = $1",
          [doc.document_id]
        );
        missingRequiredDocs.push(docNameResult.rows[0].document_type);
      }
    }

    if (missingRequiredDocs.length > 0) {
      return res.status(400).json({
        message: "Zorunlu belgeler eksik",
        missing_documents: missingRequiredDocs,
      });
    }

    // Puanlama kontrolü
    const pointResult = await client.query(
      `
      SELECT * FROM point_calculations
      WHERE application_id = $1
    `,
      [application_id]
    );

    // Puan hesaplaması yoksa, yap
    if (pointResult.rows.length === 0) {
      await pointCalculationService.calculatePoints(application_id);
    }

    // En güncel puanı getir
    const latestPointResult = await client.query(
      `
      SELECT * FROM point_calculations
      WHERE application_id = $1
      ORDER BY calculation_date DESC
      LIMIT 1
    `,
      [application_id]
    );

    const pointCalculation = latestPointResult.rows[0];

    // Yönetmeliğe göre minimum puanları sağlıyor mu?
    const isCriteriaFulfilled =
      await pointCalculationService.checkCriteriaFulfillment(application_id);

    if (!isCriteriaFulfilled.success) {
      return res.status(400).json({
        message: "Minimum başvuru kriterleri sağlanmadı",
        details: isCriteriaFulfilled.details,
      });
    }

    // Tablo 5'i oluştur
    const tablo5URL = await pdfService.generateTablo5(application_id);

    // Başvuruyu tamamla
    await client.query(
      `
      UPDATE applications
      SET 
        durum = 'incelemede',
        submitted_at = NOW(),
        tablo5_url = $1,
        total_point = $2
      WHERE application_id = $3
    `,
      [tablo5URL, pointCalculation.toplam_puan, application_id]
    );

    // Admin ve yöneticilere bildirim gönder
    const adminManagerResult = await client.query(`
      SELECT u.user_id
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE r.role_name IN ('admin', 'yonetici')
    `);

    // Başvuru yapan kullanıcı bilgilerini getir
    const userResult = await client.query(
      `
      SELECT ad, soyad FROM users WHERE user_id = $1
    `,
      [user_id]
    );

    const user = userResult.rows[0];

    // İlan bilgilerini getir
    const detailsResult = await client.query(
      `
      SELECT f.faculty_ad, d.departman_ad, k.kadro_ad
      FROM announcements a
      JOIN faculties f ON a.faculty_id = f.faculty_id
      JOIN departmanlar d ON a.departman_id = d.departman_id
      JOIN kadrolar k ON a.kadro_id = k.kadro_id
      WHERE a.ilan_id = $1
    `,
      [application.ilan_id]
    );

    const details = detailsResult.rows[0];

    // Admin ve yöneticilere bildirim gönder
    for (const recipient of adminManagerResult.rows) {
      await notificationService.sendNotification({
        user_id: recipient.user_id,
        mesaj: `Başvuru tamamlandı: ${user.ad} ${user.soyad} tarafından ${details.faculty_ad} - ${details.departman_ad} ${details.kadro_ad} ilanına yapılan başvuru tamamlandı ve incelemeye alındı.`,
        tip: "bilgi",
        link: `/manager/applications/${application_id}`,
      });
    }

    // Başvurana bildirim gönder
    await notificationService.sendNotification({
      user_id: user_id,
      mesaj: `Başvurunuz tamamlandı: ${details.faculty_ad} - ${details.departman_ad} ${details.kadro_ad} ilanına yaptığınız başvuru incelemeye alındı.`,
      tip: "bilgi",
      link: `/applicant/applications/${application_id}`,
    });

    res.json({
      message: "Başvuru başarıyla tamamlandı ve incelemeye alındı",
      application_id,
      tablo5_url: tablo5URL,
      total_point: pointCalculation.toplam_puan,
    });
  } catch (error) {
    console.error("Submit application error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};

/**
 * Başvuru durumunu değiştir (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { durum, notes } = req.body;

    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    // Başvuruyu kontrol et
    const applicationResult = await pool.query(
      "SELECT * FROM applications WHERE application_id = $1",
      [application_id]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    const application = applicationResult.rows[0];

    // Durum kontrolü (sadece incelemede olan başvurular değiştirilebilir)
    if (application.durum !== "incelemede") {
      return res.status(400).json({
        message: "Sadece incelemede olan başvuruların durumu değiştirilebilir",
      });
    }

    // Durum değerini kontrol et
    const validStatusValues = ["onaylandı", "reddedildi"];
    if (!validStatusValues.includes(durum)) {
      return res.status(400).json({ message: "Geçersiz durum değeri" });
    }

    // Başvuruyu güncelle
    await pool.query(
      `
      UPDATE applications
      SET durum = $1, admin_notes = $2, updated_at = NOW(), updated_by = $3
      WHERE application_id = $4
    `,
      [durum, notes, req.user.id, application_id]
    );

    // Başvuru sahibine bildirim gönder
    const detailsResult = await pool.query(
      `
      SELECT f.faculty_ad, d.departman_ad, k.kadro_ad
      FROM announcements a
      JOIN applications app ON a.ilan_id = app.ilan_id
      JOIN faculties f ON a.faculty_id = f.faculty_id
      JOIN departmanlar d ON a.departman_id = d.departman_id
      JOIN kadrolar k ON a.kadro_id = k.kadro_id
      WHERE app.application_id = $1
    `,
      [application_id]
    );

    const details = detailsResult.rows[0];

    let messageText;
    let messageType;

    if (durum === "onaylandı") {
      messageText = `Başvurunuz onaylandı: ${details.faculty_ad} - ${details.departman_ad} ${details.kadro_ad} ilanına yaptığınız başvuru onaylandı.`;
      messageType = "başarı";
    } else {
      messageText = `Başvurunuz reddedildi: ${details.faculty_ad} - ${details.departman_ad} ${details.kadro_ad} ilanına yaptığınız başvuru reddedildi.`;
      messageType = "hata";
    }

    await notificationService.sendNotification({
      user_id: application.user_id,
      mesaj: messageText,
      tip: messageType,
      link: `/applicant/applications/${application_id}`,
    });

    res.json({
      message: `Başvuru durumu başarıyla "${durum}" olarak güncellendi`,
      application_id,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Kullanıcının başvurularını getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getUserApplications = async (req, res) => {
  try {
    const user_id = req.user.id;

    const applicationsResult = await pool.query(
      `
      SELECT a.*, 
             an.ilan_baslik, 
             f.faculty_ad, 
             d.departman_ad, 
             k.kadro_ad,
             pc.toplam_puan
      FROM applications a
      JOIN announcements an ON a.ilan_id = an.ilan_id
      JOIN faculties f ON an.faculty_id = f.faculty_id
      JOIN departmanlar d ON an.departman_id = d.departman_id
      JOIN kadrolar k ON an.kadro_id = k.kadro_id
      LEFT JOIN (
        SELECT pc.application_id, pc.toplam_puan
        FROM point_calculations pc
        JOIN (
          SELECT application_id, MAX(calculation_date) as max_date
          FROM point_calculations
          GROUP BY application_id
        ) latest ON pc.application_id = latest.application_id AND pc.calculation_date = latest.max_date
      ) pc ON a.application_id = pc.application_id
      WHERE a.user_id = $1
      ORDER BY a.basvuru_tarihi DESC
    `,
      [user_id]
    );

    res.json({
      applications: applicationsResult.rows,
    });
  } catch (error) {
    console.error("Get user applications error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * İlana yapılan tüm başvuruları getir (Yönetici/Admin)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAnnouncementApplications = async (req, res) => {
  try {
    const { ilan_id } = req.params;

    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    // İlanı kontrol et
    const announcementResult = await pool.query(
      "SELECT * FROM announcements WHERE ilan_id = $1",
      [ilan_id]
    );

    if (announcementResult.rows.length === 0) {
      return res.status(404).json({ message: "İlan bulunamadı" });
    }

    // İlana yapılan başvuruları getir
    const applicationsResult = await pool.query(
      `
      SELECT a.*,
             u.ad, u.soyad, u.email,
             pc.toplam_puan,
             (SELECT COUNT(*) FROM application_documents WHERE application_id = a.application_id) as document_count,
             (SELECT COUNT(*) FROM evaluations WHERE application_id = a.application_id) as evaluation_count
      FROM applications a
      JOIN users u ON a.user_id = u.user_id
      LEFT JOIN (
        SELECT pc.application_id, pc.toplam_puan
        FROM point_calculations pc
        JOIN (
          SELECT application_id, MAX(calculation_date) as max_date
          FROM point_calculations
          GROUP BY application_id
        ) latest ON pc.application_id = latest.application_id AND pc.calculation_date = latest.max_date
      ) pc ON a.application_id = pc.application_id
      WHERE a.ilan_id = $1
      ORDER BY a.basvuru_tarihi DESC
    `,
      [ilan_id]
    );

    res.json({
      ilan_id,
      applications: applicationsResult.rows,
    });
  } catch (error) {
    console.error("Get announcement applications error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Başvuru detaylarını getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getApplicationById = async (req, res) => {
  try {
    const { application_id } = req.params;
    const user_id = req.user.id;

    // Başvuruyu getir
    const applicationResult = await pool.query(
      `
      SELECT a.*,
             u.ad, u.soyad, u.email, u.telefon,
             an.ilan_baslik, an.ilan_aciklama,
             f.faculty_ad, d.departman_ad, k.kadro_ad,
             an.baslangic_tarih, an.bitis_tarih
      FROM applications a
      JOIN users u ON a.user_id = u.user_id
      JOIN announcements an ON a.ilan_id = an.ilan_id
      JOIN faculties f ON an.faculty_id = f.faculty_id
      JOIN departmanlar d ON an.departman_id = d.departman_id
      JOIN kadrolar k ON an.kadro_id = k.kadro_id
      WHERE a.application_id = $1
    `,
      [application_id]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    const application = applicationResult.rows[0];

    // Erişim kontrolü
    if (
      application.user_id !== user_id &&
      req.user.role !== "admin" &&
      req.user.role !== "yonetici" &&
      req.user.role !== "juri"
    ) {
      return res
        .status(403)
        .json({ message: "Bu başvuruya erişim yetkiniz yok" });
    }

    // Puanlama bilgilerini getir
    const pointResult = await pool.query(
      `
      SELECT *
      FROM point_calculations
      WHERE application_id = $1
      ORDER BY calculation_date DESC
      LIMIT 1
    `,
      [application_id]
    );

    // Belgeleri getir
    const documentsResult = await pool.query(
      `
      SELECT ad.*, d.document_type, d.puan, dc.category_code, dc.category_name
      FROM application_documents ad
      JOIN documents d ON ad.document_id = d.document_id
      JOIN document_categories dc ON d.category_id = dc.category_id
      WHERE ad.application_id = $1
      ORDER BY dc.category_code, d.document_type
    `,
      [application_id]
    );

    // Değerlendirmeleri getir (yönetici, admin veya jüri üyesi ise)
    let evaluations = [];
    if (
      req.user.role === "admin" ||
      req.user.role === "yonetici" ||
      req.user.role === "juri"
    ) {
      const evaluationsResult = await pool.query(
        `
        SELECT e.*, j.ad, j.soyad, j.unvan
        FROM evaluations e
        JOIN jury_members j ON e.jury_id = j.jury_id
        WHERE e.application_id = $1
        ORDER BY e.tarih DESC
      `,
        [application_id]
      );

      evaluations = evaluationsResult.rows;
    }

    res.json({
      application,
      points: pointResult.rows[0] || null,
      documents: documentsResult.rows,
      evaluations: evaluations,
    });
  } catch (error) {
    console.error("Get application by id error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Başvuruların istatistiklerini getir (Yönetici/Admin)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getApplicationStats = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    // Toplam başvuru sayısı
    const totalResult = await pool.query(
      "SELECT COUNT(*) as total FROM applications"
    );

    // Durum bazında başvuru sayıları
    const statusResult = await pool.query(`
      SELECT durum, COUNT(*) as count 
      FROM applications 
      GROUP BY durum
    `);

    // Fakülte bazında başvuru sayıları
    const facultyResult = await pool.query(`
      SELECT f.faculty_ad, COUNT(*) as count 
      FROM applications a
      JOIN announcements an ON a.ilan_id = an.ilan_id
      JOIN faculties f ON an.faculty_id = f.faculty_id
      GROUP BY f.faculty_ad
      ORDER BY count DESC
    `);

    // Kadro bazında başvuru sayıları
    const positionResult = await pool.query(`
      SELECT k.kadro_ad, COUNT(*) as count 
      FROM applications a
      JOIN announcements an ON a.ilan_id = an.ilan_id
      JOIN kadrolar k ON an.kadro_id = k.kadro_id
      GROUP BY k.kadro_ad
      ORDER BY count DESC
    `);

    // Son 7 gün içindeki başvuru sayıları
    const last7DaysResult = await pool.query(`
      SELECT date_trunc('day', basvuru_tarihi) as date, COUNT(*) as count
      FROM applications
      WHERE basvuru_tarihi > NOW() - INTERVAL '7 days'
      GROUP BY date_trunc('day', basvuru_tarihi)
      ORDER BY date
    `);

    res.json({
      total: parseInt(totalResult.rows[0].total),
      byStatus: statusResult.rows,
      byFaculty: facultyResult.rows,
      byPosition: positionResult.rows,
      last7Days: last7DaysResult.rows,
    });
  } catch (error) {
    console.error("Get application stats error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
