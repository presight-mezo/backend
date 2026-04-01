import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import type { Server } from "http";

// groupId → Set of connected sockets
const rooms = new Map<string, Set<WebSocket>>();

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const groupId = url.searchParams.get("groupId") ?? "";

    if (groupId) {
      if (!rooms.has(groupId)) rooms.set(groupId, new Set());
      rooms.get(groupId)!.add(ws);
    }

    ws.on("close", () => {
      if (groupId) rooms.get(groupId)?.delete(ws);
    });

    ws.send(JSON.stringify({ event: "connected", payload: { groupId } }));
  });

  return wss;
}

export function broadcast(groupId: string, event: string, payload: object) {
  const room = rooms.get(groupId);
  if (!room) return;
  const message = JSON.stringify({ event, payload, timestamp: Date.now() });
  for (const client of room) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
