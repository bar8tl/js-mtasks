`use strict`;
const fs   = require('fs');
const tp   = require('./dtypes');

// Parameters from run command line
class Params {
  constructor() {
    this.Parms = []; // Array of Param_tp
    var args = process.argv.slice(2);
    if (args.length == 0) {
      console.log('Run option missing\r\n')
      return
    }
    for (var i = 0; i < args.length; i++) {
      var curarg = args[i];
      if (curarg.substr(0,1) == '-' || curarg.substr(0,1) == '//') {
        var optn = curarg.substr(1, curarg.length);
        var prm1 = '';
        var prm2 = '';
        if (optn != '') {
          if (optn.indexOf(':') != -1) {
            prm1 = optn.substr(optn.indexOf(':')+1, optn.length);
            optn = optn.substr(0, optn.indexOf(':')).trim();
            if (prm1.indexOf(':') != -1) {
              prm2 = prm1.substr(prm1.indexOf(':')+1, prm1.length).trim();
              prm1 = prm1.substr(0, prm1.indexOf(':')).trim();
            }
          }
          this.Parms.push(new tp.Param_tp(optn, prm1, prm2))
        } else {
          console.log('Run option missing\r\n')
        }
      }
    }
  }
}

// Values from configuration file
class Config {
  constructor(fname) {
    var jsonv = fs.readFileSync(fname);
    this.c = JSON.parse(jsonv);
  }
}

// Defaults, Constants and Literal values from defaults file
class Dfault {
  constructor(fname) {
    var jsonv = fs.readFileSync(fname);
    this.d = JSON.parse(jsonv);
  }
}

// Run specific environment variables
class Envmnt {
  constructor() {}
}

// Program global settings - Inheriting from parameters, configuration,
// defaults and constants
module.exports.Settings = class Settings {
  constructor(cfnam, dfnam) {
    this.Params = new Params();
    this.Config = new Config(cfnam);
    this.Dfault = new Dfault(dfnam);

    // Following definitions and functions will be migrated to own class as
    // soon as I am able to implement multiple inheritance

    // Params
    this.Parms = []; // Array of Param_tp
    this.customizeParams();

    // Config
    this.Lrfdr = '';
    this.Dbonm = '';
    this.Dbodr = '';
    this.Dbort = '';
    this.Inpdr = '';
    this.Outdr = '';
    this.Run   = []; // Array of Run_tp
    this.Cdb   = []; // Array of Cdb_tp
    this.Lrf   = []; // Array of Lrf_tp
    this.customizeConfig();

    // Dfault
    this.Sqlst = []; // Array of Sqlst_tp
    this.customizeDfault();

    // Envmnt
    this.Dtsys = new Date();
    this.Dtcur = new Date();
    this.Dtnul = new Date(0);
    this.Objnm = '';
    this.Usrid = '';
  }

  customizeParams() {
    for (var parm of this.Params.Parms) {
      this.Parms.push(new tp.Param_tp(
        parm.Optn.toLowerCase(),
        parm.Prm1.toLowerCase(),
        parm.Prm2.toLowerCase()
      ));
    }
  }

  customizeConfig() {
    this.Lrfdr = this.Config.c.progm.lrfdr.length > 0 ?
      this.Config.c.progm.lrfdr.trim() : this.Dfault.d.konst.REFDATA_DIR;
    this.Dbonm = this.Config.c.progm.dbonm.length > 0 ?
      this.Config.c.progm.dbonm.trim() : this.Dfault.d.konst.DB_NAME;
    this.Dbodr = this.Config.c.progm.dbodr.length > 0 ?
      this.Config.c.progm.dbodr.trim() : this.Dfault.d.konst.DB_DIR;
    this.Inpdr = this.Config.c.progm.inpdr.length > 0 ?
      this.Config.c.progm.inpdr.trim() : this.Dfault.d.konst.INPUTS_DIR;
    this.Outdr = this.Config.c.progm.outdr.length > 0 ?
      this.Config.c.progm.outdr.trim() : this.Dfault.d.konst.OUTPUTS_DIR;
    this.Dbort = this.Dbodr + this.Dbonm;
    for (var run of this.Config.c.run) {
      this.Run.push(new tp.Run_tp(
        run.optcd.trim().toLowerCase(),
        run.objnm.trim(),
        run.inpdr.trim(),
        run.outdr.trim()
      ));
    }
    for (var cdb of this.Config.c.cdb) {
      this.Cdb.push(new tp.Cdb_tp(
        cdb.id.trim().toLowerCase(),
        cdb.table.trim(),
        cdb.cr
      ));
    }
    for (var lrf of this.Config.c.lrf) {
      this.Lrf.push(new tp.Lrf_tp(
        lrf.id.trim().toLowerCase(),
        lrf.table.trim(),
        lrf.user.trim(),
        lrf.file.trim(),
        lrf.ld
      ));
    }
  }

  customizeDfault() {
    this.Dflt  = this.Dfault.d.dflt;
    this.Konst = this.Dfault.d.konst;
    for (var sql of this.Dfault.d.sqlst) {
      if (sql.activ) {
        this.Sqlst.push(new tp.Sqlst_tp(
          sql.activ,
          sql.table,
          sql.sqlst
        ));
      }
    }
    this.errs  = this.Dfault.errs;
  }

  SetRunSettings(p) {
    if (p.Optn == this.Konst.CREATE_DB) {
      if (p.Prm1.Length > 0) {
        this.Dbonm = p.Prm1.trim();
      }
      if (p.Prm2.length > 0) {
        var ids = p.Prm2.split('.');
        for (var i = 0; i < this.Cdb.length; i++) {
          for (var j = 0; j < ids.length; j++) {
            if (this.Cdb[i].Id == ids[j]) {
              this.Cdb[i].Cr = true;
              break;
            } else {
              this.Cdb[i].Cr = false;
            }
          }
        }
      }
    }
    if (p.Optn == this.Konst.LOAD_REFERENCES) {
      if (p.Prm1.length > 0) {
        this.Usrid = p.Prm1.trim();
      }
      if (p.Prm2.length > 0) {
        var ids = p.Prm2.split('.');
        for (var i = 0; i < this.Lrf.length; i++) {
          for (var j = 0; j < ids.length; j++) {
            if (this.Lrf[i].Id == ids[j]) {
              this.Lrf[i].Ld = true;
              break;
            } else {
              this.Lrf[i].Ld = false;
            }
          }
        }
      }
    }
    if (p.Optn == this.Konst.REPORT_TASKS) {
      if (p.Prm1.length > 0) {
        this.Objnm = p.Prm1.trim();
      } else {
        console.log('Error: Not possible to determine IDOC-Type name.\r\n');
        process.exit(1);
      }
    }
    var found = false;
    for (var i = 0; i < this.Run.length && !found; i++) {
      var run = s.Config.Run[i];
      if (p.Optn == run.Optcd && p.Prm1 == run.Objnm) {
        found = true;
        this.Objnm = run.Objnm.length > 0 ? run.Objnm : p.Prm1;
        if (p.Optn == this.Konst.DUMP_MAPPING_FILE) {
          this.Inpdr = run.Inpdr.length > 0 ? run.Inpdr : this.Inpdr;
          this.Outdr = run.Outdr.length > 0 ? run.Outdr : this.Outdr;
        }
      }
    }
  }
}
