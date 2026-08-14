**ERD**

**1\. Diagram ER (Mermaid Format)**  
Cuplikan kode  
erDiagram  
    USER ||--o{ JADWAL\_MISA : "mengelola"  
    JADWAL\_MISA ||--o{ LAGU\_MISA : "berisi"

    USER {  
        int id PK  
        string username  
        string password  
        string nama\_kbg  
        datetime created\_at  
    }

    JADWAL\_MISA {  
        int id PK  
        int user\_id FK  
        date tanggal  
        string waktu  
        string jenis\_perayaan  
        string status "Draft / Ready / Selesai"  
        datetime created\_at  
    }

    LAGU\_MISA {  
        int id PK  
        int misa\_id FK  
        string kategori "Pembukaan, Kyrie, Gloria, dll"  
        int urutan\_lagu "Untuk Multi-Lagu"  
        string header\_buku "Contoh: Puji Syukur No. 320"  
        string judul\_lagu  
        text teks\_reff  
        text teks\_ayat\_1  
        text json\_ayat\_tambahan "Menyimpan Ayat 2, 3, dst"  
        string susunan\_nyanyi "reff-ayat-reff, dll"  
        datetime created\_at  
    }

### **2\. Penjelasan Relasi & Struktur Tabel**

1. **Tabel `users` (Akun Petugas KBG)**  
   * Menyimpan data kredensial login petugas liturgi per Kelompok Umat Basis (tanpa token statis di database, berbasis autentikasi *username & password*).  
   * Relasi: **One-to-Many** ke tabel `jadwal_misa` (Satu akun KBG dapat membuat dan mengelola banyak jadwal perayaan Misa).  
2. **Tabel `jadwal_misa` (Perayaan Ekaristi)**  
   * Menyimpan informasi utama suatu perayaan Misa (Hari/Tanggal, Waktu WITA, Jenis Perayaan seperti *Misa Minggu Biasa XX*, serta status Misa: `Draft`, `Ready`, atau `Selesai Siaran` yang otomatis masuk ke menu Riwayat).  
   * Relasi: **One-to-Many** ke tabel `lagu_misa` (Satu jadwal Misa memiliki beberapa bagian lagu liturgi).  
3. **Tabel `lagu_misa` (Detail Lirik & Bagian Liturgi)**  
   * Menyimpan rincian lirik lagu berdasarkan kategori liturgi (`Pembukaan`, `Kyrie`, `Gloria`, `Persembahan`, `Sanctus`, `AgnusDei`, `Komuni`, `Penutup`).  
   * Mendukung fitur **Multi-Lagu** melalui kolom `urutan_lagu` dan **Ayat Dinamis** melalui kolom `json_ayat_tambahan`.  
   * Khusus kategori Ordinarium (*Kyrie, Gloria, Sanctus, AgnusDei*), kolom `teks_reff` dan `susunan_nyanyi` akan bernilai kosong/null karena hanya memerlukan 1 blok teks ayat utama.

