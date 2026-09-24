import express from "express";
import http from "http";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import { pathToFileURL } from "url";

import { ENV, validateEnv } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";
import { attachCollabServer } from "./lib/collab.js";
import { apiLimiter } from "./middleware/rateLimit.js";

import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";
import codeRoutes from "./routes/codeRoutes.js";

const app = express();

const __dirname = path.resolve();

// middleware
app.use(express.json());
// credentials:true => server allows a browser to include cookies on request
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ENV.CLIENT_URL,
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  })
);

// Public health check, registered BEFORE the auth middleware so it stays
// reachable without auth configuration (load balancers, docker HEALTHCHECK).
app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

app.use(clerkMiddleware()); // adds req.auth() to the request object

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api", apiLimiter);
app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/code", codeRoutes);

// make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// JSON error handler: API consumers get structured errors, never HTML pages.
app.use((err, req, res, _next) => {
  const status = err?.status || err?.statusCode || 500;
  if (ENV.NODE_ENV !== "production") console.error("[api] error:", err?.message || err);
  res.status(status).json({
    message: status === 500 ? "Internal Server Error" : err.message || "Request failed",
  });
});

// HTTP server is created explicitly (instead of app.listen) so the Yjs
// collaboration WebSocket endpoint can share the same port.
const httpServer = http.createServer(app);
attachCollabServer(httpServer);

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();
    httpServer.listen(ENV.PORT, () => console.log("Server is running on port:", ENV.PORT));
  } catch (error) {
    console.error("💥 Error starting the server", error);
    process.exit(1);
  }
};

// Only auto-start when executed directly (`node src/server.js`).
// Importing this module (e.g. in tests) gives you { app, httpServer, startServer }
// without opening ports or touching the database.
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  startServer();
}

export { app, httpServer, startServer };
