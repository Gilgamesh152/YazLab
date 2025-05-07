const { pool } = require("../config/db");
const notificationService = require("../services/notificationService");

/**
 * Kullanıcının bildirimlerini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;

    const notificationsResult = await pool.query(
      `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `,
      [user_id]
    );

    res.json({
      notifications: notificationsResult.rows,
    });
  } catch (error) {
    console.error("Get user notifications error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Bildirim okundu olarak işaretle
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notification_id } = req.params;
    const user_id = req.user.id;

    // Bildirimi kontrol et ve kullanıcıya ait olduğunu doğrula
    const notificationResult = await pool.query(
      "SELECT * FROM notifications WHERE notification_id = $1 AND user_id = $2",
      [notification_id, user_id]
    );

    if (notificationResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Bildirim bulunamadı veya erişim yetkiniz yok" });
    }

    // Bildirimi okundu olarak işaretle
    await pool.query(
      `
      UPDATE notifications
      SET okundu = true, okundu_tarihi = NOW()
      WHERE notification_id = $1
    `,
      [notification_id]
    );

    res.json({
      message: "Bildirim okundu olarak işaretlendi",
      notification_id,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Tüm bildirimleri okundu olarak işaretle
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Tüm bildirimleri okundu olarak işaretle
    await pool.query(
      `
      UPDATE notifications
      SET okundu = true, okundu_tarihi = NOW()
      WHERE user_id = $1 AND okundu = false
    `,
      [user_id]
    );

    res.json({
      message: "Tüm bildirimler okundu olarak işaretlendi",
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Bildirim oluştur (Admin)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createNotification = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { user_id, mesaj, tip, link } = req.body;

    // Bildirim verilerini doğrula
    if (!user_id || !mesaj) {
      return res
        .status(400)
        .json({ message: "Kullanıcı ID ve mesaj zorunludur" });
    }

    // Kullanıcıyı kontrol et
    const userResult = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // Bildirim oluştur
    const notificationResult = await notificationService.sendNotification({
      user_id,
      mesaj,
      tip: tip || "bilgi",
      link,
    });

    res.status(201).json({
      message: "Bildirim başarıyla oluşturuldu",
      notification: notificationResult,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Toplu bildirim gönder (Admin)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.sendBulkNotification = async (req, res) => {
  const client = await pool.connect();

  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { role, mesaj, tip, link } = req.body;

    // Bildirim verilerini doğrula
    if (!role || !mesaj) {
      return res.status(400).json({ message: "Rol ve mesaj zorunludur" });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Belirtilen roldeki kullanıcıları getir
    let userQuery = `
      SELECT u.user_id
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
    `;

    const queryParams = [];

    if (role !== "all") {
      userQuery += " WHERE r.role_name = $1";
      queryParams.push(role);
    }

    const usersResult = await client.query(userQuery, queryParams);

    if (usersResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Belirtilen rolde kullanıcı bulunamadı" });
    }

    // Her kullanıcıya bildirim gönder
    const notificationPromises = [];
    for (const user of usersResult.rows) {
      notificationPromises.push(
        notificationService.sendNotification({
          user_id: user.user_id,
          mesaj,
          tip: tip || "bilgi",
          link,
        })
      );
    }

    await Promise.all(notificationPromises);

    // İşlemi tamamla
    await client.query("COMMIT");

    res.json({
      message: "Toplu bildirim başarıyla gönderildi",
      count: usersResult.rows.length,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Send bulk notification error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};

/**
 * Okunmamış bildirim sayısını getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getUnreadNotificationCount = async (req, res) => {
  try {
    const user_id = req.user.id;

    const countResult = await pool.query(
      `
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = $1 AND okundu = false
    `,
      [user_id]
    );

    res.json({
      unread_count: parseInt(countResult.rows[0].unread_count),
    });
  } catch (error) {
    console.error("Get unread notification count error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Tüm bildirimleri getir (Admin)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAllNotifications = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yönetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    // Sayfalama
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Filtreleme
    const { user_id, read, type } = req.query;

    let query = `
      SELECT n.*, u.ad, u.soyad, u.email
      FROM notifications n
      JOIN users u ON n.user_id = u.user_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (user_id) {
      query += ` AND n.user_id = $${paramIndex}`;
      queryParams.push(user_id);
      paramIndex++;
    }

    if (read !== undefined) {
      query += ` AND n.okundu = $${paramIndex}`;
      queryParams.push(read === "true");
      paramIndex++;
    }

    if (type) {
      query += ` AND n.tip = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    // Toplam kayıt sayısı
    const countQuery = query.replace(
      "n.*, u.ad, u.soyad, u.email",
      "COUNT(*) as total"
    );
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Sıralama ve sayfalama
    query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    res.json({
      notifications: result.rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all notifications error:", error);

    // Hata kodlarına göre özel mesajlar
    if (error.code === "22P02") {
      return res.status(400).json({ message: "Geçersiz parametre formatı" });
    }

    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Okunmamış bildirimleri getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getUnreadNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;

    const notificationsResult = await pool.query(
      `
      SELECT * FROM notifications
      WHERE user_id = $1 AND okundu = false
      ORDER BY created_at DESC
    `,
      [user_id]
    );

    res.json({
      notifications: notificationsResult.rows,
    });
  } catch (error) {
    console.error("Get unread notifications error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Bildirim detayını getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Bildirimi kontrol et ve kullanıcıya ait olduğunu doğrula
    // Admin veya yönetici ise tüm bildirimlere erişebilir
    let query = `
      SELECT * FROM notifications
      WHERE notification_id = $1
    `;

    const queryParams = [id];

    if (req.user.role !== "admin" && req.user.role !== "yönetici") {
      query += ` AND user_id = $2`;
      queryParams.push(user_id);
    }

    const notificationResult = await pool.query(query, queryParams);

    if (notificationResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Bildirim bulunamadı veya erişim yetkiniz yok" });
    }

    res.json({
      notification: notificationResult.rows[0],
    });
  } catch (error) {
    console.error("Get notification by id error:", error);

    // Hata kodlarına göre özel mesajlar
    if (error.code === "22P02") {
      return res.status(400).json({ message: "Geçersiz bildirim ID formatı" });
    }

    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Bildirimi sil
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Bildirimi kontrol et ve kullanıcıya ait olduğunu doğrula
    // Admin veya yönetici ise tüm bildirimleri silebilir
    let query = `
      SELECT * FROM notifications
      WHERE notification_id = $1
    `;

    const queryParams = [id];

    if (req.user.role !== "admin" && req.user.role !== "yönetici") {
      query += ` AND user_id = $2`;
      queryParams.push(user_id);
    }

    const notificationResult = await pool.query(query, queryParams);

    if (notificationResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Bildirim bulunamadı veya erişim yetkiniz yok" });
    }

    // Bildirimi sil
    await pool.query("DELETE FROM notifications WHERE notification_id = $1", [
      id,
    ]);

    res.json({
      message: "Bildirim başarıyla silindi",
      notification_id: id,
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    // Hata kodlarına göre özel mesajlar
    if (error.code === "22P02") {
      return res.status(400).json({ message: "Geçersiz bildirim ID formatı" });
    }

    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Tüm bildirimleri okundu olarak işaretle (controller adını düzeltme)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Tüm bildirimleri okundu olarak işaretle
    await pool.query(
      `
      UPDATE notifications
      SET okundu = true, okundu_tarihi = NOW()
      WHERE user_id = $1 AND okundu = false
    `,
      [user_id]
    );

    res.json({
      message: "Tüm bildirimler okundu olarak işaretlendi",
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Bildirim gönder (Admin) - sendNotification fonksiyonu createNotification'a bağlanabilir
 */
