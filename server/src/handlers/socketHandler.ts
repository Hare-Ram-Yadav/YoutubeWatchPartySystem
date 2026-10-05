import { Server } from 'socket.io';
import { MessageHandler } from './MessageHandler.js';

export function setupSocketHandlers(io: Server) {
  const messageHandler = new MessageHandler(io);
  io.on('connection', (socket) => {
    messageHandler.registerSocketEvents(socket);
  });
}
