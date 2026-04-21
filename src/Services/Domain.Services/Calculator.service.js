const Tables = require("../../Constants/Tables");
const { SqliteDatabase } = require("../Common.Services/dbHandler");
const { SharedService } = require("../Common.Services/SharedService");
const settings = require("../../settings.json").settings;

class CalculatorService {
  constructor(message) {
    this._message = message;
    this._dbPath = settings.dbPath;
    this._dbContext = new SqliteDatabase(this._dbPath);
  }

  _compute(op, a, b) {
    switch (op) {
      case "add":
        return a + b;
      case "subtract":
        return a - b;
      case "multiply":
        return a * b;
      case "divide":
        if (b === 0) throw new Error("Division by zero is not allowed.");
        return a / b;
      default:
        throw new Error("Unsupported operation.");
    }
  }

  async calculate(opInput) {
    let resObj = {};
    try {
      const d = this._message.data || {};
      const op = (opInput || d.op || "").toString().toLowerCase();
      const a = Number(d.a);
      const b = Number(d.b);
      if (!op || Number.isNaN(a) || Number.isNaN(b)) {
        throw new Error("Invalid input.");
      }
      const result = this._compute(op, a, b);

      this._dbContext.open();
      const row = {
        Operation: op,
        A: a,
        B: b,
        Result: result,
        CreatedOn: SharedService.getCurrentTimestamp(),
        ConcurrencyKey: SharedService.generateConcurrencyKey()
      };
      await this._dbContext.insertValue(Tables.CALCHISTORY, row);
      resObj.success = { result };
    } catch (e) {
      resObj.error = { message: e.message || "Calculation failed" };
    } finally {
      this._dbContext.close();
    }
    return resObj;
  }

  async getHistory() {
    let resObj = {};
    try {
      this._dbContext.open();
      const rows = await this._dbContext.getValues(Tables.CALCHISTORY, {});
      const mapped = rows.map((r) => ({
        id: r.Id,
        operation: r.Operation,
        a: r.A,
        b: r.B,
        result: r.Result,
        createdOn: r.CreatedOn
      }));
      resObj.success = mapped;
    } catch (e) {
      resObj.error = { message: e.message || "Failed to fetch history" };
    } finally {
      this._dbContext.close();
    }
    return resObj;
  }
}

module.exports = {
  CalculatorService
};
