const { Schema, model } = require("mongoose");

const applicationSchema = new Schema(
  {
    announcement: {
      type: Schema.Types.ObjectId,
      ref: "Announcement",
      required: true,
    },
    applicant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "cancelled",
      ],
      default: "draft",
    },
    documents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    evaluations: [
      {
        type: Schema.Types.ObjectId,
        ref: "Evaluation",
      },
    ],
    points: {
      calculated: {
        type: Boolean,
        default: false,
      },
      table5: {
        type: Schema.Types.ObjectId,
        ref: "PointCalculation",
      },
      totalPoints: {
        type: Number,
        default: 0,
      },
      categoryPoints: {
        a1a2: { type: Number, default: 0 },
        a1a4: { type: Number, default: 0 },
        a1a5: { type: Number, default: 0 },
        a1a6: { type: Number, default: 0 },
        a1a8: { type: Number, default: 0 },
        section_a: { type: Number, default: 0 },
        section_b: { type: Number, default: 0 },
        section_c: { type: Number, default: 0 },
        section_d: { type: Number, default: 0 },
        section_e: { type: Number, default: 0 },
        section_f: { type: Number, default: 0 },
        section_g: { type: Number, default: 0 },
        section_h: { type: Number, default: 0 },
        section_i: { type: Number, default: 0 },
        section_j: { type: Number, default: 0 },
        section_k: { type: Number, default: 0 },
        section_l: { type: Number, default: 0 },
      },
    },
    counts: {
      publications: {
        total: { type: Number, default: 0 },
        a1a2: { type: Number, default: 0 },
        a1a4: { type: Number, default: 0 },
        a1a5: { type: Number, default: 0 },
        a1a6: { type: Number, default: 0 },
        a1a8: { type: Number, default: 0 },
        mainAuthor: { type: Number, default: 0 },
      },
      personalExhibitions: { type: Number, default: 0 },
      groupExhibitions: { type: Number, default: 0 },
      completedThesis: {
        doctoralSupervision: { type: Number, default: 0 },
        mastersSupervision: { type: Number, default: 0 },
      },
      projects: {
        h1h12: { type: Number, default: 0 },
        h13h17: { type: Number, default: 0 },
        h13h22: { type: Number, default: 0 },
      },
    },
    meetsRequirements: {
      type: Boolean,
      default: false,
    },
    finalDecision: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      reason: {
        type: String,
      },
      decidedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      decisionDate: {
        type: Date,
      },
    },
    notes: {
      type: String,
    },
    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Bir kullanıcının aynı ilana birden fazla başvurmasını engelle
applicationSchema.index({ announcement: 1, applicant: 1 }, { unique: true });

module.exports = model("Application", applicationSchema);
