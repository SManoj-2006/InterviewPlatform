import { ENV } from "../lib/env.js";

const DEFAULT_PISTON_API_URL = "https://emkc.org/api/v2/piston";

export function getExecuteUrl(baseUrl) {
  const normalized = (baseUrl || "").replace(/\/+$/, "");
  return normalized.endsWith("/execute") ? normalized : `${normalized}/execute`;
}

export async function executeCode(req, res) {
  try {
    const { language, version, files, stdin, args } = req.body || {};

    if (!language || !version || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: "language, version, and files are required" });
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
