const HotPocket = require("hotpocket-js-client");
const bson = require("bson");

class ContractService {
  constructor(servers) {
    this.servers = servers;
    this.userKeyPair = null;
    this.client = null;
    this.isConnectionSucceeded = false;
    this.promiseMap = new Map();
  }

  async init() {
    if (this.userKeyPair == null) {
      this.userKeyPair = await HotPocket.generateKeys();
    }
    if (this.client == null) {
      this.client = await HotPocket.createClient(this.servers, this.userKeyPair, {
        protocol: HotPocket.protocols.json
      });
    }

    this.client.on(HotPocket.events.disconnect, () => {
      this.isConnectionSucceeded = false;
    });

    this.client.on(HotPocket.events.connectionChange, (server, action) => {
      console.log(server + " " + action);
    });

    this.client.on(HotPocket.events.contractOutput, (r) => {
      r.outputs.forEach((o) => {
        let output = null;
        try {
          output = JSON.parse(o);
        } catch (e) {
          try { output = bson.deserialize(o); } catch (err) { output = null; }
        }
        if (!output) return;
        const pId = output.promiseId;
        if (output.error) this.promiseMap.get(pId)?.rejecter(output.error);
        else this.promiseMap.get(pId)?.resolver(output.success);
        this.promiseMap.delete(pId);
      });
    });

    if (!this.isConnectionSucceeded) {
      if (!(await this.client.connect())) {
        console.log("Connection failed.");
        return false;
      }
      console.log("HotPocket Connected.");
      this.isConnectionSucceeded = true;
    }

    return true;
  }

  submitInputToContract(inp) {
    let resolver, rejecter;
    const promiseId = this.#getUniqueId();
    const payload = { promiseId, ...inp };
    const str = JSON.stringify(payload);

    this.client.submitContractInput(Buffer.from(str)).then((input) => {
      input?.submissionStatus.then((s) => {
        if (s.status !== "accepted") {
          console.log(`Ledger_Rejection: ${s.reason}`);
        }
      });
    });

    return new Promise((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
      this.promiseMap.set(promiseId, { resolver, rejecter });
    });
  }

  #getUniqueId() {
    const bytes = Buffer.alloc(10);
    for (let i = 0; i < 10; i++) bytes[i] = Math.floor(Math.random() * 256);
    return bytes.toString("hex");
  }
}

module.exports = ContractService;
