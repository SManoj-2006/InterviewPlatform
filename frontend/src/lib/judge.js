/**
 * Judge utilities — compares a program's actual output against expected output.
 *
 * Mirrors `backend/src/lib/judge.js` (keep the two in sync). The backend copy
 * is covered by unit tests; this copy is used for instant client-side verdicts.
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
        .replace(/\[\s+/g, "[")
        .replace(/\s+\]/g, "]")
        .replace(/\s*,\s*/g, ",")
        .replace(/\s+/g, " ")
    )
    .filter((line) => line.length > 0)
    .join("\n");
}

export function outputsMatch(actualOutput, expectedOutput) {
  return normalizeOutput(actualOutput) === normalizeOutput(expectedOutput);
}
