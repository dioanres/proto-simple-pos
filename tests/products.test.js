const { test, assert } = require("./harness");
const p = require("../js/products.js");

test("harga desimal atau negatif ditolak", () => {
  assert.strictEqual(p.validateProduct({ name: "A", category: "Kopi", price: -1, stock: 0 }).ok, false);
  assert.strictEqual(p.validateProduct({ name: "A", category: "Kopi", price: 10.5, stock: 0 }).ok, false);
});

test("nama kosong ditolak", () => {
  assert.strictEqual(p.validateProduct({ name: "  ", category: "Kopi", price: 1000, stock: 0 }).ok, false);
});

test("stok tidak boleh negatif", () => {
  const list = [{ id: "p1", name: "X", category: "Kopi", price: 1000, stock: 1 }];
  assert.throws(() => p.adjustStock(list, "p1", -2), /Stok tidak boleh negatif/);
});

test("formatRupiah memakai titik sebagai pemisah ribuan", () => {
  assert.strictEqual(p.formatRupiah(28000), "Rp 28.000");
});

test("upsertProduct menambah produk baru bila id kosong", () => {
  const out = p.upsertProduct([], { id: "", name: "Mocha", category: "Kopi", price: 30000, stock: 5 });
  assert.strictEqual(out.length, 1);
  assert.ok(out[0].id);
  assert.strictEqual(out[0].name, "Mocha");
});

test("upsertProduct mengubah produk yang sudah ada", () => {
  const list = [{ id: "p1", name: "Latte", category: "Kopi", price: 28000, stock: 5 }];
  const out = p.upsertProduct(list, { id: "p1", name: "Latte", category: "Kopi", price: 30000, stock: 5 });
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].price, 30000);
});
