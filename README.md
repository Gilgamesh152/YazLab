# Akademik Personel Başvuru Sistemi (Frontend)

**Akademik Personel Başvuru Sistemi** (APBS), üniversiteye başvuran akademik personel adaylarının başvuru süreçlerini kolaylaştıran ve takip edilebilmesini sağlayan bir web uygulamasıdır. Bu sistem, kullanıcı dostu bir arayüz ile başvuru yapma, başvuru durumunu izleme gibi işlemleri kolayca gerçekleştirmenize olanak tanır.

Frontend kısmı **React.js**, **Vite** ve **Tailwind CSS** teknolojileriyle geliştirilmiştir.

---

## Kullanılan Teknolojiler

Bu projede kullanılan ana teknolojiler şunlardır:

- **React.js**: Modern web uygulamaları geliştirmek için kullanılan popüler bir JavaScript kütüphanesidir.
- **Vite**: Hızlı geliştirme ortamı sağlayan bir build aracıdır. React projeleri için optimize edilmiştir.
- **Tailwind CSS**: Esnek ve özelleştirilebilir bir utility-first CSS framework'üdür. Tasarımda hızlı ve verimli çalışma imkanı sağlar.
- **PDF.js** (isteğe bağlı): PDF dosyalarını kullanıcı arayüzünde görüntülemek için kullanılabilir.

---

## Ekran Görüntüleri

### 1. **Giriş Ekranı**

Projeye ilk girdiğinizde kullanıcı dostu bir giriş ekranı karşılar. Aşağıda giriş ekranının bir örneği yer almaktadır:

![Giriş Ekranı](src/assets/images/image.png)

Başvuru formu, akademik personel adaylarının başvurularını girmesine olanak tanır.

---

## Başlangıç

Projeyi yerel bilgisayarınızda çalıştırabilmek için aşağıdaki adımları izleyebilirsiniz:

### 1. Depoyu Klonlayın

Depoyu bilgisayarınıza klonlamak için aşağıdaki komutu kullanın:

```bash
git clone https://github.com/Gilgamesh152/YazLab.git

# Akademik Personel Başvuru Sistemi - Backend

## Proje Hakkında

Bu proje, Kocaeli Üniversitesi'nin akademik personel başvuru süreçlerini dijitalleştiren bir sistemin backend kısmını içermektedir. Sistem; akademik personel adaylarının ilgili kadrolara başvurmasını, yönetici ve admin kullanıcıları için ilan ve başvuru kriterlerinin düzenlenmesini ve jüri üyelerinin değerlendirme yapmasını sağlar.

## Teknolojiler

- **Node.js** - JavaScript runtime ortamı
- **Express.js** - Web uygulama çerçevesi
- **PostgreSQL** - İlişkisel veritabanı sistemi
- **JWT** - JSON Web Token kimlik doğrulama
- **Firebase Storage** - Dosya depolama
- **Twilio/Firebase** - Bildirim sistemi
- **Nüfus Müdürlüğü ve e-Devlet API** - Kimlik doğrulama

## Kurulum

### Gereksinimler

- Node.js (v14+)
- PostgreSQL (v12+)
- npm veya yarn

### Adımlar

1. Repoyu klonlayın
```bash
git clone https://github.com/kullanici/akademik-personel-backend.git
cd akademik-personel-backend
```

2. Bağımlılıkları yükleyin
```bash
npm install
```

3. `.env` dosyasını oluşturun ve aşağıdaki bilgileri ekleyin
```
# Server
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=akademik_personel
DB_USER=postgres
DB_PASSWORD=sifreiniz

# JWT
JWT_SECRET=gizli_anahtar
JWT_EXPIRES_IN=1d

# Firebase
FIREBASE_API_KEY=firebase_api_key
FIREBASE_AUTH_DOMAIN=firebase_auth_domain
FIREBASE_PROJECT_ID=firebase_project_id
FIREBASE_STORAGE_BUCKET=firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=firebase_messaging_sender_id
FIREBASE_APP_ID=firebase_app_id

