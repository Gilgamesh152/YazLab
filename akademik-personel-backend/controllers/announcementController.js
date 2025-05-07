// controllers/announcementController.js
const pool = require("../config/db");
const { validationResult } = require("express-validator");

/**
 * Get all announcements with optional filters
 */
const getAllAnnouncements = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { faculty_id, departman_id, kadro_id, status } = req.query;

    // Base query
    let query = `
      SELECT a.*, f.faculty_ad, d.departman_ad, k.kadro_ad,
        CASE 
          WHEN a.bitis_tarih < CURRENT_DATE THEN 'Kapandı'
          WHEN a.baslangic_tarih > CURRENT_DATE THEN 'Başlamadı'
          ELSE 'Aktif' 
        END as durum
      FROM announcements a
      LEFT JOIN faculties f ON a.faculty_id = f.faculty_id
      LEFT JOIN departmanlar d ON a.departman_id = d.departman_id
      LEFT JOIN kadrolar k ON a.kadro_id = k.kadro_id
      WHERE 1=1
    `;

    const params = [];

    // Add filters if provided
    if (faculty_id) {
      params.push(faculty_id);
      query += ` AND a.faculty_id = $${params.length}`;
    }

    if (departman_id) {
      params.push(departman_id);
      query += ` AND a.departman_id = $${params.length}`;
    }

    if (kadro_id) {
      params.push(kadro_id);
      query += ` AND a.kadro_id = $${params.length}`;
    }

    // Filter by status if provided
    if (status === "active") {
      query += ` AND a.baslangic_tarih <= CURRENT_DATE AND a.bitis_tarih >= CURRENT_DATE`;
    } else if (status === "upcoming") {
      query += ` AND a.baslangic_tarih > CURRENT_DATE`;
    } else if (status === "past") {
      query += ` AND a.bitis_tarih < CURRENT_DATE`;
    }

    // Order by creation date (newest first)
    query += ` ORDER BY a.baslangic_tarih DESC`;

    const { rows } = await pool.query(query, params);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get active announcements
 */
