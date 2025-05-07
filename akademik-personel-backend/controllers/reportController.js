const { pool } = require("../config/db");
const pdfService = require("../services/pdfService");

/**
 * Başvuru için Tablo 5 oluştur/güncelle
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.generateTablo5 = async (req, res) => {
  try {
    const { application_id } = req.params;

    // Başvuruyu kontrol et
    const applicationResult = await pool.query(
      `
      SELECT a.*, u.ad, u.soyad, u.tc_kimlik, u.email
      FROM applications a
      JOIN users u ON a.user_id = u.user_id
      WHERE a.application_id = $1
    `,
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
      req.user.role !== "yönetici" &&
      req.user.role !== "jüri üyesi"
    ) {
      return res
        .status(403)
        .json({ message: "Bu dosyaya erişim yetkiniz bulunmamaktadır" });
    }

    // Tablo 5 oluştur
    const tablo5URL = await pdfService.generateTablo5(application_id);

    // Başvuruyu güncelle
    await pool.query(
      `
      UPDATE applications
      SET tablo5_url = $1, updated_at = NOW()
      WHERE application_id = $2
    `,
      [tablo5URL, application_id]
    );

    res.json({
      message: "Tablo 5 başarıyla oluşturuldu",
      application_id,
      tablo5_url: tablo5URL,
    });
  } catch (error) {
    console.error("Generate Tablo 5 error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Tablo 5 görüntüle
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.viewTablo5 = async (req, res) => {
  try {
    const { application_id } = req.params;

    // Başvuruyu kontrol et
    const applicationResult = await pool.query(
      `
      SELECT a.*, u.ad, u.soyad
      FROM applications a
      JOIN users u ON a.user_id = u.user_id
      WHERE a.application_id = $1
    `,
      [application_id]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ message: "Başvuru bulunamadı" });
    }

    const application = applicationResult.rows[0];

    // Tablo 5 URL'i kontrol et
    if (!application.tablo5_url) {
      return res
        .status(404)
        .json({ message: "Bu başvuru için Tablo 5 henüz oluşturulmamış" });
    }

    // Yetki kontrolü
    if (
      req.user.id !== application.user_id &&
      req.user.role !== "admin" &&
      req.user.role !== "yonetici" &&
      req.user.role !== "juri"
    ) {
      return res
        .status(403)
        .json({ message: "Bu dosyaya erişim yetkiniz bulunmamaktadır" });
    }

    // Jüri üyesi ise, bu başvuruya atanmış mı kontrol et
    if (req.user.role === "jüri üyesi") {
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
          .json({ message: "Bu dosyaya erişim yetkiniz bulunmamaktadır" });
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
        return res
          .status(403)
          .json({ message: "Bu dosyaya erişim yetkiniz bulunmamaktadır" });
      }
    }

    res.json({
      application_id,
      applicant_name: `${application.ad} ${application.soyad}`,
      tablo5_url: application.tablo5_url,
    });
  } catch (error) {
    console.error("View Tablo 5 error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * İstatistik raporları oluştur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.generateStatisticsReport = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    const { report_type, start_date, end_date } = req.query;

    // Tarih kontrolü
    let dateFilter = "";
    let dateParams = [];

    if (start_date && end_date) {
      dateFilter = "AND a.basvuru_tarihi BETWEEN $1 AND $2";
      dateParams = [start_date, end_date];
    }

    let reportData;

    switch (report_type) {
      case "faculty":
        // Fakültelere göre başvuru sayıları
        const facultyResult = await pool.query(
          `
          SELECT f.faculty_id, f.faculty_ad,
                 COUNT(*) as total_applications,
                 SUM(CASE WHEN a.durum = 'beklemede' THEN 1 ELSE 0 END) as pending,
                 SUM(CASE WHEN a.durum = 'incelemede' THEN 1 ELSE 0 END) as in_review,
                 SUM(CASE WHEN a.durum = 'onaylandı' THEN 1 ELSE 0 END) as approved,
                 SUM(CASE WHEN a.durum = 'reddedildi' THEN 1 ELSE 0 END) as rejected
          FROM applications a
          JOIN announcements an ON a.ilan_id = an.ilan_id
          JOIN faculties f ON an.faculty_id = f.faculty_id
          WHERE 1=1 ${dateFilter}
          GROUP BY f.faculty_id, f.faculty_ad
          ORDER BY total_applications DESC
        `,
          dateParams
        );

        reportData = facultyResult.rows;
        break;

      case "position":
        // Kadrolara göre başvuru sayıları
        const positionResult = await pool.query(
          `
          SELECT k.kadro_id, k.kadro_ad,
                 COUNT(*) as total_applications,
                 SUM(CASE WHEN a.durum = 'beklemede' THEN 1 ELSE 0 END) as pending,
                 SUM(CASE WHEN a.durum = 'incelemede' THEN 1 ELSE 0 END) as in_review,
                 SUM(CASE WHEN a.durum = 'onaylandı' THEN 1 ELSE 0 END) as approved,
                 SUM(CASE WHEN a.durum = 'reddedildi' THEN 1 ELSE 0 END) as rejected
          FROM applications a
          JOIN announcements an ON a.ilan_id = an.ilan_id
          JOIN kadrolar k ON an.kadro_id = k.kadro_id
          WHERE 1=1 ${dateFilter}
          GROUP BY k.kadro_id, k.kadro_ad
          ORDER BY total_applications DESC
        `,
          dateParams
        );

        reportData = positionResult.rows;
        break;

      case "department":
        // Bölümlere göre başvuru sayıları
        const departmentResult = await pool.query(
          `
          SELECT d.departman_id, d.departman_ad, f.faculty_ad,
                 COUNT(*) as total_applications,
                 SUM(CASE WHEN a.durum = 'beklemede' THEN 1 ELSE 0 END) as pending,
                 SUM(CASE WHEN a.durum = 'incelemede' THEN 1 ELSE 0 END) as in_review,
                 SUM(CASE WHEN a.durum = 'onaylandı' THEN 1 ELSE 0 END) as approved,
                 SUM(CASE WHEN a.durum = 'reddedildi' THEN 1 ELSE 0 END) as rejected
          FROM applications a
          JOIN announcements an ON a.ilan_id = an.ilan_id
          JOIN departmanlar d ON an.departman_id = d.departman_id
          JOIN faculties f ON an.faculty_id = f.faculty_id
          WHERE 1=1 ${dateFilter}
          GROUP BY d.departman_id, d.departman_ad, f.faculty_ad
          ORDER BY total_applications DESC
        `,
          dateParams
        );

        reportData = departmentResult.rows;
        break;

      case "time":
        // Zamana göre başvuru sayıları (aylık)
        const timeResult = await pool.query(
          `
          SELECT TO_CHAR(a.basvuru_tarihi, 'YYYY-MM') as month,
                 COUNT(*) as total_applications,
                 SUM(CASE WHEN a.durum = 'beklemede' THEN 1 ELSE 0 END) as pending,
                 SUM(CASE WHEN a.durum = 'incelemede' THEN 1 ELSE 0 END) as in_review,
                 SUM(CASE WHEN a.durum = 'onaylandı' THEN 1 ELSE 0 END) as approved,
                 SUM(CASE WHEN a.durum = 'reddedildi' THEN 1 ELSE 0 END) as rejected
          FROM applications a
          WHERE 1=1 ${dateFilter}
          GROUP BY TO_CHAR(a.basvuru_tarihi, 'YYYY-MM')
          ORDER BY month
        `,
          dateParams
        );

        reportData = timeResult.rows;
        break;

      case "status":
        // Durumlara göre başvuru sayıları
        const statusResult = await pool.query(
          `
          SELECT a.durum,
                 COUNT(*) as total_applications
          FROM applications a
          WHERE 1=1 ${dateFilter}
          GROUP BY a.durum
          ORDER BY total_applications DESC
        `,
          dateParams
        );

        reportData = statusResult.rows;
        break;

      case "announcement":
        // İlanlara göre başvuru sayıları
        const announcementResult = await pool.query(
          `
          SELECT an.ilan_id, an.ilan_baslik, f.faculty_ad, d.departman_ad, k.kadro_ad,
                 COUNT(*) as total_applications,
                 SUM(CASE WHEN a.durum = 'beklemede' THEN 1 ELSE 0 END) as pending,
                 SUM(CASE WHEN a.durum = 'incelemede' THEN 1 ELSE 0 END) as in_review,
                 SUM(CASE WHEN a.durum = 'onaylandı' THEN 1 ELSE 0 END) as approved,
                 SUM(CASE WHEN a.durum = 'reddedildi' THEN 1 ELSE 0 END) as rejected
          FROM applications a
          JOIN announcements an ON a.ilan_id = an.ilan_id
          JOIN faculties f ON an.faculty_id = f.faculty_id
          JOIN departmanlar d ON an.departman_id = d.departman_id
          JOIN kadrolar k ON an.kadro_id = k.kadro_id
          WHERE 1=1 ${dateFilter}
          GROUP BY an.ilan_id, an.ilan_baslik, f.faculty_ad, d.departman_ad, k.kadro_ad
          ORDER BY total_applications DESC
        `,
          dateParams
        );

        reportData = announcementResult.rows;
        break;

      default:
        // Genel istatistikler
        const totalApplicationsResult = await pool.query(
          `
          SELECT COUNT(*) as total_applications,
                 SUM(CASE WHEN a.durum = 'beklemede' THEN 1 ELSE 0 END) as pending,
                 SUM(CASE WHEN a.durum = 'incelemede' THEN 1 ELSE 0 END) as in_review,
                 SUM(CASE WHEN a.durum = 'onaylandı' THEN 1 ELSE 0 END) as approved,
                 SUM(CASE WHEN a.durum = 'reddedildi' THEN 1 ELSE 0 END) as rejected
          FROM applications a
          WHERE 1=1 ${dateFilter}
        `,
          dateParams
        );

        const totalAnnouncementsResult = await pool.query(
          `
          SELECT COUNT(*) as total_announcements,
                 COUNT(DISTINCT faculty_id) as total_faculties,
                 COUNT(DISTINCT departman_id) as total_departments
          FROM announcements
          WHERE 1=1 ${dateFilter ? "AND baslangic_tarih BETWEEN $1 AND $2" : ""}
        `,
          dateParams
        );

        const totalUsersResult = await pool.query(
          `
          SELECT COUNT(*) as total_users,
                 COUNT(DISTINCT CASE WHEN r.role_name = 'aday' THEN u.user_id END) as total_applicants,
                 COUNT(DISTINCT CASE WHEN r.role_name = 'juri' THEN u.user_id END) as total_jury_members
          FROM users u
          JOIN roles r ON u.role_id = r.role_id
          WHERE 1=1 ${dateFilter ? "AND u.created_at BETWEEN $1 AND $2" : ""}
        `,
          dateParams
        );

        reportData = {
          applications: totalApplicationsResult.rows[0],
          announcements: totalAnnouncementsResult.rows[0],
          users: totalUsersResult.rows[0],
        };
        break;
    }

    // PDF raporu oluştur
    const reportURL = await pdfService.generateStatisticsReport(
      report_type,
      reportData,
      { start_date, end_date }
    );

    res.json({
      message: "İstatistik raporu başarıyla oluşturuldu",
      report_type,
      report_url: reportURL,
      data: reportData,
    });
  } catch (error) {
    console.error("Generate statistics report error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Fakülte bazlı akademik kadro dağılımı raporu
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAcademicPositionDistribution = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    // Fakülteleri getir
    const facultiesResult = await pool.query(`
      SELECT faculty_id, faculty_ad
      FROM faculties
      ORDER BY faculty_ad
    `);

    const faculties = facultiesResult.rows;

    // Her fakülte için akademik kadro dağılımını hesapla
    const distributionData = [];

    for (const faculty of faculties) {
      // Başvuruları ve kabul oranlarını hesapla
      const positionDistributionResult = await pool.query(
        `
        SELECT k.kadro_ad,
               COUNT(a.application_id) as total_applications,
               SUM(CASE WHEN a.durum = 'onaylandı' THEN 1 ELSE 0 END) as approved,
               CASE 
                 WHEN COUNT(a.application_id) > 0 
                 THEN ROUND((SUM(CASE WHEN a.durum = 'onaylandı' THEN 1 ELSE 0 END)::numeric / COUNT(a.application_id)::numeric) * 100, 2)
                 ELSE 0
               END as approval_rate
        FROM announcements an
        LEFT JOIN applications a ON an.ilan_id = a.ilan_id
        JOIN kadrolar k ON an.kadro_id = k.kadro_id
        WHERE an.faculty_id = $1
        GROUP BY k.kadro_ad
        ORDER BY k.kadro_ad
      `,
        [faculty.faculty_id]
      );

      distributionData.push({
        faculty_id: faculty.faculty_id,
        faculty_ad: faculty.faculty_ad,
        positions: positionDistributionResult.rows,
      });
    }

    // PDF raporu oluştur
    const reportURL = await pdfService.generatePositionDistributionReport(
      distributionData
    );

    res.json({
      message: "Akademik kadro dağılımı raporu başarıyla oluşturuldu",
      report_url: reportURL,
      data: distributionData,
    });
  } catch (error) {
    console.error("Get academic position distribution error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

/**
 * Jüri değerlendirme analizi raporu
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getJuryEvaluationAnalysis = async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.role !== "admin" && req.user.role !== "yonetici") {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }

    // Fakülteleri getir
    const facultiesResult = await pool.query(`
      SELECT faculty_id, faculty_ad
      FROM faculties
      ORDER BY faculty_ad
    `);

    const faculties = facultiesResult.rows;

    // Her fakülte için jüri değerlendirme analizini hesapla
    const analysisData = [];

    for (const faculty of faculties) {
      // Jüri değerlendirmelerini getir
      const juryAnalysisResult = await pool.query(
        `
        SELECT j.ad, j.soyad, j.unvan,
               COUNT(e.eval_id) as total_evaluations,
               SUM(CASE WHEN e.karar = 'kabul' THEN 1 ELSE 0 END) as accepted,
               SUM(CASE WHEN e.karar = 'ret' THEN 1 ELSE 0 END) as rejected,
               CASE 
                 WHEN COUNT(e.eval_id) > 0 
                 THEN ROUND((SUM(CASE WHEN e.karar = 'kabul' THEN 1 ELSE 0 END)::numeric / COUNT(e.eval_id)::numeric) * 100, 2)
                 ELSE 0
               END as acceptance_rate,
               AVG(EXTRACT(EPOCH FROM (e.tarih - ja.assigned_at)) / 86400)::integer as avg_evaluation_days
        FROM evaluations e
        JOIN jury_members j ON e.jury_id = j.jury_id
        JOIN jury_assignments ja ON e.jury_id = ja.jury_id AND e.application_id = ja.application_id
        JOIN applications a ON e.application_id = a.application_id
        JOIN announcements an ON a.ilan_id = an.ilan_id
        WHERE an.faculty_id = $1
        GROUP BY j.jury_id, j.ad, j.soyad, j.unvan
        ORDER BY total_evaluations DESC
      `,
        [faculty.faculty_id]
      );

      analysisData.push({
        faculty_id: faculty.faculty_id,
        faculty_ad: faculty.faculty_ad,
        jury_analysis: juryAnalysisResult.rows,
      });
    }

    // PDF raporu oluştur
    const reportURL = await pdfService.generateJuryAnalysisReport(analysisData);

    res.json({
      message: "Jüri değerlendirme analizi raporu başarıyla oluşturuldu",
      report_url: reportURL,
      data: analysisData,
    });
  } catch (error) {
    console.error("Get jury evaluation analysis error:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
