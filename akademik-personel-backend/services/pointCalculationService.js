const { Op } = require("sequelize");
const ApplicationModel = require("../models/applicationModel");
const ApplicationDocumentModel = require("../models/applicationDocumentModel");
const DocumentModel = require("../models/documentModel");
const DocumentCategoryModel = require("../models/documentCategoryModel");
const PointCalculationModel = require("../models/pointCalculationModel");

/**
 * Akademik başvuru puanlarını hesaplayan servis
 */
class PointCalculationService {
  /**
   * Bir başvurunun toplam puanını hesaplar
   * @param {Number} applicationId - Başvuru ID
   * @returns {Promise<Object>} - Hesaplanmış puanlar
   */
  async calculateApplicationPoints(applicationId) {
    try {
      // Başvuruyu al
      const application = await ApplicationModel.findByPk(applicationId, {
        include: [
          {
            model: ApplicationDocumentModel,
            include: [
              {
                model: DocumentModel,
                include: [DocumentCategoryModel],
              },
            ],
          },
        ],
      });

      if (!application) {
        throw new Error("Başvuru bulunamadı");
      }

      // Puan hesaplama için veri yapısı
      const pointData = {
        totalPoints: 0,
        sectionPoints: {
          a1_a2: 0, // A1-A2 kategorisindeki puanlar
          a1_a4: 0, // A1-A4 kategorisindeki puanlar
          a1_a5: 0, // A1-A5 kategorisindeki puanlar
          a1_a6: 0, // A1-A6 kategorisindeki puanlar
          a1_a8: 0, // A1-A8 kategorisindeki puanlar
          sectionA: 0, // A kategorisindeki toplam puanlar
          sectionB: 0, // B kategorisindeki toplam puanlar
          sectionC: 0, // C kategorisindeki toplam puanlar
          sectionD: 0, // D kategorisindeki toplam puanlar
          sectionE: 0, // E kategorisindeki toplam puanlar
          sectionF: 0, // F kategorisindeki toplam puanlar
          sectionG: 0, // G kategorisindeki toplam puanlar
          sectionH: 0, // H kategorisindeki toplam puanlar
          sectionI: 0, // I kategorisindeki toplam puanlar
          sectionJ: 0, // J kategorisindeki toplam puanlar
          sectionK: 0, // K kategorisindeki toplam puanlar
          sectionL: 0, // L kategorisindeki toplam puanlar
        },
        categoryCounts: {
          baslicaYazar: 0, // Başlıca yazar sayısı
          totalMakale: 0, // Toplam makale sayısı
          a1_a2_count: 0, // A1-A2 kategorisindeki makale sayısı
          a1_a4_count: 0, // A1-A4 kategorisindeki makale sayısı
          a1_a5_count: 0, // A1-A5 kategorisindeki makale sayısı
          a1_a6_count: 0, // A1-A6 kategorisindeki makale sayısı
          a1_a8_count: 0, // A1-A8 kategorisindeki makale sayısı
          kisiselEtkinlik: 0, // Kişisel etkinlik sayısı
          karmaEtkinlik: 0, // Karma etkinlik sayısı
        },
        detailedPoints: [], // Detaylı puan hesabı
      };

      // Belgeleri kategorilere göre işle
      for (const appDoc of application.applicationDocuments) {
        const document = appDoc.document;
        const category = document.documentCategory;
        const categoryCode = category.category_code;
        const basePoint = category.puan_degeri;
        let finalPoint = basePoint;

        // Yazar sayısına göre puan hesaplama
        if (appDoc.author_count > 1) {
          // Yazar sayısına göre çarpan uygulaması
          let k = 1;
          if (appDoc.author_count === 2) k = 0.8;
          else if (appDoc.author_count === 3) k = 0.6;
          else if (appDoc.author_count === 4) k = 0.5;
          else if (appDoc.author_count >= 5 && appDoc.author_count <= 9)
            k = 1 / appDoc.author_count;
          else if (appDoc.author_count >= 10) k = 0.1;

          // Başlıca yazar ve özel durumlar için ek çarpanlar
          if (appDoc.is_baslica_yazar && appDoc.author_count >= 5) {
            k *= 1.8; // Başlıca yazar için %80 artış
            pointData.categoryCounts.baslicaYazar++;
          } else if (
            appDoc.is_corresponding_author &&
            appDoc.author_count >= 5
          ) {
            k *= 1.8; // Sorumlu yazar için %80 artış
          }

          // Çarpan uygulanmış puan
          finalPoint = basePoint * k;
        }

        // Başlıca yazar kontrolü
        if (appDoc.is_baslica_yazar && appDoc.author_count < 5) {
          pointData.categoryCounts.baslicaYazar++;
        }

        // Detaylı puan kaydı
        pointData.detailedPoints.push({
          documentId: document.document_id,
          category: categoryCode,
          basePoint,
          finalPoint,
          authorCount: appDoc.author_count,
          isBaslicaYazar: appDoc.is_baslica_yazar,
          isCorrespondingAuthor: appDoc.is_corresponding_author,
        });

        // Kategori bazlı puan toplamları
        if (categoryCode.startsWith("A")) {
          pointData.sectionPoints.sectionA += finalPoint;
          pointData.categoryCounts.totalMakale++;

          // Alt kategori sayımları
          if (categoryCode === "A.1" || categoryCode === "A.2") {
            pointData.sectionPoints.a1_a2 += finalPoint;
            pointData.categoryCounts.a1_a2_count++;
            pointData.sectionPoints.a1_a4 += finalPoint;
            pointData.categoryCounts.a1_a4_count++;
            pointData.sectionPoints.a1_a5 += finalPoint;
            pointData.categoryCounts.a1_a5_count++;
            pointData.sectionPoints.a1_a6 += finalPoint;
            pointData.categoryCounts.a1_a6_count++;
            pointData.sectionPoints.a1_a8 += finalPoint;
            pointData.categoryCounts.a1_a8_count++;
          } else if (categoryCode === "A.3" || categoryCode === "A.4") {
            pointData.sectionPoints.a1_a4 += finalPoint;
            pointData.categoryCounts.a1_a4_count++;
            pointData.sectionPoints.a1_a5 += finalPoint;
            pointData.categoryCounts.a1_a5_count++;
            pointData.sectionPoints.a1_a6 += finalPoint;
            pointData.categoryCounts.a1_a6_count++;
            pointData.sectionPoints.a1_a8 += finalPoint;
            pointData.categoryCounts.a1_a8_count++;
          } else if (categoryCode === "A.5") {
            pointData.sectionPoints.a1_a5 += finalPoint;
            pointData.categoryCounts.a1_a5_count++;
            pointData.sectionPoints.a1_a6 += finalPoint;
            pointData.categoryCounts.a1_a6_count++;
            pointData.sectionPoints.a1_a8 += finalPoint;
            pointData.categoryCounts.a1_a8_count++;
          } else if (categoryCode === "A.6") {
            pointData.sectionPoints.a1_a6 += finalPoint;
            pointData.categoryCounts.a1_a6_count++;
            pointData.sectionPoints.a1_a8 += finalPoint;
            pointData.categoryCounts.a1_a8_count++;
          } else if (categoryCode === "A.7" || categoryCode === "A.8") {
            pointData.sectionPoints.a1_a8 += finalPoint;
            pointData.categoryCounts.a1_a8_count++;
          }
        } else if (categoryCode.startsWith("B")) {
          pointData.sectionPoints.sectionB += finalPoint;
        } else if (categoryCode.startsWith("C")) {
          pointData.sectionPoints.sectionC += finalPoint;
        } else if (categoryCode.startsWith("D")) {
          pointData.sectionPoints.sectionD += finalPoint;
        } else if (categoryCode.startsWith("E")) {
          pointData.sectionPoints.sectionE += finalPoint;
        } else if (categoryCode.startsWith("F")) {
          pointData.sectionPoints.sectionF += finalPoint;
        } else if (categoryCode.startsWith("G")) {
          pointData.sectionPoints.sectionG += finalPoint;
        } else if (categoryCode.startsWith("H")) {
          pointData.sectionPoints.sectionH += finalPoint;
        } else if (categoryCode.startsWith("I")) {
          pointData.sectionPoints.sectionI += finalPoint;
        } else if (categoryCode.startsWith("J")) {
          pointData.sectionPoints.sectionJ += finalPoint;
        } else if (categoryCode.startsWith("K")) {
          pointData.sectionPoints.sectionK += finalPoint;
        } else if (categoryCode.startsWith("L")) {
          pointData.sectionPoints.sectionL += finalPoint;

          // Kişisel ve karma etkinlik sayıları
          if (categoryCode === "L.5" || categoryCode === "L.6") {
            pointData.categoryCounts.kisiselEtkinlik++;
          } else if (categoryCode === "L.7" || categoryCode === "L.8") {
            pointData.categoryCounts.karmaEtkinlik++;
          }
        }
      }

      // Toplam puanı hesapla (D, E, K bölümlerindeki azami puanları kısıtla)
      const limitedD = Math.min(pointData.sectionPoints.sectionD, 1500);
      const limitedE = Math.min(pointData.sectionPoints.sectionE, 50);
      const limitedK = Math.min(pointData.sectionPoints.sectionK, 50);

      pointData.totalPoints =
        pointData.sectionPoints.sectionA +
        pointData.sectionPoints.sectionB +
        pointData.sectionPoints.sectionC +
        limitedD +
        limitedE +
        pointData.sectionPoints.sectionF +
        pointData.sectionPoints.sectionG +
        pointData.sectionPoints.sectionH +
        pointData.sectionPoints.sectionI +
        pointData.sectionPoints.sectionJ +
        limitedK +
        pointData.sectionPoints.sectionL;

      // Hesaplanan puanları veritabanına kaydet
      const [pointCalculation, created] =
        await PointCalculationModel.findOrCreate({
          where: { application_id: applicationId },
          defaults: {
            application_id: applicationId,
            toplam_puan: pointData.totalPoints,
            a1_a2_puan: pointData.sectionPoints.a1_a2,
            a1_a4_puan: pointData.sectionPoints.a1_a4,
            a1_a5_puan: pointData.sectionPoints.a1_a5,
            a1_a6_puan: pointData.sectionPoints.a1_a6,
            a1_a8_puan: pointData.sectionPoints.a1_a8,
            baslica_yazar_count: pointData.categoryCounts.baslicaYazar,
            calculation_date: new Date(),
            calculation_json: JSON.stringify(pointData),
          },
        });

      // Eğer daha önce hesaplama yapılmışsa, güncelle
      if (!created) {
        await pointCalculation.update({
          toplam_puan: pointData.totalPoints,
          a1_a2_puan: pointData.sectionPoints.a1_a2,
          a1_a4_puan: pointData.sectionPoints.a1_a4,
          a1_a5_puan: pointData.sectionPoints.a1_a5,
          a1_a6_puan: pointData.sectionPoints.a1_a6,
          a1_a8_puan: pointData.sectionPoints.a1_a8,
          baslica_yazar_count: pointData.categoryCounts.baslicaYazar,
          calculation_date: new Date(),
          calculation_json: JSON.stringify(pointData),
        });
      }

      return pointData;
    } catch (error) {
      console.error("Puan hesaplama hatası:", error);
      throw error;
    }
  }

