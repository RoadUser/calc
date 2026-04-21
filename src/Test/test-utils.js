function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error((message || "Assertion failed") + `: expected ${expected}, got ${actual}`);
  }
}

function assertSuccessResponse(resp) {
  if (!resp || typeof resp !== "object" || !("result" in resp)) {
    throw new Error("Expected success response with result field");
  }
}

function assertErrorResponse(resp) {
  if (!resp || typeof resp !== "object" || !resp.message) {
    throw new Error("Expected error response with message field");
  }
}

module.exports = {
  assertEqual,
  assertSuccessResponse,
  assertErrorResponse
};
