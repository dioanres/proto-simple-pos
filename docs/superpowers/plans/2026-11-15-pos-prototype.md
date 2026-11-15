# Prototype POS Coffee Shop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun prototype POS berbasis HTML, CSS, dan JavaScript murni, dengan fokus pada form input sales, plus login, dashboard, produk/stok/harga, akun, dan download report CSV.

**Architecture:** Halaman statis `index.html` yang dibuka langsung di browser. Logika bisnis dipisah ke modul JS murni yang bisa diuji dengan Node. Data disimpan di localStorage melalui wrapper yang bisa diganti saat pengujian. Semua layar ada di satu halaman dan dipindah dengan menampilkan/menyembunyikan section.

**Tech Stack:** HTML5, CSS3, JavaScript (ES5/ES2015 gaya klasik, tanpa modul ES, tanpa build), localStorage, Node.js built-in `node:test` untuk pengujian logika.

**Spec:** `docs/superpowers/specs/2026-11-15-pos-prototype-design.md`

## Global Constraints

- Hanya HTML, CSS, dan JavaScript. Tanpa TypeScript, tanpa build step, tanpa framework.
- File harus bisa dibuka dengan `file://`. Karena itu tidak memakai `<script type="module">`; setiap file JS memakai namespace global `window.POS`.
- Data hanya di localStorage. Tidak ada request ke server.
- Format angka rupiah: `Rp 59.000` (pemisah ribuan titik, tanpa desimal).
- Nama kategori awal: Kopi, Non-kopi, Makanan.

## Review Focus

1. **Checkout tanpa item.** Keranjang kosong tidak boleh bisa disimpan atau dibayar. Diharapkan: ditolak dengan pesan jelas.
2. **Uang tunai kurang dari total.** Diharapkan: pembayaran Cash ditolak; kembalian tidak pernah negatif di layar.
3. **Open bill tanpa nomor meja.** Diharapkan: ditolak, meja wajib diisi.
4. **Jumlah melebihi stok.** Menambah item di atas stok tersedia ditolak.
5. **localStorage kosong atau rusak.** Diharapkan: aplikasi jalan dengan data contoh, tidak crash.

## Interface Contract (lintas task)

Semua modul logika disimpan di `js/` dan mendaftar ke `window.POS` di browser. Di Node, file yang sama diekspor lewat `module.exports` bila `module` tersedia. Pola ini ada di setiap file logika:

```js
if (typeof module !== "undefined") module.exports = { /* fungsi publik */ };
if (typeof window !== "undefined") { window.POS = window.POS || {}; window.POS.<nama> = { /* sama */ }; }
```

Bentuk data:
- `Product`: `{ id: string, name: string, category: string, price: number, stock: number }`
- `User`: `{ id: string, username: string, password: string, name: string, role: "superadmin" | "supervisor" | "cashier" }`
- `CartItem`: `{ productId: string, name: string, price: number, qty: number }`
- `Cart`: `{ items: CartItem[], table: string, payMethod: "cash" | "transfer" | "qris", paid: number }`
- `Order`: `{ id: string, table: string, items: CartItem[], total: number, payMethod: string, paid: number, change: number, status: "open" | "paid", createdAt: string }`

---

### Task 1: Kerangka halaman dan gaya dasar

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/app.js`

**Interfaces:**
- Consumes: none
- Produces: section `#login`, `#app` (berisi `#nav` dan `#screen-*`), dan `window.POS.app.showScreen(name)`.

