**Rules**

**UI/UX & Frontend Generation Rules**

Panduan dan aturan wajib bagi AI Agent dalam menghasilkan desain antarmuka (UI) dan kode frontend (HTML/Tailwind CSS/Framework lainnya) agar tetap bersih, terstruktur, dan profesional.

## **1\. Prinsip Desain Bersih & Terstruktur (Clean & Minimalist)**

* **Hindari "Clutter" (Kekacauan Visual):** Jangan menumpuk terlalu banyak elemen, kotak, atau border dalam satu area pandang. Berikan ruang kosong (*generous whitespace*) agar mata pengguna tidak lelah.  
* **Hierarki Visual yang Tegas:** Gunakan perbedaan ukuran font (`text-xl`, `text-2xl`, dll.), ketebalan (*font weight*), dan warna kontras untuk membedakan judul, sub-judul, dan isi teks.  
* **Layout Konsisten:** Gunakan sistem grid atau flexbox yang teratur (misalnya menggunakan Tailwind CSS grid/flex utilities) agar tata letak elemen sejajar dan rapi.

## **2\. Aturan Ketat Penggunaan Ikon (Minimalist Iconography)**

* **Larangan Penggunaan Ikon Berlebihan:** Jangan menyematkan ikon di setiap menu, teks, atau tombol secara berlebihan.  
* **Fungsi Utama Saja:** Ikon **hanya boleh digunakan** pada elemen esensial yang membutuhkan bantuan visual cepat, seperti:  
  * Tombol aksi utama (misal: tombol keluar/logout, tombol kembali/back).  
  * Indikator status (misal: titik hijau untuk status online/ready).  
* **Utamakan Tipografi:** Jika teks atau label sudah cukup jelas menjelaskan fungsinya, **jangan tambahkan ikon**. Lebih baikandalkan teks yang bersih dan penataan yang rapi.

## **3\. Konsistensi Desain & Komponen (Design System)**

* **Skema Warna Terbatas:** Gunakan maksimal 1 hingga 2 warna aksen utama (misalnya warna *Teal/Emerald* untuk brand utama) dipadukan dengan palet netral (Slate/Gray) untuk teks dan background.  
* **Radius Sudut Seragam:** Gunakan konsistensi pada bentuk elemen (*border-radius*). Jika menggunakan gaya *rounded* modern (seperti `rounded-2xl` atau `rounded-3xl`), pertahankan konsistensi tersebut pada seluruh card dan tombol.  
* **Warna Latar Belakang:** Gunakan transisi warna background yang fungsional (misalnya membedakan halaman utama dengan halaman form/workspace menggunakan warna *soft tint*) agar user tahu mereka berpindah konteks.

## **4\. Standar Kualitas Kode Frontend**

* **Semantik HTML:** Gunakan tag HTML yang tepat (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`) alih-alih hanya menumpuk tag `<div>`.  
* **Tailwind CSS Clean Classes:** Tulis kelas Tailwind secara terstruktur, hindari duplikasi kelas yang tidak perlu, dan pastikan desain bersifat responsif (*mobile-friendly*).

