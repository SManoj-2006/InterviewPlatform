import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeOutput, outputsMatch } from "../src/lib/judge.js";

describe("normalizeOutput", () => {
  it("trims surrounding whitespace", () => {
    assert.equal(normalizeOutput("  hello  \n"), "hello");
  });

  it("handles null and undefined", () => {
    assert.equal(normalizeOutput(null), "");
    assert.equal(normalizeOutput(undefined), "");
  });

  it("normalises CRLF to LF", () => {
    assert.equal(normalizeOutput("a\r\nb\r\n"), "a\nb");
  });

  it("drops blank lines", () => {
    assert.equal(normalizeOutput("a\n\n\nb\n"), "a\nb");
  });

  it("collapses inner whitespace", () => {
    assert.equal(normalizeOutput("a   b\tc"), "a b c");
  });

  it("ignores spacing inside brackets and around commas", () => {
    assert.equal(normalizeOutput("[ 0,  1 ]"), "[0,1]");
  });
});

describe("outputsMatch", () => {
  it("matches equivalent outputs", () => {
    assert.ok(outputsMatch("[0, 1]\n", "[0,1]"));
  });

  it("rejects different outputs", () => {
    assert.ok(!outputsMatch("[0, 1]", "[0, 2]"));
  });

  it("matches multi-line program output", () => {
    assert.ok(outputsMatch("42\nhello\n", "42\nhello"));
  });
});
