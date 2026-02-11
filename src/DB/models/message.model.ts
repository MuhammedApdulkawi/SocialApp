import mongoose from "mongoose";
import { IMessage } from "../../common";

const messageSchema = new mongoose.Schema<IMessage>({
  text: String,
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  attachments: [String],
}, { timestamps: true });

export const MessageModel = mongoose.model<IMessage>("Message", messageSchema);
