`use strict`;
const fs      = require('fs');
const sprintf = require('/nodejs/node_modules/sprintf-js').sprintf;
const parse   = require('/nodejs/node_modules/csv-parse');
const sqlite3 = require('/nodejs/node_modules/sqlite3');
const xlsx    = require('/nodejs/node_modules/xlsx');

module.exports.Dlrf = class Dlrf {
  constructor() {}

  LoadRefData(parm, s) {
    s.SetRunSettings(parm, s);
    for (var lrf of s.Lrf) {
      switch (lrf.Id) {
      case s.Konst.MY_TASKS :
        this.loadMtasks(s, lrf).then((msg) => {
          console.log(sprintf('Table %-8s %s...', 'mtasks', msg));
        });
        break;
      case s.Konst.EDI_CUSTOMER_REQS :
        this.loadEdicrq(s, lrf).then((msg) => {
          console.log(sprintf('Table %-8s %s...', 'edicrq', msg));
        });
        break;
      case s.Konst.DAV57_BOARD :
        this.loadDav57b(s, lrf).then((msg) => {
          console.log(sprintf('Table %-8s %s...', 'dav57b', msg));
        });
        break;
      }
    }
  }

  loadMtasks(s, lrf) {
    return new Promise((resolve, reject) => {
      console.log(s.Lrfdr + lrf.File);
      const wbook = xlsx.readFile(s.Lrfdr + lrf.File);
      const shlst = wbook.SheetNames;
      const xlsjs = xlsx.utils.sheet_to_json(
        wbook.Sheets[shlst[s.Konst.MTASK_MAPPING_SHEET]]);
      console.log(xlsjs);
      const db = new sqlite3.Database(s.Dbort);
      db.serialize(() => {
        db.run('DELETE FROM mtasks;');
        for (var i = 0; i < xlsjs.length; i++) {
          db.run('INSERT INTO mtasks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?);',
            xlsjs[i].EntryDate,  xlsjs[i].TaskID,       xlsjs[i].Category,
            xlsjs[i].Requestor,  xlsjs[i].Requirement,  xlsjs[i].Estimation,
            xlsjs[i].TargetDate, xlsjs[i].Status,       xlsjs[i].Resolution,
            xlsjs[i].TaskType,   xlsjs[i].Dependencies, xlsjs[i].Actual,
            xlsjs[i].EndDate);
        }
        db.close();
      });
      resolve('uploaded');
    });
  }

  loadEdicrq(s, lrf) {
    return new Promise((resolve, reject) => {
      var csvdata = [];
      fs.createReadStream(s.Lrfdr + lrf.File)
        .pipe(parse({delimiter: '|'}))
        .on('data', csvrow => csvdata.push(csvrow))
        .on('end', () => {
          const db = new sqlite3.Database(s.Dbort);
          db.serialize(() => {
            db.run('DELETE FROM edicrq;');
            for (var row of csvdata) {
              db.run('INSERT INTO edicrq VALUES(?,?,?,?,?,?,?,?,?,?,?,?,' +
               '?,?);',
                row[1],  row[0], row[1], row[2], row[3], row[4],
                row[5],  row[6], row[7], row[8], row[9], row[10],
                row[11], row[12]);
            }
            db.close();
          });
        });
        resolve('uploaded');
    });
  }

  loadDav57b(s, lrf) {
    return new Promise((resolve, reject) => {
      var csvdata = [];
      fs.createReadStream(s.Lrfdr + lrf.File)
        .pipe(parse({delimiter: '|'}))
        .on('data', csvrow => csvdata.push(csvrow))
        .on('end', () => {
          const db = new sqlite3.Database(s.Dbort);
          db.serialize(() => {
            db.run('DELETE FROM dav57b;');
            for (var row of csvdata) {
              db.run('INSERT INTO dav57b VALUES(?,?,?,?,?,?,?,?,?,?,?,?,' +
               '?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);',
                row[5],  row[4],   row[5],  row[6],  row[7],  row[15],
                row[0],  row[12],  row[8],  row[14], row[13], row[1],
                row[16], row[2],   row[3],  row[9],  row[10], row[11],
                row[17], row[18],  row[19], row[20], row[21], row[22],
                row[23], row[24],  row[25], row[26], row[27]);
            }
            db.close();
          });
        });
      resolve('uploaded');
    });
  }
}
