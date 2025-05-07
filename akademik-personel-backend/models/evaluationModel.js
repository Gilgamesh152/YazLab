const { Schema, model } = require("mongoose");

const evaluationSchema = new Schema(
  {
    application: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    juryMember: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    recommendation: {
      type: String,
      enum: ["approve", "reject", "none"],
      default: "none",
    },
    generalComments: {
      type: String,
    },
    documentEvaluations: [
      {
        document: {
          type: Schema.Types.ObjectId,
          ref: "Document",
        },
        approved: {
          type: Boolean,
          default: false,
        },
        comments: {
          type: String,
        },
      },
    ],
    scoreEvaluations: {
      publications: {
        approved: { type: Boolean, default: false },
        comments: { type: String },
      },
      projects: {
        approved: { type: Boolean, default: false },
        comments: { type: String },
      },
      thesisSupervisions: {
        approved: { type: Boolean, default: false },
        comments: { type: String },
      },
      exhibitions: {
        approved: { type: Boolean, default: false },
        comments: { type: String },
      },
      patents: {
        approved: { type: Boolean, default: false },
        comments: { type: String },
      },
    },
    reportFile: {
      name: { type: String },
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
      path: { type: String },
      url: { type: String },
      uploadedAt: { type: Date },
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Bir başvuru için bir jüri üyesi tarafından yapılan değerlendirmeyi benzersiz yap
evaluationSchema.index({ application: 1, juryMember: 1 }, { unique: true });

module.exports = model("Evaluation", evaluationSchema);
