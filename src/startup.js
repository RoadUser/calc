const HotPocket = require("hotpocket-nodejs-contract");
const { Controller } = require("./controller");
const { DBInitializer } = require("./Data.Deploy/initDB");
const { SharedService } = require("./Services/Common.Services/SharedService");

const calculatorContract = async (ctx) => {
  console.log("Calculator contract is running.");

  SharedService.context = ctx;
  const isReadOnly = ctx.readonly;

  if (!isReadOnly) {
    ctx.unl.onMessage((node, msg) => {
      try {
        const obj = JSON.parse(msg.toString());
        if (obj && obj.type) {
          SharedService.nplEventEmitter.emit(obj.type, node, msg);
        }
      } catch (e) {
        console.error("NPL message parse error", e);
      }
    });
  }

  try {
    await DBInitializer.init();
  } catch (e) {
    console.error("DB init error:", e);
  }

  const controller = new Controller();

  for (const user of ctx.users.list()) {
    for (const input of user.inputs) {
      const buf = await ctx.users.read(input);
      let message = null;
      try {
        message = JSON.parse(buf);
      } catch (e) {
        try {
          message = JSON.parse(buf.toString());
        } catch (err) {
          message = null;
        }
      }

      if (!message) {
        await user.send(JSON.stringify({ error: { message: "Invalid message format." } }));
        continue;
      }

      await controller.handleRequest(user, message, isReadOnly);
    }
  }
};

const hpc = new HotPocket.Contract();
hpc.init(calculatorContract, HotPocket.clientProtocols.JSON, true);