# E-Devlet
EDEVLET_API_KEY=edevlet_api_key
```

4. Veritabanını oluşturun
```bash
psql -U postgres
CREATE DATABASE akademik_personel;
\q
```

5. Migrations'ları çalıştırın
```bash
npm run migrate
```

6. Sunucuyu başlatın
```bash
npm run dev
```

## Proje Yapısı

```
📁 AKADEMIK-PERSONEL-BACKEND
│
├── 📁 config                   # Konfigürasyon dosyaları
│   ├── 📄 db.js                # Veritabanı bağlantı ayarları
│   ├── 📄 eDevlet.js           # e-Devlet entegrasyonu
│   ├── 📄 email.js             # E-posta servis konfigürasyonu
│   ├── 📄 firebase.js          # Firebase konfigürasyonu
│   └── 📄 jwt.js               # JWT kimlik doğrulama yapılandırması
│
├── 📁 controllers              # İstek yöneticileri
│   ├── 📄 announcementController.js   # Duyuru işlemleri
│   ├── 📄 applicationController.js    # Başvuru işlemleri
│   ├── 📄 authController.js           # Kimlik doğrulama
│   ├── 📄 criteriaController.js       # Değerlendirme kriterleri
│   ├── 📄 documentController.js       # Belge yönetimi
│   ├── 📄 evaluationController.js     # Değerlendirme işlemleri
│   ├── 📄 juryController.js           # Jüri yönetimi
│   ├── 📄 notificationController.js   # Bildirim işlemleri
│   ├── 📄 reportController.js         # Rapor oluşturma
│   └── 📄 userController.js           # Kullanıcı yönetimi
│
├── 📁 db                       # Veritabanı ilgili dosyalar
│   └── 📄 migrations.js        # Veritabanı şema oluşturma
│
├── 📁 middleware               # Ara katman yazılımları
│   ├── 📄 auth.js              # Kimlik doğrulama middleware
│   ├── 📄 errorHandler.js      # Hata yönetimi
│   ├── 📄 roleCheck.js         # Rol kontrolü
│   ├── 📄 uploadMiddleware.js  # Dosya yükleme işlemleri
│   └── 📄 validate.js          # Veri doğrulama
│
├── 📁 models                   # Veri modelleri
│   ├── 📄 announcementModel.js       # Duyuru modeli
│   ├── 📄 applicationDocumentModel.js # Başvuru belgeleri modeli
│   ├── 📄 applicationModel.js        # Başvuru modeli
│   ├── 📄 criteriaModel.js           # Değerlendirme kriterleri
│   ├── 📄 departmentModel.js         # Bölüm modeli
│   ├── 📄 documentCategoryModel.js   # Belge kategorileri
│   ├── 📄 documentModel.js           # Belge modeli
│   ├── 📄 evaluationModel.js         # Değerlendirme modeli
│   ├── 📄 facultyModel.js            # Fakülte modeli
│   ├── 📄 juryModel.js               # Jüri modeli
│   ├── 📄 notificationModel.js       # Bildirim modeli
│   ├── 📄 pointCalculationModel.js   # Puan hesaplama modeli
│   ├── 📄 positionModel.js           # Pozisyon modeli
│   ├── 📄 roleModel.js               # Rol modeli
│   └── 📄 userModel.js               # Kullanıcı modeli
│
├── 📁 routes                   # API rotaları
│   ├── 📄 announcementRoutes.js      # Duyuru rotaları
│   ├── 📄 applicationRoutes.js       # Başvuru rotaları
│   ├── 📄 authRoutes.js              # Kimlik doğrulama rotaları
│   ├── 📄 criteriaRoutes.js          # Kriter rotaları
│   ├── 📄 documentRoutes.js          # Belge rotaları
│   ├── 📄 evaluationRoutes.js        # Değerlendirme rotaları
│   ├── 📄 juryRoutes.js              # Jüri rotaları
│   ├── 📄 notificationRoutes.js      # Bildirim rotaları
│   ├── 📄 reportRoutes.js            # Rapor rotaları
│   └── 📄 userRoutes.js              # Kullanıcı rotaları
│
├── 📁 services                 # İş mantığı servisleri
│   ├── 📄 emailService.js            # E-posta gönderme servisi
│   ├── 📄 notificationService.js     # Bildirim servisi
│   ├── 📄 pdfService.js              # PDF oluşturma servisi
│   ├── 📄 pointCalculationService.js # Puan hesaplama servisi
│   └── 📄 storageService.js          # Depolama servisi
│
├── 📁 templates                # Şablonlar
│   └── 📁 pdf                  # PDF şablonları
│
├── 📁 uploads                  # Yüklenen dosyalar
│   └── 📁 jury_reports         # Jüri raporları
│
├── 📁 utils                    # Yardımcı fonksiyonlar
│   ├── 📄 constants.js         # Sabit değerler
│   ├── 📄 formatters.js        # Biçimlendirme fonksiyonları
│   └── 📄 validators.js        # Doğrulama fonksiyonları
│
├── 📄 .env                     # Ortam değişkenleri
├── 📄 package-lock.json        # Bağımlılık kilitleme dosyası
├── 📄 package.json             # Proje bağımlılıkları
├── 📄 server.js                # Ana sunucu dosyası
└── 📄 serviceAccountKey.json   # Servis hesabı anahtarı (Firebase için)
```

## Veritabanı Şeması

Ana Tablolar:

1. **Users (Kullanıcılar)**
   - Alanlar: user_id, tc_kimlik, sifre, ad, soyad, email, telefon, role_id
   - Açıklama: Sistemdeki kullanıcıları tanımlar
   - İlişkiler: roles tablosu ile ilişkili (role_id)

2. **Roles (Roller)**
   - Alanlar: role_id, role_name, role_desc
   - Açıklama: Kullanıcı rollerini tanımlar (örn: Aday, Admin, Yönetici, Jüri Üyesi)

3. **Faculties (Fakülteler)**
   - Alanlar: faculty_id, faculty_ad
   - Açıklama: Üniversite fakültelerini tanımlar

4. **Departmanlar**
   - Alanlar: departman_id, departman_ad, faculty_id
   - Açıklama: Fakültelere bağlı bölümleri tanımlar
   - İlişkiler: faculties tablosu ile ilişkili (faculty_id)

5. **Kadrolar**
   - Alanlar: kadro_id, kadro_ad, description
   - Açıklama: Akademik kadro türlerini tanımlar (Dr. Öğr. Üyesi, Doçent, Profesör)

6. **Announcements (İlanlar)**
   - Alanlar: ilan_id, ilan_başlık, ilan_aciklama, faculty_id, departman_id, kadro_id, baslangic_tarih, bitis_tarih
   - Açıklama: İlan edilen akademik kadro pozisyonlarını tanımlar
   - İlişkiler: faculties, departmanlar ve kadrolar tabloları ile ilişkili

7. **Criteria (Kriterler)**
   - Alanlar: criteria_id, faculty_id, kadro_id, min_puan, departman_id
   - Açıklama: Başvuru kriterlerini tanımlar
   - İlişkiler: faculties, kadrolar ve departmanlar tabloları ile ilişkili

8. **Documents (Belgeler)**
   - Alanlar: document_id, document_type, puan
   - Açıklama: Belge türlerini ve puanlarını tanımlar

9. **Document_Categories (Belge Kategorileri)**
   - Alanlar: category_id, category_code, category_name, description, puan_degeri
   - Açıklama: Belge kategorilerini tanımlar

10. **Applications (Başvurular)**
    - Alanlar: application_id, user_id, ilan_id, basvuru_tarihi, durum
    - Açıklama: Kullanıcı başvurularını tanımlar
    - İlişkiler: users ve announcements tabloları ile ilişkili

11. **Application_Documents (Başvuru Belgeleri)**
    - Alanlar: application_id, document_id, dosya_url, upload_date, is_verified, is_baslica_yazar, verification_notes
    - Açıklama: Başvuru ile ilgili yüklenen belgeleri tanımlar
    - İlişkiler: applications ve documents tabloları ile ilişkili

12. **Criteria_Documents (Kriter Belgeleri)**
    - Alanlar: criteria_id, document_id
    - Açıklama: Kriterler ve belgeler arasındaki ilişkiyi tanımlar
    - İlişkiler: criteria ve documents tabloları ile ilişkili

13. **Jury_Members (Jüri Üyeleri)**
    - Alanlar: jury_id, tc_kimlik, ad, soyad, unvan, kurum
    - Açıklama: Başvuruları değerlendirecek jüri üyelerini tanımlar

14. **Evaluations (Değerlendirmeler)**
    - Alanlar: eval_id, jury_id, application_id, rapor_url, karar, tarih
    - Açıklama: Jüri üyelerinin başvurulara yönelik değerlendirmelerini tanımlar
    - İlişkiler: jury_members ve applications tabloları ile ilişkili

15. **Notifications (Bildirimler)**
    - Alanlar: notification_id, user_id, application_id, mesaj, gonderildi, created_at
    - Açıklama: Kullanıcılara gönderilen bildirimleri tanımlar
    - İlişkiler: users ve applications tabloları ile ilişkili

16. **Point_Calculations (Puan Hesaplamaları)**
    - Alanlar: calculation_id, application_id, toplam_puan, a1_a2_puan, a1_a4_puan, a1_a5_puan, a1_a6_puan, a1_a8_puan, baslica_yazar_count, calculation_date, calculation_json
    - Açıklama: Başvuru puanı hesaplamalarını tanımlar
    - İlişkiler: applications tablosu ile ilişkili

## API Endpointleri

### Kimlik Doğrulama
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Yeni kullanıcı kaydı (Sadece admin tarafından)
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### Kullanıcılar
- `GET /api/users` - Tüm kullanıcıları listele (Admin)
- `GET /api/users/:id` - Belirli bir kullanıcıyı getir
- `PUT /api/users/:id` - Kullanıcı bilgilerini güncelle
- `DELETE /api/users/:id` - Kullanıcı sil (Admin)

### İlanlar
- `GET /api/announcements` - Tüm ilanları listele
- `GET /api/announcements/:id` - Belirli bir ilanı getir
- `POST /api/announcements` - Yeni ilan oluştur (Admin)
- `PUT /api/announcements/:id` - İlan güncelle (Admin)
- `DELETE /api/announcements/:id` - İlan sil (Admin)

### Başvurular
- `GET /api/applications` - Tüm başvuruları listele (Admin/Yönetici)
- `GET /api/applications/my` - Kullanıcının kendi başvurularını listele
- `GET /api/applications/:id` - Belirli bir başvuruyu getir
- `POST /api/applications` - Yeni başvuru oluştur (Aday)
- `PUT /api/applications/:id` - Başvuru güncelle
- `DELETE /api/applications/:id` - Başvuru sil
- `PUT /api/applications/:id/status` - Başvuru durumunu güncelle (Yönetici)

### Belgeler
- `GET /api/documents` - Tüm belge türlerini listele
- `GET /api/documents/:id` - Belirli bir belge türünü getir
- `POST /api/documents` - Yeni belge türü oluştur (Admin)
- `PUT /api/documents/:id` - Belge türü güncelle (Admin)
- `DELETE /api/documents/:id` - Belge türü sil (Admin)

### Başvuru Belgeleri
- `GET /api/applications/:id/documents` - Başvuruya ait belgeleri listele
- `POST /api/applications/:id/documents` - Başvuruya yeni belge ekle
- `DELETE /api/applications/:id/documents/:docId` - Başvurudan belge sil

### Kriterler
- `GET /api/criteria` - Tüm kriterleri listele
- `GET /api/criteria/:id` - Belirli bir kriteri getir
- `POST /api/criteria` - Yeni kriter oluştur (Yönetici)
- `PUT /api/criteria/:id` - Kriter güncelle (Yönetici)
- `DELETE /api/criteria/:id` - Kriter sil (Yönetici)

### Jüri
- `GET /api/jury` - Tüm jüri üyelerini listele (Yönetici)
- `GET /api/jury/:id` - Belirli bir jüri üyesini getir
- `POST /api/jury` - Yeni jüri üyesi ekle (Yönetici)
- `PUT /api/jury/:id` - Jüri üyesi bilgilerini güncelle (Yönetici)
- `DELETE /api/jury/:id` - Jüri üyesi sil (Yönetici)
- `GET /api/jury/evaluations` - Jüri üyesinin değerlendirmelerini getir

### Değerlendirmeler
- `GET /api/evaluations` - Tüm değerlendirmeleri listele (Yönetici)
- `GET /api/evaluations/:id` - Belirli bir değerlendirmeyi getir
- `POST /api/evaluations` - Yeni değerlendirme oluştur (Jüri Üyesi)
- `PUT /api/evaluations/:id` - Değerlendirme güncelle (Jüri Üyesi)
- `DELETE /api/evaluations/:id` - Değerlendirme sil (Jüri Üyesi)

### Raporlar
- `GET /api/reports/applications` - Başvuru raporlarını getir (Yönetici)
- `GET /api/reports/faculties` - Fakülte bazlı istatistikler (Yönetici)
- `GET /api/reports/positions` - Kadro bazlı istatistikler (Yönetici)
- `GET /api/reports/table5/:id` - Belirli bir başvuru için Tablo 5 raporu oluştur

## İş Akışı

Sistem aşağıdaki temel iş akışına sahiptir:

1. Admin, yeni bir akademik ilan ekler.
2. Yönetici, ilan için başvuru kriterlerini belirler ve KOÜ Atama Yönetmeliği'ne uygunluk sağlar.
3. Aday, ilanı görüntüler ve başvuru yapar.
4. Sistem, adayın başvuruyu tamamlayıp tamamlamadığını kontrol eder.
5. Yönetici, gerekirse ilan kriterlerinde değişiklik yapabilir.
6. Tablo 5, adayların başvurularında sistem tarafından otomatik olarak oluşturulur.
7. Başvuru süresi tamamlandığında, yönetici başvuruları görüntüler.
8. Yönetici, her başvuru için jüri üyeleri atar.
9. Jüri üyeleri, aday başvurularını değerlendirir ve raporlarını sisteme yükler.
10. Tüm jüri üyelerinin değerlendirmeleri tamamlandıktan sonra, yönetici nihai kararı verir.
11. Sonuç, adaylara bildirilir.
