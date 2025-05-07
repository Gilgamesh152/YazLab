const { Schema, model } = require("mongoose");

const criteriaSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    academicArea: {
      type: String,
      required: true,
      enum: [
        "Sağlık Bilimleri",
        "Fen Bilimleri ve Matematik",
        "Mühendislik",
        "Ziraat, Orman ve Su Ürünleri",
        "Eğitim Bilimleri",
        "Filoloji",
        "Mimarlık, Planlama ve Tasarım",
        "Sosyal, Beşeri ve İdari Bilimler",
        "Spor Bilimleri",
        "Hukuk",
        "İlahiyat",
        "Güzel Sanatlar",
      ],
    },
    position: {
      type: Schema.Types.ObjectId,
      ref: "Position",
      required: true,
    },
    requirements: {
      minimumPublications: {
        total: { type: Number, required: true },
        a1a2: { type: Number, default: 0 },
        a1a4: { type: Number, default: 0 },
        a1a5: { type: Number, default: 0 },
        a1a6: { type: Number, default: 0 },
        a1a8: { type: Number, default: 0 },
        mainAuthor: { type: Number, default: 0 },
      },
      minimumPoints: {
        a1a4: { type: Number, default: 0 },
        a1a5: { type: Number, default: 0 },
        a1a6: { type: Number, default: 0 },
        a1a8: { type: Number, default: 0 },
        total: { type: Number, required: true },
      },
      personalExhibitions: { type: Number, default: 0 },
      groupExhibitions: { type: Number, default: 0 },
      completedThesis: {
        doctoralSupervision: { type: Number, default: 0 },
        mastersSupervision: { type: Number, default: 0 },
      },
      projects: {
        h1h12: { type: Number, default: 0 }, // Proje sayısı
        h13h17: { type: Number, default: 0 }, // Proje sayısı
        h13h22: { type: Number, default: 0 }, // Proje sayısı
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Akademik alan ve kadro için benzersiz kriter oluştur
criteriaSchema.index({ academicArea: 1, position: 1 }, { unique: true });

module.exports = model("Criteria", criteriaSchema);
