const { test, assert } = require("./harness");
const a = require("../js/auth.js");

const users = [{ id: "u1", username: "kasir", password: "kasir", name: "Kasir", role: "cashier" }];

test("login dengan kredensial benar mengembalikan user", () => {
  assert.strictEqual(a.login(users, "kasir", "kasir").id, "u1");
});

test("login dengan password salah mengembalikan null", () => {
  assert.strictEqual(a.login(users, "kasir", "salah"), null);
});

test("cashier hanya bisa mengakses kasir", () => {
  assert.strictEqual(a.canAccess("cashier", "kasir"), true);
  assert.strictEqual(a.canAccess("cashier", "akun"), false);
  assert.strictEqual(a.canAccess("cashier", "dashboard"), false);
});

test("supervisor tidak bisa mengelola akun", () => {
  assert.strictEqual(a.canAccess("supervisor", "akun"), false);
  assert.strictEqual(a.canAccess("supervisor", "report"), true);
});
