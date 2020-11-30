'use strict';
const sprintf = require('/nodejs/node_modules/sprintf-js').sprintf;
const sqlite3 = require('/nodejs/node_modules/sqlite3');
const tp      = require('./dtypes');

module.exports.Ddbo = class Ddbo {
  constructor() {
    this.dbcrt = []; // Array of Dbcrt_tp
  }

  CrtTables(parm, s) {
    s.SetRunSettings(parm);
    for (var cdb of s.Cdb) {
      for (var sq of s.Sqlcr) {
        if (cdb.Table == sq.Table && cdb.Cr && sq.Activ) {
          this.dbcrt.push(new tp.Dbcrt_tp(sq.Table, sq.Sqlst));
          break;
        }
      }
    }
    var db = new sqlite3.Database(s.Dbort);
    db.serialize(() => {
      this.dbcrt.forEach((refdb) => {
        var sqdrp = 'DROP TABLE IF EXISTS &1;'.replace('&1', refdb.Table);
        db.run(sqdrp);
        db.run(refdb.Sqlst, (err) => {
          if (err) {
            console.log('sql-insert:', err.message);
            throw err;
          }
          console.log(sprintf('Table %-8s created...', refdb.Table));
        });
      });
      db.close((err) => {
        if (err) {
          console.error('sql-close:', err.message);
        }
        console.log('Creation of dabatase', s.Dbonm,'completed.')
      });
    });
  }
}
