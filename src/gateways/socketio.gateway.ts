import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";

import { verifyToken } from "../utils";
import { chatInitializer } from "../modules/chat/chat";

export const connectedSockets = new Map<string, string[]>();
let io: Server | null = null;

function socketAuthentication(socket: Socket, next: Function) {
  const token = socket.handshake.auth.authorization;
  const decodedToken = verifyToken(
    token,
    process.env.JWT_ACCESS_SECRET as string,
  );
  socket.data = { _id: decodedToken._id };
  const userTabs = connectedSockets.get(socket.data._id);

  if (!userTabs) {
    connectedSockets.set(socket.data._id, [socket.id]);
  } else userTabs.push(socket.id);

  socket.emit("connected", {
    user: {
      _id: socket.data._id,
      firstName: decodedToken.firstName,
      lastName: decodedToken.lastName,
    },
  });
  next();
}

function socketDisconnection(socket: Socket) {
  socket.on("disconnect", () => {
    const userId = socket.data._id;
    let userTabs = connectedSockets.get(userId);

    if (userTabs && userTabs.length > 0) {
      userTabs = userTabs.filter((tabId) => tabId !== socket.id);
      if (!userTabs.length) {
        connectedSockets.delete(userId);
      } else {
        connectedSockets.set(userId, userTabs);
      }
    }

    socket.broadcast.emit("userDisconnected", {
      _id: userId,
      socketId: socket.id,
    });
  });
}

export const ioInitializer = (httpServer: HttpServer) => {
  const frontendUrl = process.env.FRONTEND_URL?.trim() || "http://localhost:5173";
  const allowedOrigins = [frontendUrl, "http://localhost:5173", "http://127.0.0.1:5173"];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use(socketAuthentication);

  io.on("connection", (socket: Socket) => {
    chatInitializer(socket);
    socketDisconnection(socket);
  });
};

export const getIo = () => {
  try {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
  } catch (error) {
    throw error;
  }
};
