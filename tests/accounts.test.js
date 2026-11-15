const { test, assert } = require("./harness");
const acc = require("../js/accounts.js");

const users = [
  { id: "u1", username: "admin", password: "admin", name: "Admin", role: "superadmin" },
  { id: "u2", username: "kasir", password: "kasir", name: "Kasir", role: "cashier" },
];

test("username duplikat ditolak", () => {
  assert.strictEqual(acc.validateAccount(users, { username: "kasir", password: "1234", name: "X", role: "cashier" }).ok, false);
});

test("password kurang dari 4 karakter ditolak", () => {
  assert.strictEqual(acc.validateAccount(users, { username: "baru", password: "123", name: "X", role: "cashier" }).ok, false);
});

test("role tidak dikenal ditolak", () => {
  assert.strictEqual(acc.validateAccount(users, { username: "baru", password: "1234", name: "X", role: "boss" }).ok, false);
});

test("superadmin terakhir tidak bisa dihapus", () => {
  assert.throws(() => acc.removeAccount(users, "u1", "u2"), /superadmin/);
});

test("akun sendiri tidak bisa dihapus", () => {
  assert.throws(() => acc.removeAccount(users, "u2", "u2"), /sendiri/);
});

test("upsertAccount menambah akun baru dengan id", () => {
  const out = acc.upsertAccount(users, { id: "", username: "spv", password: "spv1", name: "Supervisor", role: "supervisor" });
  assert.strictEqual(out.length, 3);
  assert.ok(out[2].id);
});
