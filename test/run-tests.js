/**
 * @license
 * Copyright 2016 Palantir Technologies, Inc.
 */

var childProcess = require("child_process");
var fs = require("fs");
var glob = require("glob");
var path = require("path");
var rimraf = require("rimraf");

var bundleTypings = require("../build/src").bundleTypings;

rimraf.sync("test/output/*");

var testCaseDirs = glob.sync("test/cases/*/");
var oldCWD = process.cwd();
testCaseDirs.forEach(function(testCaseDir) {
   var directoryName = path.basename(testCaseDir);
   console.log("Processing " + testCaseDir);
   process.chdir(testCaseDir)

   rimraf.sync("build");
   try {
      childProcess.execSync("tsc", {timeout: 5000});
   } catch (e) {
      console.warn("`npm run test` command could not finish: compilation of test case failed at " + directoryName);
      console.warn("Possible tsc error message:");
      console.warn(e.stdout.toString());
      throw e;
   }

   var params = JSON.parse(fs.readFileSync("params.json"), "utf8");
   var output;
   try {
      output = bundleTypings.apply(null, params);
   } catch (e) {
      console.warn("Library could not bundle typings:");
      throw e;
   }

   process.chdir(oldCWD);
   fs.writeFileSync(path.join("test/output", directoryName + ".d.ts"), output, "utf8");
});

console.log("Finished processing test cases, now diffing test/output and test/accepted-output:");
