const { Schema, model } = require("mongoose");

const jurySchema = new Schema(
  {
    announcement: {
      type: Schema.Types.ObjectId,
      ref: "Announcement",
      required: true,
    },
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["invited", "accepted", "declined", "removed"],
          default: "invited",
        },
        invitedAt: {
          type: Date,
          default: Date.now,
        },
        respondedAt: {
          type: Date,
        },
      },
    ],
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// İlan başına bir jüri oluştur
jurySchema.index({ announcement: 1 }, { unique: true });

module.exports = model("Jury", jurySchema);
