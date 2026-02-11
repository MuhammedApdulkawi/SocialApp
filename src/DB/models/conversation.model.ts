import mongoose from "mongoose";
import { CONVERSATION_TYPE, IConversation } from "../../common";

const conversationSchema = new mongoose.Schema<IConversation>({
  type: {
    type: String,
    enum: Object.values(CONVERSATION_TYPE),
    default: CONVERSATION_TYPE.PRIVATE,
    required: true,
  },
  name: String,
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
}, { timestamps: true });

export const ConversationModel = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema,
);
