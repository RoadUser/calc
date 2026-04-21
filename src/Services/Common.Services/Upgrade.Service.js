const fs = require("fs");
const { SharedService } = require("./SharedService");
const { SqliteDatabase } = require("./dbHandler");
const Tables = require("../../Constants/Tables");
const settings = require("../../settings.json").settings;

class UpgradeService {
  constructor(message) {
    this._message = message;
    this._dbPath = settings.dbPath;
    this._dbContext = new SqliteDatabase(this._dbPath);
  }

  async upgradeContract() {
    let resObj = {};
    try {
      const zipBuffer = this._message.data.zipBuffer;
      const version = this._message.data.version;
      const description = this._message.data.description || "";

      this._dbContext.open();
      let row = await this._dbContext.getLastRecord(Tables.CONTRACTVERSION);
      const currentVersion = row && row.Version ? row.Version : 1.0;

      if (!(version > currentVersion)) {
        throw new Error("Incoming version must be greater than current version.");
      }

      fs.writeFileSync(settings.newContractZipFileName, zipBuffer);

      const shellScriptContent = `#!/bin/bash\
\
! command -v unzip &>/dev/null && apt-get update && apt-get install --no-install-recommends -y unzip\
\
zip_file=\"${settings.newContractZipFileName}\"\
\
unzip -o -d ./ \"$zip_file\" >>/dev/null\
\
rm \"$zip_file\" >>/dev/null\
`;

      fs.writeFileSync(settings.postExecutionScriptName, shellScriptContent);
      fs.chmodSync(settings.postExecutionScriptName, 0o777);

      const data = {
        Version: version,
        Description: description,
        CreatedOn: SharedService.getCurrentTimestamp(),
        LastUpdatedOn: SharedService.getCurrentTimestamp()
      };

      const ins = await this._dbContext.insertValue(Tables.CONTRACTVERSION, data);

      resObj.success = { message: "Contract upgraded", id: ins.lastId, version: version };
    } catch (err) {
      resObj.error = { message: err.message || "Failed to upgrade contract." };
    } finally {
      this._dbContext.close();
    }
    return resObj;
  }
}

module.exports = {
  UpgradeService
};
