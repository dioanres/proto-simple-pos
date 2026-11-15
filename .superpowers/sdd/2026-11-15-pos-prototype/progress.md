# SDD ledger — plan: docs/superpowers/plans/2026-11-15-pos-prototype.md
Ruling: Folder tidak berupa repo git dan commit belum diminta — skrip git-based dilewati, test dijalankan manual, tiap task dicatat di ledger ini — dampak: tidak ada riwayat commit per task, review range tidak bisa diukur dengan git.
Task 0 (pre-flight): Ruling: Node v16 tidak punya node:test — dipakai tests/harness.js sebagai pengganti, test file memakai require("./harness") — dampak: perintah 'node --test' di plan diganti 'node tests/<file>'.
Pre-flight: Interface Contract mengikat semua task; konsumen (Task 3 → Task 4, Task 2 → Task 4, Task 5 → Task 10) dicek saat task masing-masing.
Task 2: Ruling: loadData menerima storage sebagai parameter (bukan global) — agar bisa diuji di Node — dampak kecil, UI memanggil dengan window.localStorage.
Task 2: complete (tests: node tests/storage.test.js → 3 passed, 0 failed)
Task 3: Ruling: toOrder punya parameter keempat opsional 'status' (default 'paid') — agar order open bill bisa dibuat tanpa mengubah interface 3 argumen — dampak: pemanggil lama tetap jalan.
Task 3: complete (tests: node tests/sales.test.js → 7 passed, 0 failed)
Task 1: complete (kerangka index.html, css/style.css, js/app.js; verifikasi visual ditunda ke Task 10 — skrip modul lain di index.html belum ada sampai task masing-masing)
Task 3: Ruling: formatRupiah ditaruh di sales.js (bukan products.js) karena layar kasir butuh lebih dulu — Task 6 cukup mengekspor ulang — dampak: tidak ada.
Task 4: Ruling: Tambah fitur 'Muat' open bill ke keranjang — spec 'bisa dibayar nanti' tidak bisa dicapai tanpa ini — saat bill dimuat, item dikunci (stok sudah dikurangi saat disimpan) dan hanya metode bayar serta uang dibayar yang bisa diubah — dampak: operator tidak bisa mengedit item bill terbuka; harus kosongkan lalu buat ulang.
Task 4: Ruling: validasi stok saat bayar bill terbuka memakai stok yang dikembalikan sementara sesuai isi bill — dampak: kalau stok berubah dari luar (tidak mungkin di prototype ini), angka bisa keliru.
Task 5: complete (tests: node tests/auth.test.js → 4 passed, 0 failed); app.js dihubungkan ke login, menu per peran, dan init tiap layar; verifikasi browser ditunda ke Task 10.
Task 6: complete (tests: node tests/products.test.js → 6 passed, 0 failed); layar produk & stok (tabel, ±stok, form tambah/ubah) ditambahkan, verifikasi browser ditunda ke Task 10.
Task 7: Ruling: password kosong saat ubah akun berarti 'tidak diganti' — spec tidak mengatur — dampak: tidak bisa mengosongkan password (memang dilarang oleh aturan minimal 4 karakter).
Task 7: complete (tests: node tests/accounts.test.js → 6 passed, 0 failed); layar akun ditambahkan, verifikasi browser ditunda ke Task 10.
Task 8: complete (tests: node tests/dashboard.test.js → passed); dashboard dengan rentang, kartu omzet, bar metode bayar, dan produk terlaris; verifikasi browser ditunda ke Task 10.
Task 9: Ruling: format item di CSV 'Nama xQty' digabung '; ' — spec tidak mengatur — dampak: format kolom item bisa diubah. Ruling: BOM UTF-8 ditambahkan agar Excel membaca karakter Indonesia dengan benar.
Task 9: complete (tests: node tests/report.test.js → 3 passed, 0 failed); layar report dan unduh CSV ditambahkan, verifikasi browser ditunda ke Task 10.
Task 10: Ruling: verifikasi browser tidak bisa dilakukan — ekstensi Chrome tidak terhubung — dampak: UI (kasir, produk, akun, dashboard, report, login) belum diuji secara visual atau interaktif; hanya logika yang diuji (32 test, 7 file) dan sintaks diperiksa dengan node --check.
Task 10: complete (tests: for f in tests/*.test.js → 32 passed, 0 failed); verifikasi manual browser BELUM dilakukan.
Ruling: Tema diubah ke dasar putih dengan gradient biru (permintaan pemilik) — mode gelap dihapus karena bertentangan dengan dasar putih — dampak: tampilan gelap sistem tidak lagi didukung.
Ruling: Biru dibuat lebih gelap (accent #1e40af, gradient sampai #1e3a8a) atas permintaan pemilik — dampak: kontras teks putih di tombol naik, aman.
