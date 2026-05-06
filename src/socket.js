import { io } from "socket.io-client";
import { api } from "./api.js";

let socket = null;

export function getSocket() {
  if (socket && socket.connected) return socket;
  const token = api.getToken();
  if (!token) return null;
  if (socket) socket.disconnect();
  socket = io(api.baseUrl, { auth: { token }, autoConnect: true });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
