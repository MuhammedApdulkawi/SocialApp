import { Socket } from "socket.io";
import { getIo } from "../../../gateways/socketio.gateway";

import {
  ConversationRepository,
  MessageRepository,
} from "../../../DB/repository";
import { CONVERSATION_TYPE } from "../../../common";
import { BadRequestError } from "../../../utils";

export class ChatService {
  
  private conversationRepo: ConversationRepository =
    new ConversationRepository();
  private messageRepo: MessageRepository = new MessageRepository();
  
  async joinPrivateConversation(socket: Socket, targetUserId: string) {
    // Check if a private conversation already exists between the two users
    let conversation = await this.conversationRepo.findOneDocument({
      type: CONVERSATION_TYPE.PRIVATE,
      members: { $all: [socket.data._id, targetUserId] },
    });
    // If not, create a new private conversation
    if (!conversation) {
      conversation = await this.conversationRepo.createNewDocument({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [socket.data._id, targetUserId],
      });
    }
    // Join the Socket.IO room for this conversation
    socket.join(conversation._id.toString());
    return conversation;
  }

  async sendPrivateMessage(socket: Socket, data: unknown) {
    // Extract text and targetUserId from the data object
    const { text, targetUserId } = data as {
      targetUserId: string;
      text: string;
    };
    // Join the private conversation (or create it if it doesn't exist)
    const conversation = await this.joinPrivateConversation(
      socket,
      targetUserId,
    );
    // Create a new message document in the database
    const newMessage = await this.messageRepo.createNewDocument({
      text,
      conversationId: conversation._id,
      senderId: socket.data._id,
    });
    // Emit the new message to all clients in the conversation room
    getIo().to(conversation._id.toString()).emit("message-sent", newMessage);
  }

  async getConversationMessages(socket: Socket, targetUserId: string) {
    // Join the private conversation (or create it if it doesn't exist)
    const conversation = await this.joinPrivateConversation(
      socket,
      targetUserId,
    );
    // Retrieve all messages for this conversation from the database
    const messages = await this.messageRepo.findAllDocuments({
      conversationId: conversation._id,
    });
    // Emit the messages to the client that requested the conversation history
    socket.emit("chat-history", messages);
  }

  async joinGroupChat(socket: Socket, targetGroupId: string) {
    // Check if the conversation exists and is of type GROUP
    let conversation = await this.conversationRepo.findOneDocument({
      _id: targetGroupId,
      type: CONVERSATION_TYPE.GROUP,
    });
    // If the conversation doesn't exist or is not a group chat, throw an error
    if (!conversation) throw new BadRequestError("Invalid Group ID");
    // join the Socket.IO room for this conversation
    socket.join(conversation._id.toString());
    return conversation;
  }

  async sendGroupMessage(socket: Socket, data: unknown) {
    // Extract text and targetGroupId from the data object
    const { text, targetGroupId } = data as {
      targetGroupId: string;
      text: string;
    };
    // Join the group chat (or throw an error if it doesn't exist)
    const conversation = await this.joinGroupChat(socket, targetGroupId);
    // Create a new message document in the database
    const newMessage = await this.messageRepo.createNewDocument({
      text,
      conversationId: conversation._id,
      senderId: socket.data._id,
    });
    // Emit the new message to all clients in the conversation room
    getIo().to(conversation._id.toString()).emit("message-sent", newMessage);
  }

  async getGroupHistory(socket: Socket, targetGroupId: string) {
    const messages = await this.messageRepo.findAllDocuments({
      conversationId: targetGroupId,
    });
    socket.emit("group-chat-history", messages);
  }
}
