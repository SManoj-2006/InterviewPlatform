import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getExecuteUrl } from "../src/controllers/codeController.js";

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
