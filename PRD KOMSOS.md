**PRD**

**MisaText**

## **1\. Ringkasan Eksekutif & Tujuan Produk**

**MisaText** adalah platform web otomatisasi running teks perayaan Ekaristi Misa Gereja Katolik yang terintegrasi secara langsung dengan sistem *broadcast graphics* SPX Graphics.

Platform ini dirancang khusus untuk memudahkan **Petugas Liturgi Kelompok Umat Basis (KBG)** dalam menginput jadwal, menyusun lirik lagu per bagian liturgi, dan menyiapkan running teks perayaan Ekaristi secara akurat, rapi, dan otomatis.

## **2\. Pengguna & Hak Akses (User Roles)**

| Peran Pengguna | Deskripsi Tugas & Hak Akses |
| :---- | :---- |
| **Petugas Liturgi (KBG / Lingkungan)** | Menginput jadwal Misa tugas KBG, memasukkan lirik lagu per Bagian Liturgi, menggunakan fitur *Auto-Split* lirik, menyusun *Multi-Lagu*, serta mengubah status Misa dari *Draft* menjadi *Ready*. |

## **3\. Alur Pengguna (User Journey & System Flow)**

\[Public Landing Page\] ➔ \[Button Login\] ➔ \[Login View: Username & Password\]  
                                                  │  
                                                  ▼  
                                            \[Home Page\] ◄──► \[Riwayat Page\]  
                                                  │  
                                                  └─► \[Halaman Khusus Form Input Lagu (Workspace)\]

