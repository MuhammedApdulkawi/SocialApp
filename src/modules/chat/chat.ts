import { Socket } from "socket.io";
import { chatEvents } from "./chat.events";

export const chatInitializer = (socket: Socket) => {
  const chatEventsInstance = new chatEvents(socket);
  chatEventsInstance.sendPrivateMessageEvent();
  chatEventsInstance.getConversationMessagesEvent();
  chatEventsInstance.sendGroupMessageEvent();
  chatEventsInstance.getGroupHistoryEvent();
};
