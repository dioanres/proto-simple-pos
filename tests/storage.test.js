const { test, assert } = require("./harness");
const { loadData, saveData } = require("../js/storage.js");

function fakeStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
  };
}

test("loadData mengisi data contoh saat storage kosong", () => {
  const d = loadData(fakeStorage());
  assert.ok(d.products.length >= 6);
  assert.ok(d.users.some(u => u.role === "superadmin"));
  assert.deepStrictEqual(d.orders, []);
});

test("loadData memulihkan JSON rusak tanpa crash", () => {
  const s = fakeStorage();
  s.setItem("pos.data", "{rusak");
  const d = loadData(s);
  assert.ok(d.products.length >= 6);
});

test("saveData lalu loadData mengembalikan data yang sama", () => {
  const s = fakeStorage();
  const d = loadData(s);
  d.orders.push({ id: "o1" });
  saveData(s, d);
  assert.deepStrictEqual(loadData(s).orders, [{ id: "o1" }]);
});