- [ ] **Step 1: Buat `index.html`** dengan `<meta name="viewport">`, `<link rel="stylesheet" href="css/style.css">`, dan script tag `js/storage.js`, `js/sales.js`, `js/auth.js`, `js/products.js`, `js/accounts.js`, `js/dashboard.js`, `js/report.js`, `js/app.js` berurutan (klasik, tanpa `type="module"`). Isi body dengan section `#login` (form username/password) dan `#app` (sidebar `#nav`, area `#screen-kasir`, `#screen-dashboard`, `#screen-produk`, `#screen-akun`, `#screen-report`), semua `hidden` kecuali `#login`.
- [ ] **Step 2: Buat `css/style.css`** dengan variabel warna di `:root` (netral, krem dan cokelat sederhana), layout dua kolom untuk kasir (kiri katalog, kanan keranjang), dan media query agar di layar sempit kolom menjadi satu. Tanpa scroll horizontal.
- [ ] **Step 3: Buat `js/app.js`** yang mendaftarkan `window.POS.app.showScreen(name)` untuk menampilkan satu screen dan menyembunyikan yang lain.
- [ ] **Step 4: Verifikasi manual.** Buka `index.html` dengan double-click. Expected: halaman login tampil, tidak ada error di konsol, tidak ada scroll horizontal saat lebar jendela dikecilkan ke ±375px.

---

### Task 2: Penyimpanan dan data contoh

**Files:**
- Create: `js/storage.js`
- Test: `tests/storage.test.js`

**Interfaces:**
- Consumes: none
- Produces:
  - `loadData(storage) -> { products: Product[], users: User[], orders: Order[] }`
  - `saveData(storage, data) -> void`
  - `seedData() -> { products, users, orders }` (data contoh)

- [ ] **Step 1: Tulis test gagal** di `tests/storage.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const { loadData, saveData } = require("../js/storage.js");

function fakeStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
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
```

- [ ] **Step 2: Jalankan dan pastikan gagal.** Run: `node --test tests/storage.test.js`. Expected: FAIL, modul belum ada.
- [ ] **Step 3: Implementasi `js/storage.js`** dengan key tunggal `pos.data`. `seedData` berisi 6 produk (Espresso, Latte, Kopi Susu, Matcha, Croissant, Roti Coklat) dan 3 user (`admin/admin` superadmin, `spv/spv` supervisor, `kasir/kasir` cashier). `loadData` membungkus `JSON.parse` dalam try/catch dan memakai seed jika gagal. Pakai pola `module.exports` + `window.POS.storage`.
- [ ] **Step 4: Jalankan test, pastikan lulus.** Expected: 3 test PASS.

---

### Task 3: Logika keranjang dan transaksi

**Files:**
- Create: `js/sales.js`
- Test: `tests/sales.test.js`

**Interfaces:**
- Consumes: `Product`, `Cart`, `Order` dari Interface Contract.
- Produces:
  - `newCart() -> Cart`
  - `addItem(cart, product) -> Cart` (menaikkan qty bila item sudah ada; menolak bila qty akan melebihi `product.stock`, melempar `Error("Stok tidak cukup")`)
  - `setQty(cart, productId, qty) -> Cart` (qty <= 0 menghapus item)
  - `cartTotal(cart) -> number`
  - `changeDue(cart) -> number` (`paid - total`, bisa negatif bila kurang)
  - `validateCheckout(cart, mode, products) -> { ok: true } | { ok: false, error: string }` dengan `mode` `"pay"` atau `"openBill"`
  - `toOrder(cart, id, createdAt) -> Order`
  - `applyStock(products, cart) -> Product[]` (mengurangi stok sesuai qty tiap item; melempar `Error("Stok tidak cukup")` bila kurang)
  - `openBills(orders) -> Order[]`
  - `payOpenBill(orders, orderId, payMethod, paid) -> Order[]`

- [ ] **Step 1: Tulis test gagal** untuk kelima review focus transaksi:

