const { UpgradeService } = require("../Services/Common.Services/Upgrade.Service");
const env = require("../Utils/Environment");
const nacl = require("tweetnacl");

function hexToUint8(hex) {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const arr = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    arr[i / 2] = parseInt(clean.substr(i, 2), 16);
  }
  return arr;
}

function base64ToUint8(b64) {
  const buf = Buffer.from(b64, "base64");
  return new Uint8Array(buf);
}

function isMaintainer(userPubKeyHex) {
  const expected = (env.MAINTAINER_PUBKEY || process.env.MAINTAINER_PUBKEY || "").toLowerCase();
  if (!expected || expected.length === 0) return false;
  return (userPubKeyHex || "").toLowerCase() === expected;
}

class UpgradeController {
  constructor(message) {
    this._message = message;
    this._service = new UpgradeService(message);
  }

  async handleRequest(user) {
    try {
      const userPubKey = user.publicKey || user.pubKey || "";
      if (!isMaintainer(userPubKey)) {
        return { error: { message: "Unauthorized" } };
      }

      if (this._message.Action === "UpgradeContract") {
        const payload = this._message.data || {};
        const zipBase64 = payload.zipBase64;
        const signatureHex = payload.zipSignatureHex;
        const version = parseFloat(payload.version);
        const description = payload.description || "";

        if (!zipBase64 || !signatureHex || !version) {
          return { error: { message: "Invalid upgrade payload." } };
        }

        const zipBuffer = Buffer.from(zipBase64, "base64");
        const sig = hexToUint8(signatureHex);
        const pk = hexToUint8(userPubKey);

        const verified = nacl.sign.detached.verify(new Uint8Array(zipBuffer), sig, pk);
        if (!verified) {
          return { error: { message: "Signature verification failed." } };
        }

        this._message.data = { zipBuffer, version, description };
        return await this._service.upgradeContract();
      }

      return { error: { message: "Invalid action." } };
    } catch (e) {
      return { error: { message: e.message || "Upgrade error." } };
    }
  }
}

module.exports = {
  UpgradeController
};
