const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const Tables = require("../Constants/Tables");
const settings = require("../settings.json").settings;

class DBInitializer {
  static async init() {
    const dbPath = settings.dbPath;

    if (!fs.existsSync(dbPath)) {
      const db = new sqlite3.Database(dbPath);
      await new Promise((resolve, reject) => db.run("PRAGMA foreign_keys = ON", [], (e) => e ? reject(e) : resolve()));

      await new Promise((resolve, reject) => db.run(
        `CREATE TABLE IF NOT EXISTS ${Tables.CONTRACTVERSION} (
          Id INTEGER,
          Version FLOAT NOT NULL,
          Description TEXT,
          CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
          LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY("Id" AUTOINCREMENT)
        )`, [], (e) => e ? reject(e) : resolve()
      ));

      await new Promise((resolve, reject) => db.run(
        `CREATE TABLE IF NOT EXISTS ${Tables.CALCHISTORY} (
          Id INTEGER,
          Operation TEXT NOT NULL,
          A REAL,
          B REAL,
          Result REAL,
          CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
          ConcurrencyKey TEXT,
          PRIMARY KEY("Id" AUTOINCREMENT)
        )`, [], (e) => e ? reject(e) : resolve()
      ));

      db.close();
    }

    // Migration Scripts Runner (optional placeholder)
    if (fs.existsSync(settings.dbScriptsFolderPath)) {
      const folders = fs.readdirSync(settings.dbScriptsFolderPath).filter((f) => f.startsWith("Sprint_")).sort();
      for (const fld of folders) {
        const fldPath = path.join(settings.dbScriptsFolderPath, fld);
        const sqlFiles = fs.readdirSync(fldPath).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
        if (sqlFiles.length > 0) {
          const db = new sqlite3.Database(dbPath);
          for (const sqlf of sqlFiles) {
            const full = path.join(fldPath, sqlf);
            const sqlScript = fs.readFileSync(full, "utf8");
            const statements = sqlScript.split(";").map((s) => s.split(/\?\
/).map((l) => l.trim().startsWith("--") ? "" : l).join("\
")).filter((s) => s.trim() !== "");
            for (const st of statements) {
              await new Promise((resolve, reject) => db.run(st, [], (e) => e ? reject(e) : resolve()));
            }
          }
          db.close();
        }
      }
    }
  }
}

module.exports = {
  DBInitializer
};