```js
const test = require("node:test");
const assert = require("node:assert");
const s = require("../js/sales.js");

const latte = { id: "p2", name: "Latte", category: "Kopi", price: 28000, stock: 3 };

test("keranjang kosong ditolak untuk pay dan openBill", () => {
  const cart = s.newCart();
  assert.strictEqual(s.validateCheckout(cart, "pay", [latte]).ok, false);
  assert.strictEqual(s.validateCheckout(cart, "openBill", [latte]).ok, false);
});

test("pembayaran cash kurang dari total ditolak", () => {
  let cart = s.addItem(s.newCart(), latte);      // total 28000
  cart = { ...cart, payMethod: "cash", paid: 20000 };
  assert.strictEqual(s.validateCheckout(cart, "pay", [latte]).ok, false);
});

test("open bill tanpa meja ditolak", () => {
  const cart = s.addItem(s.newCart(), latte);
  assert.strictEqual(s.validateCheckout(cart, "openBill", [latte]).ok, false);
});

test("menambah item melebihi stok melempar error", () => {
  let cart = s.newCart();
  cart = s.addItem(cart, latte); cart = s.addItem(cart, latte); cart = s.addItem(cart, latte);
  assert.throws(() => s.addItem(cart, latte), /Stok tidak cukup/);
});

test("changeDue tidak negatif saat cash cukup", () => {
  let cart = s.addItem(s.newCart(), latte);
  cart = { ...cart, payMethod: "cash", paid: 30000 };
  assert.strictEqual(s.changeDue(cart), 2000);
});

test("payOpenBill mengubah status menjadi paid", () => {
  const order = { id: "o1", table: "05", items: [], total: 28000, payMethod: "cash", paid: 0, change: 0, status: "open", createdAt: "x" };
  const out = s.payOpenBill([order], "o1", "qris", 28000);
  assert.strictEqual(out[0].status, "paid");
  assert.strictEqual(out[0].payMethod, "qris");
});
```

- [ ] **Step 2: Jalankan dan pastikan gagal.** Run: `node --test tests/sales.test.js`. Expected: FAIL.
- [ ] **Step 3: Implementasi `js/sales.js`** sesuai signature di atas. `toOrder` tidak mengubah stok. Pengurangan stok lewat `applyStock`, dipanggil di Task 4 setiap kali order disimpan, baik sebagai open bill maupun paid. Keputusan ini dicatat di sini: stok berkurang saat transaksi disimpan, bukan saat dibayar. Tambahkan test: `applyStock` mengurangi stok `latte` dari 3 menjadi 1 untuk qty 2.
- [ ] **Step 4: Jalankan test, pastikan lulus.** Expected: semua test PASS.

---

### Task 4: Layar kasir

**Files:**
- Modify: `index.html` (isi `#screen-kasir`)
- Modify: `css/style.css` (gaya katalog dan keranjang)
- Create: `js/kasir.js`

**Interfaces:**
- Consumes: `POS.sales.*` termasuk `applyStock` (Task 3), `POS.storage.loadData` dan `saveData` (Task 2), `POS.app.showScreen` (Task 1).
- Produces: `window.POS.kasir.render()` dan `window.POS.kasir.init()`.

- [ ] **Step 1: Isi `#screen-kasir`** dengan kolom pencarian, filter kategori, grid produk, panel keranjang (meja, daftar item dengan `[-][+]`, total, pilihan Cash/Transfer/QRIS, input "Dibayar", kembalian, tombol `Simpan Open Bill` dan `Bayar`), serta indikator `Open Bill: N` di header.
- [ ] **Step 2: Implementasi `js/kasir.js`.** Setiap aksi memanggil fungsi di `POS.sales`, menyimpan data lewat `saveData`, lalu memanggil `render()`. Kolom pencarian otomatis fokus saat screen ditampilkan. Enter pada kolom pencarian menambah produk pertama yang namanya cocok. Error dari `validateCheckout` atau `addItem` ditampilkan di area pesan, tidak dengan `alert`.
- [ ] **Step 3: Verifikasi manual.** Buka `index.html`, login sebagai kasir, lalu:
  - Tambah Latte dua kali, Expected: qty 2, total Rp 56.000.
  - Pilih Cash, isi Dibayar 50.000, Expected: `Bayar` ditolak dengan pesan kurang bayar.
  - Isi Dibayar 60.000, Expected: kembalian Rp 4.000, `Bayar` berhasil, keranjang kosong.
  - Isi meja 05, tambah item, `Simpan Open Bill`, Expected: indikator Open Bill bertambah.
  - Ketik "lat" di pencarian lalu Enter, Expected: Latte ditambahkan.
  - Refresh halaman, Expected: open bill masih ada.

---

### Task 5: Login dan hak akses

