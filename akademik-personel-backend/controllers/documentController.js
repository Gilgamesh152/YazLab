const { pool } = require("../config/db");
const storageService = require("../services/storageService");

/**
 * Belge listesini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAllDocuments = async (req, res) => {
  try {
    const { category_id } = req.query;

    let query = `
      SELECT d.*, dc.category_code, dc.category_name
      FROM documents d
      JOIN document_categories dc ON d.category_id = dc.category_id
    `;

    const queryParams = [];

    if (category_id) {
      query += " WHERE d.category_id = $1";
      queryParams.push(category_id);
    }

    query += " ORDER BY dc.category_code, d.document_type";

    const result = await pool.query(query, queryParams);

    res.json({ documents: result.rows });
  } catch (error) {
    console.error("Get all documents error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Belge kategorilerini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM document_categories
      ORDER BY category_code
    `);

    res.json({ categories: result.rows });
  } catch (error) {
    console.error("Get all categories error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Belge detayını getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT d.*, dc.category_code, dc.category_name
      FROM documents d
      JOIN document_categories dc ON d.category_id = dc.category_id
      WHERE d.document_id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Belge bulunamadı" });
    }

    res.json({ document: result.rows[0] });
  } catch (error) {
    console.error("Get document by id error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Belge güncelle (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateDocument = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { id } = req.params;
    const { document_type, category_id, puan, description } = req.body;

    // Belge türünü kontrol et
    if (!document_type || document_type.trim() === "") {
      return res.status(400).json({ message: "Belge türü zorunludur" });
    }

    // Kategori ID'sini kontrol et
    if (!category_id) {
      return res.status(400).json({ message: "Kategori ID zorunludur" });
    }

    // Puanı kontrol et
    if (puan === undefined || puan === null) {
      return res.status(400).json({ message: "Puan zorunludur" });
    }

    // Belgeyi kontrol et
    const documentResult = await pool.query(
      "SELECT * FROM documents WHERE document_id = $1",
      [id]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ message: "Belge bulunamadı" });
    }

    // Kategoriyi kontrol et
    const categoryResult = await pool.query(
      "SELECT * FROM document_categories WHERE category_id = $1",
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ message: "Kategori bulunamadı" });
    }

    // Belge türünün benzersiz olduğunu kontrol et (kendi ID'si dışında)
    const existingDocumentResult = await pool.query(
      "SELECT * FROM documents WHERE document_type = $1 AND document_id != $2",
      [document_type, id]
    );

    if (existingDocumentResult.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Bu belge türü zaten kullanılıyor" });
    }

    // Belge türünü güncelle
    const updateResult = await pool.query(
      `
      UPDATE documents
      SET document_type = $1, category_id = $2, puan = $3, description = $4
      WHERE document_id = $5
      RETURNING *
    `,
      [document_type, category_id, puan, description, id]
    );

    // Kategori bilgisini de getir
    const documentWithCategory = {
      ...updateResult.rows[0],
      category_code: categoryResult.rows[0].category_code,
      category_name: categoryResult.rows[0].category_name,
    };

    res.json({
      message: "Belge türü başarıyla güncellendi",
      document: documentWithCategory,
    });
  } catch (error) {
    console.error("Update document error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Belge sil (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteDocument = async (req, res) => {
  const client = await pool.connect();

  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { id } = req.params;

    // Belgeyi kontrol et
    const documentResult = await client.query(
      "SELECT * FROM documents WHERE document_id = $1",
      [id]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ message: "Belge bulunamadı" });
    }

    // Belgenin kriterler tablosunda kullanılıp kullanılmadığını kontrol et
    const criteriaCheck = await client.query(
      "SELECT COUNT(*) FROM criteria WHERE document_id = $1",
      [id]
    );

    if (parseInt(criteriaCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Bu belge türü kriterlerde kullanıldığı için silinemez",
      });
    }

    // Belgenin başvuru belgeleri tablosunda kullanılıp kullanılmadığını kontrol et
    const applicationDocumentCheck = await client.query(
      "SELECT COUNT(*) FROM application_documents WHERE document_id = $1",
      [id]
    );

    if (parseInt(applicationDocumentCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Bu belge türü başvurularda kullanıldığı için silinemez",
      });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Belgeyi sil
    await client.query("DELETE FROM documents WHERE document_id = $1", [id]);

    // İşlemi tamamla
    await client.query("COMMIT");

    res.json({
      message: "Belge türü başarıyla silindi",
      document_id: id,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Delete document error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};

/**
 * Kategori güncelle (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateCategory = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { id } = req.params;
    const { category_code, category_name, description } = req.body;

    // Kategori kodunu kontrol et
    if (!category_code || category_code.trim() === "") {
      return res.status(400).json({ message: "Kategori kodu zorunludur" });
    }

    // Kategori adını kontrol et
    if (!category_name || category_name.trim() === "") {
      return res.status(400).json({ message: "Kategori adı zorunludur" });
    }

    // Kategoriyi kontrol et
    const categoryResult = await pool.query(
      "SELECT * FROM document_categories WHERE category_id = $1",
      [id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ message: "Kategori bulunamadı" });
    }

    // Kategori kodunun benzersiz olduğunu kontrol et (kendi ID'si dışında)
    const existingCategoryResult = await pool.query(
      "SELECT * FROM document_categories WHERE category_code = $1 AND category_id != $2",
      [category_code, id]
    );

    if (existingCategoryResult.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Bu kategori kodu zaten kullanılıyor" });
    }

    // Kategoriyi güncelle
    const updateResult = await pool.query(
      `
      UPDATE document_categories
      SET category_code = $1, category_name = $2, description = $3
      WHERE category_id = $4
      RETURNING *
    `,
      [category_code, category_name, description, id]
    );

    res.json({
      message: "Kategori başarıyla güncellendi",
      category: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Kategori sil (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteCategory = async (req, res) => {
  const client = await pool.connect();

  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { id } = req.params;

    // Kategoriyi kontrol et
    const categoryResult = await client.query(
      "SELECT * FROM document_categories WHERE category_id = $1",
      [id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ message: "Kategori bulunamadı" });
    }

    // Kategoriye ait belgelerin olup olmadığını kontrol et
    const documentsCheck = await client.query(
      "SELECT COUNT(*) FROM documents WHERE category_id = $1",
      [id]
    );

    if (parseInt(documentsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Bu kategoriye ait belgeler olduğu için silinemez",
      });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Kategoriyi sil
    await client.query(
      "DELETE FROM document_categories WHERE category_id = $1",
      [id]
    );

    // İşlemi tamamla
    await client.query("COMMIT");

    res.json({
      message: "Kategori başarıyla silindi",
      category_id: id,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};

/**
 * Belge dosyasını görüntüle (Firebase URL'ini al)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.viewDocument = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { application_id } = req.query;

    // Belgenin varlığını kontrol et
    const documentResult = await pool.query(
      `
      SELECT ad.*, d.document_type
      FROM application_documents ad
      JOIN documents d ON ad.document_id = d.document_id
      WHERE ad.application_id = $1 AND ad.document_id = $2
    `,
      [application_id, document_id]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ message: "Belge bulunamadı" });
    }

    const document = documentResult.rows[0];

    // Başvuru sahibi veya yetkili mi kontrol et
    const applicationResult = await pool.query(
      "SELECT user_id FROM applications WHERE application_id = $1",
      [application_id]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    const application = applicationResult.rows[0];

    if (
      application.user_id !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "yönetici" &&
      req.user.role !== "jüri üyesi"
    ) {
      return res
        .status(403)
        .json({ message: "Bu belgeye erişim yetkiniz yok" });
    }

    // Firebase Storage URL'i döndür
    res.json({
      document_id,
      application_id,
      document_type: document.document_type,
      file_url: document.dosya_url,
      is_baslica_yazar: document.is_baslica_yazar,
      description: document.description,
      uploaded_at: document.uploaded_at,
    });
  } catch (error) {
    console.error("View document error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
/**
 * Kategori detayını getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM document_categories WHERE category_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Kategori bulunamadı" });
    }

    res.json({ category: result.rows[0] });
  } catch (error) {
    console.error("Get category by id error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Kategori bazında belgeleri getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getDocumentsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Kategoriyi kontrol et
    const categoryResult = await pool.query(
      "SELECT * FROM document_categories WHERE category_id = $1",
      [categoryId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ message: "Kategori bulunamadı" });
    }

    const documentsResult = await pool.query(
      `
      SELECT *
      FROM documents
      WHERE category_id = $1
      ORDER BY document_type
    `,
      [categoryId]
    );

    res.json({
      category: categoryResult.rows[0],
      documents: documentsResult.rows,
    });
  } catch (error) {
    console.error("Get documents by category error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Belge puanını güncelle (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateDocumentPoints = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yönetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { id } = req.params;
    const { puan } = req.body;

    // Puan değerini doğrula
    if (puan === undefined || puan === null || isNaN(puan)) {
      return res.status(400).json({ message: "Geçerli bir puan girmelisiniz" });
    }

    // Belgeyi kontrol et
    const documentResult = await pool.query(
      "SELECT * FROM documents WHERE document_id = $1",
      [id]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ message: "Belge bulunamadı" });
    }

    // Belge puanını güncelle
    const updateResult = await pool.query(
      `
      UPDATE documents
      SET puan = $1
      WHERE document_id = $2
      RETURNING *
    `,
      [puan, id]
    );

    res.json({
      message: "Belge puanı başarıyla güncellendi",
      document: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Update document points error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Belge doğrula (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.verifyDocument = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yönetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { id } = req.params;
    const { is_verified, verification_notes } = req.body;

    // Doğrulama değerini kontrol et
    if (is_verified === undefined) {
      return res
        .status(400)
        .json({ message: "Doğrulama durumu belirtilmemiş" });
    }

    // Belge dosyasını kontrol et
    const documentResult = await pool.query(
      `
      SELECT ad.*, d.document_type, a.user_id
      FROM application_documents ad
      JOIN documents d ON ad.document_id = d.document_id
      JOIN applications a ON ad.application_id = a.application_id
      WHERE ad.application_document_id = $1
    `,
      [id]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ message: "Belge bulunamadı" });
    }

    const document = documentResult.rows[0];

    // Belge doğrulamasını güncelle
    const updateResult = await pool.query(
      `
      UPDATE application_documents
      SET is_verified = $1, verification_notes = $2, verified_at = NOW(), verified_by = $3
      WHERE application_document_id = $4
      RETURNING *
    `,
      [is_verified, verification_notes, req.user.id, id]
    );

    // Başvuru sahibine bildirim gönder
    await notificationService.sendNotification({
      user_id: document.user_id,
      mesaj: `${document.document_type} belgeniz ${
        is_verified ? "doğrulandı" : "reddedildi"
      }${verification_notes ? ": " + verification_notes : ""}`,
      tip: "bilgi",
      link: `/applicant/applications`,
    });

    res.json({
      message: "Belge doğrulama durumu güncellendi",
      document: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Verify document error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
