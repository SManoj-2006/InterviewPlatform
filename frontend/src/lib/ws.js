/**
 * Builds the WebSocket URL for the Yjs collaboration endpoint from
 * VITE_API_URL, e.g. "http://localhost:3000/api" -> "ws://localhost:3000".
 */
export function getCollabWsUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const url = new URL(apiUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  // strip the trailing /api so we hit the server root, where /collab lives
  url.pathname = url.pathname.replace(/\/api\/?$/, "");
  return url.toString().replace(/\/$/, "");
}
