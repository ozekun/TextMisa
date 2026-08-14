"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import DashboardNavbar from "@/components/DashboardNavbar";
import Link from "next/link";
import Swal from "sweetalert2";

import dynamic from "next/dynamic";

function DashboardHome() {
  const { currentUser, misaList, addMisa, songs, deleteMisa, updateMisaStatus } = useApp();
  const router = useRouter();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [jenisPerayaan, setJenisPerayaan] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [waktu, setWaktu] = useState("");
  const [error, setError] = useState("");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Authenticate Guard
  useEffect(() => {
    if (mounted) {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/login");
      }
    }
  }, [currentUser, router, mounted]);

  if (!mounted || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 font-medium">Memuat data...</div>
      </div>
    );
  }

  // Filter Active Misa (Draft and Ready). 
  // Temporarily removing user_id check as Supabase schema expects UUID but mock user is integer.
  const activeMisa = misaList.filter((m) => m.status !== "Selesai");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenisPerayaan.trim() || !tanggal || !waktu) {
      setError("Semua kolom form wajib diisi.");
      return;
    }

    const result = await addMisa({
      jenis_perayaan: jenisPerayaan,
      tanggal: tanggal,
      waktu: waktu,
      status: "Draft",
    });

    if (!result) {
      setError("Gagal menyimpan jadwal misa ke database. Pastikan koneksi Supabase Anda sudah benar.");
      return;
    }

    // Reset Form & Close Modal
    setJenisPerayaan("");
    setTanggal("");
    setWaktu("");
    setError("");
    setModalOpen(false);

    Swal.fire({
      title: "Jadwal Misa Berhasil Ditambahkan!",
      icon: "success",
      draggable: true
    });
  };

  const handleArchiveMisa = async (misaId: number) => {
    Swal.fire({
      title: "Hapus Jadwal Misa?",

      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#1b3151ff",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await updateMisaStatus(misaId, "Selesai");
          Swal.fire({
            title: "Berhasil Terhapus",

            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (err) {
          Swal.fire({
            title: "Gagal!",
            text: "Gagal mengarsipkan jadwal misa.",
            icon: "error",
          });
        }
      }
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Ready":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Draft":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // Helper to count songs added for a misa
  const getSongsCount = (misaId: number) => {
    return songs.filter((s) => s.misa_id === misaId).length;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-8">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Jadwal Misa
            </h1>
            <p className="text-sm text-text-sec mt-1">
              Kelola daftar penugasan running teks liturgi perayaan Ekaristi
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="self-start sm:self-center inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            + Buat Jadwal Misa Baru
          </button>
        </div>

        {/* Schedules Grid */}
        {activeMisa.length === 0 ? (
          <div className="bg-white rounded-4xl border border-slate-100 p-16 text-center space-y-4 max-w-xl mx-auto shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">Belum Ada Jadwal</h3>
            <p className="text-xs text-text-sec max-w-sm mx-auto leading-relaxed">
              Tidak ada jadwal misa aktif saat ini. Silakan buat jadwal misa baru untuk mulai menginput lirik lagu liturgi.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-2 inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-xl transition-all"
            >
              Buat Jadwal Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeMisa.map((misa) => {
              const count = getSongsCount(misa.id);
              return (
                <div
                  key={misa.id}
                  className="bg-white border border-slate-100 hover:border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Status & ID Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                          misa.status
                        )}`}
                      >
                        {misa.status === "Draft"
                          ? "Draft"
                          : misa.status === "Ready"
                            ? "Ready"
                            : "Belum Diisi"}
                      </span>
                      <span className="text-[10px] text-text-sec font-medium">
                        ID: #{misa.id}
                      </span>
                    </div>

                    {/* Mass Title */}
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-2">
                        {misa.jenis_perayaan}
                      </h3>
                      <p className="text-xs text-text-sec mt-1 font-medium">
                        Petugas: {currentUser.nama_kbg}
                      </p>
                    </div>

                    {/* DateTime & Song Info */}
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="block text-[10px] text-text-sec uppercase tracking-wider">
                          Tanggal & Waktu
                        </span>
                        <span className="font-semibold text-slate-800 block">
                          {misa.tanggal}
                        </span>
                        <span className="text-[10px] font-semibold text-text-sec block mt-0.5">
                          {misa.waktu} WITA
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-text-sec uppercase tracking-wider">
                          Lagu Terisi
                        </span>
                        <span className="font-semibold text-slate-800">
                          {count === 0 ? "Belum Diisi" : `${count} Lagu`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2">
                    <Link
                      href={`/dashboard/misa/${misa.id}`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-3 text-xs font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-2xl transition-all shadow-sm hover:shadow-md text-center"
                    >
                      {count === 0 ? "Isi Lagu Misa" : "Edit Lagu Misa"}
                    </Link>
                    <button
                      onClick={() => handleArchiveMisa(misa.id)}
                      className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all border border-red-100/50 flex items-center justify-center shrink-0 cursor-pointer"
                      title="Arsipkan Jadwal Misa"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-4xl max-w-md w-full p-8 shadow-2xl border border-slate-100 space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Buat Jadwal Misa Baru
              </h2>
              <p className="text-xs text-text-sec mt-1">
                Masukkan informasi jadwal liturgi Misa yang bertugas
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-red-50 text-[11px] font-medium text-red-600 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Jenis Perayaan Ekaristi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Misa Hari Minggu Biasa XX"
                  value={jenisPerayaan}
                  onChange={(e) => setJenisPerayaan(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Waktu (WITA)
                  </label>
                  <input
                    type="time"
                    required
                    value={waktu}
                    onChange={(e) => setWaktu(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setError("");
                  }}
                  className="w-1/2 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow-md"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(DashboardHome), { ssr: false });
