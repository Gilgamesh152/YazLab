/**
 * emailService.js
 *
 * E-posta göndermek için kullanılan servis.
 * Nodemailer kütüphanesini kullanarak e-posta işlemlerini yönetir.
 */

const nodemailer = require("nodemailer");
const emailConfig = require("../config/email");
const fs = require("fs").promises;
const path = require("path");
const handlebars = require("handlebars");

// Gönderilecek e-postalar için bir kuyruk oluştur (opsiyonel rate limiting için)
let emailQueue = [];
let isProcessing = false;

// Nodemailer transporter'ı oluştur
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth,
  pool: true, // Bağlantı havuzu kullan
  maxConnections: emailConfig.rateLimits.maxConnections,
  maxMessages: emailConfig.rateLimits.maxMessages,
});

/**
 * E-posta şablonunu yükler
 * @param {string} templateName - Şablon dosyası adı (uzantısız)
 * @returns {Promise<string>} - Şablon içeriği
 */
const loadTemplate = async (templateName) => {
  try {
    // Şablon dosyasının yolunu oluştur (templates klasörü ana dizinde olmalı)
    const templatePath = path.join(
      __dirname,
      "../templates",
      `${templateName}.html`
    );

    // Şablonu oku
    const template = await fs.readFile(templatePath, "utf8");
    return template;
  } catch (error) {
    console.error(`Şablon yüklenirken hata: ${error.message}`);
    throw new Error(emailConfig.errorMessages.templateNotFound);
  }
};

/**
 * Şablonu verilerle doldurur
 * @param {string} template - Şablon içeriği
 * @param {Object} data - Şablona eklenen veriler
 * @returns {string} - Doldurulmuş şablon
 */
const compileTemplate = (template, data) => {
  const compiledTemplate = handlebars.compile(template);
  return compiledTemplate(data);
};

/**
 * E-posta gönderir
 * @param {Object} options - E-posta seçenekleri
 * @param {string|string[]} options.to - Alıcı e-posta adresi veya adresleri
 * @param {string} options.subject - E-posta konusu
 * @param {string} options.text - Düz metin içeriği
 * @param {string} [options.html] - HTML içeriği (opsiyonel)
 * @param {Object} [options.attachments] - Ekler (opsiyonel)
 * @returns {Promise<Object>} - Gönderilen e-posta hakkında bilgiler
 */
const sendEmail = async (options) => {
  try {
    // E-posta seçeneklerini doğrula
    if (!options.to) {
      throw new Error(emailConfig.errorMessages.invalidRecipient);
    }

    // E-posta ayarlarını oluştur
    const mailOptions = {
      from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
    };

    // HTML içeriği varsa ekle
    if (options.html) {
      mailOptions.html = options.html;
    }

    // Ekler varsa ekle
    if (options.attachments) {
      mailOptions.attachments = options.attachments;
    }

    // CC ve BCC varsa ekle
    if (options.cc) {
      mailOptions.cc = options.cc;
    }

    if (options.bcc) {
      mailOptions.bcc = options.bcc;
    }

    // E-postayı gönder
    const info = await transporter.sendMail(mailOptions);

    // Gönderim bilgilerini döndür
    return {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending,
      response: info.response,
    };
  } catch (error) {
    console.error(`E-posta gönderilirken hata: ${error.message}`);
    throw new Error(
      `${emailConfig.errorMessages.sendFailed}: ${error.message}`
    );
  }
};

/**
 * Şablonlu e-posta gönderir
 * @param {Object} options - E-posta seçenekleri
 * @param {string|string[]} options.to - Alıcı e-posta adresi veya adresleri
 * @param {string} options.subject - E-posta konusu
 * @param {string} options.templateName - Şablon dosyası adı (uzantısız)
 * @param {Object} options.templateData - Şablona eklenen veriler
 * @param {Object} [options.attachments] - Ekler (opsiyonel)
 * @returns {Promise<Object>} - Gönderilen e-posta hakkında bilgiler
 */
const sendTemplateEmail = async (options) => {
  try {
    // Şablonu yükle
    const template = await loadTemplate(options.templateName);

    // Şablonu verilerle doldur
    const html = compileTemplate(template, {
      ...options.templateData,
      appName: emailConfig.appName,
    });

    // Düz metin içeriği oluştur (basit HTML temizleme)
    const text = html.replace(/<[^>]*>?/gm, "");

    // E-postayı gönder
    return await sendEmail({
      to: options.to,
      subject: options.subject,
      text,
      html,
      attachments: options.attachments,
      cc: options.cc,
      bcc: options.bcc,
    });
  } catch (error) {
    console.error(`Şablonlu e-posta gönderilirken hata: ${error.message}`);
    throw new Error(
      `${emailConfig.errorMessages.sendFailed}: ${error.message}`
    );
  }
};

/**
 * Toplu e-posta gönderir (yük dengeleme ve hız sınırlaması ile)
 * @param {Array<Object>} emailList - Gönderilecek e-postaların listesi
 * @param {number} [batchSize=10] - Bir seferde işlenecek e-posta sayısı
 * @param {number} [delayMs=1000] - Gruplar arasındaki gecikme (ms)
 * @returns {Promise<Array>} - Gönderilen e-postaların sonuçları
 */
const sendBulkEmails = async (emailList, batchSize = 10, delayMs = 1000) => {
  // Kuyruğa ekle
  emailQueue.push(...emailList);

  // Zaten işleme yapılıyorsa çık
  if (isProcessing) return;

  isProcessing = true;
  const results = [];

  try {
    // Kuyrukta e-posta varsa işle
    while (emailQueue.length > 0) {
      // Bir grup e-posta al
      const batch = emailQueue.splice(0, batchSize);

      // Bu gruptaki tüm e-postaları gönder
      const batchPromises = batch.map(async (emailOptions) => {
        try {
          if (emailOptions.templateName) {
            return await sendTemplateEmail(emailOptions);
          } else {
            return await sendEmail(emailOptions);
          }
        } catch (error) {
          console.error(`Toplu e-posta gönderilirken hata: ${error.message}`);
          return { error: error.message, emailOptions };
        }
      });

      // Gruptaki e-postaların sonuçlarını bekle
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Sonraki grup için bekle (rate limiting)
      if (emailQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return results;
  } catch (error) {
    console.error(`Toplu e-posta işlenirken hata: ${error.message}`);
    throw new Error(`Toplu e-posta işlenemedi: ${error.message}`);
  } finally {
    isProcessing = false;
  }
};

/**
 * Transporter'ın bağlantısını doğrular
 * @returns {Promise<boolean>} - Bağlantı durumu
 */
const verifyConnection = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error(`E-posta sunucu bağlantısı doğrulanamadı: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendTemplateEmail,
  sendBulkEmails,
  verifyConnection,
};
