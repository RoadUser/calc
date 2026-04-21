const { runCalculatorTests } = require("./TestCases/CalculatorTest");

(async () => {
  try {
    await runCalculatorTests();
    console.log("All tests completed successfully.");
    process.exit(0);
  } catch (e) {
    console.error("Tests failed:", e);
    process.exit(1);
  }
})();
