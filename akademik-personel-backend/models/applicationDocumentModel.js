const { Schema, model } = require("mongoose");

const applicationDocumentSchema = new Schema(
  {
    application: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    documentCategory: {
      type: Schema.Types.ObjectId,
      ref: "DocumentCategory",
      required: true,
    },
    document: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    scoreCategory: {
      type: String,
      required: true,
    },
    metadata: {
      authorPosition: { type: Number },
      isMainAuthor: { type: Boolean, default: false },
      isDerlemeMakale: { type: Boolean, default: false },
      isUniversityCollaboration: { type: Boolean, default: false },
      collaborationType: {
        type: String,
        enum: [
          "none",
          "domestic_university",
          "international_university",
          "industry",
        ],
      },
      publicationQuartile: {
        type: String,
        enum: ["Q1", "Q2", "Q3", "Q4", "N/A"],
      },
      numberOfAuthors: { type: Number },
      yearPublished: { type: Number },
      coAuthors: [{ type: String }],
      projectRole: {
        type: String,
        enum: ["coordinator", "researcher", "advisor", "N/A"],
      },
      projectDuration: { type: Number }, // months
      projectBudget: { type: Number },
      projectType: {
        type: String,
        enum: ["national", "international", "private", "public", "N/A"],
      },
    },
    points: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verificationDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Bir başvuruda aynı belge kategorisinin tekrarlanmasını engelle
applicationDocumentSchema.index(
  { application: 1, documentCategory: 1, document: 1 },
  { unique: true }
);

module.exports = model("ApplicationDocument", applicationDocumentSchema);
