/**
 * notificationService.js
 *
 * Bu servis, akademik personel başvuru sistemi için bildirim işlemlerini yönetir.
 * E-posta bildirimleri, uygulama içi bildirimler ve SMS bildirimleri için yöntemleri içerir.
 */

const firebase = require("firebase-admin");
const { Pool } = require("pg");
const pool = require("../config/db");
const emailService = require("./emailService");
const { formatDate } = require("../utils/formatters");

/**
 * Veritabanına bildirim ekler
 * @param {number} userId - Bildirimin gönderileceği kullanıcı ID'si
 * @param {number} applicationId - İlgili başvuru ID'si
 * @param {string} message - Bildirim mesajı
 * @param {string} type - Bildirim tipi (info, warning, success, error)
 * @returns {Promise<Object>} - Eklenen bildirim nesnesi
 */
const createNotification = async (
  userId,
  applicationId,
  message,
  type = "info"
) => {
  try {
    const query = `
      INSERT INTO notifications (user_id, basvuru_id, mesaj, notification_type, gonderildi, created_at)
      VALUES ($1, $2, $3, $4, false, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      applicationId,
      message,
      type,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Bildirim oluşturulurken hata:", error);
    throw new Error("Bildirim oluşturulamadı");
  }
};

/**
 * Firebase kullanarak gerçek zamanlı bildirim gönderir
 * @param {number} userId - Kullanıcı ID'si
 * @param {Object} notificationData - Bildirim verileri
 * @returns {Promise<void>}
 */
const sendRealTimeNotification = async (userId, notificationData) => {
  try {
    // Kullanıcının FCM token'ını veritabanından al
    const userQuery = "SELECT fcm_token FROM users WHERE user_id = $1";
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0 || !userResult.rows[0].fcm_token) {
      console.log(`Kullanıcı ${userId} için FCM token bulunamadı`);
      return;
    }

    const token = userResult.rows[0].fcm_token;

    // Firebase üzerinden bildirim gönder
    const message = {
      notification: {
        title: notificationData.title || "Akademik Başvuru Sistemi",
        body: notificationData.message,
      },
      data: {
        type: notificationData.type || "info",
        applicationId: notificationData.applicationId
          ? notificationData.applicationId.toString()
          : "",
        url: notificationData.url || "",
        createdAt: new Date().toISOString(),
      },
      token: token,
    };

    await firebase.messaging().send(message);

    // Bildirimin gönderildiğini işaretle
    await pool.query(
      "UPDATE notifications SET gonderildi = true WHERE notification_id = $1",
      [notificationData.notificationId]
    );

    return true;
  } catch (error) {
    console.error("Gerçek zamanlı bildirim gönderilirken hata:", error);
    return false;
  }
};

/**
 * Bir kullanıcının tüm bildirimlerini getirir
 * @param {number} userId - Kullanıcı ID'si
 * @param {Object} options - Sayfalama ve filtreleme seçenekleri
 * @returns {Promise<Array>} - Bildirimler dizisi
 */
const getUserNotifications = async (userId, options = {}) => {
  const { limit = 10, offset = 0, read = null } = options;

  try {
    let query = `
      SELECT n.*, a.basvuru_baslik, a.kadro_id
      FROM notifications n
      LEFT JOIN applications app ON n.basvuru_id = app.application_id
      LEFT JOIN announcements a ON app.basvuru_id = a.ilan_id
      WHERE n.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (read !== null) {
      query += ` AND n.read = $${paramIndex}`;
      params.push(read);
      paramIndex++;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return result.rows.map((notification) => ({
      ...notification,
      created_at: formatDate(notification.created_at),
    }));
  } catch (error) {
    console.error("Kullanıcı bildirimleri alınırken hata:", error);
    throw new Error("Bildirimler alınamadı");
  }
};

/**
 * Bir bildirimi okundu olarak işaretler
 * @param {number} notificationId - Bildirim ID'si
 * @param {number} userId - Kullanıcı ID'si (yetki kontrolü için)
 * @returns {Promise<boolean>} - İşlem başarılı oldu mu?
 */
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const query = `
      UPDATE notifications
      SET read = true
      WHERE notification_id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [notificationId, userId]);
    return result.rowCount > 0;
  } catch (error) {
    console.error("Bildirim okundu işaretlenirken hata:", error);
    throw new Error("Bildirim güncellenemedi");
  }
};

/**
 * Tüm bildirimleri okundu olarak işaretler
 * @param {number} userId - Kullanıcı ID'si
 * @returns {Promise<number>} - Etkilenen satır sayısı
 */
const markAllNotificationsAsRead = async (userId) => {
  try {
    const query = `
      UPDATE notifications
      SET read = true
      WHERE user_id = $1 AND read = false
      RETURNING *
    `;

    const result = await pool.query(query, [userId]);
    return result.rowCount;
  } catch (error) {
    console.error("Tüm bildirimler okundu işaretlenirken hata:", error);
    throw new Error("Bildirimler güncellenemedi");
  }
};

/**
 * İlan sürecinin değiştiği durumlarda tüm jüri üyelerine bildirim gönderir
 * @param {number} announcementId - İlan ID'si
 * @param {string} message - Bildirim mesajı
 * @returns {Promise<void>}
 */
const notifyJuryMembers = async (announcementId, message) => {
  try {
    // İlana atanmış jüri üyelerini bul
    const juryQuery = `
      SELECT j.jury_id, j.user_id
      FROM jury_members j
      INNER JOIN evaluations e ON j.jury_id = e.jury_id
      INNER JOIN applications a ON e.basvuru_id = a.application_id
      INNER JOIN announcements ann ON a.basvuru_id = ann.ilan_id
      WHERE ann.ilan_id = $1
    `;

    const juryResult = await pool.query(juryQuery, [announcementId]);

    // Her bir jüri üyesine bildirim gönder
    for (const jury of juryResult.rows) {
      if (!jury.user_id) continue;

      const notification = await createNotification(
        jury.user_id,
        null,
        message,
        "info"
      );

      // E-posta bildirimi gönder
      await emailService.sendEmail({
        to: jury.email,
        subject: "İlan Değerlendirme Süreci Güncellendi",
        text: message,
        html: `<p>${message}</p>`,
      });

      // Gerçek zamanlı bildirim gönder
      await sendRealTimeNotification(jury.user_id, {
        title: "İlan Değerlendirme Süreci",
        message,
        notificationId: notification.notification_id,
      });
    }
  } catch (error) {
    console.error("Jüri üyelerine bildirim gönderilirken hata:", error);
    throw new Error("Jüri bildirimleri gönderilemedi");
  }
};

/**
 * Başvuru durumu değiştiğinde adaya bildirim gönderir
 * @param {number} applicationId - Başvuru ID'si
 * @param {string} status - Yeni durum
 * @param {string} message - Ek mesaj (opsiyonel)
 * @returns {Promise<void>}
 */
const notifyApplicantOfStatusChange = async (
  applicationId,
  status,
  message = ""
) => {
  try {
    // Başvuru sahibini bul
    const applicationQuery = `
      SELECT a.user_id, a.basvuru_id, ann.ilan_baslik, u.email
      FROM applications a
      INNER JOIN announcements ann ON a.basvuru_id = ann.ilan_id
      INNER JOIN users u ON a.user_id = u.user_id
      WHERE a.application_id = $1
    `;

    const applicationResult = await pool.query(applicationQuery, [
      applicationId,
    ]);

    if (applicationResult.rows.length === 0) {
      throw new Error("Başvuru bulunamadı");
    }

    const application = applicationResult.rows[0];

    // Durum mesajını hazırla
    let statusMessage = "";
    switch (status) {
      case "pending":
        statusMessage = "Başvurunuz alındı ve değerlendirme aşamasında.";
        break;
      case "approved":
        statusMessage = "Tebrikler! Başvurunuz onaylandı.";
        break;
      case "rejected":
        statusMessage = "Üzgünüz, başvurunuz kabul edilmedi.";
        break;
      case "under_review":
        statusMessage = "Başvurunuz şu anda jüri değerlendirmesinde.";
        break;
      default:
        statusMessage = `Başvuru durumunuz güncellendi: ${status}`;
    }

    if (message) {
      statusMessage += ` ${message}`;
    }

    const finalMessage = `"${application.ilan_baslik}" ilanına yaptığınız başvuru için: ${statusMessage}`;

    // Bildirim oluştur
    const notification = await createNotification(
      application.user_id,
      applicationId,
      finalMessage,
      status === "approved"
        ? "success"
        : status === "rejected"
        ? "error"
        : "info"
    );

    // E-posta bildirimi gönder
    await emailService.sendEmail({
      to: application.email,
      subject: "Başvuru Durumu Güncellendi",
      text: finalMessage,
      html: `<p>${finalMessage}</p>`,
    });

    // Gerçek zamanlı bildirim gönder
    await sendRealTimeNotification(application.user_id, {
      title: "Başvuru Durumu Güncellendi",
      message: finalMessage,
      applicationId,
      notificationId: notification.notification_id,
      type:
        status === "approved"
          ? "success"
          : status === "rejected"
          ? "error"
          : "info",
    });
  } catch (error) {
    console.error(
      "Aday durum değişikliği bildirimi gönderilirken hata:",
      error
    );
    throw new Error("Durum değişikliği bildirimi gönderilemedi");
  }
};

/**
 * Tüm jüri değerlendirmeleri tamamlandığında yöneticiye bildirim gönderir
 * @param {number} applicationId - Başvuru ID'si
 * @returns {Promise<void>}
 */
const notifyManagerOfCompletedEvaluations = async (applicationId) => {
  try {
    // Başvuru bilgilerini al
    const applicationQuery = `
      SELECT a.application_id, a.basvuru_id, ann.ilan_baslik, u.ad, u.soyad
      FROM applications a
      INNER JOIN announcements ann ON a.basvuru_id = ann.ilan_id
      INNER JOIN users u ON a.user_id = u.user_id
      WHERE a.application_id = $1
    `;

    const applicationResult = await pool.query(applicationQuery, [
      applicationId,
    ]);

    if (applicationResult.rows.length === 0) {
      throw new Error("Başvuru bulunamadı");
    }

    const application = applicationResult.rows[0];

    // Yönetici kullanıcıları bul
    const managerQuery = `
      SELECT user_id, email
      FROM users
      WHERE role_id = (SELECT role_id FROM roles WHERE role_name = 'Yönetici')
    `;

    const managerResult = await pool.query(managerQuery);

    if (managerResult.rows.length === 0) {
      console.log("Bildirim göndermek için yönetici bulunamadı");
      return;
    }

    const message = `"${application.ilan_baslik}" ilanına ${application.ad} ${application.soyad} tarafından yapılan başvuru için tüm jüri değerlendirmeleri tamamlanmıştır. Lütfen nihai kararı verin.`;

    // Her bir yöneticiye bildirim gönder
    for (const manager of managerResult.rows) {
      // Bildirim oluştur
      const notification = await createNotification(
        manager.user_id,
        applicationId,
        message,
        "info"
      );

      // E-posta bildirimi gönder
      await emailService.sendEmail({
        to: manager.email,
        subject: "Değerlendirmeler Tamamlandı",
        text: message,
        html: `<p>${message}</p><p>Nihai kararı vermek için <a href="/manager/final-decision/${applicationId}">tıklayın</a>.</p>`,
      });

      // Gerçek zamanlı bildirim gönder
      await sendRealTimeNotification(manager.user_id, {
        title: "Değerlendirmeler Tamamlandı",
        message,
        applicationId,
        notificationId: notification.notification_id,
        url: `/manager/final-decision/${applicationId}`,
      });
    }
  } catch (error) {
    console.error(
      "Yönetici tamamlanmış değerlendirme bildirimi gönderilirken hata:",
      error
    );
    throw new Error("Yönetici bildirimi gönderilemedi");
  }
};

/**
 * Yeni jüri ataması yapıldığında jüri üyesine bildirim gönderir
 * @param {number} juryId - Jüri ID'si
 * @param {number} applicationId - Başvuru ID'si
 * @returns {Promise<void>}
 */
const notifyJuryOfAssignment = async (juryId, applicationId) => {
  try {
    // Jüri bilgilerini al
    const juryQuery = `
      SELECT j.jury_id, j.user_id, u.email, ann.ilan_baslik, a.application_id
      FROM jury_members j
      INNER JOIN users u ON j.user_id = u.user_id
      INNER JOIN applications a ON a.application_id = $2
      INNER JOIN announcements ann ON a.basvuru_id = ann.ilan_id
      WHERE j.jury_id = $1
    `;

    const juryResult = await pool.query(juryQuery, [juryId, applicationId]);

    if (juryResult.rows.length === 0) {
      throw new Error("Jüri üyesi bulunamadı");
    }

    const jury = juryResult.rows[0];

    const message = `"${jury.ilan_baslik}" ilanına yapılan bir başvuruyu değerlendirmek üzere jüri üyesi olarak atandınız. Lütfen değerlendirmenizi en kısa sürede tamamlayın.`;

    // Bildirim oluştur
    const notification = await createNotification(
      jury.user_id,
      applicationId,
      message,
      "info"
    );

    // E-posta bildirimi gönder
    await emailService.sendEmail({
      to: jury.email,
      subject: "Yeni Jüri Değerlendirme Görevi",
      text: message,
      html: `<p>${message}</p><p>Değerlendirmeyi yapmak için <a href="/jury/evaluation/${applicationId}">tıklayın</a>.</p>`,
    });

    // Gerçek zamanlı bildirim gönder
    await sendRealTimeNotification(jury.user_id, {
      title: "Yeni Jüri Görevi",
      message,
      applicationId,
      notificationId: notification.notification_id,
      url: `/jury/evaluation/${applicationId}`,
    });
  } catch (error) {
    console.error("Jüri atama bildirimi gönderilirken hata:", error);
    throw new Error("Jüri atama bildirimi gönderilemedi");
  }
};

/**
 * Yeni ilan yayınlandığında kullanıcılara bildirim gönderir
 * @param {number} announcementId - İlan ID'si
 * @returns {Promise<void>}
 */
const notifyUsersOfNewAnnouncement = async (announcementId) => {
  try {
    // İlan bilgilerini al
    const announcementQuery = `
      SELECT ann.ilan_id, ann.ilan_baslik, ann.kadro_id, k.kadro_ad, f.faculty_id, f.faculty_ad, d.departman_id, d.departman_ad
      FROM announcements ann
      INNER JOIN kadrolar k ON ann.kadro_id = k.kadro_id
      INNER JOIN faculties f ON ann.faculty_id = f.faculty_id
      INNER JOIN departmanlar d ON ann.departman_id = d.departman_id
      WHERE ann.ilan_id = $1
    `;

    const announcementResult = await pool.query(announcementQuery, [
      announcementId,
    ]);

    if (announcementResult.rows.length === 0) {
      throw new Error("İlan bulunamadı");
    }

    const announcement = announcementResult.rows[0];

    // "Aday" rolündeki tüm kullanıcıları bul
    const userQuery = `
      SELECT user_id, email
      FROM users
      WHERE role_id = (SELECT role_id FROM roles WHERE role_name = 'Aday')
    `;

    const userResult = await pool.query(userQuery);

    if (userResult.rows.length === 0) {
      console.log("Bildirim göndermek için kullanıcı bulunamadı");
      return;
    }

    const message = `${announcement.faculty_ad} Fakültesi, ${announcement.departman_ad} Bölümü için ${announcement.kadro_ad} kadrosunda yeni bir ilan yayınlandı: "${announcement.ilan_baslik}"`;

    // Her bir kullanıcıya bildirim gönder (toplu e-posta için)
    const emails = userResult.rows.map((user) => user.email);

    // Toplu e-posta gönder
    await emailService.sendEmail({
      to: emails,
      subject: "Yeni Akademik Kadro İlanı",
      text: message,
      html: `<p>${message}</p><p>Detayları görmek ve başvurmak için <a href="/applicant/announcements/${announcementId}">tıklayın</a>.</p>`,
    });

    // Her bir kullanıcı için ayrı bildirim oluştur ve gerçek zamanlı bildirim gönder
    for (const user of userResult.rows) {
      // Bildirim oluştur
      const notification = await createNotification(
        user.user_id,
        null, // İlana henüz başvuru yapılmadı
        message,
        "info"
      );

      // Gerçek zamanlı bildirim gönder
      await sendRealTimeNotification(user.user_id, {
        title: "Yeni Akademik İlan",
        message,
        notificationId: notification.notification_id,
        url: `/applicant/announcements/${announcementId}`,
      });
    }
  } catch (error) {
    console.error("Yeni ilan bildirimi gönderilirken hata:", error);
    throw new Error("Yeni ilan bildirimi gönderilemedi");
  }
};

/**
 * Okunmamış bildirim sayısını getirir
 * @param {number} userId - Kullanıcı ID'si
 * @returns {Promise<number>} - Okunmamış bildirim sayısı
 */
const getUnreadNotificationsCount = async (userId) => {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND read = false
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error("Okunmamış bildirim sayısı alınırken hata:", error);
    throw new Error("Bildirim sayısı alınamadı");
  }
};

/**
 * Eski bildirimleri temizler
 * @param {number} days - Kaç günden eski bildirimler temizlenecek
 * @returns {Promise<number>} - Silinen bildirim sayısı
 */
const cleanupOldNotifications = async (days = 30) => {
  try {
    const query = `
      DELETE FROM notifications
      WHERE created_at < NOW() - INTERVAL '${days} days'
      RETURNING *
    `;

    const result = await pool.query(query);
    return result.rowCount;
  } catch (error) {
    console.error("Eski bildirimler temizlenirken hata:", error);
    throw new Error("Eski bildirimler temizlenemedi");
  }
};

module.exports = {
  createNotification,
  sendRealTimeNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  notifyJuryMembers,
  notifyApplicantOfStatusChange,
  notifyManagerOfCompletedEvaluations,
  notifyJuryOfAssignment,
  notifyUsersOfNewAnnouncement,
  getUnreadNotificationsCount,
  cleanupOldNotifications,
};
