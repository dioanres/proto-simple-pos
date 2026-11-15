const { test, assert } = require("./harness");
const s = require("../js/sales.js");

const latte = { id: "p2", name: "Latte", category: "Kopi", price: 28000, stock: 3 };

test("keranjang kosong ditolak untuk pay dan openBill", () => {
  const cart = s.newCart();
  assert.strictEqual(s.validateCheckout(cart, "pay", [latte]).ok, false);
  assert.strictEqual(s.validateCheckout(cart, "openBill", [latte]).ok, false);
});

test("pembayaran cash kurang dari total ditolak", () => {
  let cart = s.addItem(s.newCart(), latte);
  cart = Object.assign({}, cart, { payMethod: "cash", paid: 20000 });
  assert.strictEqual(s.validateCheckout(cart, "pay", [latte]).ok, false);
});

test("open bill tanpa meja ditolak", () => {
  const cart = s.addItem(s.newCart(), latte);
  assert.strictEqual(s.validateCheckout(cart, "openBill", [latte]).ok, false);
});

test("menambah item melebihi stok melempar error", () => {
  let cart = s.newCart();
  cart = s.addItem(cart, latte);
  cart = s.addItem(cart, latte);
  cart = s.addItem(cart, latte);
  assert.throws(() => s.addItem(cart, latte), /Stok tidak cukup/);
});

test("changeDue tidak negatif saat cash cukup", () => {
  let cart = s.addItem(s.newCart(), latte);
  cart = Object.assign({}, cart, { payMethod: "cash", paid: 30000 });
  assert.strictEqual(s.changeDue(cart), 2000);
});

test("payOpenBill mengubah status menjadi paid", () => {
  const order = { id: "o1", table: "05", items: [], total: 28000, payMethod: "cash", paid: 0, change: 0, status: "open", createdAt: "x" };
  const out = s.payOpenBill([order], "o1", "qris", 28000);
  assert.strictEqual(out[0].status, "paid");
  assert.strictEqual(out[0].payMethod, "qris");
});

test("applyStock mengurangi stok sesuai qty", () => {
  let cart = s.addItem(s.newCart(), latte);
  cart = s.addItem(cart, latte);
  const out = s.applyStock([latte], cart);
  assert.strictEqual(out[0].stock, 1);
});

test("formatRupiah memakai titik sebagai pemisah ribuan", () => {
  assert.strictEqual(s.formatRupiah(28000), "Rp 28.000");
  assert.strictEqual(s.formatRupiah(0), "Rp 0");
  assert.strictEqual(s.formatRupiah(1234567), "Rp 1.234.567");
});
