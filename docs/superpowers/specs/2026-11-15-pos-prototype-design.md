# Desain Prototype POS Coffee Shop

Tanggal: 2026-11-15
Status: Disetujui pemilik proyek

## Tujuan dan Alasan

Prototype web POS untuk toko, dibuat untuk ditunjukkan ke calon client (pemilik coffee shop) atau pihak lain yang ingin dibuatkan web POS. Fokus utamanya adalah **form input sales**: kasir bisa memilih produk, mengatur jumlah, menentukan meja, memilih metode pembayaran, dan menyelesaikan transaksi dengan cepat. Layar lain tetap ada agar demo terasa lengkap.

## Sasaran

- Form input sales mudah dipakai tanpa penjelasan.
- Cukup lengkap untuk demo: login, dashboard analitik, transaksi, produk/stok/harga, akun, dan download report.
- Tampilan sederhana dan elegan.

## Bukan Sasaran

- Keamanan autentikasi sungguhan.
- Integrasi pembayaran (QRIS, transfer) dan verifikasi pembayaran.
- Sinkronisasi multi-perangkat.
- Backend atau database server.

## Anti-sasaran

- Form sales yang butuh banyak klik untuk transaksi sederhana.
- Tampilan yang ramai atau terlihat seperti prototype kasar di depan calon client.

## Batasan

- Hanya HTML, CSS, dan JavaScript murni. Tanpa TypeScript, tanpa build step, tanpa framework.
- Bisa dibuka langsung di browser sebagai file statis (`index.html`).
- Data disimpan di **localStorage**. Data hilang jika cache browser dibersihkan.
- Login dan peran (superadmin, cashier, supervisor) hanya simulasi di sisi klien.

## Pendekatan

1. **HTML + CSS + JS murni dengan localStorage** (dipilih). Paling sederhana, tanpa instalasi, mudah dibuka dan dibagikan.
2. Vite + TypeScript. Ditolak karena butuh build step, dan pemilik proyek memilih HTML dan JS saja.
3. Framework (React atau Vue). Ditolak karena berlebihan untuk prototype ini.
4. Backend dengan database. Ditolak karena di luar lingkup prototype.

## Bagian yang Sudah Diputuskan

### Layar Kasir (fokus utama)

```
+--------------------------------------------------------------+
| POS · Kasir                                   [Open Bill: 3] |
+-----------------------------+--------------------------------+
| [ Cari produk...        ]   | Meja: [ 05 ]                   |
| [Semua][Kopi][Non-kopi]     |--------------------------------|
|                             | Kopi Susu    2 x 22.000 [-][+] |
| [Espresso] [Latte]          | Roti Coklat  1 x 15.000 [-][+] |
| [Kopi Susu][Matcha]         |--------------------------------|
| [Croissant][Roti]           | Total          Rp 59.000       |
|                             | Bayar: (•)Cash ( )Transfer     |
|                             |        ( )QRIS                 |
|                             | Dibayar [ 60.000 ] Kembali 1.000|
|                             | [Simpan Open Bill] [ Bayar ]   |
+-----------------------------+--------------------------------+
```

- **Kiri**: katalog produk dengan pencarian dan filter kategori. **Kanan**: keranjang dan pembayaran.
- **Meja** wajib diisi untuk open bill, dan opsional untuk langsung bayar.
- **Open bill** disimpan per meja dan bisa dibayar nanti. Jumlah tagihan terbuka ditampilkan di pojok kanan atas.
- **Cash** menghitung kembalian otomatis. **Transfer** dan **QRIS** hanya mencatat metode, tanpa verifikasi.
- **Keyboard**: kolom pencarian langsung fokus, dan Enter menambah produk pertama yang cocok.

### Keputusan yang Saya Ambil Sendiri

- Nama kategori awal: Kopi, Non-kopi, Makanan. Bisa diganti.
- Data contoh (produk dan harga) diisi saat pertama kali dibuka, agar demo langsung terisi.
- Download report berformat CSV, karena paling sederhana dan bisa dibuka di Excel.
- Peran dan hak akses: superadmin mengelola semua, supervisor melihat dashboard dan report, cashier hanya bisa transaksi.

## Yang Masih Diserahkan ke Pelaksana

- Susunan detail layar selain kasir (login, dashboard, produk, akun, report).
- Desain visual (warna, font, ikon) selama tetap sederhana dan elegan.
- Struktur file dan cara membagi kode JavaScript.
- Cara pengujian, misalnya uji manual atau skrip sederhana.
