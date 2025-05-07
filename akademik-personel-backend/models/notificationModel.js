const { Schema, model } = require("mongoose");

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error"],
      default: "info",
    },
    relatedTo: {
      model: {
        type: String,
        enum: [
          "Announcement",
          "Application",
          "Evaluation",
          "Document",
          "Jury",
          null,
        ],
        default: null,
      },
      id: {
        type: Schema.Types.ObjectId,
        default: null,
      },
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    channel: {
      type: String,
      enum: ["system", "email", "sms", "all"],
      default: "system",
    },
    delivered: {
      system: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },
    deliveryError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Notification", notificationSchema);
