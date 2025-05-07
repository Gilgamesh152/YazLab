/**
 * eDevlet.js
 *
 * e-Devlet entegrasyonu için yapılandırma ve yardımcı fonksiyonlar
 * TC Kimlik doğrulama, adres bilgileri, diploma bilgileri sorgulamaları için kullanılır
 */

// Bu dosya şu an için gerçek e-Devlet entegrasyonu yerine mock fonksiyonlar içermektedir
// Gerçek bir uygulamada burada e-Devlet API'sine bağlantı ve kimlik doğrulama kodları olacaktır

/**
 * TC Kimlik Numarası doğrulama
 * @param {string} tcKimlik - TC Kimlik Numarası
 * @param {string} ad - Kişinin adı
 * @param {string} soyad - Kişinin soyadı
 * @param {number} dogumYili - Kişinin doğum yılı
 * @returns {Promise<boolean>} - Doğrulama sonucu
 */
const verifyTCKimlik = async (tcKimlik, ad, soyad, dogumYili) => {
  // Gerçek uygulama için burada e-Devlet API'sine istek gönderilecek

  try {
    // Geliştirme/test amaçlı basit doğrulama kontrolü
    // Gerçek uygulamada burası e-Devlet API'si üzerinden doğrulama yapacak

    // TC Kimlik No 11 haneli ve rakamlardan oluşmalı
    if (!/^\d{11}$/.test(tcKimlik)) {
      return false;
    }

    // Ad ve soyad boş olmamalı
    if (!ad || !soyad) {
      return false;
    }

    // Doğum yılı geçerli bir yıl olmalı
    const currentYear = new Date().getFullYear();
    if (
      !dogumYili ||
      dogumYili > currentYear ||
      dogumYili < currentYear - 120
    ) {
      return false;
    }

    // TC Kimlik Numarası algoritması doğrulaması
    // Aşağıdaki algoritma gerçek TC Kimlik Numarası algoritmasının basitleştirilmiş halidir

    // 11. hane kontrol hanesidir
    const checkDigit = parseInt(tcKimlik.charAt(10), 10);

    // İlk 10 hanenin toplamının mod 10'u 11. haneyi vermelidir
    const sum = [...tcKimlik.substring(0, 10)].reduce(
      (acc, digit) => acc + parseInt(digit, 10),
      0
    );

    if (sum % 10 !== checkDigit) {
      return false;
    }

    // Geliştirme aşamasında her zaman doğru döndür veya rastgele doğrulama yap
    return true;
  } catch (error) {
    console.error("TC Kimlik doğrulama hatası:", error);
    throw new Error(
      "TC Kimlik doğrulama işlemi sırasında beklenmeyen bir hata oluştu."
    );
  }
};

/**
 * Adres bilgisi sorgulama
 * @param {string} tcKimlik - TC Kimlik Numarası
 * @returns {Promise<Object>} - Adres bilgileri
 */
const getAddressInfo = async (tcKimlik) => {
  // Gerçek uygulama için burada e-Devlet API'sine istek gönderilecek
  try {
    // Şu anda gerçek entegrasyon olmadığı için mock veri dönüyoruz
    return {
      il: "Kocaeli",
      ilce: "İzmit",
      mahalle: "Örnek Mahalle",
      sokak: "Üniversite Caddesi",
      binaNo: "1",
      daireNo: "1",
      postaKodu: "41001",
    };
  } catch (error) {
    console.error("Adres bilgisi sorgulama hatası:", error);
    throw new Error(
      "Adres bilgisi sorgulama işlemi sırasında beklenmeyen bir hata oluştu."
    );
  }
};

/**
 * Öğrenim bilgisi sorgulama
 * @param {string} tcKimlik - TC Kimlik Numarası
 * @returns {Promise<Array>} - Öğrenim bilgileri
 */
const getEducationInfo = async (tcKimlik) => {
  // Gerçek uygulama için burada e-Devlet API'sine istek gönderilecek
  try {
    // Şu anda gerçek entegrasyon olmadığı için mock veri dönüyoruz
    return [
      {
        okulTuru: "Lisans",
        okulAdi: "Kocaeli Üniversitesi",
        bolum: "Bilgisayar Mühendisliği",
        mezuniyetTarihi: "2018-06-15",
        diplomaNo: "123456789",
      },
      {
        okulTuru: "Yüksek Lisans",
        okulAdi: "Kocaeli Üniversitesi",
        bolum: "Bilgisayar Mühendisliği",
        mezuniyetTarihi: "2020-06-15",
        diplomaNo: "987654321",
      },
    ];
  } catch (error) {
    console.error("Öğrenim bilgisi sorgulama hatası:", error);
    throw new Error(
      "Öğrenim bilgisi sorgulama işlemi sırasında beklenmeyen bir hata oluştu."
    );
  }
};

/**
 * Mesleki yeterlilik belgesi sorgulama
 * @param {string} tcKimlik - TC Kimlik Numarası
 * @returns {Promise<Array>} - Mesleki yeterlilik belgeleri
 */
const getProfessionalCertificates = async (tcKimlik) => {
  // Gerçek uygulama için burada e-Devlet API'sine istek gönderilecek
  try {
    // Şu anda gerçek entegrasyon olmadığı için mock veri dönüyoruz
    return [
      {
        belgeAdi: "Doçentlik Belgesi",
        belgeNo: "DOC2023001",
        verilenKurum: "Yükseköğretim Kurulu",
        verilinTarih: "2023-01-15",
        gecerlilikTarihi: "2033-01-15",
      },
    ];
  } catch (error) {
    console.error("Mesleki yeterlilik belgesi sorgulama hatası:", error);
    throw new Error(
      "Mesleki yeterlilik belgesi sorgulama işlemi sırasında beklenmeyen bir hata oluştu."
    );
  }
};

// e-Devlet API bağlantı ayarları
const eDevletConfig = {
  // API endpoint'leri
  endpoints: {
    kimlikDogrulama:
      process.env.EDEVLET_KIMLIK_DOGRULAMA_URL ||
      "https://wstest.nvi.gov.tr/KimlikDogrulama",
    adresSorgulama:
      process.env.EDEVLET_ADRES_SORGULAMA_URL ||
      "https://wstest.nvi.gov.tr/AdresSorgulama",
    ogrenim:
      process.env.EDEVLET_OGRENIM_URL || "https://wstest.meb.gov.tr/Ogrenim",
  },

  // API kimlik bilgileri
  auth: {
    username: process.env.EDEVLET_USERNAME || "test_username",
    password: process.env.EDEVLET_PASSWORD || "test_password",
    apiKey: process.env.EDEVLET_API_KEY || "test_api_key",
  },

  // İstek ayarları
  request: {
    timeout: parseInt(process.env.EDEVLET_TIMEOUT || "30000", 10), // 30 saniye
    maxRetries: parseInt(process.env.EDEVLET_MAX_RETRIES || "3", 10),
  },
};

module.exports = {
  verifyTCKimlik,
  getAddressInfo,
  getEducationInfo,
  getProfessionalCertificates,
  config: eDevletConfig,
};
