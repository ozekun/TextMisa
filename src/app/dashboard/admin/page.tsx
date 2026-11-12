"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/DashboardNavbar";
import { useApp } from "@/context/AppContext";
import { DataLagu } from "@/types";

type CategoryFilter = "all" | "ordinarium" | "lainnya";

// shortcut: klasifikasi dari judul agar tidak perlu tambah kolom kategori di data_lagu; upgrade ke kolom kategori jika ada judul ordinarium non-standar
function classifyCategory(judulLagu: string): Exclude<CategoryFilter, "all"> {
  const title = judulLagu.trim().toLowerCase();
  if (/\b(?:kyrie|tuhan kasihanilah|gloria|kemuliaan|sanctus|agnus dei|anak domba)\b|^kudus\b/i.test(title)) {
    return "ordinarium";
  }
  return "lainnya";
}

function AdminDataLaguPage() {
  const router = useRouter();
  const { currentUser, isLoading, fetchDataLagu } = useApp();

  const [dataSongs, setDataSongs] = useState<DataLagu[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  useEffect(() => {
    if (isLoading) return;
    if (!localStorage.getItem("user")) {
      router.push("/login");
    }
  }, [isLoading, router]);

  const loadAllSongs = async () => {
    setLoadingSongs(true);
    setLoadError(false);
    const { data, error } = await fetchDataLagu();
    setDataSongs(data);
    setLoadError(error);
    setLoadingSongs(false);
  };

  useEffect(() => {
    if (currentUser?.role !== "admin") return;
    let active = true;
    fetchDataLagu().then(({ data, error }) => {
      if (!active) return;
      setDataSongs(data);
      setLoadError(error);
      setLoadingSongs(false);
    });
    return () => {
      active = false;
    };
  }, [currentUser?.role, fetchDataLagu]);

  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dataSongs.filter((song) => {
      if (categoryFilter !== "all" && classifyCategory(song.judul_lagu) !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        song.judul_lagu.toLowerCase().includes(q) ||
        (song.header_buku || "").toLowerCase().includes(q)
      );
    });
  }, [dataSongs, searchQuery, categoryFilter]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-500 text-sm font-medium">Memuat halaman admin...</div>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-white p-8 sm:p-10 border border-slate-100 shadow-xl rounded-4xl max-w-md w-full space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto text-lg font-extrabold">
            !
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-900">Akses Khusus Admin</h2>
            <p className="text-xs text-text-sec leading-relaxed">
              Halaman pengelolaan Data Lagu hanya dapat diakses menggunakan akun Admin KOMSOS.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl text-xs font-bold transition-all"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Data Lagu Misa
            </h1>
            <p className="text-xs sm:text-sm text-text-sec mt-1">
              Periksa daftar lagu tersimpan. Klik lagu untuk edit atau hapus.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700">
              {dataSongs.length} Lagu
            </span>
            <button
              type="button"
              onClick={loadAllSongs}
              disabled={loadingSongs}
              className="px-4 py-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              Muat Ulang
            </button>
          </div>
        </div>

        {loadError ? (
          <div className="bg-white border border-amber-200 rounded-3xl p-8 text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-base font-extrabold text-slate-900">Tabel data_lagu Belum Tersedia</h2>
            <p className="text-xs text-text-sec leading-relaxed">
              Jalankan script <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">supabase/data_lagu.sql</code> di SQL Editor Supabase terlebih dahulu, lalu muat ulang halaman ini.
            </p>
            <button
              type="button"
              onClick={loadAllSongs}
              className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
            {/* Card Kiri: Pencarian & Filter Kategori */}
            <aside className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 lg:sticky lg:top-24">
              <div className="relative">
                <svg
                  className="w-4 h-4 text-brand-primary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul atau nomor lagu..."
                  className="block w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus pencarian"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm font-bold cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: "all" as const, label: "Semua" },
                  { key: "ordinarium" as const, label: "Ordinarium" },
                  { key: "lainnya" as const, label: "Lainnya" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setCategoryFilter(opt.key)}
                    className={`py-2 px-2 rounded-xl border text-xs font-extrabold text-center transition-all cursor-pointer ${
                      categoryFilter === opt.key
                        ? "bg-brand-primary border-brand-primary text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </aside>

            {/* Card Kanan: Daftar Lagu */}
            <section className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-xs">
              {loadingSongs ? (
                <div className="py-12 text-center text-xs text-slate-400">Memuat daftar lagu...</div>
              ) : filteredSongs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  {dataSongs.length === 0
                    ? "Belum ada lagu tersimpan di Data Lagu."
                    : "Tidak ada lagu yang cocok dengan pencarian atau kategori."}
                </div>
              ) : (
                <div className="space-y-6">
                  {[
                    {
                      key: "ordinarium" as const,
                      title: "Ordinarium",
                      items: filteredSongs.filter((s) => classifyCategory(s.judul_lagu) === "ordinarium"),
                    },
                    {
                      key: "lainnya" as const,
                      title: "Lainnya",
                      items: filteredSongs.filter((s) => classifyCategory(s.judul_lagu) === "lainnya"),
                    },
                  ]
                    .filter((group) => group.items.length > 0)
                    .map((group) => (
                      <div key={group.key} className="space-y-1">
                        <div className="flex items-baseline justify-between px-3 pb-2.5 border-b border-slate-200/80">
                          <h2 className="font-serif font-semibold text-base text-slate-500 tracking-wide">
                            {group.title}
                          </h2>
                          <span className="text-xs font-medium text-slate-400 tabular-nums">
                            {group.items.length} Lagu
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {group.items.map((song) => (
                            <Link
                              key={song.id}
                              href={`/dashboard/admin/${song.id}`}
                              className="flex items-center justify-between gap-4 px-3 py-3.5 hover:bg-teal-50/40 rounded-2xl transition-colors group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-base font-bold text-slate-900 group-hover:text-brand-primary truncate">
                                  {song.judul_lagu}
                                </span>
                                {song.header_buku && (
                                  <>
                                    <span className="text-base text-slate-300 shrink-0" aria-hidden="true">|</span>
                                    <span className="text-sm font-semibold text-text-sec shrink-0">
                                      {song.header_buku}
                                    </span>
                                  </>
                                )}
                              </div>

                              <svg
                                className="w-4 h-4 text-slate-400 group-hover:text-brand-primary transition-colors shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminDataLaguPage), { ssr: false });
