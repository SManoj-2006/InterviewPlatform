import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateEnv } from "../src/lib/env.js";

describe("validateEnv", () => {
  it("returns a list of missing variables without throwing in non-strict mode", () => {
    const missing = validateEnv({ strict: false });
    assert.ok(Array.isArray(missing));
    // In CI/test envs Clerk/Stream keys are typically absent.
    for (const key of missing) {
      assert.match(key, /^[A-Z_]+$/);
    }
  });

  it("throws in strict mode when required vars are missing", () => {
    const hadDb = !!process.env.DB_URL;
    const hadClerk = !!process.env.CLERK_SECRET_KEY;
    if (!hadDb || !hadClerk) {
      assert.throws(() => validateEnv({ strict: true }), /Missing required environment variables/);
    }
  });
});
