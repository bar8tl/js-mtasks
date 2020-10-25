`use strict`;
const constant = require('./constants');
const crtdb    = require('./crtdb');
const lrfdata  = require('./lrfdata');
const rptasks  = require('./rptasks');
const settings = require('./settings');

function main() {
  var s = new settings.Settings(constant.CONFIG, constant.DFAULT);
  for (const parm of s.Parms) {
    switch (parm.Optn) {
    case s.Konst.CREATE_DB :
      var dbo = new crtdb.Ddbo();
      dbo.CrtTables(parm, s);
      break;
    case s.Konst.LOAD_REFERENCES :
      var lrf = new lrfdata.Dlrf();
      lrf.LoadRefData(parm, s);
      break;
    case s.Konst.REPORT_TASKS :
      var rpt = new rptasks.Drpt();
      rpt.DspTasks(parm, s);
      break;
    }
  }
}

main();
