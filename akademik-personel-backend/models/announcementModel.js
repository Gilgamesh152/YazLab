/**
 * announcementModel.js
 *
 * PostgreSQL için ilan modeli
 *
 * SQL Şeması:
 * CREATE TABLE announcements (
 *   ilan_id SERIAL PRIMARY KEY,
 *   ilan_baslik VARCHAR(255) NOT NULL,
 *   ilan_aciklama TEXT NOT NULL,
 *   faculty_id INTEGER NOT NULL REFERENCES faculties(faculty_id),
 *   departman_id INTEGER NOT NULL REFERENCES departmanlar(departman_id),
 *   kadro_id INTEGER NOT NULL REFERENCES kadrolar(kadro_id),
 *   baslangic_tarih DATE NOT NULL,
 *   bitis_tarih DATE NOT NULL,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP,
 *   created_by INTEGER REFERENCES users(user_id),
 *   updated_by INTEGER REFERENCES users(user_id)
 * );
 */

const pool = require("../config/db");

/**
 * Tüm ilanları getir
 * @param {Object} filters - Filtre parametreleri
 * @returns {Promise<Array>} - İlanlar listesi
 */
const getAllAnnouncements = async (filters = {}) => {
  const { faculty_id, departman_id, kadro_id, status } = filters;

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

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * İlan detaylarını getir
 * @param {Number} ilanId - İlan ID
 * @returns {Promise<Object>} - İlan bilgileri
 */
const getAnnouncementById = async (ilanId) => {
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
    WHERE a.ilan_id = $1
  `;

  const result = await pool.query(query, [ilanId]);
  return result.rows[0];
};

/**
 * İlan oluştur
 * @param {Object} announcementData - İlan verileri
 * @param {Number} userId - İşlemi yapan kullanıcı ID
 * @returns {Promise<Object>} - Oluşturulan ilan
 */
const createAnnouncement = async (announcementData, userId) => {
  const {
    ilan_baslik,
    ilan_aciklama,
    faculty_id,
    departman_id,
    kadro_id,
    baslangic_tarih,
    bitis_tarih,
  } = announcementData;

  const query = `
    INSERT INTO announcements (
      ilan_baslik, 
      ilan_aciklama, 
      faculty_id, 
      departman_id, 
      kadro_id, 
      baslangic_tarih, 
      bitis_tarih,
      created_at,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
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
    userId,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * İlan güncelle
 * @param {Number} ilanId - İlan ID
 * @param {Object} announcementData - Güncellenecek veriler
 * @param {Number} userId - İşlemi yapan kullanıcı ID
 * @returns {Promise<Object>} - Güncellenen ilan
 */
const updateAnnouncement = async (ilanId, announcementData, userId) => {
  const {
    ilan_baslik,
    ilan_aciklama,
    faculty_id,
    departman_id,
    kadro_id,
    baslangic_tarih,
    bitis_tarih,
  } = announcementData;

  const query = `
    UPDATE announcements
    SET ilan_baslik = $1,
        ilan_aciklama = $2,
        faculty_id = $3,
        departman_id = $4,
        kadro_id = $5,
        baslangic_tarih = $6,
        bitis_tarih = $7,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $8
    WHERE ilan_id = $9
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
    userId,
    ilanId,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * İlan sil
 * @param {Number} ilanId - İlan ID
 * @returns {Promise<Object>} - Silinen ilan
 */
const deleteAnnouncement = async (ilanId) => {
  const query = `DELETE FROM announcements WHERE ilan_id = $1 RETURNING *`;
  const result = await pool.query(query, [ilanId]);
  return result.rows[0];
};

module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
