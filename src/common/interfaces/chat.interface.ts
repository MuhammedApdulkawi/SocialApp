import { Document, Types } from "mongoose";

export interface IConversation extends Document <Types.ObjectId> {
  type: string;
  name?: string;
  members: Types.ObjectId[];
}

export interface IMessage extends Document <Types.ObjectId> {
  text: string;
  senderId: Types.ObjectId;
  conversationId: Types.ObjectId;
  attachments?: string[];
}