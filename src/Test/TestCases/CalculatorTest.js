const HotPocket = require("hotpocket-js-client");
const { assertEqual, assertSuccessResponse, assertErrorResponse } = require("../test-utils");

async function runCalculatorTests() {
  const userKeyPair = await HotPocket.generateKeys();
  const client = await HotPocket.createClient(["wss://localhost:8081"], userKeyPair);

  if (!(await client.connect())) {
    throw new Error("Connection failed.");
  }

  // Test: Add
  let payload = { Service: "Calculator", Action: "Add", data: { a: 2, b: 3 } };
  let output = await client.submitContractReadRequest(JSON.stringify(payload));
  let res = JSON.parse(output);
  if (res.error) throw new Error("Add failed:" + JSON.stringify(res.error));
  assertSuccessResponse(res.success);
  assertEqual(res.success.result, 5, "2+3 should be 5");

  // Test: Multiply
  payload = { Service: "Calculator", Action: "Multiply", data: { a: 4, b: 5 } };
  output = await client.submitContractReadRequest(JSON.stringify(payload));
  res = JSON.parse(output);
  if (res.error) throw new Error("Multiply failed:" + JSON.stringify(res.error));
  assertSuccessResponse(res.success);
  assertEqual(res.success.result, 20, "4*5 should be 20");

  // Test: Divide by zero
  payload = { Service: "Calculator", Action: "Divide", data: { a: 10, b: 0 } };
  output = await client.submitContractReadRequest(JSON.stringify(payload));
  res = JSON.parse(output);
  if (res.success) throw new Error("Expected error for divide by zero");
  assertErrorResponse(res.error);

  // Test: Get History
  payload = { Service: "Calculator", Action: "GetHistory" };
  output = await client.submitContractReadRequest(JSON.stringify(payload));
  res = JSON.parse(output);
  if (res.error) throw new Error("GetHistory failed:" + JSON.stringify(res.error));
  if (!Array.isArray(res.success)) throw new Error("History should be an array");

  console.log("Calculator tests passed.");
}

module.exports = {
  runCalculatorTests
};
