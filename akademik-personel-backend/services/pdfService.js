// pdfService.js
// PDF oluşturma servisi
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Akademik başvuru için Tablo 5 PDF'i oluşturma servisi
 */
class PDFService {
  /**
   * Tablo 5 formatında PDF oluşturur
   * @param {Object} applicationData - Başvuru verileri
   * @param {Object} userData - Kullanıcı verileri
   * @param {Array} publications - Yayın listesi
   * @param {Object} pointCalculations - Puan hesaplamaları
   * @returns {Promise<String>} - PDF dosya yolu
   */
  async generateTable5PDF(
    applicationData,
    userData,
    publications,
    pointCalculations
  ) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const filename = `table5_${userData.tc_kimlik}_${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, "../temp", filename);

        // PDF akışını dosyaya yönlendir
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Başlık
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("TABLO 5", { align: "center" });
        doc
          .fontSize(12)
          .text(
            "ÖĞRETİM ÜYELİKLERİNE ATAMA İÇİN YAPILAN BAŞVURULARDA ADAYLARIN YAYIN, EĞİTİM-ÖĞRETİM VE DİĞER FAALİYETLERİNİN DEĞERLENDİRİLMESİNE İLİŞKİN GENEL PUANLAMA BİLGİLERİ",
            { align: "center" }
          );
        doc.moveDown(2);

        // Genel Bilgiler
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("GENEL PUANLAMA BİLGİLERİ");
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(
            `Adı Soyadı (Ünvanı): ${userData.ad} ${userData.soyad} (${
              userData.unvan || ""
            })`
          );
        doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`);
        doc.text(`Bulunduğu Kurum: ${userData.kurum || ""}`);
        doc.text(
          `Başvurduğu Akademik Kadro: ${applicationData.kadro_ad || ""}`
        );
        doc.moveDown();

        // Puanlanan Faaliyet Dönemi
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("Puanlanan Faaliyet Dönemi");

        // Kadro türüne göre uygun seçeneği işaretle
        const kadroDurumu = applicationData.kadro_ad || "";
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(
            `☐ Profesör (Doçent ünvanını aldıktan sonraki faaliyetleri esas alınacaktır)${
              kadroDurumu.includes("Profesör") ? " ✓" : ""
            }`
          );
        doc.text(
          `☐ Doçent (Doktora / Sanatta yeterlik/ tıp/diş uzmanlık ünvanını aldıktan sonraki faaliyetleri esas alınacaktır)${
            kadroDurumu.includes("Doçent") ? " ✓" : ""
          }`
        );
        doc.text(
          `☐ Dr. Öğretim Üyesi (Yeniden Atama: Son atama tarihinden başvuru tarihine kadar olmak üzere dönem faaliyetleri esas alınacaktır)${
            kadroDurumu.includes("Dr. Öğretim Üyesi") &&
            applicationData.isYenidenAtama
              ? " ✓"
              : ""
          }`
        );
        doc.text(
          `☐ Dr. Öğretim Üyesi (İlk Atama)${
            kadroDurumu.includes("Dr. Öğretim Üyesi") &&
            !applicationData.isYenidenAtama
              ? " ✓"
              : ""
          }`
        );
        doc.moveDown(2);

        // A. Makaleler Bölümü
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(
            "A. Makaleler (Başvurulan bilim alanı ile ilgili tam araştırma ve derleme makaleleri)"
          );

        // Tablo başlıkları
        const tableTop = doc.y;
        doc
          .fontSize(8)
          .text(
            "Yazar/Yazarlar, Makale adı, Dergi adı, Cilt No., Sayfa, Yıl",
            50,
            tableTop
          );
        doc.text("Puan Hesabı", 400, tableTop);
        doc.text("Nihai Puan", 480, tableTop);
        doc.moveDown();

        // Yayınları listele
        if (publications && publications.length > 0) {
          publications.forEach((pub, index) => {
            if (pub.type === "makale") {
              const yText = doc.y;
              doc
                .fontSize(8)
                .font("Helvetica")
                .text(
                  `${index + 1}) ${pub.authors}, ${pub.title}, ${
                    pub.journal
                  }, ${pub.volume}, ${pub.pages}, ${pub.year}`,
                  50,
                  yText,
                  { width: 340 }
                );
              doc.text(pub.rawPoint, 400, yText);
              doc.text(pub.finalPoint, 480, yText);
              doc.moveDown();
            }
          });
        } else {
          doc
            .fontSize(8)
            .font("Helvetica")
            .text("Kayıt bulunmamaktadır.", 50, doc.y);
          doc.moveDown();
        }

        // Toplam puanlar
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(
            `Bölüm A Toplam Puanı: ${pointCalculations.totalSectionA || 0}`
          );
        doc.moveDown();

        // Benzer şekilde diğer bölümler (B, C, D, ...) eklenebilir
        // Örnek: B. Bilimsel Toplantı Faaliyetleri
        doc.addPage(); // Yeni sayfa ekle

        // Sayfa sonuna kullanıcı imzası için alan
        doc.fontSize(10).text("İmza:", 400, 700);
        doc.moveTo(440, 720).lineTo(540, 720).stroke();

        // PDF oluşturmayı sonlandır
        doc.end();

        // Stream kapandığında resolve et
        stream.on("finish", () => {
          resolve(outputPath);
        });

        stream.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new PDFService();
