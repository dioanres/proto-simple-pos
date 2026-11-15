const { test, assert } = require("./harness");
const d = require("../js/dashboard.js");

const orders = [
  { id: "o1", status: "paid", total: 28000, payMethod: "cash", createdAt: "2026-11-15T10:00:00Z", items: [{ name: "Latte", qty: 1 }] },
  { id: "o2", status: "open", total: 15000, payMethod: "cash", createdAt: "2026-11-15T11:00:00Z", items: [{ name: "Roti", qty: 1 }] },
  { id: "o3", status: "paid", total: 22000, payMethod: "qris", createdAt: "2026-11-14T09:00:00Z", items: [{ name: "Latte", qty: 1 }] },
];

test("summarize hanya menghitung order yang sudah dibayar dalam rentang", () => {
  const s = d.summarize(orders, "2026-11-15T00:00:00Z", "2026-11-15T23:59:59Z");
  assert.strictEqual(s.revenue, 28000);
  assert.strictEqual(s.count, 1);
  assert.strictEqual(s.byPayMethod.qris, 0);
});

test("summarize menghitung omzet per metode dan produk terlaris", () => {
  const many = [
    { id: "a", status: "paid", total: 10000, payMethod: "cash", createdAt: "2026-11-15T01:00:00Z", items: [{ name: "Espresso", qty: 2 }] },
    { id: "b", status: "paid", total: 5000, payMethod: "transfer", createdAt: "2026-11-15T02:00:00Z", items: [{ name: "Espresso", qty: 1 }, { name: "Roti", qty: 4 }] },
  ];
  const s = d.summarize(many, "2026-11-15T00:00:00Z", "2026-11-15T23:59:59Z");
  assert.strictEqual(s.revenue, 15000);
  assert.strictEqual(s.byPayMethod.cash, 10000);
  assert.strictEqual(s.byPayMethod.transfer, 5000);
  assert.strictEqual(s.topItems[0].name, "Roti");
  assert.strictEqual(s.topItems[0].qty, 4);
  assert.strictEqual(s.topItems[1].qty, 3);
});
