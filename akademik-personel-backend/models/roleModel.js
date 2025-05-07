/**
 * roleModel.js
 *
 * PostgreSQL için rol model tanımlaması
 * Bu dosya veritabanı şemasını ve model davranışlarını tanımlar
 */

/**
 * roles tablosu için SQL şeması
 *
 * CREATE TABLE roles (
 *   role_id SERIAL PRIMARY KEY,
 *   role_name VARCHAR(50) NOT NULL UNIQUE,
 *   description TEXT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 *
 * CREATE TABLE role_permissions (
 *   permission_id SERIAL PRIMARY KEY,
 *   role_id INTEGER NOT NULL REFERENCES roles(role_id),
 *   permission_name VARCHAR(100) NOT NULL,
 *   UNIQUE(role_id, permission_name)
 * );
 */

const pool = require("../config/db");

/**
 * Tüm rolleri getir
 * @returns {Promise<Array>} - Roller listesi
 */
const getAllRoles = async () => {
  const result = await pool.query("SELECT * FROM roles ORDER BY role_id");
  return result.rows;
};

/**
 * Rolü ID'ye göre getir
 * @param {Number} roleId - Rol ID
 * @returns {Promise<Object>} - Bulunan rol
 */
const getRoleById = async (roleId) => {
  const result = await pool.query("SELECT * FROM roles WHERE role_id = $1", [
    roleId,
  ]);
  return result.rows[0];
};

/**
 * Rolü ismine göre getir
 * @param {String} roleName - Rol ismi
 * @returns {Promise<Object>} - Bulunan rol
 */
const getRoleByName = async (roleName) => {
  const result = await pool.query("SELECT * FROM roles WHERE role_name = $1", [
    roleName,
  ]);
  return result.rows[0];
};

/**
 * Rol oluştur
 * @param {Object} roleData - Rol verisi
 * @returns {Promise<Object>} - Oluşturulan rol
 */
const createRole = async (roleData) => {
  const { roleName, description } = roleData;

  const result = await pool.query(
    "INSERT INTO roles (role_name, description, created_at) VALUES ($1, $2, NOW()) RETURNING *",
    [roleName, description]
  );

  return result.rows[0];
};

/**
 * Rolü güncelle
 * @param {Number} roleId - Rol ID
 * @param {Object} roleData - Güncellenecek rol verisi
 * @returns {Promise<Object>} - Güncellenen rol
 */
const updateRole = async (roleId, roleData) => {
  const { roleName, description } = roleData;

  const result = await pool.query(
    "UPDATE roles SET role_name = $1, description = $2 WHERE role_id = $3 RETURNING *",
    [roleName, description, roleId]
  );

  return result.rows[0];
};

/**
 * Rol izinlerini getir
 * @param {Number} roleId - Rol ID
 * @returns {Promise<Array>} - İzinler listesi
 */
const getRolePermissions = async (roleId) => {
  const result = await pool.query(
    "SELECT permission_name FROM role_permissions WHERE role_id = $1",
    [roleId]
  );

  return result.rows.map((row) => row.permission_name);
};

/**
 * Rol izinlerini kaydet
 * @param {Number} roleId - Rol ID
 * @param {Array} permissions - İzinler listesi
 * @returns {Promise<Boolean>} - İşlem başarılı mı?
 */
const saveRolePermissions = async (roleId, permissions) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Mevcut izinleri sil
    await client.query("DELETE FROM role_permissions WHERE role_id = $1", [
      roleId,
    ]);

    // Yeni izinleri ekle
    for (const permission of permissions) {
      await client.query(
        "INSERT INTO role_permissions (role_id, permission_name) VALUES ($1, $2)",
        [roleId, permission]
      );
    }

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  getRoleByName,
  createRole,
  updateRole,
  getRolePermissions,
  saveRolePermissions,
};
