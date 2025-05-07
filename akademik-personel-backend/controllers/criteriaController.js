const { pool } = require("../config/db");
const { validateCriteriaData } = require("../utils/validators");

/**
 * Başvuru kriterlerini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getCriteria = async (req, res) => {
  try {
    const { faculty_id, departman_id, kadro_id } = req.query;

    // Filtreleme parametreleri için koşullar oluştur
    const conditions = [];
    const queryParams = [];

    if (faculty_id) {
      conditions.push(`c.faculty_id = $${queryParams.length + 1}`);
      queryParams.push(faculty_id);
    }

    if (departman_id) {
      conditions.push(`c.departman_id = $${queryParams.length + 1}`);
      queryParams.push(departman_id);
    }

    if (kadro_id) {
      conditions.push(`c.kadro_id = $${queryParams.length + 1}`);
      queryParams.push(kadro_id);
    }

    // Sorgu oluştur
    let query = `
      SELECT c.*, f.faculty_ad, d.departman_ad, k.kadro_ad
      FROM criteria c
      JOIN faculties f ON c.faculty_id = f.faculty_id
      JOIN departmanlar d ON c.departman_id = d.departman_id
      JOIN kadrolar k ON c.kadro_id = k.kadro_id
    `;

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY c.faculty_id, c.departman_id, c.kadro_id";

    const result = await pool.query(query, queryParams);

    res.json({ criteria: result.rows });
  } catch (error) {
    console.error("Get criteria error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * İlana ait başvuru kriterlerini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAnnouncementCriteria = async (req, res) => {
  try {
    const { ilan_id } = req.params;

    // İlanı kontrol et
    const announcementResult = await pool.query(
      "SELECT * FROM announcements WHERE ilan_id = $1",
      [ilan_id]
    );

    if (announcementResult.rows.length === 0) {
      return res.status(404).json({ message: "İlan bulunamadı" });
    }

    const announcement = announcementResult.rows[0];

    // İlana ait kriterleri getir
    const criteriaResult = await pool.query(
      `
      SELECT c.*, d.document_type, d.puan, dc.category_code, dc.category_name
      FROM criteria c
      JOIN documents d ON c.document_id = d.document_id
      JOIN document_categories dc ON d.category_id = dc.category_id
      WHERE c.ilan_id = $1
      ORDER BY dc.category_code, d.document_type
    `,
      [ilan_id]
    );

    // İlana ait minimum puanları getir
    const minPointsResult = await pool.query(
      `
      SELECT category_code, min_puan
      FROM criteria_min_points
      WHERE ilan_id = $1
      ORDER BY category_code
    `,
      [ilan_id]
    );

    // İlana ait diğer gereksinimleri getir
    const requirementsResult = await pool.query(
      `
      SELECT r.*, rt.requirement_type
      FROM criteria_requirements r
      JOIN requirement_types rt ON r.requirement_type_id = rt.requirement_type_id
      WHERE r.ilan_id = $1
      ORDER BY r.requirement_type_id
    `,
      [ilan_id]
    );

    res.json({
      ilan_id,
      faculty_id: announcement.faculty_id,
      departman_id: announcement.departman_id,
      kadro_id: announcement.kadro_id,
      criteria: criteriaResult.rows,
      min_points: minPointsResult.rows,
      requirements: requirementsResult.rows,
    });
  } catch (error) {
    console.error("Get announcement criteria error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Kadro/Fakülte/Bölüm bazlı temel başvuru kriterlerini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getBaseCriteria = async (req, res) => {
  try {
    const { faculty_id, departman_id, kadro_id } = req.params;

    // Fakülte, bölüm ve kadro bilgilerini kontrol et
    const facultyResult = await pool.query(
      "SELECT * FROM faculties WHERE faculty_id = $1",
      [faculty_id]
    );

    if (facultyResult.rows.length === 0) {
      return res.status(404).json({ message: "Fakülte bulunamadı" });
    }

    const departmentResult = await pool.query(
      "SELECT * FROM departmanlar WHERE departman_id = $1",
      [departman_id]
    );

    if (departmentResult.rows.length === 0) {
      return res.status(404).json({ message: "Bölüm bulunamadı" });
    }

    const positionResult = await pool.query(
      "SELECT * FROM kadrolar WHERE kadro_id = $1",
      [kadro_id]
    );

    if (positionResult.rows.length === 0) {
      return res.status(404).json({ message: "Akademik kadro bulunamadı" });
    }

    // Yönetmeliğe göre asgari kriterleri getir
    const baseCriteriaResult = await pool.query(
      `
      SELECT bc.*, d.document_type, d.puan, dc.category_code, dc.category_name
      FROM base_criteria bc
      JOIN documents d ON bc.document_id = d.document_id
      JOIN document_categories dc ON d.category_id = dc.category_id
      WHERE bc.faculty_id = $1 AND bc.departman_id = $2 AND bc.kadro_id = $3
      ORDER BY dc.category_code, d.document_type
    `,
      [faculty_id, departman_id, kadro_id]
    );

    // Minimum puanları getir
    const minPointsResult = await pool.query(
      `
      SELECT category_code, min_puan
      FROM base_criteria_min_points
      WHERE faculty_id = $1 AND departman_id = $2 AND kadro_id = $3
      ORDER BY category_code
    `,
      [faculty_id, departman_id, kadro_id]
    );

    // Diğer gereksinimleri getir
    const requirementsResult = await pool.query(
      `
      SELECT r.*, rt.requirement_type
      FROM base_criteria_requirements r
      JOIN requirement_types rt ON r.requirement_type_id = rt.requirement_type_id
      WHERE r.faculty_id = $1 AND r.departman_id = $2 AND r.kadro_id = $3
      ORDER BY r.requirement_type_id
    `,
      [faculty_id, departman_id, kadro_id]
    );

    res.json({
      faculty_id,
      departman_id,
      kadro_id,
      faculty_ad: facultyResult.rows[0].faculty_ad,
      departman_ad: departmentResult.rows[0].departman_ad,
      kadro_ad: positionResult.rows[0].kadro_ad,
      criteria: baseCriteriaResult.rows,
      min_points: minPointsResult.rows,
      requirements: requirementsResult.rows,
    });
  } catch (error) {
    console.error("Get base criteria error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * İlana başvuru kriterleri ekle (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createAnnouncementCriteria = async (req, res) => {
  const client = await pool.connect();

  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { ilan_id } = req.params;
    const { criteria, min_points, requirements } = req.body;

    // İlanı kontrol et
    const announcementResult = await client.query(
      "SELECT * FROM announcements WHERE ilan_id = $1",
      [ilan_id]
    );

    if (announcementResult.rows.length === 0) {
      return res.status(404).json({ message: "İlan bulunamadı" });
    }

    const announcement = announcementResult.rows[0];

    // Verileri doğrula
    const { error } = validateCriteriaData(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Başvuru kontrolü
    const applicationsCheck = await client.query(
      "SELECT COUNT(*) FROM applications WHERE ilan_id = $1",
      [ilan_id]
    );

    if (parseInt(applicationsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message:
          "Bu ilana yapılmış başvurular olduğu için kriterler güncellenemez",
      });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Mevcut kriterleri temizle
    await client.query("DELETE FROM criteria WHERE ilan_id = $1", [ilan_id]);
    await client.query("DELETE FROM criteria_min_points WHERE ilan_id = $1", [
      ilan_id,
    ]);
    await client.query("DELETE FROM criteria_requirements WHERE ilan_id = $1", [
      ilan_id,
    ]);

    // Yeni kriterleri ekle
    if (criteria && criteria.length > 0) {
      for (const criterion of criteria) {
        await client.query(
          `
          INSERT INTO criteria (ilan_id, faculty_id, departman_id, kadro_id, document_id, required, min_count)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
          [
            ilan_id,
            announcement.faculty_id,
            announcement.departman_id,
            announcement.kadro_id,
            criterion.document_id,
            criterion.required || false,
            criterion.min_count || 1,
          ]
        );
      }
    }

    // Minimum puanları ekle
    if (min_points && min_points.length > 0) {
      for (const minPoint of min_points) {
        await client.query(
          `
          INSERT INTO criteria_min_points (ilan_id, category_code, min_puan)
          VALUES ($1, $2, $3)
        `,
          [ilan_id, minPoint.category_code, minPoint.min_puan]
        );
      }
    }

    // Diğer gereksinimleri ekle
    if (requirements && requirements.length > 0) {
      for (const requirement of requirements) {
        await client.query(
          `
          INSERT INTO criteria_requirements (ilan_id, requirement_type_id, requirement_value)
          VALUES ($1, $2, $3)
        `,
          [
            ilan_id,
            requirement.requirement_type_id,
            requirement.requirement_value,
          ]
        );
      }
    }

    // İşlemi tamamla
    await client.query("COMMIT");

    res.json({
      message: "Başvuru kriterleri başarıyla eklendi",
      ilan_id,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Create announcement criteria error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};

/**
 * Temel başvuru kriterlerini oluştur/güncelle (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateBaseCriteria = async (req, res) => {
  const client = await pool.connect();

  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { faculty_id, departman_id, kadro_id } = req.params;
    const { criteria, min_points, requirements } = req.body;

    // Fakülte, bölüm ve kadro bilgilerini kontrol et
    const facultyResult = await client.query(
      "SELECT * FROM faculties WHERE faculty_id = $1",
      [faculty_id]
    );

    if (facultyResult.rows.length === 0) {
      return res.status(404).json({ message: "Fakülte bulunamadı" });
    }

    const departmentResult = await client.query(
      "SELECT * FROM departmanlar WHERE departman_id = $1",
      [departman_id]
    );

    if (departmentResult.rows.length === 0) {
      return res.status(404).json({ message: "Bölüm bulunamadı" });
    }

    const positionResult = await client.query(
      "SELECT * FROM kadrolar WHERE kadro_id = $1",
      [kadro_id]
    );

    if (positionResult.rows.length === 0) {
      return res.status(404).json({ message: "Akademik kadro bulunamadı" });
    }

    // Verileri doğrula
    const { error } = validateCriteriaData(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Mevcut kriterleri temizle
    await client.query(
      "DELETE FROM base_criteria WHERE faculty_id = $1 AND departman_id = $2 AND kadro_id = $3",
      [faculty_id, departman_id, kadro_id]
    );
    await client.query(
      "DELETE FROM base_criteria_min_points WHERE faculty_id = $1 AND departman_id = $2 AND kadro_id = $3",
      [faculty_id, departman_id, kadro_id]
    );
    await client.query(
      "DELETE FROM base_criteria_requirements WHERE faculty_id = $1 AND departman_id = $2 AND kadro_id = $3",
      [faculty_id, departman_id, kadro_id]
    );

    // Yeni kriterleri ekle
    if (criteria && criteria.length > 0) {
      for (const criterion of criteria) {
        await client.query(
          `
          INSERT INTO base_criteria (faculty_id, departman_id, kadro_id, document_id, required, min_count)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            faculty_id,
            departman_id,
            kadro_id,
            criterion.document_id,
            criterion.required || false,
            criterion.min_count || 1,
          ]
        );
      }
    }

    // Minimum puanları ekle
    if (min_points && min_points.length > 0) {
      for (const minPoint of min_points) {
        await client.query(
          `
          INSERT INTO base_criteria_min_points (faculty_id, departman_id, kadro_id, category_code, min_puan)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [
            faculty_id,
            departman_id,
            kadro_id,
            minPoint.category_code,
            minPoint.min_puan,
          ]
        );
      }
    }

    // Diğer gereksinimleri ekle
    if (requirements && requirements.length > 0) {
      for (const requirement of requirements) {
        await client.query(
          `
          INSERT INTO base_criteria_requirements (faculty_id, departman_id, kadro_id, requirement_type_id, requirement_value)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [
            faculty_id,
            departman_id,
            kadro_id,
            requirement.requirement_type_id,
            requirement.requirement_value,
          ]
        );
      }
    }

    // İşlemi tamamla
    await client.query("COMMIT");

    res.json({
      message: "Temel başvuru kriterleri başarıyla güncellendi",
      faculty_id,
      departman_id,
      kadro_id,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Update base criteria error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};

/**
 * Temel belge türlerini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getDocumentTypes = async (req, res) => {
  try {
    // Belge kategorilerini getir
    const categoriesResult = await pool.query(`
      SELECT * FROM document_categories
      ORDER BY category_code
    `);

    // Belge türlerini getir
    const documentsResult = await pool.query(`
      SELECT d.*, dc.category_code, dc.category_name
      FROM documents d
      JOIN document_categories dc ON d.category_id = dc.category_id
      ORDER BY dc.category_code, d.document_type
    `);

    // Gereksinim türlerini getir
    const requirementTypesResult = await pool.query(`
      SELECT * FROM requirement_types
      ORDER BY requirement_type_id
    `);

    res.json({
      categories: categoriesResult.rows,
      documents: documentsResult.rows,
      requirement_types: requirementTypesResult.rows,
    });
  } catch (error) {
    console.error("Get document types error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Belge kategorisi ekle (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.addDocumentCategory = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { category_code, category_name, description } = req.body;

    // Kategori kodunu kontrol et
    if (!category_code || category_code.trim() === "") {
      return res.status(400).json({ message: "Kategori kodu zorunludur" });
    }

    // Kategori adını kontrol et
    if (!category_name || category_name.trim() === "") {
      return res.status(400).json({ message: "Kategori adı zorunludur" });
    }

    // Kategori kodunun benzersiz olduğunu kontrol et
    const existingCategoryResult = await pool.query(
      "SELECT * FROM document_categories WHERE category_code = $1",
      [category_code]
    );

    if (existingCategoryResult.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Bu kategori kodu zaten kullanılıyor" });
    }

    // Kategoriyi ekle
    const result = await pool.query(
      `
      INSERT INTO document_categories (category_code, category_name, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
      [category_code, category_name, description]
    );

    res.status(201).json({
      message: "Belge kategorisi başarıyla eklendi",
      category: result.rows[0],
    });
  } catch (error) {
    console.error("Add document category error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Belge türü ekle (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.addDocumentType = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

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

    // Kategoriyi kontrol et
    const categoryResult = await pool.query(
      "SELECT * FROM document_categories WHERE category_id = $1",
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ message: "Kategori bulunamadı" });
    }

    // Belge türünün benzersiz olduğunu kontrol et
    const existingDocumentResult = await pool.query(
      "SELECT * FROM documents WHERE document_type = $1",
      [document_type]
    );

    if (existingDocumentResult.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Bu belge türü zaten kullanılıyor" });
    }

    // Belge türünü ekle
    const result = await pool.query(
      `
      INSERT INTO documents (document_type, category_id, puan, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [document_type, category_id, puan, description]
    );

    // Kategori bilgisini de getir
    const documentWithCategory = {
      ...result.rows[0],
      category_code: categoryResult.rows[0].category_code,
      category_name: categoryResult.rows[0].category_name,
    };

    res.status(201).json({
      message: "Belge türü başarıyla eklendi",
      document: documentWithCategory,
    });
  } catch (error) {
    console.error("Add document type error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
