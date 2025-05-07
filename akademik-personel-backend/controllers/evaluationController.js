const { pool } = require("../config/db");
const { validateEvaluationData } = require("../utils/validators");
const storageService = require("../services/storageService");
const notificationService = require("../services/notificationService");

/**
 * Değerlendirme oluştur/güncelle (Jüri üyesi)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createUpdateEvaluation = async (req, res) => {
  const client = await pool.connect();

  try {
    const { application_id } = req.params;
    const { karar, notes } = req.body;

    // Değerlendirme verilerini doğrula
    const { error } = validateEvaluationData(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Başvuruyu kontrol et
    const applicationResult = await client.query(
      "SELECT * FROM applications WHERE application_id = $1",
      [application_id]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    const application = applicationResult.rows[0];

    // Başvuru durumunu kontrol et
    if (application.durum !== "incelemede") {
      return res.status(400).json({
        message: "Sadece incelemede olan başvurular değerlendirilebilir",
      });
    }

    // Jüri üyesinin TC Kimlik numarasını al
    const userResult = await client.query(
      "SELECT tc_kimlik FROM users WHERE user_id = $1",
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    const tc_kimlik = userResult.rows[0].tc_kimlik;

    // Jüri üyesini getir
    const juryResult = await client.query(
      "SELECT * FROM jury_members WHERE tc_kimlik = $1",
      [tc_kimlik]
    );

    if (juryResult.rows.length === 0) {
      return res.status(404).json({ message: "Jüri üyesi bulunamadı" });
    }

    const jury_id = juryResult.rows[0].jury_id;

    // Jüri üyesinin başvuruya atanıp atanmadığını kontrol et
    const assignmentResult = await client.query(
      `
      SELECT * FROM jury_assignments
      WHERE application_id = $1 AND jury_id = $2
    `,
      [application_id, jury_id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(403).json({
        message: "Bu başvuruya değerlendirme yapma yetkiniz bulunmamaktadır",
      });
    }

    // Rapor dosyasını kontrol et
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Lütfen değerlendirme raporu yükleyin" });
    }

    let fileURL;
    try {
      // Dosyayı Firebase Storage'a yükle
      const file = req.file;
      const fileName = `evaluations/${application_id}/${jury_id}_${Date.now()}_${
        file.originalname
      }`;
      fileURL = await storageService.uploadFile(
        file.buffer,
        fileName,
        file.mimetype
      );
    } catch (error) {
      console.error("Dosya yükleme hatası:", error);
      return res
        .status(500)
        .json({ message: "Dosya yükleme sırasında bir hata oluştu" });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Daha önce değerlendirme yapılmış mı kontrol et
    const existingEvaluationResult = await client.query(
      `
      SELECT * FROM evaluations
      WHERE application_id = $1 AND jury_id = $2
    `,
      [application_id, jury_id]
    );

    let evaluationId;

    if (existingEvaluationResult.rows.length > 0) {
      // Değerlendirmeyi güncelle
      const updateResult = await client.query(
        `
        UPDATE evaluations
        SET rapor_url = $1, karar = $2, notes = $3, tarih = NOW()
        WHERE application_id = $4 AND jury_id = $5
        RETURNING *
      `,
        [fileURL, karar, notes, application_id, jury_id]
      );

      evaluationId = updateResult.rows[0].eval_id;
    } else {
      // Yeni değerlendirme oluştur
      const insertResult = await client.query(
        `
        INSERT INTO evaluations (jury_id, application_id, rapor_url, karar, notes, tarih)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `,
        [jury_id, application_id, fileURL, karar, notes]
      );

      evaluationId = insertResult.rows[0].eval_id;
    }

    // Tüm atanan jüri üyelerinin değerlendirme yaptığını kontrol et
    const juryCountResult = await client.query(
      `
      SELECT COUNT(*) as total_jury
      FROM jury_assignments
      WHERE application_id = $1
    `,
      [application_id]
    );

    const evaluationCountResult = await client.query(
      `
      SELECT COUNT(*) as completed_evaluations
      FROM evaluations
      WHERE application_id = $1
    `,
      [application_id]
    );

    const totalJury = parseInt(juryCountResult.rows[0].total_jury);
    const completedEvaluations = parseInt(
      evaluationCountResult.rows[0].completed_evaluations
    );

    // İşlemi tamamla
    await client.query("COMMIT");

    // Başvuru sahibine bildirim gönder
    await notificationService.sendNotification({
      user_id: application.user_id,
      mesaj: `Başvurunuz için bir jüri üyesi değerlendirme yaptı.`,
      tip: "bilgi",
      link: `/applicant/applications/${application_id}`,
    });

    // Tüm değerlendirmeler tamamlandıysa yöneticilere bildirim gönder
    if (totalJury === completedEvaluations) {
      // Yöneticileri getir
      const managersResult = await pool.query(`
        SELECT u.user_id
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name = 'yonetici'
      `);

      // Başvuru bilgilerini getir
      const applicationInfoResult = await pool.query(
        `
        SELECT u.ad, u.soyad, f.faculty_ad, d.departman_ad, k.kadro_ad
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

      const applicantInfo = applicationInfoResult.rows[0];

      // Her yöneticiye bildirim gönder
      for (const manager of managersResult.rows) {
        await notificationService.sendNotification({
          user_id: manager.user_id,
          mesaj: `Tüm jüri değerlendirmeleri tamamlandı: ${applicantInfo.ad} ${applicantInfo.soyad} - ${applicantInfo.faculty_ad} ${applicantInfo.departman_ad} ${applicantInfo.kadro_ad} başvurusu için tüm jüri üyeleri değerlendirmelerini tamamladı. Son kararı verebilirsiniz.`,
          tip: "bilgi",
          link: `/manager/applications/${application_id}`,
        });
      }
    }

    res.json({
      message:
        existingEvaluationResult.rows.length > 0
          ? "Değerlendirme başarıyla güncellendi"
          : "Değerlendirme başarıyla oluşturuldu",
      evaluation_id: evaluationId,
      all_completed: totalJury === completedEvaluations,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Create/update evaluation error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};

/**
 * Değerlendirme raporu görüntüle
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getEvaluationReport = async (req, res) => {
  try {
    const { evaluation_id } = req.params;

    // Değerlendirmeyi getir
    const evaluationResult = await pool.query(
      `
      SELECT e.*, j.ad, j.soyad, j.unvan, j.kurum, j.tc_kimlik
      FROM evaluations e
      JOIN jury_members j ON e.jury_id = j.jury_id
      WHERE e.eval_id = $1
    `,
      [evaluation_id]
    );

    if (evaluationResult.rows.length === 0) {
      return res.status(404).json({ message: "Değerlendirme bulunamadı" });
    }

    const evaluation = evaluationResult.rows[0];

    // Başvuruyu getir
    const applicationResult = await pool.query(
      "SELECT * FROM applications WHERE application_id = $1",
      [evaluation.application_id]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    const application = applicationResult.rows[0];

    // Yetki kontrolü
    // Başvuru sahibi raporlara doğrudan erişemez (rapor sonuçlarını görebilir ama raporun kendisini göremez)
    if (
      req.user.id === application.user_id &&
      req.user.role !== "admin" &&
      req.user.role !== "yonetici"
    ) {
      return res
        .status(403)
        .json({ message: "Bu rapora erişim yetkiniz bulunmamaktadır" });
    }

    // Jüri üyesi ise, sadece kendi raporuna erişebilir
    if (req.user.role === "juri") {
      const userTcKimlik = await pool.query(
        "SELECT tc_kimlik FROM users WHERE user_id = $1",
        [req.user.id]
      );

      if (userTcKimlik.rows[0].tc_kimlik !== evaluation.tc_kimlik) {
        return res
          .status(403)
          .json({ message: "Bu rapora erişim yetkiniz bulunmamaktadır" });
      }
    }

    res.json({
      evaluation: {
        eval_id: evaluation.eval_id,
        application_id: evaluation.application_id,
        jury_id: evaluation.jury_id,
        jury_name: `${evaluation.unvan} ${evaluation.ad} ${evaluation.soyad}`,
        jury_institution: evaluation.kurum,
        report_url: evaluation.rapor_url,
        decision: evaluation.karar,
        notes: evaluation.notes,
        date: evaluation.tarih,
      },
    });
  } catch (error) {
    console.error("Get evaluation report error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Başvuruya ait tüm değerlendirmeleri getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getApplicationEvaluations = async (req, res) => {
  try {
    const { application_id } = req.params;

    // Başvuruyu kontrol et
    const applicationResult = await pool.query(
      "SELECT * FROM applications WHERE application_id = $1",
      [application_id]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    const application = applicationResult.rows[0];

    // Yetki kontrolü
    if (
      req.user.id !== application.user_id &&
      req.user.role !== "admin" &&
      req.user.role !== "yonetici"
    ) {
      // Jüri üyesi ise, sadece bu başvuruya atanmışsa ve kendi değerlendirmesi varsa görebilir
      if (req.user.role === "juri") {
        const userTcKimlik = await pool.query(
          "SELECT tc_kimlik FROM users WHERE user_id = $1",
          [req.user.id]
        );

        const juryCheck = await pool.query(
          `
          SELECT j.jury_id
          FROM jury_members j
          WHERE j.tc_kimlik = $1
        `,
          [userTcKimlik.rows[0].tc_kimlik]
        );

        if (juryCheck.rows.length === 0) {
          return res
            .status(403)
            .json({ message: "Bu başvuruya erişim yetkiniz bulunmamaktadır" });
        }

        const jury_id = juryCheck.rows[0].jury_id;

        const assignmentCheck = await pool.query(
          `
          SELECT *
          FROM jury_assignments
          WHERE application_id = $1 AND jury_id = $2
        `,
          [application_id, jury_id]
        );

        if (assignmentCheck.rows.length === 0) {
          return res
            .status(403)
            .json({ message: "Bu başvuruya erişim yetkiniz bulunmamaktadır" });
        }

        // Jüri üyesi ise, sadece değerlendirme sonuçlarını alır, rapor URL'lerini değil
        const evaluationsResult = await pool.query(
          `
          SELECT e.eval_id, e.jury_id, j.ad, j.soyad, j.unvan, j.kurum, e.karar, e.tarih
          FROM evaluations e
          JOIN jury_members j ON e.jury_id = j.jury_id
          WHERE e.application_id = $1
          ORDER BY e.tarih DESC
        `,
          [application_id]
        );

        return res.json({
          application_id,
          evaluations: evaluationsResult.rows,
        });
      } else {
        return res
          .status(403)
          .json({ message: "Bu başvuruya erişim yetkiniz bulunmamaktadır" });
      }
    }

    // Admin ve yönetici tüm değerlendirmeleri görebilir, başvuru sahibi ise sadece sonuçları görebilir
    let query;

    if (req.user.id === application.user_id) {
      // Başvuru sahibi için
      query = `
        SELECT e.eval_id, e.jury_id, j.ad, j.soyad, j.unvan, j.kurum, e.karar, e.tarih
        FROM evaluations e
        JOIN jury_members j ON e.jury_id = j.jury_id
        WHERE e.application_id = $1
        ORDER BY e.tarih DESC
      `;
    } else {
      // Admin ve yönetici için
      query = `
        SELECT e.*, j.ad, j.soyad, j.unvan, j.kurum
        FROM evaluations e
        JOIN jury_members j ON e.jury_id = j.jury_id
        WHERE e.application_id = $1
        ORDER BY e.tarih DESC
      `;
    }

    const evaluationsResult = await pool.query(query, [application_id]);

    res.json({
      application_id,
      evaluations: evaluationsResult.rows,
    });
  } catch (error) {
    console.error("Get application evaluations error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Jüri üyesinin değerlendirmelerini getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getJuryEvaluations = async (req, res) => {
  try {
    let jury_id;

    // Eğer jüri üyesi ise, kendi jury_id'sini bul
    if (req.user.role === "juri") {
      const tcKimlikResult = await pool.query(
        "SELECT tc_kimlik FROM users WHERE user_id = $1",
        [req.user.id]
      );

      if (tcKimlikResult.rows.length === 0) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      const juryResult = await pool.query(
        "SELECT jury_id FROM jury_members WHERE tc_kimlik = $1",
        [tcKimlikResult.rows[0].tc_kimlik]
      );

      if (juryResult.rows.length === 0) {
        return res.status(404).json({ message: "Jüri üyesi bulunamadı" });
      }

      jury_id = juryResult.rows[0].jury_id;
    } else if (req.user.role === "admin" || req.user.role === "yonetici") {
      // Admin veya yönetici ise, params'dan jury_id'yi al
      jury_id = req.params.jury_id;

      if (!jury_id) {
        return res
          .status(400)
          .json({ message: "Jüri ID parametresi gereklidir" });
      }
    } else {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    // Jüri üyesini kontrol et
    const juryMemberResult = await pool.query(
      "SELECT * FROM jury_members WHERE jury_id = $1",
      [jury_id]
    );

    if (juryMemberResult.rows.length === 0) {
      return res.status(404).json({ message: "Jüri üyesi bulunamadı" });
    }

    // Jüri üyesinin değerlendirmelerini getir
    const evaluationsResult = await pool.query(
      `
      SELECT e.*, a.durum as application_status, a.basvuru_tarihi, a.submitted_at,
             u.ad as applicant_ad, u.soyad as applicant_soyad,
             an.ilan_baslik, f.faculty_ad, d.departman_ad, k.kadro_ad
      FROM evaluations e
      JOIN applications a ON e.application_id = a.application_id
      JOIN users u ON a.user_id = u.user_id
      JOIN announcements an ON a.ilan_id = an.ilan_id
      JOIN faculties f ON an.faculty_id = f.faculty_id
      JOIN departmanlar d ON an.departman_id = d.departman_id
      JOIN kadrolar k ON an.kadro_id = k.kadro_id
      WHERE e.jury_id = $1
      ORDER BY e.tarih DESC
    `,
      [jury_id]
    );

    res.json({
      jury_member: juryMemberResult.rows[0],
      evaluations: evaluationsResult.rows,
    });
  } catch (error) {
    console.error("Get jury evaluations error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
/**
 * Değerlendirmeyi sil (Jüri üyesi veya Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteEvaluation = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    // Değerlendirmeyi getir
    const evaluationResult = await client.query(
      "SELECT * FROM evaluations WHERE eval_id = $1",
      [id]
    );

    if (evaluationResult.rows.length === 0) {
      return res.status(404).json({ message: "Değerlendirme bulunamadı" });
    }

    const evaluation = evaluationResult.rows[0];

    // Yetki kontrolü
    if (req.user.role === "jüri üyesi") {
      // Jüri üyesinin kendi TC kimliğini al
      const userResult = await client.query(
        "SELECT tc_kimlik FROM users WHERE user_id = $1",
        [req.user.id]
      );

      // Jüri üyesinin jury_id'sini al
      const juryResult = await client.query(
        "SELECT jury_id FROM jury_members WHERE tc_kimlik = $1",
        [userResult.rows[0].tc_kimlik]
      );

      // Sadece kendi değerlendirmesini silebilir
      if (juryResult.rows[0].jury_id !== evaluation.jury_id) {
        return res.status(403).json({
          message: "Sadece kendi değerlendirmenizi silebilirsiniz",
        });
      }
    } else if (req.user.role !== "yönetici" && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Bu işlem için yetkiniz bulunmamaktadır",
      });
    }

    // Değerlendirmeyi sil
    await client.query("BEGIN");
    await client.query("DELETE FROM evaluations WHERE eval_id = $1", [id]);
    await client.query("COMMIT");

    res.json({
      message: "Değerlendirme başarıyla silindi",
      evaluation_id: id,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Delete evaluation error:", error);

    // Hata tipine göre özelleştirilmiş mesaj
    if (error.code === "23503") {
      return res.status(400).json({
        message:
          "Bu değerlendirme diğer kayıtlarla ilişkili olduğu için silinemez",
      });
    }

    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};

/**
 * Başvuru değerlendirme durumunu getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getApplicationEvaluationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Başvuruyu kontrol et
    const applicationResult = await pool.query(
      "SELECT * FROM applications WHERE application_id = $1",
      [applicationId]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    // Yetki kontrolü
    const application = applicationResult.rows[0];
    if (
      req.user.id !== application.user_id &&
      req.user.role !== "admin" &&
      req.user.role !== "yönetici"
    ) {
      // Jüri üyesi ise, sadece bu başvuruya atanmışsa görebilir
      if (req.user.role === "jüri üyesi") {
        const tcKimlikResult = await pool.query(
          "SELECT tc_kimlik FROM users WHERE user_id = $1",
          [req.user.id]
        );

        const juryCheck = await pool.query(
          `
          SELECT j.jury_id
          FROM jury_members j
          WHERE j.tc_kimlik = $1
        `,
          [tcKimlikResult.rows[0].tc_kimlik]
        );

        if (juryCheck.rows.length === 0) {
          return res.status(403).json({
            message: "Bu başvuruya erişim yetkiniz bulunmamaktadır",
          });
        }

        const juryId = juryCheck.rows[0].jury_id;

        const assignmentCheck = await pool.query(
          `
          SELECT *
          FROM jury_assignments
          WHERE application_id = $1 AND jury_id = $2
        `,
          [applicationId, juryId]
        );

        if (assignmentCheck.rows.length === 0) {
          return res.status(403).json({
            message: "Bu başvuruya erişim yetkiniz bulunmamaktadır",
          });
        }
      } else {
        return res.status(403).json({
          message: "Bu başvuruya erişim yetkiniz bulunmamaktadır",
        });
      }
    }

    // Jüri sayısını ve tamamlanan değerlendirme sayısını getir
    const juryCountResult = await pool.query(
      `
      SELECT COUNT(*) as total_jury
      FROM jury_assignments
      WHERE application_id = $1
    `,
      [applicationId]
    );

    const evaluationCountResult = await pool.query(
      `
      SELECT COUNT(*) as completed_evaluations
      FROM evaluations
      WHERE application_id = $1
    `,
      [applicationId]
    );

    const totalJury = parseInt(juryCountResult.rows[0].total_jury);
    const completedEvaluations = parseInt(
      evaluationCountResult.rows[0].completed_evaluations
    );

    // Jüri üyelerinin değerlendirme durumunu getir
    const juryStatusResult = await pool.query(
      `
      SELECT j.jury_id, j.ad, j.soyad, j.unvan,
            CASE WHEN e.eval_id IS NOT NULL THEN true ELSE false END as evaluated
      FROM jury_assignments ja
      JOIN jury_members j ON ja.jury_id = j.jury_id
      LEFT JOIN evaluations e ON ja.jury_id = e.jury_id AND ja.application_id = e.application_id
      WHERE ja.application_id = $1
      ORDER BY j.ad, j.soyad
    `,
      [applicationId]
    );

    // Nihai karar bilgisini getir
    const finalDecisionResult = await pool.query(
      `
      SELECT final_decision, decision_date
      FROM application_final_decisions
      WHERE application_id = $1
    `,
      [applicationId]
    );

    const finalDecision =
      finalDecisionResult.rows.length > 0
        ? finalDecisionResult.rows[0]
        : { final_decision: null, decision_date: null };

    res.json({
      application_id: applicationId,
      total_jury: totalJury,
      completed_evaluations: completedEvaluations,
      all_completed: totalJury === completedEvaluations,
      completion_percentage:
        totalJury > 0 ? (completedEvaluations / totalJury) * 100 : 0,
      jury_status: juryStatusResult.rows,
      final_decision: finalDecision.final_decision,
      decision_date: finalDecision.decision_date,
    });
  } catch (error) {
    console.error("Get application evaluation status error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
/**
 * Başvuru için nihai kararı gönder (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.submitFinalDecision = async (req, res) => {
  const client = await pool.connect();

  try {
    // Yetki kontrolü
    if (req.user.role !== "yönetici" && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Bu işlem için yetkiniz bulunmamaktadır",
      });
    }

    const { applicationId } = req.params;
    const { final_decision, notes } = req.body;

    // Final kararı doğrula
    if (!final_decision || !["kabul", "ret"].includes(final_decision)) {
      return res.status(400).json({
        message: "Geçerli bir karar girmelisiniz (kabul veya ret)",
      });
    }

    // Başvuruyu kontrol et
    const applicationResult = await client.query(
      "SELECT * FROM applications WHERE application_id = $1",
      [applicationId]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    // Tüm jürilerin değerlendirme yapıp yapmadığını kontrol et
    const juryCountResult = await client.query(
      `
      SELECT COUNT(*) as total_jury
      FROM jury_assignments
      WHERE application_id = $1
    `,
      [applicationId]
    );

    const evaluationCountResult = await client.query(
      `
      SELECT COUNT(*) as completed_evaluations
      FROM evaluations
      WHERE application_id = $1
    `,
      [applicationId]
    );

    const totalJury = parseInt(juryCountResult.rows[0].total_jury);
    const completedEvaluations = parseInt(
      evaluationCountResult.rows[0].completed_evaluations
    );

    if (totalJury === 0) {
      return res.status(400).json({
        message: "Bu başvuruya henüz jüri atanmamış, nihai karar verilemez",
      });
    }

    if (completedEvaluations < totalJury) {
      return res.status(400).json({
        message:
          "Tüm jüri üyeleri değerlendirmelerini tamamlamadan nihai karar verilemez",
      });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Daha önce nihai karar verilmiş mi kontrol et
    const existingDecisionResult = await client.query(
      `
      SELECT * FROM application_final_decisions
      WHERE application_id = $1
    `,
      [applicationId]
    );

    if (existingDecisionResult.rows.length > 0) {
      // Nihai kararı güncelle
      await client.query(
        `
        UPDATE application_final_decisions
        SET final_decision = $1, notes = $2, decision_date = NOW(), decided_by = $3
        WHERE application_id = $4
      `,
        [final_decision, notes, req.user.id, applicationId]
      );
    } else {
      // Yeni nihai karar oluştur
      await client.query(
        `
        INSERT INTO application_final_decisions
        (application_id, final_decision, notes, decision_date, decided_by)
        VALUES ($1, $2, $3, NOW(), $4)
      `,
        [applicationId, final_decision, notes, req.user.id]
      );
    }

    // Başvuru durumunu güncelle
    await client.query(
      `
      UPDATE applications
      SET durum = $1, updated_at = NOW()
      WHERE application_id = $2
    `,
      [final_decision === "kabul" ? "onaylandı" : "reddedildi", applicationId]
    );

    // İşlemi tamamla
    await client.query("COMMIT");

    // Başvuru sahibine bildirim gönder
    const application = applicationResult.rows[0];
    await notificationService.sendNotification({
      user_id: application.user_id,
      mesaj: `Başvurunuz için nihai karar verildi: ${
        final_decision === "kabul" ? "KABUL" : "RET"
      }`,
      tip: "bilgi",
      link: `/applicant/applications/${applicationId}`,
    });

    res.json({
      message: "Nihai karar başarıyla kaydedildi",
      application_id: applicationId,
      final_decision,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Submit final decision error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};
/**
 * Başvuru değerlendirme durumunu getir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getApplicationEvaluationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Başvuruyu kontrol et
    const applicationResult = await pool.query(
      "SELECT * FROM applications WHERE application_id = $1",
      [applicationId]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    // Yetki kontrolü
    const application = applicationResult.rows[0];
    if (
      req.user.id !== application.user_id &&
      req.user.role !== "admin" &&
      req.user.role !== "yonetici"
    ) {
      // Jüri üyesi ise, sadece bu başvuruya atanmışsa görebilir
      if (req.user.role === "juri") {
        const tcKimlikResult = await pool.query(
          "SELECT tc_kimlik FROM users WHERE user_id = $1",
          [req.user.id]
        );

        const juryCheck = await pool.query(
          `
          SELECT j.jury_id
          FROM jury_members j
          WHERE j.tc_kimlik = $1
        `,
          [tcKimlikResult.rows[0].tc_kimlik]
        );

        if (juryCheck.rows.length === 0) {
          return res.status(403).json({
            message: "Bu başvuruya erişim yetkiniz bulunmamaktadır",
          });
        }

        const juryId = juryCheck.rows[0].jury_id;

        const assignmentCheck = await pool.query(
          `
          SELECT *
          FROM jury_assignments
          WHERE application_id = $1 AND jury_id = $2
        `,
          [applicationId, juryId]
        );

        if (assignmentCheck.rows.length === 0) {
          return res.status(403).json({
            message: "Bu başvuruya erişim yetkiniz bulunmamaktadır",
          });
        }
      } else {
        return res.status(403).json({
          message: "Bu başvuruya erişim yetkiniz bulunmamaktadır",
        });
      }
    }

    // Jüri sayısını ve tamamlanan değerlendirme sayısını getir
    const juryCountResult = await pool.query(
      `
      SELECT COUNT(*) as total_jury
      FROM jury_assignments
      WHERE application_id = $1
    `,
      [applicationId]
    );

    const evaluationCountResult = await pool.query(
      `
      SELECT COUNT(*) as completed_evaluations
      FROM evaluations
      WHERE application_id = $1
    `,
      [applicationId]
    );

    const totalJury = parseInt(juryCountResult.rows[0].total_jury);
    const completedEvaluations = parseInt(
      evaluationCountResult.rows[0].completed_evaluations
    );

    // Jüri üyelerinin değerlendirme durumunu getir
    const juryStatusResult = await pool.query(
      `
      SELECT j.jury_id, j.ad, j.soyad, j.unvan,
            CASE WHEN e.eval_id IS NOT NULL THEN true ELSE false END as evaluated
      FROM jury_assignments ja
      JOIN jury_members j ON ja.jury_id = j.jury_id
      LEFT JOIN evaluations e ON ja.jury_id = e.jury_id AND ja.application_id = e.application_id
      WHERE ja.application_id = $1
      ORDER BY j.ad, j.soyad
    `,
      [applicationId]
    );

    // Nihai karar bilgisini getir
    const finalDecisionResult = await pool.query(
      `
      SELECT final_decision, decision_date
      FROM application_final_decisions
      WHERE application_id = $1
    `,
      [applicationId]
    );

    const finalDecision =
      finalDecisionResult.rows.length > 0
        ? finalDecisionResult.rows[0]
        : { final_decision: null, decision_date: null };

    res.json({
      application_id: applicationId,
      total_jury: totalJury,
      completed_evaluations: completedEvaluations,
      all_completed: totalJury === completedEvaluations,
      completion_percentage:
        totalJury > 0 ? (completedEvaluations / totalJury) * 100 : 0,
      jury_status: juryStatusResult.rows,
      final_decision: finalDecision.final_decision,
      decision_date: finalDecision.decision_date,
    });
  } catch (error) {
    console.error("Get application evaluation status error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Başvuru için nihai kararı gönder (Yönetici)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.submitFinalDecision = async (req, res) => {
  const client = await pool.connect();

  try {
    // Yetki kontrolü
    if (req.user.role !== "yonetici" && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Bu işlem için yetkiniz bulunmamaktadır",
      });
    }

    const { applicationId } = req.params;
    const { final_decision, notes } = req.body;

    // Final kararı doğrula
    if (!final_decision || !["kabul", "ret"].includes(final_decision)) {
      return res.status(400).json({
        message: "Geçerli bir karar girmelisiniz (kabul veya ret)",
      });
    }

    // Başvuruyu kontrol et
    const applicationResult = await client.query(
      "SELECT * FROM applications WHERE application_id = $1",
      [applicationId]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    // Tüm jürilerin değerlendirme yapıp yapmadığını kontrol et
    const juryCountResult = await client.query(
      `
      SELECT COUNT(*) as total_jury
      FROM jury_assignments
      WHERE application_id = $1
    `,
      [applicationId]
    );

    const evaluationCountResult = await client.query(
      `
      SELECT COUNT(*) as completed_evaluations
      FROM evaluations
      WHERE application_id = $1
    `,
      [applicationId]
    );

    const totalJury = parseInt(juryCountResult.rows[0].total_jury);
    const completedEvaluations = parseInt(
      evaluationCountResult.rows[0].completed_evaluations
    );

    if (totalJury === 0) {
      return res.status(400).json({
        message: "Bu başvuruya henüz jüri atanmamış, nihai karar verilemez",
      });
    }

    if (completedEvaluations < totalJury) {
      return res.status(400).json({
        message:
          "Tüm jüri üyeleri değerlendirmelerini tamamlamadan nihai karar verilemez",
      });
    }

    // İşlem başlat
    await client.query("BEGIN");

    // Daha önce nihai karar verilmiş mi kontrol et
    const existingDecisionResult = await client.query(
      `
      SELECT * FROM application_final_decisions
      WHERE application_id = $1
    `,
      [applicationId]
    );

    if (existingDecisionResult.rows.length > 0) {
      // Nihai kararı güncelle
      await client.query(
        `
        UPDATE application_final_decisions
        SET final_decision = $1, notes = $2, decision_date = NOW(), decided_by = $3
        WHERE application_id = $4
      `,
        [final_decision, notes, req.user.id, applicationId]
      );
    } else {
      // Yeni nihai karar oluştur
      await client.query(
        `
        INSERT INTO application_final_decisions
        (application_id, final_decision, notes, decision_date, decided_by)
        VALUES ($1, $2, $3, NOW(), $4)
      `,
        [applicationId, final_decision, notes, req.user.id]
      );
    }

    // Başvuru durumunu güncelle
    await client.query(
      `
      UPDATE applications
      SET durum = $1, updated_at = NOW()
      WHERE application_id = $2
    `,
      [final_decision === "kabul" ? "onaylandı" : "reddedildi", applicationId]
    );

    // İşlemi tamamla
    await client.query("COMMIT");

    // Başvuru sahibine bildirim gönder
    const application = applicationResult.rows[0];
    await notificationService.sendNotification({
      user_id: application.user_id,
      mesaj: `Başvurunuz için nihai karar verildi: ${
        final_decision === "kabul" ? "KABUL" : "RET"
      }`,
      tip: "bilgi",
      link: `/applicant/applications/${applicationId}`,
    });

    res.json({
      message: "Nihai karar başarıyla kaydedildi",
      application_id: applicationId,
      final_decision,
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await client.query("ROLLBACK");
    console.error("Submit final decision error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  } finally {
    client.release();
  }
};
