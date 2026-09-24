import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeOutput, outputsMatch } from "../src/lib/judge.js";

describe("normalizeOutput", () => {
  it("trims leading/trailing whitespace and blank lines", () => {
    assert.equal(normalizeOutput("\n  hello\n\n"), "hello");
  });

  it("handles CRLF line endings", () => {
    assert.equal(normalizeOutput("a\r\nb\r\n"), "a\nb");
  });

  it("ignores spacing inside brackets and around commas", () => {
    assert.equal(normalizeOutput("[ 1,  2 ,3 ]"), "[1,2,3]");
  });

  it("collapses repeated inner whitespace", () => {
    assert.equal(normalizeOutput("a   b\tc"), "a b c");
  });

  it("is null-safe", () => {
    assert.equal(normalizeOutput(null), "");
    assert.equal(normalizeOutput(undefined), "");
  });

  it("coerces non-strings", () => {
    assert.equal(normalizeOutput(42), "42");
  });
});

describe("outputsMatch", () => {
  it("matches equivalent outputs despite formatting noise", () => {
    assert.ok(outputsMatch("[1, 2, 3]\n", "[ 1,2,3 ]\r\n"));
  });

  it("rejects genuinely different outputs", () => {
    assert.ok(!outputsMatch("[1, 2, 4]", "[1, 2, 3]"));
    assert.ok(!outputsMatch("hello", "world"));
  });
});
