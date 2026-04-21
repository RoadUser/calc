const ServiceTypes = require("./Constants/ServiceTypes");
const { UpgradeController } = require("./Controllers/Upgrade.Controller");
const { CalculatorController } = require("./Controllers/Calculator.Controller");

class Controller {
  async handleRequest(user, message, isReadOnly) {
    let result = {};
    try {
      if (message && message.Service === ServiceTypes.UPGRADE) {
        const ctrl = new UpgradeController(message);
        result = await ctrl.handleRequest(user);
      } else if (message && message.Service === ServiceTypes.CALCULATOR) {
        const cctrl = new CalculatorController(message);
        result = await cctrl.handleRequest();
      } else {
        result = { error: { message: "Unknown service." } };
      }
    } catch (e) {
      result = { error: { message: e.message || "Unhandled error." } };
    }

    if (isReadOnly) {
      await user.send(JSON.stringify(result));
    } else {
      const out = message.promiseId ? { promiseId: message.promiseId, ...result } : result;
      await user.send(JSON.stringify(out));
    }
  }
}

module.exports = {
  Controller
};
