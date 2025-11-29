import WebSocket, { WebSocketServer } from "ws";
import http from "http";

let wss: WebSocketServer | null = null;

export function attachWebsocketServer(server: http.Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket) => {
	console.log(`Received a new connection.`);
    socket.on("message", (msg) => {
      try {
        socket.send(JSON.stringify({ type: "echo", payload: msg.toString() }));
      } catch (e) {
        // ignore
      }
    });
  });

  return wss;
}

export function broadcast(message: any) {
  if (!wss) return;
  const payload =
    typeof message === "string" ? message : JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
