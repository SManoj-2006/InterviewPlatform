/**
 * Judge utilities — shared logic for comparing a program's actual output
 * against a problem's expected output.
 *
 * This file is intentionally dependency-free and is mirrored in
 * `frontend/src/lib/judge.js` (the two must be kept in sync).
 */

/**
 * Normalizes program output so trivial formatting differences
 * (trailing whitespace, CRLF, spacing inside brackets/commas, blank lines)
 * don't cause false test failures.
 */
export function normalizeOutput(output) {
  if (output === null || output === undefined) return "";
  return String(output)
    .replace(/\r\n/g, "\n")
    .trim()
    .split("\n")
    .map((line) =>
      line
        .trim()
        // remove spaces after [ and before ]
        .replace(/\[\s+/g, "[")
        .replace(/\s+\]/g, "]")
        // normalize spacing around commas: "[1, 2]" -> "[1,2]"
        .replace(/\s*,\s*/g, ",")
        // collapse any remaining repeated whitespace
        .replace(/\s+/g, " ")
    )
    .filter((line) => line.length > 0)
    .join("\n");
}

/**
 * Returns true when the actual program output matches the expected output
 * after normalization.
 */
export function outputsMatch(actualOutput, expectedOutput) {
  return normalizeOutput(actualOutput) === normalizeOutput(expectedOutput);
}
