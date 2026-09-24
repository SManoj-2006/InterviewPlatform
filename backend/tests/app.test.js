import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

// Importing the server module must not open ports, connect to MongoDB,
// or require env vars — it only wires the Express app. startServer() is
// reserved for direct execution (`node src/server.js`).
// This test also catches broken import chains (e.g. wrong filename casing).
import { app, httpServer } from "../src/server.js";

describe("server module", () => {
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => httpServer.listen(0, resolve));
    const { port } = httpServer.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise((resolve) => httpServer.close(resolve));
  });

  it("exposes the express app", () => {
    assert.ok(app, "app should be exported");
    assert.equal(typeof app.get, "function");
  });

  it("responds on /health without auth or database", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.msg, "api is up and running");
  });

  it("rejects unauthenticated API access", async () => {
    const res = await fetch(`${baseUrl}/api/sessions/active`);
    // 401 with Clerk configured; 500 when Clerk keys are missing (misconfiguration).
    // Either way, the route must not be reachable without auth.
    assert.ok(res.status === 401 || res.status === 500, `unexpected status ${res.status}`);
    assert.match(res.headers.get("content-type") || "", /json/);
  });
});
