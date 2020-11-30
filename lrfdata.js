'use strict';
const fs       = require('fs');
const sprintf  = require('/nodejs/node_modules/sprintf-js').sprintf;
const parse    = require('/nodejs/node_modules/csv-parse');
const sqlite3  = require('/nodejs/node_modules/sqlite3');
const xlsxFile = require('/nodejs/node_modules/read-excel-file/node');

module.exports.Dlrf = class Dlrf {
  constructor() {}

  LoadRefData(parm, s) {
    s.SetRunSettings(parm, s);
    for (var lrf of s.Lrf) {
      if (lrf.Ld && lrf.Id == s.Konst.MY_TASKS && lrf.User == s.Usrid) {
        this.loadMtasks(s, lrf).then((msg) => {
          console.log(sprintf('Table %-8s %s...', 'mtasks', msg));
        });  
      } else if (lrf.Ld && lrf.Id == s.Konst.EDI_CUSTOMER_REQS) {
        this.loadEdicrq(s, lrf).then((msg) => {
          console.log(sprintf('Table %-8s %s...', 'edicrq', msg));
        });
      } else if (lrf.Ld && lrf.Id == s.Konst.EDI_CRQ_BASELINE) {
        this.loadEdicbl(s, lrf).then((msg) => {
          console.log(sprintf('Table %-8s %s...', 'edicbl', msg));
        });
      } else if (lrf.Ld && lrf.Id == s.Konst.DAV57_BOARD) {
        this.loadDav57b(s, lrf).then((msg) => {
          console.log(sprintf('Table %-8s %s...', 'dav57b', msg));
        });
      }
    }
  }

  loadMtasks(s, lrf) {
    return new Promise((resolve, reject) => {
      xlsxFile(s.Lrfdr + lrf.File,
        { sheet: s.Konst.TASKS_SHEET }).then((rows) => {
        const db = new sqlite3.Database(s.Dbort);
        db.serialize(() => {
          db.run('DELETE FROM mtasks where usrid = ?;', lrf.User);
          this.cell = rows;
          for (var i in this.cell) {
            for (var j in this.cell[i]) {
              if (this.cell[i][j] == null) {
                this.cell[i][j] = '';
              }
            }
          }
          for (var row = s.Konst.TASKS_TOPLINE; row < this.cell.length;
            row++) {
            db.run('INSERT INTO mtasks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);',
              lrf.User.toLowerCase(),
              this.cell[row][1],  this.cell[row][0],  this.cell[row][2],
              this.cell[row][3],  this.cell[row][4],  this.cell[row][5],
              this.cell[row][6],  this.cell[row][7],  this.cell[row][8],
              this.cell[row][9],  this.cell[row][10], this.cell[row][11],
              this.cell[row][12], this.cell[row][13]);
          }
          db.close();
        });
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
              if (row[0] != 'Issue Type' &&
                row[1].substr(0, row[1].indexOf('-')) == 'EDICUSTOMERREQUEST') {
                var tskid = row[1].replace('EDICUSTOMERREQUEST', 'EDICRQ');
                db.run('INSERT INTO edicrq VALUES(?,?,?,?,?,?,?,?,?,?,?,?,' +
                 '?,?,?);', row[5].toLowerCase(),
                  tskid,  row[0], row[1], row[2], row[3],  row[4],  row[5],
                  row[6], row[7], row[8], row[9], row[10], row[11], row[12]);
              }
            }
            db.close();
          });
        });
        resolve('uploaded');
    });
  }

  loadEdicbl(s, lrf) {
    return new Promise((resolve, reject) => {
      xlsxFile(s.Lrfdr + lrf.File,
        { sheet: s.Konst.BASELINE_SHEET }).then((rows) => {
        const db = new sqlite3.Database(s.Dbort);
        db.serialize(() => {
          db.run('DELETE FROM edicbl;');
          this.cell = rows;
          for (var i in this.cell) {
            for (var j in this.cell[i]) {
              if (this.cell[i][j] == null) {
                this.cell[i][j] = '';
              }
            }
          }
          for (var row = s.Konst.BASELINE_TOPLINE; row < this.cell.length;
            row++) {
            db.run('INSERT INTO edicbl VALUES(?,?,?,?);',
              this.cell[row][0], this.cell[row][1], this.cell[row][2],
              this.cell[row][3]);
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
            db.run('DELETE FROM dav57b where usrid = ?;', lrf.User);
            for (var row of csvdata) {
              if (row[0] != 'Assignee') {
                db.run('INSERT INTO dav57b VALUES(?,?,?,?,?,?,?,?,?,?,?,?,' +
               '?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);',
                row[0].toLowerCase(),
                row[5],  row[4],   row[5],  row[6],  row[7],  row[15],
                row[0],  row[12],  row[8],  row[14], row[13], row[1],
                row[16], row[2],   row[3],  row[9],  row[10], row[11],
                row[17], row[18],  row[19], row[20], row[21], row[22],
                row[23], row[24],  row[25], row[26], row[27]);
              }
            }
            db.close();
          });
        });
      resolve('uploaded');
    });
  }
}
