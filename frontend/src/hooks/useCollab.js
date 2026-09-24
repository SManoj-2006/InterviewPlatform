import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getCollabWsUrl } from "../lib/ws";

const AWARENESS_COLORS = [
  "#f44336", "#9c27b0", "#3f51b5", "#03a9f4",
  "#009688", "#8bc34a", "#ff9800", "#795548",
];

function pickColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return AWARENESS_COLORS[hash % AWARENESS_COLORS.length];
}

/**
 * Real-time collaborative editing for a session via Yjs (CRDT).
 *
 * Returns { yText, awareness, status, isLive } where status is one of
 * "idle" | "connecting" | "synced" | "error".
 *
 * The backend verifies the Clerk JWT and session membership on the
 * WebSocket upgrade, so only the host/participant can join the document.
 * If the socket can never sync (offline, misconfigured), callers should
 * fall back to the legacy manual-refresh editing mode.
 */
export function useCollab(sessionId, { enabled = true } = {}) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [status, setStatus] = useState("idle");
  const [doc, setDoc] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    let cancelled = false;
    const ydoc = new Y.Doc();
    setDoc(ydoc);
    setStatus("connecting");

    (async () => {
      try {
        const token = await getToken();
        if (cancelled || !token) {
          if (!cancelled) setStatus("error");
          return;
        }

        const wsProvider = new WebsocketProvider(getCollabWsUrl(), sessionId, ydoc, {
          params: { sessionId, token },
        });

        wsProvider.awareness.setLocalStateField("user", {
          name: user?.fullName || user?.username || "Anonymous",
          color: pickColor(user?.id || "anon"),
        });

        wsProvider.on("sync", (isSynced) => {
          if (!cancelled) setStatus(isSynced ? "synced" : "connecting");
        });

        if (!cancelled) setProvider(wsProvider);
      } catch (err) {
        console.error("[collab] failed to connect", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      setProvider((prev) => {
        prev?.destroy();
        return null;
      });
      setDoc((prev) => {
        prev?.destroy();
        return null;
      });
      setStatus("idle");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, enabled]);

  return {
    yText: doc ? doc.getText("code") : null,
    awareness: provider ? provider.awareness : null,
    status,
    isLive: status === "synced",
  };
}
