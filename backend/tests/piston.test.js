import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getExecuteUrl,
  resolveExecutor,
  wandboxToPistonResult,
} from "../src/controllers/codeController.js";
import { ENV } from "../src/lib/env.js";

describe("getExecuteUrl", () => {
  it("appends /execute when missing", () => {
    assert.equal(getExecuteUrl("http://localhost:2000/api/v2"), "http://localhost:2000/api/v2/execute");
  });

  it("keeps the URL when /execute is already present", () => {
    assert.equal(
      getExecuteUrl("https://emkc.org/api/v2/piston/execute"),
      "https://emkc.org/api/v2/piston/execute"
    );
  });

  it("strips trailing slashes first", () => {
    assert.equal(getExecuteUrl("http://localhost:2000/api/v2///"), "http://localhost:2000/api/v2/execute");
  });
});

describe("resolveExecutor", () => {
  const saved = { CODE_EXECUTOR: ENV.CODE_EXECUTOR, PISTON_API_URL: ENV.PISTON_API_URL };

  it("honours an explicit CODE_EXECUTOR=piston", () => {
    ENV.CODE_EXECUTOR = "piston";
    ENV.PISTON_API_URL = "";
    assert.equal(resolveExecutor(), "piston");
  });

  it("honours an explicit CODE_EXECUTOR=wandbox", () => {
    ENV.CODE_EXECUTOR = "wandbox";
    ENV.PISTON_API_URL = "http://localhost:2000/api/v2";
    assert.equal(resolveExecutor(), "wandbox");
  });

  it("prefers self-hosted Piston when PISTON_API_URL is set", () => {
    ENV.CODE_EXECUTOR = "";
    ENV.PISTON_API_URL = "http://localhost:2000/api/v2";
    assert.equal(resolveExecutor(), "piston");
  });

  it("falls back to free Wandbox when nothing is configured", () => {
    ENV.CODE_EXECUTOR = "";
    ENV.PISTON_API_URL = "";
    assert.equal(resolveExecutor(), "wandbox");
  });

  it("restores env", () => {
    ENV.CODE_EXECUTOR = saved.CODE_EXECUTOR;
    ENV.PISTON_API_URL = saved.PISTON_API_URL;
  });
});

describe("wandboxToPistonResult", () => {
  it("maps program output and errors into the Piston shape", () => {
    const result = wandboxToPistonResult({
      status: "0",
      program_output: "42\n",
      program_error: "",
      compiler_error: "",
    });
    assert.equal(result.run.output, "42\n");
    assert.equal(result.run.stdout, "42\n");
    assert.equal(result.run.stderr, "");
    assert.equal(result.run.code, 0);
  });

  it("merges compiler and runtime errors into stderr", () => {
    const result = wandboxToPistonResult({
      status: "1",
      program_output: "",
      program_error: "Traceback: ZeroDivisionError",
      compiler_error: "",
    });
    assert.match(result.run.stderr, /ZeroDivisionError/);
  });

  it("surfaces compiler errors", () => {
    const result = wandboxToPistonResult({
      status: "1",
      program_output: "",
      compiler_error: "prog.java:1: error",
    });
    assert.match(result.run.stderr, /prog\.java/);
  });
});
