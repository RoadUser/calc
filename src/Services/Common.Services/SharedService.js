const { v4: uuidv4 } = require("uuid");
const EventEmitter = require("events");

class SharedService {
  static context = null;
  static nplEventEmitter = new EventEmitter();

  static generateUUID() {
    return uuidv4();
  }

  static getUtcISOStringFromUnixTimestamp(milliseconds) {
    const date = new Date(milliseconds);
    return date.toISOString();
    }

  static getCurrentTimestamp() {
    return this.getUtcISOStringFromUnixTimestamp(this.context.timestamp);
  }

  static generateConcurrencyKey() {
    const ts = this.getCurrentTimestamp();
    const extracted = ts.replace(/\D/g, "");
    const hex = Number(extracted).toString(16).toUpperCase().padStart(14, "0");
    const checksum = 16 - hex.length;
    return `0x${"0".repeat(checksum)}${hex}`;
  }
}

module.exports = {
  SharedService
};
