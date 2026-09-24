import { StreamChat } from "stream-chat";
import { StreamClient } from "@stream-io/node-sdk";
import { ENV } from "./env.js";

/**
 * Stream clients are created lazily (on first use) instead of at import time.
 * Rationale: constructing them at module load crashes the entire process with
 * a cryptic `secretOrPrivateKey must have a value` error when the env vars are
 * missing. Lazy init means:
 *  - `node src/server.js` fails fast via validateEnv() with a clear message, and
 *  - importing modules (e.g. in tests) never touches the network or secrets.
 */
let _chatClient = null;
let _streamClient = null;

function assertConfigured() {
  if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
    throw new Error(
      "Stream is not configured: set STREAM_API_KEY and STREAM_API_SECRET in backend/.env"
    );
  }
}

export function getChatClient() {
  if (!_chatClient) {
    assertConfigured();
    _chatClient = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);
  }
  return _chatClient;
}

export function getStreamClient() {
  if (!_streamClient) {
    assertConfigured();
    _streamClient = new StreamClient(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET, { timeout: 15000 });
  }
  return _streamClient;
}

export const upsertStreamUser = async (userData) => {
  try {
    await getChatClient().upsertUser(userData);
    console.log("Stream user upserted successfully:", userData);
  } catch (error) {
    console.error("Error upserting Stream user:", error);
  }
};

export const deleteStreamUser = async (userId) => {
  try {
    await getChatClient().deleteUser(userId);
    console.log("Stream user deleted successfully:", userId);
  } catch (error) {
    console.error("Error deleting the Stream user:", error);
  }
};
