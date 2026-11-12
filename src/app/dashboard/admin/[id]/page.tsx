"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardNavbar from "@/components/DashboardNavbar";
import { useApp } from "@/context/AppContext";
import { DataLagu } from "@/types";
import { formatHeaderBuku, formatJudulLagu } from "@/utils/songSplitter";

interface PageProps {
  params: Promise<{ id: string }>;
}

function parseVerses(jsonStr?: string): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed.map((v) => String(v ?? "")) : [];
  } catch {
    return [];
  }
}

function AdminEditDataLaguPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const songId = parseInt(resolvedParams.id, 10);
  const isInvalidId = Number.isNaN(songId);

  const { currentUser, isLoading, fetchDataLaguById, updateDataLagu, deleteDataLagu } = useApp();

  const [song, setSong] = useState<DataLagu | null>(null);
  const [loadingSong, setLoadingSong] = useState(!isInvalidId);
  const [notFound, setNotFound] = useState(false);

  const [judul, setJudul] = useState("");
  const [headerBuku, setHeaderBuku] = useState("");
  const [susunan, setSusunan] = useState("ayat-only");
  const [teksReff, setTeksReff] = useState("");
  const [teksAyat1, setTeksAyat1] = useState("");
  const [extraVerses, setExtraVerses] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!localStorage.getItem("user")) {
      router.push("/login");
    }
  }, [isLoading, router]);

  const syncDraftFromSong = (target: DataLagu) => {
    setJudul(target.judul_lagu || "");
    setHeaderBuku(target.header_buku || "");
    setSusunan(target.susunan_nyanyi || "ayat-only");
    setTeksReff(target.teks_reff || "");
    setTeksAyat1(target.teks_ayat_1 || "");
    setExtraVerses(parseVerses(target.json_ayat_tambahan));
    setFormError(null);
  };

  useEffect(() => {
    if (currentUser?.role !== "admin" || isInvalidId) return;

    let active = true;
    fetchDataLaguById(songId).then(({ data, error }) => {
      if (!active) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setSong(data);
        syncDraftFromSong(data);
      }
      setLoadingSong(false);
    });
    return () => {
      active = false;
    };
  }, [currentUser?.role, songId, isInvalidId, fetchDataLaguById]);

  const isModified = useMemo(() => {
    if (!song) return false;
    return (
      judul !== (song.judul_lagu || "") ||
      headerBuku !== (song.header_buku || "") ||
      susunan !== (song.susunan_nyanyi || "ayat-only") ||
      teksReff !== (song.teks_reff || "") ||
      teksAyat1 !== (song.teks_ayat_1 || "") ||
      JSON.stringify(extraVerses) !== JSON.stringify(parseVerses(song.json_ayat_tambahan))
    );
  }, [song, judul, headerBuku, susunan, teksReff, teksAyat1, extraVerses]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-500 text-sm font-medium">Memuat halaman edit...</div>
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!song) return;

    if (!judul.trim() || !teksAyat1.trim()) {
      setFormError("Judul lagu dan Teks Ayat 1 wajib diisi.");
      return;
    }

    setFormError(null);
    setIsSaving(true);

    const { data, error } = await updateDataLagu(song.id, {
      judul_lagu: judul,
      header_buku: headerBuku,
      susunan_nyanyi: susunan,
      teks_reff: susunan === "ayat-only" ? "" : teksReff,
      teks_ayat_1: teksAyat1,
      json_ayat_tambahan: JSON.stringify(extraVerses),
    });

    setIsSaving(false);

    if (error || !data) {
      setFormError(error || "Gagal memperbarui data lagu.");
      return;
    }

    setSong(data);
    syncDraftFromSong(data);
    Swal.fire({
      icon: "success",
      title: "Lagu Diperbarui",
      text: `"${data.judul_lagu}" berhasil disimpan ke Data Lagu.`,
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  };

  const handleDelete = () => {
    if (!song) return;

    Swal.fire({
      title: "Hapus Lagu dari Data Lagu?",
      html: `Lagu <b>"${song.judul_lagu}"</b> akan dihapus permanen dari daftar pencarian.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      const ok = await deleteDataLagu(song.id);
      if (!ok) {
        Swal.fire({ icon: "error", title: "Gagal", text: "Tidak dapat menghapus lagu dari database." });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Terhapus",
        text: "Lagu dihapus dari Data Lagu.",
        timer: 1400,
        showConfirmButton: false,
      });
      router.push("/dashboard/admin");
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
          >
            <span>←</span>
            <span>Kembali ke Daftar Lagu</span>
          </Link>
        </div>

        {loadingSong ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-xs text-slate-400">
            Memuat detail lagu...
          </div>
        ) : notFound || isInvalidId || !song ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">Lagu Tidak Ditemukan</h2>
            <p className="text-xs text-text-sec">
              Data lagu tidak tersedia atau sudah dihapus.
            </p>
            <Link
              href="/dashboard/admin"
              className="inline-flex px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold"
            >
              Kembali ke Daftar Lagu
            </Link>
          </div>
        ) : (
          <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-8 shadow-xs">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-text-sec">
                    ID #{song.id}
                  </span>
                  <h1 className="text-xl font-black text-slate-900 truncate">
                    {song.judul_lagu}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="self-start sm:self-auto px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/70 text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Hapus Lagu
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Judul Lagu
                  </label>
                  <input
                    type="text"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    onBlur={(e) => setJudul(formatJudulLagu(e.target.value))}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    placeholder="Judul lagu"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Nomor Lagu / Sumber
                  </label>
                  <input
                    type="text"
                    value={headerBuku}
                    onChange={(e) => setHeaderBuku(e.target.value)}
                    onBlur={(e) => setHeaderBuku(formatHeaderBuku(e.target.value))}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    placeholder="Contoh: Puji Syukur 332 atau Madah Bhakti 180"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Susunan Urutan Nyanyi
                </label>
                <select
                  value={susunan}
                  onChange={(e) => setSusunan(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                >
                  <option value="ayat-only">Ayat Saja (Tanpa Reff)</option>
                  <option value="reff-ayat-reff">Reff - Ayat - Reff</option>
                  <option value="ayat-reff-ayat">Ayat - Reff - Ayat</option>
                </select>
              </div>

              {susunan !== "ayat-only" && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Teks Refrain (Reff)
                  </label>
                  <textarea
                    rows={3}
                    value={teksReff}
                    onChange={(e) => setTeksReff(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    placeholder="Lirik Reff..."
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Teks Ayat 1
                </label>
                <textarea
                  rows={4}
                  value={teksAyat1}
                  onChange={(e) => setTeksAyat1(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  placeholder="Lirik Ayat 1..."
                />
              </div>

              {extraVerses.map((verse, idx) => (
                <div key={idx} className="space-y-1.5 pt-2 border-t border-dashed border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Teks Ayat {idx + 2}
                    </label>
                    <button
                      type="button"
                      onClick={() => setExtraVerses((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-[11px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      Hapus Ayat {idx + 2}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={verse}
                    onChange={(e) =>
                      setExtraVerses((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                    }
                    className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    placeholder={`Lirik Ayat ${idx + 2}...`}
                  />
                </div>
              ))}

              <div>
                <button
                  type="button"
                  onClick={() => setExtraVerses((prev) => [...prev, ""])}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  + Tambah Ayat
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                {isModified && (
                  <button
                    type="button"
                    onClick={() => syncDraftFromSong(song)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Batalkan Perubahan
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!isModified || isSaving}
                  className="px-6 py-2.5 rounded-2xl bg-brand-primary hover:bg-brand-hover disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminEditDataLaguPage), { ssr: false });