1. **Akses Awal (Public Landing Page):** Pengguna mengakses halaman web informasi yang memuat penjelasan singkat mengenai aplikasi, dilengkapi dengan tombol utama yang mengarahkan user menuju halaman login.  
2. **Autentikasi (Login View):** Pengguna melakukan autentikasi menggunakan **Username & Password**.  
3. **Halaman Utama & Navigasi (After Login):** Setelah berhasil masuk, user diarahkan ke halaman **Home**. Navbar dirancang sangat bersih dengan **2 menu utama (Home & Riwayat)** serta **Icon Profile User** di sudut kanan atas yang menyediakan menu dropdown untuk melihat informasi akun dan melakukan *Logout*.  
4. **Halaman Khusus Form Input Lagu (Workspace):** Saat kartu Misa diklik (Isi Lagu / Edit Lagu), latar belakang halaman otomatis berubah menjadi **Emerald Soft Green** (\#f0fdfa) untuk memberikan indikator visual perpindahan halaman, dilengkapi tombol kembali cepat (← Kembali ke Home).

## **4\. Spesifikasi Detail Fungsionalitas Per Halaman**

### **4.1 Landing Page (Public / Sebelum Login)**

* **Struktur & Navigasi:** Navbar minimalis dengan Logo MisaText ("Misa" warna gelap, "Text" warna teal \#0d9488) dan tombol rounded pill Masuk / Login.  
* **Konten Utama:** Menampilkan header informatif mengenai solusi otomatisasi teks perayaan Ekaristi, deskripsi platform, serta tombol CTA utama menuju halaman login.

### **4.2 Autentikasi (Login View)**

* Halaman login terdedikasi dengan kartu card putih bersih berstandar *rounded-4xl*.  
* Metode login menggunakan **Username & Password** standar akun KBG.  
* Tombol aksi *"Autentikasi & Masuk"* serta tombol navigasi kembali ke beranda.

### **4.3 Navigasi Setelah Login (Clean Minimalist Navbar)**

* Latar belakang putih transparan dengan efek *glassmorphism* tipis.  
* **Menu Navigasi Kiri/Tengah:** Pill container berisi 2 menu utama: **Home** dan **Riwayat**.  
* **Icon Profile Kanan:** Icon huruf inisial akun (misal: *KB* untuk KBG) yang ketika diklik akan memunculkan *dropdown profile* berisi informasi identitas KBG dan tombol **Logout / Keluar**.

### **4.4 Halaman Beranda (Home & Manajemen Jadwal Misa)**

* **Action Bar:** Tombol \+ Buat Jadwal Misa Baru untuk menambahkan perayaan Ekaristi baru.  
* **Kartu Jadwal Misa:**  
  * Indikator status (*Ready*, *Draft*, *Belum Diisi*), Tanggal, Waktu (WITA), dan nama Petugas/KBG.  
  * Tombol interaktif Isi Lagu / Edit Lagu untuk masuk ke ruang kerja pengisian lirik.

### **4.5 Workspace Pengisian Lagu (Halaman Khusus)**

* **Indikator Visual Perubahan Halaman:** Seluruh latar belakang (*body*) berubah menjadi **Emerald Soft Green** (bg-emerald-50/70).  
* **Tombol Navigasi Cepat:** Tombol kontras tinggi ← Kembali ke Home.  
* **Tab Kategori Lagu (8 Bagian Liturgi):**  
  * 1\. Pembukaan  
  * 2\. Kyrie (Tuhan Kasihanilah Kami) — *Ordinarium*  
  * 3\. Gloria (Kemuliaan) — *Ordinarium*  
  * 4\. Persembahan  
  * 5\. Sanctus (Kudus) — *Ordinarium*  
  * 6\. Agnus Dei (Anak Domba Allah) — *Ordinarium*  
  * 7\. Komuni (+ Multi)  
  * 8\. Penutup (+ Multi)  
* **Aturan Logika Berdasarkan Jenis Lagu:**  
  * **Kategori Ordinarium (*Kyrie, Gloria, Sanctus, Agnus Dei*):** Susunan urutan nyanyi disembunyikan, form REFF disembunyikan dan dikosongkan, serta tombol tambah ayat disembunyikan (hanya menyisakan 1 form Teks Ayat 1).  
  * **Kategori Non-Ordinarium:** Menampilkan dropdown susunan nyanyi, form REFF, dan tombol tambah ayat dinamis (\+ Tambah Ayat Baru).  
  * **Fitur Multi-Lagu (*Komuni & Penutup*):** Menyediakan tombol tambah lagu tambahan untuk mengakomodasi kebutuhan lebih dari 1 lagu pada bagian tersebut.  
* **Auto-Split & Real-Time SPX Preview:**  
  * Lirik dibagi otomatis maksimal **2 baris per slide**.  
  * Tag nomor ayat \<nr\>1\</nr\>, \<nr\>2\</nr\>, dst. disisipkan otomatis hanya pada slide pertama masing-masing ayat.  
  * Pratinjau kartu SPX Graphics secara *real-time* merefleksikan hasil pemformatan lirik.

### **4.6 Halaman Riwayat (Riwayat Misa)**

* Menyediakan tabel arsip perayaan Ekaristi yang telah selesai disusun dan disiarkan di waktu lampau.

## **5\. Design System & Spesifikasi Visual UI/UX**

* **Gaya Desain:** *Modern Soft Minimalist SaaS* dengan *Rounded Geometry*. Dirancang bersih tanpa ikon grafis berlebih (*clean typography & badge focus*).  
* **Tipografi:** *Google Fonts: Plus Jakarta Sans & Nunito* (Karakter huruf *soft rounded geometry*).  
* **Skema Warna (Color Tokens):**  
  * **Primary Accent (Teal):** \#0d9488 (Brand 600\) / Hover: \#0f766e (Brand 700\)  
  * **Dark Accent (Navy/Dark Teal):** \#0a233a (Brand Dark / SPX Card Preview)  
  * **Canvas Background (Standard):** \#f8fafc (Slate 50\)  
  * **Workspace Active Background:** \#f0fdfa (Emerald 50 Soft Green Tint)  
  * **Surface / Card:** \#ffffff (Pure White)  
  * **Text Primary:** \#0f172a (Near-Black, Rasio Kontras Tinggi — WCAG AAA)  
  * **Text Secondary:** \#64748B (Slate Gray)  
* **Bentuk & Corner Radius:**  
  * *Main Card:* 24px – 32px (rounded-3xl / rounded-4xl)  
  * *Inputs & Controls:* 12px – 16px (rounded-xl / rounded-2xl)  
  * *Badges & Action Buttons:* Full pill (rounded-full / rounded-2xl)

