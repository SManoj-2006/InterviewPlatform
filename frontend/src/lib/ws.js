/**
 * Builds the WebSocket URL for the Yjs collaboration endpoint from
 * VITE_API_URL, e.g. "http://localhost:3000/api" -> "ws://localhost:3000/collab".
 * The y-websocket provider appends "/<room>" itself, so this must point at the
 * /collab namespace the backend upgrade handler claims — otherwise the socket
 * is ignored and the editor never leaves "connecting".
 */
export function getCollabWsUrl() {
  // Relative "/api" resolves against the page origin, so same-origin
  // production deploys need no VITE_API_URL at build time.
  const raw = import.meta.env.VITE_API_URL || "/api";
  const url = new URL(raw, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  // strip the trailing /api and point at the /collab namespace instead
  url.pathname = url.pathname.replace(/\/api\/?$/, "/collab");
  return url.toString().replace(/\/$/, "");
}
