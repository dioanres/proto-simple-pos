// Harness uji minimal (pengganti node:test untuk Node 16).
const assert = require("assert");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("ok - " + name);
  } catch (e) {
    failed++;
    console.log("not ok - " + name + "\n    " + (e && e.message));
  }
}

process.on("exit", () => {
  console.log(passed + " passed, " + failed + " failed");
  if (failed) process.exitCode = 1;
});

module.exports = { test, assert };
