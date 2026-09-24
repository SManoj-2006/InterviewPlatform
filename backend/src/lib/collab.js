import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";
import { verifyToken } from "@clerk/express";
import Session from "../models/Session.js";
import { ENV } from "./env.js";

/**
 * Real-time collaborative editing over Yjs (CRDT).
 *
 * Clients (y-websocket WebsocketProvider) open a WebSocket to
 * /collab/<sessionId>?sessionId=<id>&token=<clerk-jwt>.
 * The token is verified with Clerk and the user must be the host or the
 * participant of an *active* session before the socket is accepted.
 * Each session gets its own Yjs document, keyed by the session id.
 *
 * Persistence to MongoDB is handled client-side: the frontend debounces
 * Y.Text updates and PATCHes /api/sessions/:id/code, so a dropped socket
 * never loses work.
 */
export function attachCollabServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    handleUpgrade(req, socket, head, wss).catch((error) => {
      console.error("[collab] upgrade failed:", error?.message || error);
      try {
        socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      } finally {
        socket.destroy();
      }
    });
  });

  return wss;
}

async function handleUpgrade(req, socket, head, wss) {
  const url = new URL(req.url, "http://localhost");

  // Not our endpoint — leave the socket alone for other handlers.
  if (!url.pathname.startsWith("/collab")) return;

  const sessionId = url.searchParams.get("sessionId");
  const token = url.searchParams.get("token");

  if (!sessionId || !token) {
    throw new Error("Missing sessionId or token");
  }

  // 1. Verify the Clerk session token.
  const claims = await verifyToken(token, {
    secretKey: ENV.CLERK_SECRET_KEY,
  });
  const clerkUserId = claims.sub;
  if (!clerkUserId) throw new Error("Invalid token");

  // 2. The user must belong to an active session.
  const session = await Session.findById(sessionId).populate("host participant", "clerkId");
  if (!session || session.status !== "active") {
    throw new Error("Session not found or not active");
  }
  const isMember =
    session.host?.clerkId === clerkUserId || session.participant?.clerkId === clerkUserId;
  if (!isMember) {
    throw new Error("User is not a member of this session");
  }

  // 3. Hand the socket to y-websocket. docName isolates one Yjs doc per session.
  wss.handleUpgrade(req, socket, head, (ws) => {
    setupWSConnection(ws, req, { docName: `devintervue-${sessionId}`, gc: true });
  });
}
