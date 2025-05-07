const { Schema, model } = require("mongoose");

const departmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    chair: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Fakülte ve bölüm adına göre benzersiz kombinasyon oluştur
departmentSchema.index({ name: 1, faculty: 1 }, { unique: true });
departmentSchema.index({ code: 1, faculty: 1 }, { unique: true });

module.exports = model("Department", departmentSchema);
