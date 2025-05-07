/**
 * db.js
 *
 * PostgreSQL veritabanı bağlantı yapılandırması
 */

const { Pool } = require("pg");

// Ortam değişkenlerinden veritabanı bağlantı bilgilerini al veya varsayılan değerleri kullan
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "akademik_basvuru",
  password: process.env.DB_PASSWORD || "postgres",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  // Bağlantı havuzu yapılandırması
  max: parseInt(process.env.DB_POOL_MAX || "20", 10), // maksimum bağlantı sayısı
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10), // boşta kalan bağlantıların zaman aşımı (ms)
  connectionTimeoutMillis: parseInt(
    process.env.DB_CONNECTION_TIMEOUT || "5000",
    10
  ), // bağlantı zaman aşımı (ms)
});

// Veritabanı bağlantı durumunu kontrol et
pool.on("connect", () => {
  console.log("PostgreSQL veritabanına bağlantı başarılı");
});

pool.on("error", (err) => {
  console.error("PostgreSQL veritabanı hatası:", err);
});

// Veritabanı bağlantısını kapat (uygulama kapatılırken)
const closePool = async () => {
  try {
    await pool.end();
    console.log("PostgreSQL bağlantı havuzu kapatıldı");
  } catch (error) {
    console.error("PostgreSQL bağlantı havuzu kapatılırken hata:", error);
  }
};

// Sürüm kontrolü - veritabanı uyumluluğunu doğrula
const checkDatabaseVersion = async () => {
  try {
    const result = await pool.query("SELECT version()");
    console.log("PostgreSQL sürümü:", result.rows[0].version);
    return result.rows[0].version;
  } catch (error) {
    console.error("PostgreSQL sürüm kontrolü sırasında hata:", error);
    throw error;
  }
};

module.exports = pool;
module.exports.closePool = closePool;
module.exports.checkDatabaseVersion = checkDatabaseVersion;
