const sqlite3 = require("sqlite3").verbose();

class SqliteDatabase {
  constructor(dbFile) {
    this.dbFile = dbFile;
    this.openConnections = 0;
    this.db = null;
  }

  open() {
    if (this.openConnections <= 0) {
      this.db = new sqlite3.Database(this.dbFile);
      this.openConnections = 1;
    } else this.openConnections++;
  }

  close() {
    if (this.openConnections <= 1) {
      if (this.db) this.db.close();
      this.db = null;
      this.openConnections = 0;
    } else this.openConnections--;
  }

  runQuery(query, params = null) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params ? params : [], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ lastId: this.lastID, changes: this.changes });
      });
    });
  }

  runSelectQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getLastRecord(tableName) {
    const query = `SELECT * FROM ${tableName} ORDER BY rowid DESC LIMIT 1`;
    return new Promise((resolve, reject) => {
      this.db.get(query, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  getValues(tableName, filter = null, op = "=") {
    let values = [];
    let filterStr = "1 AND ";
    if (filter) {
      const columnNames = Object.keys(filter);
      if (op === "IN") {
        for (const columnName of columnNames) {
          if (Array.isArray(filter[columnName]) && filter[columnName].length > 0) {
            filterStr += `${columnName} ${op} ( `;
            const valArray = filter[columnName];
            for (const v of valArray) {
              filterStr += `?, `;
              values.push(v);
            }
            filterStr = filterStr.slice(0, -2);
            filterStr += `) AND `;
          }
        }
      } else {
        for (const columnName of columnNames) {
          filterStr += `${columnName} ${op} ? AND `;
          values.push(filter[columnName] !== undefined ? filter[columnName] : null);
        }
      }
    }
    filterStr = filterStr.slice(0, -5);
    const query = `SELECT * FROM ${tableName}` + (filterStr ? ` WHERE ${filterStr};` : ";");
    return new Promise((resolve, reject) => {
      let rows = [];
      this.db.each(
        query,
        values,
        function (err, row) {
          if (err) {
            reject(err);
            return;
          }
          rows.push(row);
        },
        function (err, count) {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  async insertValue(tableName, value) {
    return await this.insertValues(tableName, [value]);
  }

  async insertValues(tableName, values) {
    if (!values.length) return { lastId: 0, changes: 0 };
    const columnNames = Object.keys(values[0]);
    let rowValueStr = "";
    let rowValues = [];
    for (const val of values) {
      rowValueStr += "(";
      for (const columnName of columnNames) {
        rowValueStr += "?,";
        rowValues.push(val[columnName] !== undefined ? val[columnName] : null);
      }
      rowValueStr = rowValueStr.slice(0, -1) + "),";
    }
    rowValueStr = rowValueStr.slice(0, -1);
    const query = `INSERT INTO ${tableName}(${columnNames.join(", ")}) VALUES ${rowValueStr}`;
    return await this.runQuery(query, rowValues);
  }

  async updateValue(tableName, value, filter = null) {
    const setCols = Object.keys(value);
    let valueStr = setCols.map((c) => `${c} = ?`).join(", ");
    let values = setCols.map((c) => (value[c] !== undefined ? value[c] : null));
    let filterStr = "1 AND ";
    if (filter) {
      for (const columnName of Object.keys(filter)) {
        filterStr += `${columnName} = ? AND `;
        values.push(filter[columnName] !== undefined ? filter[columnName] : null);
      }
    }
    filterStr = filterStr.slice(0, -5);
    const query = `UPDATE ${tableName} SET ${valueStr} WHERE ${filterStr};`;
    return await this.runQuery(query, values);
  }

  async deleteValues(tableName, filter = null) {
    let values = [];
    let filterStr = "1 AND ";
    if (filter) {
      for (const columnName of Object.keys(filter)) {
        filterStr += `${columnName} = ? AND `;
        values.push(filter[columnName] !== undefined ? filter[columnName] : null);
      }
    }
    filterStr = filterStr.slice(0, -5);
    const query = `DELETE FROM ${tableName} WHERE ${filterStr};`;
    return await this.runQuery(query, values);
  }

  async findById(tableName, id) {
    const query = `SELECT * FROM ${tableName} WHERE Id = ${id}`;
    return new Promise((resolve, reject) => {
      this.db.get(query, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = {
  SqliteDatabase
};