const getActiveAnnouncements = async (req, res) => {
  try {
    const query = `
      SELECT a.*, f.faculty_ad, d.departman_ad, k.kadro_ad
      FROM announcements a
      LEFT JOIN faculties f ON a.faculty_id = f.faculty_id
      LEFT JOIN departmanlar d ON a.departman_id = d.departman_id
      LEFT JOIN kadrolar k ON a.kadro_id = k.kadro_id
      WHERE a.baslangic_tarih <= CURRENT_DATE AND a.bitis_tarih >= CURRENT_DATE
      ORDER BY a.baslangic_tarih DESC
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching active announcements:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get announcements by faculty
 */
const getAnnouncementsByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;

    const query = `
      SELECT a.*, f.faculty_ad, d.departman_ad, k.kadro_ad,
        CASE 
          WHEN a.bitis_tarih < CURRENT_DATE THEN 'Kapandı'
          WHEN a.baslangic_tarih > CURRENT_DATE THEN 'Başlamadı'
          ELSE 'Aktif' 
        END as durum
      FROM announcements a
      LEFT JOIN faculties f ON a.faculty_id = f.faculty_id
      LEFT JOIN departmanlar d ON a.departman_id = d.departman_id
      LEFT JOIN kadrolar k ON a.kadro_id = k.kadro_id
      WHERE a.faculty_id = $1
      ORDER BY a.baslangic_tarih DESC
    `;

    const { rows } = await pool.query(query, [facultyId]);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching faculty announcements:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get announcements by position
 */
const getAnnouncementsByPosition = async (req, res) => {
  try {
    const { positionId } = req.params;

    const query = `
      SELECT a.*, f.faculty_ad, d.departman_ad, k.kadro_ad,
        CASE 
          WHEN a.bitis_tarih < CURRENT_DATE THEN 'Kapandı'
          WHEN a.baslangic_tarih > CURRENT_DATE THEN 'Başlamadı'
          ELSE 'Aktif' 
        END as durum
      FROM announcements a
      LEFT JOIN faculties f ON a.faculty_id = f.faculty_id
      LEFT JOIN departmanlar d ON a.departman_id = d.departman_id
      LEFT JOIN kadrolar k ON a.kadro_id = k.kadro_id
      WHERE a.kadro_id = $1
      ORDER BY a.baslangic_tarih DESC
    `;

    const { rows } = await pool.query(query, [positionId]);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching position announcements:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get announcement by ID with related criteria
 */
const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get announcement details
    const announcementQuery = `
      SELECT a.*, f.faculty_ad, d.departman_ad, k.kadro_ad,
        CASE 
          WHEN a.bitis_tarih < CURRENT_DATE THEN 'Kapandı'
          WHEN a.baslangic_tarih > CURRENT_DATE THEN 'Başlamadı'
          ELSE 'Aktif' 
        END as durum
      FROM announcements a
      LEFT JOIN faculties f ON a.faculty_id = f.faculty_id
      LEFT JOIN departmanlar d ON a.departman_id = d.departman_id
      LEFT JOIN kadrolar k ON a.kadro_id = k.kadro_id
      WHERE a.ilan_id = $1
    `;

    const announcementResult = await pool.query(announcementQuery, [id]);

    if (announcementResult.rows.length === 0) {
      return res.status(404).json({ message: "İlan bulunamadı" });
    }

    // Get criteria for this announcement
    const criteriaQuery = `
      SELECT c.*, dc.document_id, d.document_type, d.puan
      FROM criteria c
      LEFT JOIN criteria_documents dc ON c.criteria_id = dc.criteria_id
      LEFT JOIN documents d ON dc.document_id = d.document_id
      WHERE c.faculty_id = $1 AND c.kadro_id = $2
    `;

    const criteriaResult = await pool.query(criteriaQuery, [
      announcementResult.rows[0].faculty_id,
      announcementResult.rows[0].kadro_id,
    ]);

    // Format criteria and required documents
    const criteria =
      criteriaResult.rows.length > 0 ? criteriaResult.rows[0] : null;

    // Get required documents
    const requiredDocuments = criteriaResult.rows
      .filter((row) => row.document_id !== null)
      .map((row) => ({
        document_id: row.document_id,
        document_type: row.document_type,
        puan: row.puan,
      }));

    // Get application count
    const applicationCountQuery = `
      SELECT COUNT(*) as application_count
      FROM applications
      WHERE basvuru_id = $1
    `;

    const applicationCountResult = await pool.query(applicationCountQuery, [
      id,
    ]);

    // Combine all data
    const result = {
      ...announcementResult.rows[0],
      criteria,
      required_documents: requiredDocuments,
      application_count: parseInt(
        applicationCountResult.rows[0].application_count
      ),
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create a new announcement
 */
const createAnnouncement = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      ilan_baslik,
      ilan_aciklama,
      faculty_id,
      departman_id,
      kadro_id,
      baslangic_tarih,
      bitis_tarih,
    } = req.body;

    // Check if end date is after start date
    if (new Date(bitis_tarih) <= new Date(baslangic_tarih)) {
      return res.status(400).json({
        message: "Bitiş tarihi başlangıç tarihinden sonra olmalıdır",
      });
    }

    // Check if criteria exists for this faculty and position
    const criteriaQuery = `
      SELECT criteria_id FROM criteria
      WHERE faculty_id = $1 AND kadro_id = $2
    `;

    const criteriaResult = await pool.query(criteriaQuery, [
      faculty_id,
      kadro_id,
    ]);

    if (criteriaResult.rows.length === 0) {
      return res.status(400).json({
        message:
          "Bu fakülte ve kadro için tanımlanmış kriter bulunmamaktadır. Lütfen önce kriter tanımlayınız.",
      });
    }

    // Insert announcement
    const query = `
      INSERT INTO announcements (
        ilan_baslik, 
        ilan_aciklama, 
        faculty_id, 
        departman_id, 
        kadro_id, 
        baslangic_tarih, 
        bitis_tarih,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      ilan_baslik,
      ilan_aciklama,
      faculty_id,
      departman_id,
      kadro_id,
      baslangic_tarih,
      bitis_tarih,
    ];

    const { rows } = await pool.query(query, values);

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating announcement:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update an announcement
 */
const updateAnnouncement = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      ilan_baslik,
      ilan_aciklama,
      faculty_id,
      departman_id,
      kadro_id,
      baslangic_tarih,
      bitis_tarih,
    } = req.body;

    // Check if announcement exists
    const checkQuery = "SELECT * FROM announcements WHERE ilan_id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "İlan bulunamadı" });
    }

    // Check if announcement can be updated (has applications)
    const applicationQuery =
      "SELECT COUNT(*) FROM applications WHERE basvuru_id = $1";
    const applicationResult = await pool.query(applicationQuery, [id]);

    if (
      parseInt(applicationResult.rows[0].count) > 0 &&
      (faculty_id !== checkResult.rows[0].faculty_id ||
        kadro_id !== checkResult.rows[0].kadro_id)
    ) {
      return res.status(400).json({
        message:
          "Bu ilana başvurular olduğu için fakülte veya kadro bilgileri değiştirilemez",
      });
    }

    // Update announcement
    const query = `
      UPDATE announcements
      SET ilan_baslik = $1,
          ilan_aciklama = $2,
          faculty_id = $3,
          departman_id = $4,
          kadro_id = $5,
          baslangic_tarih = $6,
          bitis_tarih = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE ilan_id = $8
      RETURNING *
    `;

    const values = [
      ilan_baslik,
      ilan_aciklama,
      faculty_id,
      departman_id,
      kadro_id,
      baslangic_tarih,
      bitis_tarih,
      id,
    ];

    const { rows } = await pool.query(query, values);

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error updating announcement:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete an announcement
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if announcement exists
    const checkQuery = "SELECT * FROM announcements WHERE ilan_id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "İlan bulunamadı" });
    }

    // Check if announcement has applications
    const applicationQuery =
      "SELECT COUNT(*) FROM applications WHERE basvuru_id = $1";
    const applicationResult = await pool.query(applicationQuery, [id]);

    if (parseInt(applicationResult.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Bu ilana başvurular olduğu için silinemez",
      });
    }

    // Delete announcement
    const query = "DELETE FROM announcements WHERE ilan_id = $1 RETURNING *";
    const { rows } = await pool.query(query, [id]);

    return res.status(200).json({
      message: "İlan başarıyla silindi",
      deleted: rows[0],
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllAnnouncements,
  getActiveAnnouncements,
  getAnnouncementsByFaculty,
  getAnnouncementsByPosition,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
