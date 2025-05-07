/**
 * authController.js
 *
 * Kimlik doğrulama işlemleri için controller fonksiyonları
 * Kayıt, giriş, çıkış, şifre sıfırlama ve kullanıcı bilgilerini yönetir
 */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const jwtConfig = require("../config/jwt");
const emailService = require("../services/emailService");
const notificationService = require("../services/notificationService");
const { formatDate } = require("../utils/formatters");
const eDevletService = require("../config/eDevlet");

/**
 * Kullanıcı kaydı
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Kayıt sonucu
 */
const register = async (req, res) => {
  const { tcKimlik, sifre, ad, soyad, email, telefon } = req.body;

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

    // Şifre hash'leme
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sifre, salt);

    // Aday rolünü veritabanından al
    const roleResult = await pool.query(
      "SELECT role_id FROM roles WHERE role_name = $1",
      ["Aday"]
    );
    const roleId = roleResult.rows[0]?.role_id || 1; // Varsayılan olarak 1 (Aday)

    // Kullanıcıyı kaydet
    const result = await pool.query(
      "INSERT INTO users (tc_kimlik, sifre, ad, soyad, email, telefon, role_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *",
      [tcKimlik, hashedPassword, ad, soyad, email, telefon, roleId]
    );

    const user = result.rows[0];

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

    return res.status(201).json({
      success: true,
      message: "Kullanıcı başarıyla kaydedildi.",
      user,
    });
  } catch (error) {
    console.error("Kayıt işlemi sırasında hata:", error);
    return res.status(500).json({
      success: false,
      message: "Kayıt işlemi sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Kullanıcı girişi
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Giriş sonucu ve JWT token
 */
const login = async (req, res) => {
  const { tcKimlik, sifre } = req.body;

  try {
    // Kullanıcıyı TC kimlik numarasına göre bul
    const result = await pool.query(
      "SELECT u.*, r.role_name FROM users u INNER JOIN roles r ON u.role_id = r.role_id WHERE u.tc_kimlik = $1",
      [tcKimlik]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Geçersiz TC Kimlik Numarası veya şifre.",
      });
    }

    const user = result.rows[0];

    // Şifreyi kontrol et
    const isValidPassword = await bcrypt.compare(sifre, user.sifre);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Geçersiz TC Kimlik Numarası veya şifre.",
      });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role_name },
      jwtConfig.secretKey,
      { expiresIn: jwtConfig.expiresIn }
    );

    // Son giriş zamanını güncelle
    await pool.query("UPDATE users SET last_login = NOW() WHERE user_id = $1", [
      user.user_id,
    ]);

    // Kullanıcı bilgilerini döndür (şifre hariç)
    delete user.sifre;

    return res.status(200).json({
      success: true,
      message: "Giriş başarılı.",
      token,
      user,
    });
  } catch (error) {
    console.error("Giriş işlemi sırasında hata:", error);
    return res.status(500).json({
      success: false,
      message: "Giriş işlemi sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Kullanıcı çıkışı
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Çıkış sonucu
 */
const logout = async (req, res) => {
  try {
    // JWT iptal etme veya blacklist'e alma işlemi burada yapılabilir
    // Şu anki örnekte client tarafında token'ı silmek yeterli

    return res.status(200).json({
      success: true,
      message: "Çıkış başarılı.",
    });
  } catch (error) {
    console.error("Çıkış işlemi sırasında hata:", error);
    return res.status(500).json({
      success: false,
      message: "Çıkış işlemi sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Token doğrulama
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Token doğrulama sonucu
 */
const verifyToken = async (req, res) => {
  try {
    // Token doğrulandıysa kullanıcı bilgilerini getir
    const userId = req.user.user_id;

    const result = await pool.query(
      "SELECT u.*, r.role_name FROM users u INNER JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    const user = result.rows[0];
    delete user.sifre;

    return res.status(200).json({
      success: true,
      message: "Token geçerli.",
      user,
    });
  } catch (error) {
    console.error("Token doğrulama işlemi sırasında hata:", error);
    return res.status(500).json({
      success: false,
      message: "Token doğrulama işlemi sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Şifre sıfırlama isteği
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Şifre sıfırlama isteği sonucu
 */
const forgotPassword = async (req, res) => {
  const { tcKimlik, email } = req.body;

  if (!tcKimlik || !email) {
    return res.status(400).json({
      success: false,
      message: "TC Kimlik Numarası ve email gereklidir.",
    });
  }

  try {
    // Kullanıcıyı TC kimlik numarası ve email'e göre bul
    const result = await pool.query(
      "SELECT * FROM users WHERE tc_kimlik = $1 AND email = $2",
      [tcKimlik, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bu bilgilere sahip bir kullanıcı bulunamadı.",
      });
    }

    const user = result.rows[0];

    // Şifre sıfırlama token'ı oluştur
    const resetToken = jwt.sign(
      { user_id: user.user_id },
      jwtConfig.resetPasswordSecretKey,
      { expiresIn: jwtConfig.resetPasswordExpiresIn }
    );

    // Token'ı veritabanına kaydet
    await pool.query(
      "UPDATE users SET reset_password_token = $1, reset_password_expires = NOW() + INTERVAL '1 hour' WHERE user_id = $2",
      [resetToken, user.user_id]
    );

    // Şifre sıfırlama e-postası gönder
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    await emailService.sendTemplateEmail({
      to: email,
      subject: "Şifre Sıfırlama İsteği",
      templateName: "notification",
      templateData: {
        title: "Şifre Sıfırlama",
        name: `${user.ad} ${user.soyad}`,
        message:
          "Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayabilirsiniz. Bu bağlantı 1 saat boyunca geçerlidir.",
        actionUrl: resetUrl,
        actionText: "Şifremi Sıfırla",
        year: new Date().getFullYear(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Şifre sıfırlama e-postası gönderildi.",
    });
  } catch (error) {
    console.error("Şifre sıfırlama isteği sırasında hata:", error);
    return res.status(500).json({
      success: false,
      message: "Şifre sıfırlama isteği sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Şifre sıfırlama
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Şifre sıfırlama sonucu
 */
const resetPassword = async (req, res) => {
  const { token, yeniSifre } = req.body;

  if (!token || !yeniSifre) {
    return res.status(400).json({
      success: false,
      message: "Token ve yeni şifre gereklidir.",
    });
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, jwtConfig.resetPasswordSecretKey);

    // Veritabanında token'ı kontrol et
    const result = await pool.query(
      "SELECT * FROM users WHERE user_id = $1 AND reset_password_token = $2 AND reset_password_expires > NOW()",
      [decoded.user_id, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz veya süresi dolmuş token.",
      });
    }

    const user = result.rows[0];

    // Yeni şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(yeniSifre, salt);

    // Şifreyi güncelle ve token'ı temizle
    await pool.query(
      "UPDATE users SET sifre = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE user_id = $2",
      [hashedPassword, user.user_id]
    );

    // Şifre değişikliği bildirimi gönder
    await emailService.sendTemplateEmail({
      to: user.email,
      subject: "Şifreniz Değiştirildi",
      templateName: "notification",
      templateData: {
        title: "Şifre Değişikliği",
        name: `${user.ad} ${user.soyad}`,
        message:
          "Şifreniz başarıyla değiştirildi. Eğer bu değişikliği siz yapmadıysanız, lütfen hemen bizimle iletişime geçin.",
        actionUrl: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login`,
        actionText: "Giriş Yap",
        year: new Date().getFullYear(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Şifre başarıyla sıfırlandı.",
    });
  } catch (error) {
    console.error("Şifre sıfırlama işlemi sırasında hata:", error);

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz veya süresi dolmuş token.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Şifre sıfırlama işlemi sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * TC Kimlik Numarası doğrulama (e-Devlet entegrasyonu)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - TC Kimlik doğrulama sonucu
 */
const verifyTCKimlik = async (req, res) => {
  const { tcKimlik, ad, soyad, dogumYili } = req.body;

  if (!tcKimlik || !ad || !soyad || !dogumYili) {
    return res.status(400).json({
      success: false,
      message: "TC Kimlik Numarası, ad, soyad ve doğum yılı gereklidir.",
    });
  }

  try {
    // e-Devlet API entegrasyonu için örnek
    // Gerçek bir uygulamada bu kısım e-Devlet API'sine bağlanarak doğrulama yapacak
    const isVerified = await eDevletService.verifyTCKimlik(
      tcKimlik,
      ad,
      soyad,
      dogumYili
    );

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: "TC Kimlik bilgileri doğrulanamadı.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "TC Kimlik bilgileri doğrulandı.",
    });
  } catch (error) {
    console.error("TC Kimlik doğrulama işlemi sırasında hata:", error);
    return res.status(500).json({
      success: false,
      message: "TC Kimlik doğrulama işlemi sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

/**
 * Kullanıcı bilgilerini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Kullanıcı bilgileri
 */
const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await pool.query(
      "SELECT u.*, r.role_name FROM users u INNER JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    const user = result.rows[0];
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
 * Kullanıcı bilgilerini güncelle
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @returns {Object} - Güncelleme sonucu
 */
const updateUserInfo = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { email, telefon, currentPassword, newPassword } = req.body;

    // Kullanıcıyı bul
    const userResult = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    const user = userResult.rows[0];

    // Şifre değişikliği var mı kontrol et
    if (currentPassword && newPassword) {
      // Mevcut şifreyi doğrula
      const isValidPassword = await bcrypt.compare(currentPassword, user.sifre);

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Mevcut şifre yanlış.",
        });
      }

      // Yeni şifreyi hash'le
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Şifreyi güncelle
      await pool.query("UPDATE users SET sifre = $1 WHERE user_id = $2", [
        hashedPassword,
        userId,
      ]);
    }

    // Diğer bilgileri güncelle
    if (email || telefon) {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

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

      if (updateFields.length > 0) {
        values.push(userId);
        await pool.query(
          `UPDATE users SET ${updateFields.join(
            ", "
          )} WHERE user_id = $${paramIndex}`,
          values
        );
      }
    }

    // Güncellenmiş kullanıcı bilgilerini getir
    const updatedUserResult = await pool.query(
      "SELECT u.*, r.role_name FROM users u INNER JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1",
      [userId]
    );

    const updatedUser = updatedUserResult.rows[0];
    delete updatedUser.sifre;

    return res.status(200).json({
      success: true,
      message: "Kullanıcı bilgileri başarıyla güncellendi.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Kullanıcı bilgileri güncellenirken hata:", error);
    return res.status(500).json({
      success: false,
      message: "Kullanıcı bilgileri güncellenirken bir hata oluştu.",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  verifyToken,
  forgotPassword,
  resetPassword,
  verifyTCKimlik,
  getUserInfo,
  updateUserInfo,
};
