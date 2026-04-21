const { CalculatorService } = require("../Services/Domain.Services/Calculator.service");

class CalculatorController {
  constructor(message) {
    this._message = message;
    this._service = new CalculatorService(message);
  }

  async handleRequest() {
    try {
      const action = this._message.Action;
      switch (action) {
        case "Add":
          return await this._service.calculate("add");
        case "Subtract":
          return await this._service.calculate("subtract");
        case "Multiply":
          return await this._service.calculate("multiply");
        case "Divide":
          return await this._service.calculate("divide");
        case "Calculate":
          return await this._service.calculate((this._message.data || {}).op);
        case "GetHistory":
          return await this._service.getHistory();
        default:
          return { error: { message: "Invalid action." } };
      }
    } catch (e) {
      return { error: { message: e.message || "Calculation error." } };
    }
  }
}

module.exports = {
  CalculatorController
};