exports.sendNotification = exports.createNotification;

/**
 * Tüm kullanıcılara bildirim gönder (Admin)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.sendNotificationToAll = async (req, res) => {
  const client = await pool.connect();

  try {
    // Yetki kontrolü
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { mesaj, tip, link } = req.body;

    // Bildirim verilerini doğrula
    if (!mesaj) {
      return res.status(400).json({ message: "Mesaj zorunludur" });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Tüm aktif kullanıcıları getir
    const usersResult = await client.query(
      "SELECT user_id FROM users WHERE is_active = true"
    );

    if (usersResult.rows.length === 0) {
      return res.status(404).json({ message: "Aktif kullanıcı bulunamadı" });
    }

    // Her kullanıcıya bildirim gönder
    const notificationPromises = [];
    for (const user of usersResult.rows) {
      notificationPromises.push(
        notificationService.sendNotification({
          user_id: user.user_id,
          mesaj,
          tip: tip || "bilgi",
          link,
        })
      );
    }

    await Promise.all(notificationPromises);

    // İşlemi tamamla
    await client.query("COMMIT");

    res.json({
      message: "Tüm kullanıcılara bildirim başarıyla gönderildi",
      count: usersResult.rows.length,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Send notification to all error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};

/**
 * Belirli bir role sahip kullanıcılara bildirim gönder (Admin)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.sendNotificationToRole = async (req, res) => {
  const client = await pool.connect();

  try {
    // Yetki kontrolü
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { role, mesaj, tip, link } = req.body;

    // Bildirim verilerini doğrula
    if (!role || !mesaj) {
      return res.status(400).json({ message: "Rol ve mesaj zorunludur" });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Belirtilen roldeki kullanıcıları getir
    const usersResult = await client.query(
      `
      SELECT u.user_id
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE r.role_name = $1 AND u.is_active = true
    `,
      [role]
    );

    if (usersResult.rows.length === 0) {
      return res.status(404).json({
        message: `'${role}' rolünde aktif kullanıcı bulunamadı`,
      });
    }

    // Her kullanıcıya bildirim gönder
    const notificationPromises = [];
    for (const user of usersResult.rows) {
      notificationPromises.push(
        notificationService.sendNotification({
          user_id: user.user_id,
          mesaj,
          tip: tip || "bilgi",
          link,
        })
      );
    }

    await Promise.all(notificationPromises);

    // İşlemi tamamla
    await client.query("COMMIT");

    res.json({
      message: `'${role}' rolündeki kullanıcılara bildirim başarıyla gönderildi`,
      count: usersResult.rows.length,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Send notification to role error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};

/**
 * Bildirim tercihlerini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getNotificationPreferences = async (req, res) => {
  try {
    const user_id = req.user.id;

    const preferencesResult = await pool.query(
      `
      SELECT * FROM user_notification_preferences
      WHERE user_id = $1
    `,
      [user_id]
    );

    // Eğer tercih kaydı yoksa varsayılan değerleri döndür
    if (preferencesResult.rows.length === 0) {
      return res.json({
        preferences: {
          email_notifications: true,
          push_notifications: true,
          application_updates: true,
          jury_assignments: true,
          system_announcements: true,
        },
      });
    }

    res.json({
      preferences: preferencesResult.rows[0],
    });
  } catch (error) {
    console.error("Get notification preferences error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
/**
 * Bildirim tercihlerini güncelle
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      email_notifications,
      push_notifications,
      application_updates,
      jury_assignments,
      system_announcements,
    } = req.body;

    // Mevcut tercihleri kontrol et
    const preferencesResult = await pool.query(
      `
      SELECT * FROM user_notification_preferences
      WHERE user_id = $1
    `,
      [user_id]
    );

    if (preferencesResult.rows.length === 0) {
      // Yeni tercih kaydı oluştur
      await pool.query(
        `
        INSERT INTO user_notification_preferences
        (user_id, email_notifications, push_notifications, application_updates, jury_assignments, system_announcements)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          user_id,
          email_notifications !== undefined ? email_notifications : true,
          push_notifications !== undefined ? push_notifications : true,
          application_updates !== undefined ? application_updates : true,
          jury_assignments !== undefined ? jury_assignments : true,
          system_announcements !== undefined ? system_announcements : true,
        ]
      );
    } else {
      // Mevcut tercihleri güncelle
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (email_notifications !== undefined) {
        updateFields.push(`email_notifications = $${paramIndex}`);
        values.push(email_notifications);
        paramIndex++;
      }

      if (push_notifications !== undefined) {
        updateFields.push(`push_notifications = $${paramIndex}`);
        values.push(push_notifications);
        paramIndex++;
      }

      if (application_updates !== undefined) {
        updateFields.push(`application_updates = $${paramIndex}`);
        values.push(application_updates);
        paramIndex++;
      }
      if (jury_assignments !== undefined) {
        updateFields.push(`jury_assignments = $${paramIndex}`);
        values.push(jury_assignments);
        paramIndex++;
      }

      if (system_announcements !== undefined) {
        updateFields.push(`system_announcements = $${paramIndex}`);
        values.push(system_announcements);
        paramIndex++;
      }

      // Güncelleme yapılacak alanlar varsa güncelle
      if (updateFields.length > 0) {
        values.push(user_id);
        const updateQuery = `
            UPDATE user_notification_preferences
            SET ${updateFields.join(", ")}
            WHERE user_id = $${paramIndex}
          `;
        await pool.query(updateQuery, values);
      }
    }

    // Güncellenmiş tercihleri getir
    const updatedPreferencesResult = await pool.query(
      `
        SELECT * FROM user_notification_preferences
        WHERE user_id = $1
      `,
      [user_id]
    );

    res.json({
      message: "Bildirim tercihleri başarıyla güncellendi",
      preferences: updatedPreferencesResult.rows[0],
    });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
/**
 * Tüm bildirimleri getir (Admin)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAllNotifications = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    // Sayfalama
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Filtreleme
    const { user_id, read, type } = req.query;

    let query = `
      SELECT n.*, u.ad, u.soyad, u.email
      FROM notifications n
      JOIN users u ON n.user_id = u.user_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (user_id) {
      query += ` AND n.user_id = $${paramIndex}`;
      queryParams.push(user_id);
      paramIndex++;
    }

    if (read !== undefined) {
      query += ` AND n.okundu = $${paramIndex}`;
      queryParams.push(read === "true");
      paramIndex++;
    }

    if (type) {
      query += ` AND n.tip = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    // Toplam kayıt sayısı
    const countQuery = query.replace(
      "n.*, u.ad, u.soyad, u.email",
      "COUNT(*) as total"
    );
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Sıralama ve sayfalama
    query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    res.json({
      notifications: result.rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all notifications error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Bildirim detayını getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Bildirimi kontrol et ve kullanıcıya ait olduğunu doğrula
    // Admin veya yönetici ise tüm bildirimlere erişebilir
    let query = `
      SELECT * FROM notifications
      WHERE notification_id = $1
    `;

    const queryParams = [id];

    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      query += ` AND user_id = $2`;
      queryParams.push(user_id);
    }

    const notificationResult = await pool.query(query, queryParams);

    if (notificationResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Bildirim bulunamadı veya erişim yetkiniz yok" });
    }

    res.json({
      notification: notificationResult.rows[0],
    });
  } catch (error) {
    console.error("Get notification by id error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Bildirimi sil
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Bildirimi kontrol et ve kullanıcıya ait olduğunu doğrula
    // Admin veya yönetici ise tüm bildirimleri silebilir
    let query = `
      SELECT * FROM notifications
      WHERE notification_id = $1
    `;

    const queryParams = [id];

    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      query += ` AND user_id = $2`;
      queryParams.push(user_id);
    }

    const notificationResult = await pool.query(query, queryParams);

    if (notificationResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Bildirim bulunamadı veya erişim yetkiniz yok" });
    }

    // Bildirimi sil
    await pool.query("DELETE FROM notifications WHERE notification_id = $1", [
      id,
    ]);

    res.json({
      message: "Bildirim başarıyla silindi",
      notification_id: id,
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Bildirim tercihlerini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getNotificationPreferences = async (req, res) => {
  try {
    const user_id = req.user.id;

    const preferencesResult = await pool.query(
      `
      SELECT * FROM user_notification_preferences
      WHERE user_id = $1
    `,
      [user_id]
    );

    // Eğer tercih kaydı yoksa varsayılan değerleri döndür
    if (preferencesResult.rows.length === 0) {
      return res.json({
        preferences: {
          email_notifications: true,
          push_notifications: true,
          application_updates: true,
          jury_assignments: true,
          system_announcements: true,
        },
      });
    }

    res.json({
      preferences: preferencesResult.rows[0],
    });
  } catch (error) {
    console.error("Get notification preferences error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Bildirim tercihlerini güncelle
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      email_notifications,
      push_notifications,
      application_updates,
      jury_assignments,
      system_announcements,
    } = req.body;

    // Mevcut tercihleri kontrol et
    const preferencesResult = await pool.query(
      `
      SELECT * FROM user_notification_preferences
      WHERE user_id = $1
    `,
      [user_id]
    );

    if (preferencesResult.rows.length === 0) {
      // Yeni tercih kaydı oluştur
      await pool.query(
        `
        INSERT INTO user_notification_preferences
        (user_id, email_notifications, push_notifications, application_updates, jury_assignments, system_announcements)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          user_id,
          email_notifications !== undefined ? email_notifications : true,
          push_notifications !== undefined ? push_notifications : true,
          application_updates !== undefined ? application_updates : true,
          jury_assignments !== undefined ? jury_assignments : true,
          system_announcements !== undefined ? system_announcements : true,
        ]
      );
    } else {
      // Mevcut tercihleri güncelle
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (email_notifications !== undefined) {
        updateFields.push(`email_notifications = $${paramIndex}`);
        values.push(email_notifications);
        paramIndex++;
      }

      if (push_notifications !== undefined) {
        updateFields.push(`push_notifications = $${paramIndex}`);
        values.push(push_notifications);
        paramIndex++;
      }

      if (application_updates !== undefined) {
        updateFields.push(`application_updates = $${paramIndex}`);
        values.push(application_updates);
        paramIndex++;
      }
      if (jury_assignments !== undefined) {
        updateFields.push(`jury_assignments = $${paramIndex}`);
        values.push(jury_assignments);
        paramIndex++;
      }

      if (system_announcements !== undefined) {
        updateFields.push(`system_announcements = $${paramIndex}`);
        values.push(system_announcements);
        paramIndex++;
      }

      // Güncelleme yapılacak alanlar varsa güncelle
      if (updateFields.length > 0) {
        values.push(user_id);
        const updateQuery = `
            UPDATE user_notification_preferences
            SET ${updateFields.join(", ")}
            WHERE user_id = $${paramIndex}
          `;
        await pool.query(updateQuery, values);
      }
    }

    // Güncellenmiş tercihleri getir
    const updatedPreferencesResult = await pool.query(
      `
        SELECT * FROM user_notification_preferences
        WHERE user_id = $1
      `,
      [user_id]
    );

    res.json({
      message: "Bildirim tercihleri başarıyla güncellendi",
      preferences: updatedPreferencesResult.rows[0],
    });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