  /**
   * Başvurunun kriterleri karşılayıp karşılamadığını kontrol eder
   * @param {Number} applicationId - Başvuru ID
   * @param {Object} criteria - Karşılaştırılacak kriterler
   * @returns {Promise<Object>} - Değerlendirme sonucu
   */
  async evaluateApplicationCriteria(applicationId, criteria) {
    try {
      // Mevcut puan hesaplamasını al
      const pointCalculation = await PointCalculationModel.findOne({
        where: { application_id: applicationId },
      });

      if (!pointCalculation) {
        // Puanları hesapla
        await this.calculateApplicationPoints(applicationId);
        // Tekrar bul
        const newCalculation = await PointCalculationModel.findOne({
          where: { application_id: applicationId },
        });

        if (!newCalculation) {
          throw new Error("Puanlar hesaplanamadı");
        }

        return this._compareCriteria(newCalculation, criteria);
      }

      return this._compareCriteria(pointCalculation, criteria);
    } catch (error) {
      console.error("Kriter değerlendirme hatası:", error);
      throw error;
    }
  }

  /**
   * Hesaplanan puanları kriterlerle karşılaştırır
   * @private
   * @param {Object} calculation - Hesaplanan puanlar
   * @param {Object} criteria - Karşılaştırılacak kriterler
   * @returns {Object} - Karşılaştırma sonucu
   */
  _compareCriteria(calculation, criteria) {
    // JSON formatındaki hesaplamaları parse et
    const detailedData = JSON.parse(calculation.calculation_json || "{}");

    // Kriterleri kontrol et
    const result = {
      meetsAllCriteria: true,
      criteriaResults: {
        totalPoints: {
          required: criteria.min_puan || 0,
          actual: calculation.toplam_puan,
          meets: calculation.toplam_puan >= (criteria.min_puan || 0),
        },
        a1_a2: {
          required: criteria.min_a1_a2_count || 0,
          actual: detailedData.categoryCounts?.a1_a2_count || 0,
          meets:
            (detailedData.categoryCounts?.a1_a2_count || 0) >=
            (criteria.min_a1_a2_count || 0),
        },
        a1_a4: {
          required: criteria.min_a1_a4_count || 0,
          actual: detailedData.categoryCounts?.a1_a4_count || 0,
          meets:
            (detailedData.categoryCounts?.a1_a4_count || 0) >=
            (criteria.min_a1_a4_count || 0),
        },
        a1_a6: {
          required: criteria.min_a1_a6_count || 0,
          actual: detailedData.categoryCounts?.a1_a6_count || 0,
          meets:
            (detailedData.categoryCounts?.a1_a6_count || 0) >=
            (criteria.min_a1_a6_count || 0),
        },
        baslicaYazar: {
          required: criteria.min_baslica_yazar || 0,
          actual: calculation.baslica_yazar_count,
          meets:
            calculation.baslica_yazar_count >=
            (criteria.min_baslica_yazar || 0),
        },
        kisiselEtkinlik: {
          required: criteria.min_kisisel_etkinlik || 0,
          actual: detailedData.categoryCounts?.kisiselEtkinlik || 0,
          meets:
            (detailedData.categoryCounts?.kisiselEtkinlik || 0) >=
            (criteria.min_kisisel_etkinlik || 0),
        },
        karmaEtkinlik: {
          required: criteria.min_karma_etkinlik || 0,
          actual: detailedData.categoryCounts?.karmaEtkinlik || 0,
          meets:
            (detailedData.categoryCounts?.karmaEtkinlik || 0) >=
            (criteria.min_karma_etkinlik || 0),
        },
      },
    };

    // Tüm kriterleri karşılayıp karşılamadığını kontrol et
    for (const [key, value] of Object.entries(result.criteriaResults)) {
      if (!value.meets) {
        result.meetsAllCriteria = false;
        break;
      }
    }

    return result;
  }
}

module.exports = new PointCalculationService();
