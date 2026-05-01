// Helper functions to emit socket events

// Get the socket instance from global
const getSocket = () => {
  const globalForSocket = globalThis as any;
  return globalForSocket.socketInstance;
};

// Emit join chat event when user opens a chat
export const emitJoinChat = (chatId: string) => {
  const socket = getSocket();
  if (socket?.connected) {
    // console.log("📤 Emitting joinChat event for:", chatId);
    socket.emit("joinChat", chatId);
  }
};

// Emit typing event when user starts typing
export const emitTyping = (chatId: string) => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit("typing", chatId);
  }
};

// Emit stop typing event when user stops typing
export const emitStopTyping = (chatId: string) => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit("stopTyping", chatId);
  }
};
