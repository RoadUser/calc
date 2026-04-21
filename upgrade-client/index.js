const ContractService = require("./contract-service");
const fs = require("fs");
const HotPocket = require("hotpocket-js-client");
const sodium = require("libsodium-wrappers");

// Usage:
// node index.js <contractUrl> <zipFilePath> <version> <description>

const contractUrl = process.argv[2];
const filepath = process.argv[3];
const version = process.argv[4];
const description = process.argv[5] || "";

async function main() {
  if (!contractUrl || !filepath || !version) {
    console.log("Usage: node index.js <contractUrl> <zipFilePath> <version> <description>");
    process.exit(1);
  }

  const contractService = new ContractService([contractUrl]);
  await contractService.init();

  await sodium.ready;

  const kp = contractService.userKeyPair; // { publicKey: Uint8Array(32), privateKey: Uint8Array(64) } typically
  const fileContent = fs.readFileSync(filepath);
  const zipBase64 = fileContent.toString("base64");
  const sig = sodium.crypto_sign_detached(new Uint8Array(fileContent), kp.privateKey);
  const sigHex = Buffer.from(sig).toString("hex");

  const submitData = {
    Service: "Upgrade",
    Action: "UpgradeContract",
    data: {
      version: parseFloat(version),
      description: description,
      zipBase64: zipBase64,
      zipSignatureHex: sigHex
    }
  };

  console.log(`Uploading ${filepath} (v${version}) to ${contractUrl}`);
  contractService
    .submitInputToContract(submitData)
    .then((re) => {
      console.log("Upgrade response:", re);
    })
    .catch((reason) => {
      console.error("Upgrade failed:", reason);
    })
    .finally(() => process.exit());
}

main();
