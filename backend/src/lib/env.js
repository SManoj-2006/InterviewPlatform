import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const ENV = {
  PORT: process.env.PORT || "3000",
  DB_URL: process.env.DB_URL,
  NODE_ENV: process.env.NODE_ENV || "development",
  // Render.com exposes the public URL as RENDER_EXTERNAL_URL; use it when
  // CLIENT_URL is not set explicitly so CORS works without extra config.
  CLIENT_URL:
    process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:5173",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  STREAM_API_KEY: process.env.STREAM_API_KEY,
  STREAM_API_SECRET: process.env.STREAM_API_SECRET,
  PISTON_API_URL: process.env.PISTON_API_URL,
  PISTON_AUTH_TOKEN: process.env.PISTON_AUTH_TOKEN,
  // Comma-separated Clerk user IDs allowed to skip Stream/Clerk in local dev.
  // Leave empty in production.
  DEV_BYPASS_USER_IDS: process.env.DEV_BYPASS_USER_IDS || "",
};

/**
 * Fails fast with a clear message when required configuration is missing,
 * instead of crashing later with a cryptic error.
 * Pass `{ strict: false }` in tests to only warn.
 */
const REQUIRED_VARS = ["DB_URL", "CLERK_SECRET_KEY", "STREAM_API_KEY", "STREAM_API_SECRET"];

export function validateEnv({ strict = true } = {}) {
  const missing = REQUIRED_VARS.filter((key) => !ENV[key]);

  if (missing.length === 0) return [];

  const message =
    `Missing required environment variables: ${missing.join(", ")}. ` +
    `Copy backend/.env.example to backend/.env and fill them in.`;

  if (strict) throw new Error(message);
  console.warn(`[env] WARNING: ${message}`);
  return missing;
}
