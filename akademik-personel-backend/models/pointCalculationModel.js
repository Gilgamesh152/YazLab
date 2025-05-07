const { Schema, model } = require("mongoose");

const pointCalculationSchema = new Schema(
  {
    application: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    calculatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["draft", "final"],
      default: "draft",
    },
    table5: {
      // Temel adayın bilgileri
      applicantInfo: {
        fullName: { type: String, required: true },
        position: { type: String, required: true },
        faculty: { type: String, required: true },
        department: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
      // Puanlanan Faaliyet Dönemi
      scoredPeriod: {
        type: String,
        enum: [
          "Profesör (Doçent ünvanını aldıktan sonraki faaliyetleri)",
          "Doçent (Doktora / Sanatta yeterlik/ tıp/diş uzmanlık ünvanını aldıktan sonraki faaliyetleri)",
          "Dr. Öğretim Üyesi (Yeniden Atama: Son atama tarihinden başvuru tarihine kadar)",
          "Dr. Öğretim Üyesi (İlk Atama)",
        ],
        required: true,
      },
      // Her bölüm için puanlar
      sections: {
        a: [
          {
            subCategory: { type: String, required: true },
            details: { type: String, required: true },
            score: { type: Number, required: true },
          },
        ],
        b: [
          {
            subCategory: { type: String, required: true },
            details: { type: String, required: true },
            score: { type: Number, required: true },
          },
        ],
        c: [
          {
            subCategory: { type: String, required: true },
            details: { type: String, required: true },
            score: { type: Number, required: true },
          },
        ],
        d: [
          {
            subCategory: { type: String, required: true },
            details: { type: String, required: true },
            score: { type: Number, required: true },
          },
        ],
        e: [
          {
            subCategory: { type: String, required: true },
            details: { type: String, required: true },
            score: { type: Number, required: true },
          },
        ],
        f: [
          {
            subCategory: { type: String, required: true },
            details: { type: String, required: true },
            score: { type: Number, required: true },
          },
        ],
        g: [
          {
            subCategory: { type: String, required: true },
            details: { type: String, required: true },
            score: { type: Number, required: true },
          },
        ],
        h: [
          {
            subCategory: { type: String, required: true },
            details: { type: String, required: true },
            score: { type: Number, required: true },
          },
        ],
        i: [
          {
            subCategory: { type: String, required: true },
            details: { type: String, required: true },
            score: { type: Number, required: true },
          },
        ],
        j: [
          {
            subCategory: { type: String, required: true },
            details: { type: String, required: true },
            score: { type: Number, required: true },
          },
        ],
        k: [
          {
            subCategory: { type: String, required: true },
            details: { type: String, required: true },
            score: { type: Number, required: true },
          },
        ],
        l: [
          {
            subCategory: { type: String, required: true },
            details: { type: String, required: true },
            score: { type: Number, required: true },
          },
        ],
      },
      // Seksiyon Toplamları
      sectionTotals: {
        a: { type: Number, default: 0 },
        b: { type: Number, default: 0 },
        c: { type: Number, default: 0 },
        d: { type: Number, default: 0 },
        e: { type: Number, default: 0 },
        f: { type: Number, default: 0 },
        g: { type: Number, default: 0 },
        h: { type: Number, default: 0 },
        i: { type: Number, default: 0 },
        j: { type: Number, default: 0 },
        k: { type: Number, default: 0 },
        l: { type: Number, default: 0 },
      },
      // Alt kategori toplamları
      subcategoryTotals: {
        a1a2: { type: Number, default: 0 },
        a1a4: { type: Number, default: 0 },
        a1a5: { type: Number, default: 0 },
        a1a6: { type: Number, default: 0 },
        a1a8: { type: Number, default: 0 },
      },
      // Diğer sayımlar
      counts: {
        mainAuthorCount: { type: Number, default: 0 },
        totalPublications: { type: Number, default: 0 },
        personalExhibitions: { type: Number, default: 0 },
        groupExhibitions: { type: Number, default: 0 },
        f1Count: { type: Number, default: 0 }, // Doktora
        f2Count: { type: Number, default: 0 }, // Yüksek Lisans
        h1to12Count: { type: Number, default: 0 }, // H1-12 kategorisindeki projeler
        h13to17Count: { type: Number, default: 0 }, // H13-17 kategorisindeki projeler
        h13to22Count: { type: Number, default: 0 }, // H13-22 kategorisindeki projeler
      },
      // Toplam puanlar
      totalScore: { type: Number, default: 0 },
      // Minimum kriterlerini karşılama durumu
      meetsRequirements: { type: Boolean, default: false },
      // Aday notları
      notes: { type: String },
    },
    // Hesaplama tarihçesi
    history: [
      {
        action: { type: String, required: true },
        performedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        changes: { type: Object },
        note: { type: String },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Bir başvuru için bir puan hesaplaması olacak şekilde index
pointCalculationSchema.index({ application: 1 }, { unique: true });

module.exports = model("PointCalculation", pointCalculationSchema);
