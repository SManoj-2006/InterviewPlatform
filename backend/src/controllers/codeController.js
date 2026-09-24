import { ENV } from "../lib/env.js";

const DEFAULT_PISTON_API_URL = "https://emkc.org/api/v2/piston";

export function getExecuteUrl(baseUrl) {
  const normalized = (baseUrl || "").replace(/\/+$/, "");
  return normalized.endsWith("/execute") ? normalized : `${normalized}/execute`;
}

// Free, no-key fallback executor. Wandbox names its file prog.<ext>, so a
// `public class Main` (written for Piston's main.java) would fail to compile;
// demoting it to a package-private class keeps user code working unchanged.
const WANDBOX_COMPILERS = {
  python: { language: "Python", compiler: "cpython-3.10.15" },
  javascript: { language: "JavaScript", compiler: "nodejs-20.17.0" },
  java: { language: "Java", compiler: "openjdk-jdk-21+35" },
};

const WANDBOX_API = "https://api.wandbox.org/api/compile.json";

/**
 * Which executor handles /code/execute.
 * Explicit CODE_EXECUTOR=piston|wandbox wins; otherwise a configured
 * PISTON_API_URL means self-hosted Piston, and the free Wandbox API is the
 * default (the public Piston API is whitelist-only since Feb 2026).
 */
export function resolveExecutor() {
  const explicit = (ENV.CODE_EXECUTOR || "").toLowerCase();
  if (explicit === "piston" || explicit === "wandbox") return explicit;
  return ENV.PISTON_API_URL ? "piston" : "wandbox";
}

function toWandboxRequest({ language, files, stdin }) {
  const target = WANDBOX_COMPILERS[language];
  if (!target) {
    throw Object.assign(new Error(`Unsupported language for Wandbox: ${language}`), {
      status: 400,
    });
  }
  let code = (files || []).map((f) => f.content).join("\n");
  if (language === "java") code = code.replace(/public\s+class\s+(\w+)/, "class $1");
  return { ...target, code, stdin: stdin || "" };
}

/** Normalizes a Wandbox response into the Piston shape the frontend expects. */
export function wandboxToPistonResult(payload) {
  const stderr = [payload.compiler_error, payload.program_error].filter(Boolean).join("\n");
  const output = payload.program_output || "";
  return {
    run: {
      stdout: output,
      stderr,
      output,
      code: Number(payload.status) || 0,
      signal: payload.signal || null,
    },
  };
}

async function executeViaWandbox(body) {
  const upstreamResponse = await fetch(WANDBOX_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toWandboxRequest(body)),
    signal: AbortSignal.timeout(30000),
  });
  const payload = await upstreamResponse.json().catch(() => ({}));
  if (!upstreamResponse.ok) {
    throw Object.assign(
      new Error(payload?.message || "Wandbox execution failed"),
      { status: upstreamResponse.status, details: payload }
    );
  }
  return wandboxToPistonResult(payload);
}

export async function executeCode(req, res) {
  try {
    const { language, version, files, stdin, args } = req.body || {};

    if (!language || !version || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: "language, version, and files are required" });
    }

    if (resolveExecutor() === "wandbox") {
      const result = await executeViaWandbox({ language, files, stdin });
      return res.status(200).json(result);
    }

    const pistonApiUrl = ENV.PISTON_API_URL || DEFAULT_PISTON_API_URL;
    const token = ENV.PISTON_AUTH_TOKEN;
    const isHostedPiston = /emkc\.org/i.test(pistonApiUrl);

    if (isHostedPiston && !token) {
      return res.status(500).json({
        message:
          "Server misconfiguration: missing PISTON_AUTH_TOKEN for hosted Piston API. Configure PISTON_API_URL to local self-hosted Piston or provide a token.",
      });
    }

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers["X-API-Key"] = token;
    }

    const upstreamResponse = await fetch(getExecuteUrl(pistonApiUrl), {
      method: "POST",
      headers,
      body: JSON.stringify({ language, version, files, stdin, args }),
    });

    const responseText = await upstreamResponse.text();
    let payload;

    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { message: responseText || "Unexpected response from code runner" };
    }

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        message: payload?.message || "Code execution failed",
        details: payload,
      });
    }

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Error in executeCode controller:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