**Files:**
- Create: `js/auth.js`
- Modify: `js/app.js` (login, logout, menu sesuai role)
- Test: `tests/auth.test.js`

**Interfaces:**
- Consumes: `User` dari Interface Contract, `POS.storage.loadData`.
- Produces:
  - `login(users, username, password) -> User | null`
  - `canAccess(role, screen) -> boolean`, dengan `screen` salah satu `"kasir" | "dashboard" | "produk" | "akun" | "report"`
    - superadmin: semua
    - supervisor: dashboard, produk, report (tidak akun, tidak kasir)
    - cashier: kasir saja

- [ ] **Step 1: Tulis test gagal** di `tests/auth.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
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
```

- [ ] **Step 2: Jalankan dan pastikan gagal.** Run: `node --test tests/auth.test.js`. Expected: FAIL.
- [ ] **Step 3: Implementasi `js/auth.js`** dan simpan sesi login di `sessionStorage` (key `pos.session`). Di `app.js`, sembunyikan menu yang tidak diizinkan dan arahkan ke `kasir` bila tidak punya akses ke screen aktif.
- [ ] **Step 4: Jalankan test, pastikan lulus.** Expected: 4 test PASS. Verifikasi manual: login sebagai kasir, menu hanya menampilkan Kasir.

---

### Task 6: Manajemen produk, stok, dan harga

**Files:**
- Modify: `index.html` (isi `#screen-produk`)
- Create: `js/products.js`
- Test: `tests/products.test.js`

**Interfaces:**
- Consumes: `Product` dari Interface Contract.
- Produces:
  - `validateProduct(input) -> { ok: true } | { ok: false, error: string }` (nama wajib, harga >= 0 bilangan bulat, stok >= 0 bilangan bulat, kategori wajib)
  - `upsertProduct(products, input) -> Product[]` (tambah bila `id` kosong, ubah bila ada)
  - `adjustStock(products, productId, delta) -> Product[]` (menolak stok di bawah 0 dengan `Error("Stok tidak boleh negatif")`)
  - `formatRupiah(n) -> string` (menghasilkan `Rp 28.000`)

- [ ] **Step 1: Tulis test gagal** di `tests/products.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
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
```

- [ ] **Step 2: Jalankan dan pastikan gagal.** Run: `node --test tests/products.test.js`. Expected: FAIL.
- [ ] **Step 3: Implementasi `js/products.js`** dan isi `#screen-produk` dengan tabel produk, form tambah/ubah, dan tombol `+` / `-` stok. Hanya superadmin dan supervisor yang bisa mengubah.
- [ ] **Step 4: Jalankan test, pastikan lulus.** Expected: 4 test PASS. Verifikasi manual: tambah produk baru, Expected: muncul di kasir.

---

### Task 7: Manajemen akun

**Files:**
- Modify: `index.html` (isi `#screen-akun`)
- Create: `js/accounts.js`
- Test: `tests/accounts.test.js`

**Interfaces:**
- Consumes: `User` dari Interface Contract.
- Produces:
  - `validateAccount(users, input) -> { ok: true } | { ok: false, error: string }` (username unik, role salah satu dari tiga nilai, password minimal 4 karakter)
  - `upsertAccount(users, input) -> User[]`
  - `removeAccount(users, userId, actingUserId) -> User[]` (menolak menghapus akun sendiri dan menghapus superadmin terakhir)

- [ ] **Step 1: Tulis test gagal** di `tests/accounts.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const acc = require("../js/accounts.js");

const users = [
  { id: "u1", username: "admin", password: "admin", name: "Admin", role: "superadmin" },
  { id: "u2", username: "kasir", password: "kasir", name: "Kasir", role: "cashier" },
];

test("username duplikat ditolak", () => {
  assert.strictEqual(acc.validateAccount(users, { username: "kasir", password: "1234", name: "X", role: "cashier" }).ok, false);
});

test("superadmin terakhir tidak bisa dihapus", () => {
  assert.throws(() => acc.removeAccount(users, "u1", "u2"), /superadmin/);
});

test("akun sendiri tidak bisa dihapus", () => {
  assert.throws(() => acc.removeAccount(users, "u2", "u2"), /sendiri/);
});
```

