const { pool } = require("../config/db");
const { validateJuryData } = require("../utils/validators");
const notificationService = require("../services/notificationService");

/**
 * Tüm jüri üyelerini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAllJuryMembers = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const result = await pool.query(`
      SELECT * FROM jury_members
      ORDER BY ad, soyad
    `);

    res.json({ jury_members: result.rows });
  } catch (error) {
    console.error("Get all jury members error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Jüri üyesi detayını getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getJuryMemberById = async (req, res) => {
  try {
    // Yetki kontrolü
    if (
      req.user.role !== "admin" &&
      req.user.role !== "yonetici" &&
      req.user.role !== "juri"
    ) {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM jury_members WHERE jury_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Jüri üyesi bulunamadı" });
    }

    res.json({ jury_member: result.rows[0] });
  } catch (error) {
    console.error("Get jury member by id error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * TC Kimlik numarasına göre jüri üyesi getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getJuryMemberByTcKimlik = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { tc_kimlik } = req.params;

    const result = await pool.query(
      "SELECT * FROM jury_members WHERE tc_kimlik = $1",
      [tc_kimlik]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Jüri üyesi bulunamadı" });
    }

    res.json({ jury_member: result.rows[0] });
  } catch (error) {
    console.error("Get jury member by TC Kimlik error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Yeni jüri üyesi ekle (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createJuryMember = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { tc_kimlik, ad, soyad, unvan, kurum, email, telefon } = req.body;

    // Veri doğrulama
    const { error } = validateJuryData(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // TC Kimlik kontrol et
    const tcKimlikCheck = await pool.query(
      "SELECT * FROM jury_members WHERE tc_kimlik = $1",
      [tc_kimlik]
    );

    if (tcKimlikCheck.rows.length > 0) {
      return res.status(400).json({
        message: "Bu TC Kimlik numarası ile kayıtlı bir jüri üyesi zaten var",
      });
    }

    // Kullanıcı tablosunda TC Kimlik kontrol et
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE tc_kimlik = $1",
      [tc_kimlik]
    );

    // Eğer aynı TC Kimlik numarasına sahip bir kullanıcı yoksa, jüri ekle
    const result = await pool.query(
      `
      INSERT INTO jury_members (tc_kimlik, ad, soyad, unvan, kurum, email, telefon, created_at, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
      RETURNING *
    `,
      [tc_kimlik, ad, soyad, unvan, kurum, email, telefon, req.user.id]
    );

    // Eğer aynı TC Kimlik numarasına sahip bir kullanıcı varsa, jüri rolü ata
    if (userCheck.rows.length > 0) {
      // Rol ID'sini getir
      const roleResult = await pool.query(
        "SELECT role_id FROM roles WHERE role_name = $1",
        ["juri"]
      );

      if (roleResult.rows.length > 0) {
        const juriRoleId = roleResult.rows[0].role_id;

        // Kullanıcının rolünü güncelle
        await pool.query("UPDATE users SET role_id = $1 WHERE tc_kimlik = $2", [
          juriRoleId,
          tc_kimlik,
        ]);

        // Kullanıcıya bildirim gönder
        await notificationService.sendNotification({
          user_id: userCheck.rows[0].user_id,
          mesaj:
            "Jüri üyesi olarak atandınız. Artık başvuruları değerlendirebilirsiniz.",
          tip: "bilgi",
        });
      }
    }

    res.status(201).json({
      message: "Jüri üyesi başarıyla eklendi",
      jury_member: result.rows[0],
    });
  } catch (error) {
    console.error("Create jury member error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Jüri üyesi güncelle (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateJuryMember = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { id } = req.params;
    const { ad, soyad, unvan, kurum, email, telefon } = req.body;

    // Veri doğrulama (TC Kimlik hariç)
    const { error } = validateJuryData({
      ...req.body,
      tc_kimlik: "11111111111",
    }); // Geçici TC Kimlik
    if (error && error.details[0].context.key !== "tc_kimlik") {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Jüri üyesini kontrol et
    const juryCheck = await pool.query(
      "SELECT * FROM jury_members WHERE jury_id = $1",
      [id]
    );

    if (juryCheck.rows.length === 0) {
      return res.status(404).json({ message: "Jüri üyesi bulunamadı" });
    }

    // Jüri üyesini güncelle
    const result = await pool.query(
      `
      UPDATE jury_members
      SET ad = $1, soyad = $2, unvan = $3, kurum = $4, email = $5, telefon = $6, updated_at = NOW(), updated_by = $7
      WHERE jury_id = $8
      RETURNING *
    `,
      [ad, soyad, unvan, kurum, email, telefon, req.user.id, id]
    );

    // Eğer aynı TC Kimlik numarasına sahip bir kullanıcı varsa, bilgilerini güncelle
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE tc_kimlik = $1",
      [juryCheck.rows[0].tc_kimlik]
    );

    if (userCheck.rows.length > 0) {
      await pool.query(
        `
        UPDATE users
        SET ad = $1, soyad = $2, email = $3, telefon = $4
        WHERE tc_kimlik = $5
      `,
        [ad, soyad, email, telefon, juryCheck.rows[0].tc_kimlik]
      );
    }

    res.json({
      message: "Jüri üyesi başarıyla güncellendi",
      jury_member: result.rows[0],
    });
  } catch (error) {
    console.error("Update jury member error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Jüri üyesi sil (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteJuryMember = async (req, res) => {
  const client = await pool.connect();

  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { id } = req.params;

    // Jüri üyesini kontrol et
    const juryCheck = await client.query(
      "SELECT * FROM jury_members WHERE jury_id = $1",
      [id]
    );

    if (juryCheck.rows.length === 0) {
      return res.status(404).json({ message: "Jüri üyesi bulunamadı" });
    }

    // Değerlendirme kontrolü
    const evaluationCheck = await client.query(
      "SELECT COUNT(*) FROM evaluations WHERE jury_id = $1",
      [id]
    );

    if (parseInt(evaluationCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Bu jüri üyesinin değerlendirmeleri olduğu için silinemez",
      });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Jüri atamalarını sil
    await client.query("DELETE FROM jury_assignments WHERE jury_id = $1", [id]);

    // Jüri üyesini sil
    await client.query("DELETE FROM jury_members WHERE jury_id = $1", [id]);

    // İşlemi tamamla
    await client.query("COMMIT");

    res.json({
      message: "Jüri üyesi başarıyla silindi",
      jury_id: id,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Delete jury member error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};

/**
 * Başvuruya jüri üyesi ata (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.assignJuryToApplication = async (req, res) => {
  const client = await pool.connect();

  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { application_id } = req.params;
    const { jury_ids } = req.body;

    // Başvuruyu kontrol et
    const applicationCheck = await client.query(
      "SELECT * FROM applications WHERE application_id = $1",
      [application_id]
    );

    if (applicationCheck.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    // Başvuru durumunu kontrol et
    if (applicationCheck.rows[0].durum !== "incelemede") {
      return res.status(400).json({
        message: "Sadece incelemede olan başvurulara jüri atanabilir",
      });
    }

    // Jüri üyelerini kontrol et
    for (const jury_id of jury_ids) {
      const juryCheck = await client.query(
        "SELECT * FROM jury_members WHERE jury_id = $1",
        [jury_id]
      );

      if (juryCheck.rows.length === 0) {
        return res
          .status(404)
          .json({ message: `${jury_id} ID'li jüri üyesi bulunamadı` });
      }
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Mevcut atamaları temizle
    await client.query(
      "DELETE FROM jury_assignments WHERE application_id = $1",
      [application_id]
    );

    // Yeni jüri üyelerini ata
    for (const jury_id of jury_ids) {
      await client.query(
        `
        INSERT INTO jury_assignments (application_id, jury_id, assigned_at, assigned_by)
        VALUES ($1, $2, NOW(), $3)
      `,
        [application_id, jury_id, req.user.id]
      );

      // TC Kimlik ile kullanıcı tablosunda jüri üyesini bul
      const juryResult = await client.query(
        "SELECT tc_kimlik FROM jury_members WHERE jury_id = $1",
        [jury_id]
      );
      const userResult = await client.query(
        "SELECT user_id FROM users WHERE tc_kimlik = $1",
        [juryResult.rows[0].tc_kimlik]
      );

      // Eğer jüri üyesi kullanıcılar tablosunda varsa, bildirim gönder
      if (userResult.rows.length > 0) {
        // Başvuru ve ilan bilgilerini getir
        const applicationInfoResult = await client.query(
          `
          SELECT a.application_id, u.ad as applicant_ad, u.soyad as applicant_soyad,
                 f.faculty_ad, d.departman_ad, k.kadro_ad
          FROM applications a
          JOIN users u ON a.user_id = u.user_id
          JOIN announcements an ON a.ilan_id = an.ilan_id
          JOIN faculties f ON an.faculty_id = f.faculty_id
          JOIN departmanlar d ON an.departman_id = d.departman_id
          JOIN kadrolar k ON an.kadro_id = k.kadro_id
          WHERE a.application_id = $1
        `,
          [application_id]
        );

        const applicationInfo = applicationInfoResult.rows[0];

        await notificationService.sendNotification({
          user_id: userResult.rows[0].user_id,
          mesaj: `Yeni değerlendirme göreviniz: ${applicationInfo.applicant_ad} ${applicationInfo.applicant_soyad} - ${applicationInfo.faculty_ad} ${applicationInfo.departman_ad} ${applicationInfo.kadro_ad} başvurusunu değerlendirmeniz istendi.`,
          tip: "bilgi",
          link: `/jury/applications/${application_id}`,
        });
      }
    }

    // İşlemi tamamla
    await client.query("COMMIT");

    res.json({
      message: "Jüri üyeleri başarıyla atandı",
      application_id,
      jury_ids,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Assign jury to application error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};

/**
 * Başvuruya atanan jüri üyelerini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getApplicationJuryMembers = async (req, res) => {
  try {
    const { application_id } = req.params;

    // Başvuruyu kontrol et
    const applicationCheck = await pool.query(
      "SELECT * FROM applications WHERE application_id = $1",
      [application_id]
    );

    if (applicationCheck.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    // Yetki kontrolü (başvuru sahibi bu bilgilere erişemez)
    if (
      req.user.role !== "admin" &&
      req.user.role !== "yonetici" &&
      req.user.role !== "juri"
    ) {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    // Jüri üyesi ise, sadece kendisi atanmışsa erişebilir
    if (req.user.role === "juri") {
      const juryCheckResult = await pool.query(
        `
        SELECT j.jury_id 
        FROM jury_members j
        JOIN users u ON j.tc_kimlik = u.tc_kimlik
        WHERE u.user_id = $1
      `,
        [req.user.id]
      );

      if (juryCheckResult.rows.length === 0) {
        return res
          .status(403)
          .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
      }

      const juryId = juryCheckResult.rows[0].jury_id;

      const assignmentCheckResult = await pool.query(
        `
        SELECT * FROM jury_assignments
        WHERE application_id = $1 AND jury_id = $2
      `,
        [application_id, juryId]
      );

      if (assignmentCheckResult.rows.length === 0) {
        return res.status(403).json({ message: "Bu başvuruya atanmadınız" });
      }
    }

    // Jüri üyelerini getir
    const juryMembersResult = await pool.query(
      `
      SELECT j.*, ja.assigned_at,
             (SELECT COUNT(*) FROM evaluations e WHERE e.jury_id = j.jury_id AND e.application_id = ja.application_id) as evaluation_count
      FROM jury_assignments ja
      JOIN jury_members j ON ja.jury_id = j.jury_id
      WHERE ja.application_id = $1
      ORDER BY j.ad, j.soyad
    `,
      [application_id]
    );

    res.json({
      application_id,
      jury_members: juryMembersResult.rows,
    });
  } catch (error) {
    console.error("Get application jury members error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Jüri üyesine atanan başvuruları getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getJuryAssignments = async (req, res) => {
  try {
    // Jüri üyesinin TC Kimlik numarasını al
    let tc_kimlik;

    if (req.user.role === "juri") {
      tc_kimlik = req.user.tc_kimlik;
    } else if (req.user.role === "admin" || req.user.role === "yonetici") {
      const { jury_id } = req.params;

      if (!jury_id) {
        return res
          .status(400)
          .json({ message: "Jüri ID parametresi gereklidir" });
      }

      const juryResult = await pool.query(
        "SELECT tc_kimlik FROM jury_members WHERE jury_id = $1",
        [jury_id]
      );

      if (juryResult.rows.length === 0) {
        return res.status(404).json({ message: "Jüri üyesi bulunamadı" });
      }

      tc_kimlik = juryResult.rows[0].tc_kimlik;
    } else {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    // Jüri üyesini getir
    const juryMemberResult = await pool.query(
      "SELECT * FROM jury_members WHERE tc_kimlik = $1",
      [tc_kimlik]
    );

    if (juryMemberResult.rows.length === 0) {
      return res.status(404).json({ message: "Jüri üyesi bulunamadı" });
    }

    const jury_id = juryMemberResult.rows[0].jury_id;

    // Atanan başvuruları getir
    const assignmentsResult = await pool.query(
      `
      SELECT ja.*, a.durum as application_status, a.basvuru_tarihi, a.submitted_at,
             u.ad as applicant_ad, u.soyad as applicant_soyad,
             an.ilan_baslik, f.faculty_ad, d.departman_ad, k.kadro_ad,
             (SELECT COUNT(*) FROM evaluations e WHERE e.jury_id = ja.jury_id AND e.application_id = ja.application_id) as evaluation_count
      FROM jury_assignments ja
      JOIN applications a ON ja.application_id = a.application_id
      JOIN users u ON a.user_id = u.user_id
      JOIN announcements an ON a.ilan_id = an.ilan_id
      JOIN faculties f ON an.faculty_id = f.faculty_id
      JOIN departmanlar d ON an.departman_id = d.departman_id
      JOIN kadrolar k ON an.kadro_id = k.kadro_id
      WHERE ja.jury_id = $1
      ORDER BY ja.assigned_at DESC
    `,
      [jury_id]
    );

    res.json({
      jury_member: juryMemberResult.rows[0],
      assignments: assignmentsResult.rows,
    });
  } catch (error) {
    console.error("Get jury assignments error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
/**
 * Jüri üyesini başvurudan kaldır (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.unassignJuryFromApplication = async (req, res) => {
  const client = await pool.connect();

  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yönetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { juryId, applicationId } = req.params;

    // Başvuruyu kontrol et
    const applicationCheck = await client.query(
      "SELECT * FROM applications WHERE application_id = $1",
      [applicationId]
    );

    if (applicationCheck.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    // Başvuru durumunu kontrol et
    if (applicationCheck.rows[0].durum !== "incelemede") {
      return res.status(400).json({
        message: "Sadece incelemede olan başvurulardan jüri kaldırılabilir",
      });
    }

    // Jüri üyesini kontrol et
    const juryCheck = await client.query(
      "SELECT * FROM jury_members WHERE jury_id = $1",
      [juryId]
    );

    if (juryCheck.rows.length === 0) {
      return res.status(404).json({ message: "Jüri üyesi bulunamadı" });
    }

    // Atama kontrolü
    const assignmentCheck = await client.query(
      "SELECT * FROM jury_assignments WHERE application_id = $1 AND jury_id = $2",
      [applicationId, juryId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Jüri ataması bulunamadı" });
    }

    // Değerlendirme kontrolü
    const evaluationCheck = await client.query(
      "SELECT * FROM evaluations WHERE application_id = $1 AND jury_id = $2",
      [applicationId, juryId]
    );

    if (evaluationCheck.rows.length > 0) {
      return res.status(400).json({
        message: "Bu jüri üyesi değerlendirme yaptığı için kaldırılamaz",
      });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Jüri atamasını kaldır
    await client.query(
      "DELETE FROM jury_assignments WHERE application_id = $1 AND jury_id = $2",
      [applicationId, juryId]
    );

    // İşlemi tamamla
    await client.query("COMMIT");

    // TC Kimlik ile kullanıcı tablosunda jüri üyesini bul
    const userResult = await pool.query(
      "SELECT user_id FROM users WHERE tc_kimlik = $1",
      [juryCheck.rows[0].tc_kimlik]
    );

    // Eğer jüri üyesi kullanıcılar tablosunda varsa, bildirim gönder
    if (userResult.rows.length > 0) {
      // Başvuru bilgilerini getir
      const applicationInfoResult = await pool.query(
        `
        SELECT u.ad as applicant_ad, u.soyad as applicant_soyad,
               f.faculty_ad, d.departman_ad, k.kadro_ad
        FROM applications a
        JOIN users u ON a.user_id = u.user_id
        JOIN announcements an ON a.ilan_id = an.ilan_id
        JOIN faculties f ON an.faculty_id = f.faculty_id
        JOIN departmanlar d ON an.departman_id = d.departman_id
        JOIN kadrolar k ON an.kadro_id = k.kadro_id
        WHERE a.application_id = $1
      `,
        [applicationId]
      );

      const applicationInfo = applicationInfoResult.rows[0];

      await notificationService.sendNotification({
        user_id: userResult.rows[0].user_id,
        mesaj: `Değerlendirme göreviniz iptal edildi: ${applicationInfo.applicant_ad} ${applicationInfo.applicant_soyad} - ${applicationInfo.faculty_ad} ${applicationInfo.departman_ad} ${applicationInfo.kadro_ad} başvurusu için görevlendirmeniz iptal edildi.`,
        tip: "bilgi",
      });
    }

    res.json({
      message: "Jüri üyesi başvurudan başarıyla kaldırıldı",
      application_id: applicationId,
      jury_id: juryId,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Unassign jury from application error:", error);

    // Özel hata mesajları
    if (error.code === "23503") {
      return res
        .status(400)
        .json({
          message: "İlişkili bir kayıt bulunduğu için işlem yapılamadı",
        });
    }

    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};
