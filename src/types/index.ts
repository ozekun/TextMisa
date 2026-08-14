export interface User {
  id: number;
  username: string;
  nama_kbg: string;
}

export interface JadwalMisa {
  id: number;
  user_id: number;
  tanggal: string;
  waktu: string;
  jenis_perayaan: string;
  status: "Draft" | "Ready" | "Selesai";
  created_at: string;
}

export interface LaguMisa {
  id: number;
  misa_id: number;
  kategori: string; // "Pembukaan", "Kyrie", "Gloria", "Persembahan", "Sanctus", "Agnus Dei", "Komuni", "Penutup"
  urutan_lagu: number; // For Multi-Lagu
  header_buku?: string; // e.g., "Puji Syukur No. 320"
  judul_lagu: string;
  teks_reff?: string;
  teks_ayat_1: string;
  json_ayat_tambahan?: string; // stringified JSON array of additional verses
  susunan_nyanyi?: string; // e.g., "reff-ayat-reff"
  created_at: string;
}
