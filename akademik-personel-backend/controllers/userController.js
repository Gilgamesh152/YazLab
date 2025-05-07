/**
 * userController.js
 *
 * Kullanıcı yönetimi için controller fonksiyonları
 * Kullanıcı listeleme, ekleme, güncelleme ve silme işlemlerini yönetir
 */

const bcrypt = require("bcrypt");
const pool = require("../config/db");
const emailService = require("../services/emailService");
const notificationService = require("../services/notificationService");
const { formatDate } = require("../utils/formatters");

/**
 * Filtreleme ve sayfalama için yardımcı fonksiyon
 * @param {Object} options - Filtreleme ve sayfalama seçenekleri
 * @returns {Object} - Sorgu ve parametreler
 */
const buildFilterQuery = (options) => {
  const { search, role, status, page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  let query = `
    SELECT u.*, r.role_name 
    FROM users u
    INNER JOIN roles r ON u.role_id = r.role_id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  // Arama filtreleri
  if (search) {
    query += ` AND (u.ad ILIKE $${paramIndex} OR u.soyad ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.tc_kimlik LIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Rol filtreleri
  if (role) {
    query += ` AND r.role_name = $${paramIndex}`;
    params.push(role);
    paramIndex++;
  }

  // Durum filtreleri
  if (status) {
    query += ` AND u.is_active = $${paramIndex}`;
    params.push(status === "active");
    paramIndex++;
  }

  // Sıralama
  query += ` ORDER BY u.created_at DESC`;

  // Sayfalama eklenmemişse (örn. count sorgusu için)
  if (page && limit) {
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
  }

  return { query, params, paramIndex };
};

/**
 * Tüm kullanıcıları getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Kullanıcı listesi
 */
const getAllUsers = async (req, res) => {
  try {
    // Sayfalama parametreleri
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Filtreleme sorgusu oluştur
    const { query, params } = buildFilterQuery({
      search: req.query.search,
      role: req.query.role,
      status: req.query.status,
      page,
      limit,
    });

    // Toplam kayıt sayısını hesapla
    const { query: countQuery, params: countParams } = buildFilterQuery({
      search: req.query.search,
      role: req.query.role,
      status: req.query.status,
      page: null,
      limit: null,
    });

    const countSql = `SELECT COUNT(*) as total FROM (${countQuery}) as filtered_users`;

    // Sorguları çalıştır
    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countSql, countParams),
    ]);

    const users = result.rows.map((user) => {
      // Şifre bilgisini çıkar
      delete user.sifre;

      //const users = result.rows.map((user) => {
      // Şifre bilgisini çıkar
      delete user.sifre;

      // Tarih formatını düzenle
      if (user.created_at) {
        user.created_at = formatDate(user.created_at);
      }

      if (user.last_login) {
        user.last_login = formatDate(user.last_login);
      }

      return user;
    });

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Kullanıcılar alınırken hata:", error);
    return res.status(500).json({
      success: false,
      message: "Kullanıcı bilgileri alınırken bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Belirli bir kullanıcıyı getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Kullanıcı bilgileri
 */
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await pool.query(
      `SELECT u.*, r.role_name 
       FROM users u
       INNER JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    const user = result.rows[0];

    // Şifre bilgisini çıkar
    delete user.sifre;

    // Tarih formatını düzenle
    if (user.created_at) {
      user.created_at = formatDate(user.created_at);
    }

    if (user.last_login) {
      user.last_login = formatDate(user.last_login);
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Kullanıcı bilgileri alınırken hata:", error);
    return res.status(500).json({
      success: false,
      message: "Kullanıcı bilgileri alınırken bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Yeni kullanıcı oluştur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Oluşturulan kullanıcı bilgileri
 */
const createUser = async (req, res) => {
  const { tcKimlik, sifre, ad, soyad, email, telefon, roleId } = req.body;

  try {
    // TC Kimlik Numarası kontrolü
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE tc_kimlik = $1",
      [tcKimlik]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Bu TC Kimlik Numarası ile kayıtlı bir kullanıcı zaten bulunmaktadır.",
      });
    }

    // Email kontrolü
    const emailCheck = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Bu e-posta adresi ile kayıtlı bir kullanıcı zaten bulunmaktadır.",
      });
    }

    // Rol kontrolü
    const roleCheck = await pool.query(
      "SELECT * FROM roles WHERE role_id = $1",
      [roleId]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz rol ID.",
      });
    }

    // Şifre hash'leme
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sifre, salt);

    // Kullanıcıyı kaydet
    const result = await pool.query(
      "INSERT INTO users (tc_kimlik, sifre, ad, soyad, email, telefon, role_id, created_at, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), true) RETURNING *",
      [tcKimlik, hashedPassword, ad, soyad, email, telefon, roleId]
    );

    const user = result.rows[0];

    // Rol adını getir
    const roleName = roleCheck.rows[0].role_name;

    // Hoş geldiniz e-postası gönder
    try {
      await emailService.sendTemplateEmail({
        to: email,
        subject: "Akademik Personel Başvuru Sistemine Hoş Geldiniz",
        templateName: "welcome",
        templateData: {
          name: `${ad} ${soyad}`,
          tcKimlik,
          email,
          loginUrl: `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login`,
          year: new Date().getFullYear(),
        },
      });
    } catch (emailError) {
      console.error("Hoş geldiniz e-postası gönderilemedi:", emailError);
      // E-posta gönderimi başarısız olsa bile kayıt işlemine devam et
    }

    // Kullanıcı bilgilerini döndür (şifre hariç)
    delete user.sifre;
    user.role_name = roleName;

    return res.status(201).json({
      success: true,
      message: "Kullanıcı başarıyla oluşturuldu.",
      user,
    });
  } catch (error) {
    console.error("Kullanıcı oluşturma sırasında hata:", error);
    return res.status(500).json({
      success: false,
      message: "Kullanıcı oluşturma sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Kullanıcı bilgilerini güncelle
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Güncellenen kullanıcı bilgileri
 */
const updateUser = async (req, res) => {
  const userId = req.params.id;
  const { ad, soyad, email, telefon } = req.body;

  try {
    // Kullanıcıyı kontrol et
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    // E-posta adresi değiştiriliyorsa ve başka bir kullanıcı tarafından kullanılıyorsa kontrol et
    if (email && email !== userCheck.rows[0].email) {
      const emailCheck = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND user_id != $2",
        [email, userId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Bu e-posta adresi başka bir kullanıcı tarafından kullanılmaktadır.",
        });
      }
    }

    // Güncellenecek alanları belirle
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (ad) {
      updateFields.push(`ad = $${paramIndex}`);
      values.push(ad);
      paramIndex++;
    }

    if (soyad) {
      updateFields.push(`soyad = $${paramIndex}`);
      values.push(soyad);
      paramIndex++;
    }

    if (email) {
      updateFields.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }

    if (telefon) {
      updateFields.push(`telefon = $${paramIndex}`);
      values.push(telefon);
      paramIndex++;
    }

    // Güncelleme tarihi ekle
    updateFields.push(`updated_at = NOW()`);

    // Güncelleme yapılacak alanlar varsa güncelle
    if (updateFields.length > 0) {
      values.push(userId);
      const updateQuery = `UPDATE users SET ${updateFields.join(
        ", "
      )} WHERE user_id = $${paramIndex} RETURNING *`;
      const result = await pool.query(updateQuery, values);

      // Rol bilgisini getir
      const roleResult = await pool.query(
        "SELECT r.role_name FROM roles r INNER JOIN users u ON r.role_id = u.role_id WHERE u.user_id = $1",
        [userId]
      );

      const user = result.rows[0];

      // Şifre bilgisini çıkar
      delete user.sifre;

      // Rol adını ekle
      user.role_name = roleResult.rows[0].role_name;

      // Tarih formatını düzenle
      if (user.created_at) {
        user.created_at = formatDate(user.created_at);
      }

      if (user.updated_at) {
        user.updated_at = formatDate(user.updated_at);
      }

      if (user.last_login) {
        user.last_login = formatDate(user.last_login);
      }

      return res.status(200).json({
        success: true,
        message: "Kullanıcı bilgileri başarıyla güncellendi.",
        user,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Güncellenecek bilgi bulunamadı.",
      });
    }
  } catch (error) {
    console.error("Kullanıcı güncelleme sırasında hata:", error);
    return res.status(500).json({
      success: false,
      message: "Kullanıcı güncelleme sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Kullanıcıyı sil
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Silme sonucu
 */
const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    // Kullanıcının varlığını kontrol et
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    // Kullanıcının başvuruları varsa silmeye izin verme
    const applicationCheck = await pool.query(
      "SELECT * FROM applications WHERE user_id = $1",
      [userId]
    );

    if (applicationCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Bu kullanıcının başvuruları olduğu için silinemez. Önce kullanıcıyı pasif duruma getirin.",
      });
    }

    // Kullanıcıyı sil
    await pool.query("DELETE FROM users WHERE user_id = $1", [userId]);

    return res.status(200).json({
      success: true,
      message: "Kullanıcı başarıyla silindi.",
    });
  } catch (error) {
    console.error("Kullanıcı silme sırasında hata:", error);
    return res.status(500).json({
      success: false,
      message: "Kullanıcı silme sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Kullanıcının rolünü değiştir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Rol değiştirme sonucu
 */
const changeUserRole = async (req, res) => {
  const userId = req.params.id;
  const { roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({
      success: false,
      message: "Rol ID gereklidir.",
    });
  }

  try {
    // Kullanıcının varlığını kontrol et
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    // Rolün varlığını kontrol et
    const roleCheck = await pool.query(
      "SELECT * FROM roles WHERE role_id = $1",
      [roleId]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz rol ID.",
      });
    }

    // Kullanıcının rolünü güncelle
    await pool.query(
      "UPDATE users SET role_id = $1, updated_at = NOW() WHERE user_id = $2",
      [roleId, userId]
    );

    // Güncellenmiş kullanıcı bilgilerini getir
    const result = await pool.query(
      `SELECT u.*, r.role_name 
       FROM users u
       INNER JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = $1`,
      [userId]
    );

    const user = result.rows[0];

    // Şifre bilgisini çıkar
    delete user.sifre;

    // Tarih formatını düzenle
    if (user.created_at) {
      user.created_at = formatDate(user.created_at);
    }

    if (user.updated_at) {
      user.updated_at = formatDate(user.updated_at);
    }

    // Kullanıcıya bildirim gönder
    try {
      await notificationService.createNotification(
        userId,
        null,
        `Rolünüz ${roleCheck.rows[0].role_name} olarak değiştirildi.`,
        "info"
      );

      // E-posta gönder
      await emailService.sendTemplateEmail({
        to: user.email,
        subject: "Rol Değişikliği Bildirimi",
        templateName: "notification",
        templateData: {
          title: "Rol Değişikliği",
          name: `${user.ad} ${user.soyad}`,
          message: `Akademik Personel Başvuru Sistemi'ndeki rolünüz ${roleCheck.rows[0].role_name} olarak değiştirildi.`,
          actionUrl: `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login`,
          actionText: "Sisteme Giriş Yap",
          year: new Date().getFullYear(),
        },
      });
    } catch (notificationError) {
      console.error(
        "Rol değişikliği bildirimi gönderilemedi:",
        notificationError
      );
      // Bildirim gönderimi başarısız olsa bile işleme devam et
    }

    return res.status(200).json({
      success: true,
      message: "Kullanıcı rolü başarıyla değiştirildi.",
      user,
    });
  } catch (error) {
    console.error("Kullanıcı rolü değiştirme sırasında hata:", error);
    return res.status(500).json({
      success: false,
      message: "Kullanıcı rolü değiştirme sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Kullanıcının şifresini sıfırla
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Şifre sıfırlama sonucu
 */
const resetUserPassword = async (req, res) => {
  const userId = req.params.id;

  try {
    // Kullanıcının varlığını kontrol et
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    const user = userCheck.rows[0];

    // Rastgele şifre oluştur
    const newPassword = Math.random().toString(36).slice(-8);

    // Şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Şifreyi güncelle
    await pool.query(
      "UPDATE users SET sifre = $1, updated_at = NOW() WHERE user_id = $2",
      [hashedPassword, userId]
    );

    // Kullanıcıya e-posta gönder
    try {
      await emailService.sendTemplateEmail({
        to: user.email,
        subject: "Şifreniz Sıfırlandı",
        templateName: "notification",
        templateData: {
          title: "Şifre Sıfırlama",
          name: `${user.ad} ${user.soyad}`,
          message: `Akademik Personel Başvuru Sistemi'ne giriş yapmanız için şifreniz sıfırlandı. Yeni şifreniz: ${newPassword}`,
          actionUrl: `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login`,
          actionText: "Sisteme Giriş Yap",
          year: new Date().getFullYear(),
        },
      });

      // Bildirim oluştur
      await notificationService.createNotification(
        userId,
        null,
        "Şifreniz yönetici tarafından sıfırlandı. Lütfen e-posta adresinizi kontrol edin.",
        "info"
      );
    } catch (emailError) {
      console.error("Şifre sıfırlama e-postası gönderilemedi:", emailError);
      // E-posta gönderimi başarısız olsa bile işleme devam et
    }

    return res.status(200).json({
      success: true,
      message:
        "Kullanıcı şifresi başarıyla sıfırlandı ve yeni şifre e-posta ile gönderildi.",
    });
  } catch (error) {
    console.error("Kullanıcı şifresi sıfırlama sırasında hata:", error);
    return res.status(500).json({
      success: false,
      message: "Kullanıcı şifresi sıfırlama sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Kullanıcının hesabını aktifleştir/deaktifleştir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Durum değiştirme sonucu
 */
const changeUserStatus = async (req, res) => {
  const userId = req.params.id;
  const { isActive } = req.body;

  if (isActive === undefined) {
    return res.status(400).json({
      success: false,
      message: "Durum bilgisi gereklidir.",
    });
  }

  try {
    // Kullanıcının varlığını kontrol et
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    const user = userCheck.rows[0];

    // Kullanıcının durumunu güncelle
    await pool.query(
      "UPDATE users SET is_active = $1, updated_at = NOW() WHERE user_id = $2",
      [isActive, userId]
    );

    // Kullanıcıya bildirim gönder
    const statusMessage = isActive ? "aktifleştirildi" : "devre dışı bırakıldı";

    try {
      await notificationService.createNotification(
        userId,
        null,
        `Hesabınız yönetici tarafından ${statusMessage}.`,
        isActive ? "success" : "warning"
      );

      // E-posta gönder
      await emailService.sendTemplateEmail({
        to: user.email,
        subject: "Hesap Durumu Değişikliği",
        templateName: "notification",
        templateData: {
          title: "Hesap Durumu Değişikliği",
          name: `${user.ad} ${user.soyad}`,
          message: `Akademik Personel Başvuru Sistemi'ndeki hesabınız yönetici tarafından ${statusMessage}.`,
          actionUrl: `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login`,
          actionText: "Sisteme Giriş Yap",
          year: new Date().getFullYear(),
        },
      });
    } catch (notificationError) {
      console.error(
        "Hesap durumu değişikliği bildirimi gönderilemedi:",
        notificationError
      );
      // Bildirim gönderimi başarısız olsa bile işleme devam et
    }

    return res.status(200).json({
      success: true,
      message: `Kullanıcı hesabı başarıyla ${statusMessage}.`,
    });
  } catch (error) {
    console.error("Kullanıcı hesap durumu değiştirme sırasında hata:", error);
    return res.status(500).json({
      success: false,
      message: "Kullanıcı hesap durumu değiştirme sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  resetUserPassword,
  changeUserStatus,
};
