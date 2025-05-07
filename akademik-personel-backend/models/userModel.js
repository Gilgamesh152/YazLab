/**
 * userModel.js
 *
 * PostgreSQL için kullanıcı model tanımlaması
 * Bu dosya veritabanı şemasını ve model davranışlarını tanımlar
 */

/**
 * users tablosu için SQL şeması
 *
 * CREATE TABLE users (
 *   user_id SERIAL PRIMARY KEY,
 *   tc_kimlik VARCHAR(11) NOT NULL UNIQUE CHECK (tc_kimlik ~ '^[0-9]{11}$'),
 *   sifre VARCHAR(255) NOT NULL,
 *   ad VARCHAR(100) NOT NULL,
 *   soyad VARCHAR(100) NOT NULL,
 *   email VARCHAR(255) NOT NULL UNIQUE,
 *   telefon VARCHAR(20),
 *   role_id INTEGER NOT NULL REFERENCES roles(role_id),
 *   faculty_id INTEGER REFERENCES faculties(faculty_id),
 *   department_id INTEGER REFERENCES departments(department_id),
 *   is_active BOOLEAN DEFAULT TRUE,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP,
 *   last_login TIMESTAMP,
 *   reset_password_token VARCHAR(255),
 *   reset_password_expires TIMESTAMP
 * );
 */

// Model davranışları için yardımcı fonksiyonlar
const bcrypt = require("bcrypt");
const pool = require("../config/db");

/**
 * Kullanıcı oluşturma
 * @param {Object} userData - Kullanıcı verisi
 * @returns {Promise<Object>} - Oluşturulan kullanıcı
 */
const createUser = async (userData) => {
  const {
    tcKimlik,
    sifre,
    ad,
    soyad,
    email,
    telefon,
    roleId,
    facultyId,
    departmentId,
  } = userData;

  // Şifre hash'leme
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(sifre, salt);

  const result = await pool.query(
    `INSERT INTO users 
     (tc_kimlik, sifre, ad, soyad, email, telefon, role_id, faculty_id, department_id, is_active, created_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW()) 
     RETURNING *`,
    [
      tcKimlik,
      hashedPassword,
      ad,
      soyad,
      email,
      telefon,
      roleId,
      facultyId,
      departmentId,
    ]
  );

  return result.rows[0];
};

/**
 * Kullanıcıyı TC Kimlik numarasına göre bul
 * @param {String} tcKimlik - TC Kimlik Numarası
 * @returns {Promise<Object>} - Bulunan kullanıcı
 */
const findByTcKimlik = async (tcKimlik) => {
  const result = await pool.query(
    `SELECT u.*, r.role_name 
     FROM users u
     INNER JOIN roles r ON u.role_id = r.role_id
     WHERE u.tc_kimlik = $1`,
    [tcKimlik]
  );

  return result.rows[0];
};

/**
 * Kullanıcıyı ID'ye göre bul
 * @param {Number} userId - Kullanıcı ID
 * @returns {Promise<Object>} - Bulunan kullanıcı
 */
const findById = async (userId) => {
  const result = await pool.query(
    `SELECT u.*, r.role_name 
     FROM users u
     INNER JOIN roles r ON u.role_id = r.role_id
     WHERE u.user_id = $1`,
    [userId]
  );

  return result.rows[0];
};

/**
 * Kullanıcı şifresini kontrol et
 * @param {String} candidatePassword - Aday şifre
 * @param {String} userPassword - Kullanıcı şifresi (hash)
 * @returns {Promise<Boolean>} - Şifre doğru mu?
 */
const comparePassword = async (candidatePassword, userPassword) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = {
  createUser,
  findByTcKimlik,
  findById,
  comparePassword,
};
