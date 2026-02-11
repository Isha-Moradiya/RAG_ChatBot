import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true,
    },
    role: { type: String, enum: ["user", "model"], required: true },
    text: { type: String, required: true },
    attachments: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        size: { type: Number, default: 0 },
        type: { type: String, default: "application/octet-stream" },
        url: { type: String, default: "" },
        isImage: { type: Boolean, default: false },
      },
    ],
    contextType: {
      type: String,
      enum: ["document", "image", "both"],
      default: "document",
    },
    documentContext: {
      documentsUsed: [
        {
          fileName: String,
          documentId: String,
          chunkIndex: Number,
        },
      ],
      contextProvided: Boolean,
    },
    documentsReferenced: Boolean,
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Useful indexes
chatMessageSchema.index({ userId: 1, sessionId: 1, timestamp: 1 });
chatMessageSchema.index({ sessionId: 1, timestamp: 1 });
chatMessageSchema.index({ userId: 1, timestamp: -1 });
chatMessageSchema.index({ text: "text" });

export default mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);
