const { test, assert } = require("./harness");
const r = require("../js/report.js");

test("toCsv menghasilkan header dan satu baris per order", () => {
  const csv = r.toCsv([{ id: "o1", table: "05", payMethod: "cash", total: 28000, paid: 30000, change: 2000, status: "paid", createdAt: "2026-11-15T10:00:00Z", items: [{ name: "Latte", qty: 1 }] }]);
  const lines = csv.split("\n");
  assert.strictEqual(lines[0], "id,tanggal,meja,metode,total,dibayar,kembali,status,item");
  assert.strictEqual(lines.length, 2);
});

test("nilai dengan koma di-escape dengan kutip", () => {
  const csv = r.toCsv([{ id: "o1", table: "05,A", payMethod: "cash", total: 0, paid: 0, change: 0, status: "paid", createdAt: "2026-11-15T10:00:00Z", items: [] }]);
  assert.ok(csv.includes('"05,A"'));
});

test("kutip di dalam nilai digandakan", () => {
  const csv = r.toCsv([{ id: "o1", table: "05", payMethod: "cash", total: 0, paid: 0, change: 0, status: "paid", createdAt: "2026-11-15T10:00:00Z", items: [{ name: 'Kopi "Spesial"', qty: 1 }] }]);
  assert.ok(csv.includes('"Kopi ""Spesial"" x1"'));
});
