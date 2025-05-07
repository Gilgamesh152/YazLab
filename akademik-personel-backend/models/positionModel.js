/**
 * positionModel.js
 *
 * PostgreSQL için kadro modeli
 *
 * SQL Şeması:
 * CREATE TABLE kadrolar (
 *   kadro_id SERIAL PRIMARY KEY,
 *   kadro_ad VARCHAR(100) NOT NULL,
 *   kadro_kod VARCHAR(50) NOT NULL UNIQUE,
 *   aciklama TEXT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 *
 * INSERT INTO kadrolar (kadro_ad, kadro_kod, aciklama) VALUES
 * ('Dr. Öğretim Üyesi', 'DR_OGR', 'Doktor Öğretim Üyesi kadrosu'),
 * ('Doçent', 'DOC', 'Doçent kadrosu'),
 * ('Profesör', 'PROF', 'Profesör kadrosu');
 */

const pool = require("../config/db");

/**
 * Tüm kadroları getir
 * @returns {Promise<Array>} - Kadrolar listesi
 */
const getAllPositions = async () => {
  const query = `SELECT * FROM kadrolar ORDER BY kadro_id ASC`;
  const result = await pool.query(query);
  return result.rows;
};

/**
 * Kadro detaylarını getir
 * @param {Number} kadroId - Kadro ID
 * @returns {Promise<Object>} - Kadro bilgileri
 */
const getPositionById = async (kadroId) => {
  const query = `SELECT * FROM kadrolar WHERE kadro_id = $1`;
  const result = await pool.query(query, [kadroId]);
  return result.rows[0];
};

/**
 * Kadro kodu ile kadro detaylarını getir
 * @param {String} kadroKod - Kadro kodu
 * @returns {Promise<Object>} - Kadro bilgileri
 */
const getPositionByCode = async (kadroKod) => {
  const query = `SELECT * FROM kadrolar WHERE kadro_kod = $1`;
  const result = await pool.query(query, [kadroKod]);
  return result.rows[0];
};

/**
 * Kadro oluştur
 * @param {Object} positionData - Kadro verileri
 * @returns {Promise<Object>} - Oluşturulan kadro
 */
const createPosition = async (positionData) => {
  const { kadro_ad, kadro_kod, aciklama } = positionData;

  const query = `
    INSERT INTO kadrolar (kadro_ad, kadro_kod, aciklama, created_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const values = [kadro_ad, kadro_kod, aciklama];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Kadro güncelle
 * @param {Number} kadroId - Kadro ID
 * @param {Object} positionData - Güncellenecek veriler
 * @returns {Promise<Object>} - Güncellenen kadro
 */
const updatePosition = async (kadroId, positionData) => {
  const { kadro_ad, kadro_kod, aciklama } = positionData;

  const query = `
    UPDATE kadrolar
    SET kadro_ad = $1,
        kadro_kod = $2,
        aciklama = $3
    WHERE kadro_id = $4
    RETURNING *
  `;

  const values = [kadro_ad, kadro_kod, aciklama, kadroId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  getAllPositions,
  getPositionById,
  getPositionByCode,
  createPosition,
  updatePosition,
};
