import rateLimit from "express-rate-limit";

/**
 * Stricter limiter for the code-execution proxy.
 * Each execution fans out to a Piston container, so this endpoint is the
 * most expensive (and most abusable) one in the API.
 */
export const codeExecutionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // 30 executions per IP per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many code executions. Please wait a few minutes and try again.",
  },
});

/**
 * General API limiter applied to every /api route.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
});
