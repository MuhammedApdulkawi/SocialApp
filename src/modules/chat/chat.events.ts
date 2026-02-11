import { Socket } from "socket.io";
import { ChatService } from "./service/chat.service";

export class chatEvents {
  private chatService: ChatService = new ChatService();

  constructor(private socket: Socket) {}

  sendPrivateMessageEvent() {
    this.socket.on("send-private-message", async (data: unknown) => {
      await this.chatService.sendPrivateMessage(this.socket, data);
    });
  }
  getConversationMessagesEvent() {
    this.socket.on("get-chat-history", async (data) => {
      await this.chatService.getConversationMessages(this.socket, data);
    });
  }
  sendGroupMessageEvent() {
    this.socket.on("send-group-message", async (data: unknown) => {
      await this.chatService.sendGroupMessage(this.socket, data);
    });
  }
  getGroupHistoryEvent() {
    this.socket.on("get-group-chat", async (data) => {
      await this.chatService.getGroupHistory(this.socket, data);
    });
  }
}
