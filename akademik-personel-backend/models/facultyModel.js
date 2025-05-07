const { Schema, model } = require("mongoose");

const facultySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
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
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model("Faculty", facultySchema);