- [ ] **Step 2: Jalankan dan pastikan gagal.** Run: `node --test tests/accounts.test.js`. Expected: FAIL.
- [ ] **Step 3: Implementasi `js/accounts.js`** dan isi `#screen-akun` dengan tabel akun dan form. Hanya superadmin yang bisa mengakses screen ini.
- [ ] **Step 4: Jalankan test, pastikan lulus.** Expected: 3 test PASS.

---

### Task 8: Dashboard analitik

**Files:**
- Modify: `index.html` (isi `#screen-dashboard`)
- Create: `js/dashboard.js`
- Test: `tests/dashboard.test.js`

**Interfaces:**
- Consumes: `Order` dari Interface Contract.
- Produces:
  - `summarize(orders, fromDate, toDate) -> { revenue: number, count: number, byPayMethod: { cash, transfer, qris }, topItems: { name, qty }[] }` (hanya order `paid`, `createdAt` dalam rentang, `topItems` maksimal 5)

- [ ] **Step 1: Tulis test gagal** di `tests/dashboard.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
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
```

- [ ] **Step 2: Jalankan dan pastikan gagal.** Run: `node --test tests/dashboard.test.js`. Expected: FAIL.
- [ ] **Step 3: Implementasi `js/dashboard.js`** dan isi `#screen-dashboard` dengan kartu ringkasan (omzet, jumlah transaksi, metode pembayaran) dan daftar produk terlaris, dengan pilihan rentang hari ini, 7 hari, 30 hari. Gambar grafik sederhana dengan CSS (batang), tanpa library.
- [ ] **Step 4: Jalankan test, pastikan lulus.** Expected: test PASS. Verifikasi manual: setelah transaksi di kasir, angka omzet hari ini bertambah.

---

### Task 9: Download report CSV

**Files:**
- Modify: `index.html` (isi `#screen-report`)
- Create: `js/report.js`
- Test: `tests/report.test.js`

**Interfaces:**
- Consumes: `Order` dari Interface Contract.
- Produces:
  - `toCsv(orders) -> string` (header: `id,tanggal,meja,metode,total,dibayar,kembali,status,item`; item digabung dengan `; `; nilai yang mengandung koma atau kutip di-escape)
  - `downloadCsv(filename, text) -> void` (membuat Blob dan link unduh; hanya dipanggil dari UI)

- [ ] **Step 1: Tulis test gagal** di `tests/report.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
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
```

- [ ] **Step 2: Jalankan dan pastikan gagal.** Run: `node --test tests/report.test.js`. Expected: FAIL.
- [ ] **Step 3: Implementasi `js/report.js`** dan isi `#screen-report` dengan filter rentang tanggal dan tombol `Download CSV`. Nama file: `laporan-YYYY-MM-DD.csv`.
- [ ] **Step 4: Jalankan test, pastikan lulus.** Expected: 2 test PASS. Verifikasi manual: unduh CSV, buka di Excel atau teks biasa, Expected: kolom sesuai header.

---

### Task 10: Integrasi akhir dan verifikasi

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: semua `POS.*` dari task sebelumnya.
- Produces: none.

- [ ] **Step 1: Hubungkan semua screen** di `app.js`: setelah login, render menu sesuai role, dan panggil `init()` setiap modul yang tampil.
- [ ] **Step 2: Jalankan seluruh test.** Run: `node --test tests/`. Expected: semua test PASS.
- [ ] **Step 3: Verifikasi manual end-to-end.** Login sebagai kasir, buat transaksi cash dan open bill, lalu login sebagai superadmin, cek dashboard, tambah produk, dan unduh CSV. Expected: semua langkah berhasil tanpa error di konsol.
- [ ] **Step 4: Cek lebar layar.** Buka dengan lebar ±375px. Expected: tidak ada scroll horizontal di semua screen.

---

## Catatan Git

Folder ini belum berupa repository git dan pengguna belum meminta commit. Langkah commit dilewati. Bila repository dibuat nanti, commit per task bisa ditambahkan.
