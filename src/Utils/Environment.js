const fs = require("fs");

let env = {};
try {
  if (fs.existsSync(".env")) {
    const res = fs.readFileSync(".env", "utf8");
    res.split("\
").forEach((line) => {
      line = line.trim();
      if (!line || line.startsWith("#")) return;
      const idx = line.indexOf("=");
      if (idx === -1) return;
      const key = line.substring(0, idx);
      const valRaw = line.substring(idx + 1);
      let val = valRaw;
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
      if (!process.env[key]) process.env[key] = val;
    });
  }
} catch (e) {}

module.exports = env;
