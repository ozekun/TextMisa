"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import DashboardNavbar from "@/components/DashboardNavbar";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";

function RiwayatPage() {
  const { currentUser, misaList, updateMisaStatus } = useApp();
  const router = useRouter();
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

  // Filter completed Misa schedules (Selesai).
  // Temporarily removing user_id check since mock user ID (integer) fails Supabase UUID check.
  const completedMisa = misaList.filter((m) => m.status === "Selesai");

  const handleRestore = async (id: number) => {
    const targetMisa = misaList.find((m) => m.id === id);
    if (!targetMisa) {
      Swal.fire({
        title: "Gagal!",
        text: "Jadwal Misa tidak ditemukan.",
        icon: "error"
      });
      return;
    }

    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold transition-all shadow-sm mx-1 active:scale-95 cursor-pointer",
        cancelButton: "px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold transition-all shadow-sm mx-1 active:scale-95 cursor-pointer"
      },
      buttonsStyling: false
    });

    swalWithBootstrapButtons.fire({
      title: "Pulihkan Misa ke Draft?",
      text: "Misa ini akan kembali tampil di dashboard utama dan dapat disunting kembali.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Pulihkan Misa",
      cancelButtonText: "Batal",
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await updateMisaStatus(id, "Draft");
          await swalWithBootstrapButtons.fire({
            title: "Dipulihkan!",
            text: "Jadwal Misa berhasil dikembalikan ke status Draft.",
            icon: "success",
            confirmButtonText: "OK"
          });
          router.push("/dashboard");
        } catch (err) {
          Swal.fire({
            title: "Gagal!",
            text: "Gagal memulihkan status Misa.",
            icon: "error"
          });
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Perayaan Ekaristi
          </h1>
          <p className="text-xs sm:text-sm text-text-sec mt-1">
            Arsip penulisan running teks liturgi misa yang telah selesai disiarkan
          </p>
        </div>

        {completedMisa.length === 0 ? (
          <div className="bg-white rounded-3xl sm:rounded-4xl border border-slate-100 p-8 sm:p-16 text-center space-y-4 max-w-xl mx-auto shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Belum Ada Riwayat</h3>
            <p className="text-xs text-text-sec max-w-sm mx-auto leading-relaxed">
              Daftar riwayat perayaan Ekaristi akan tampil di sini setelah Anda menyelesaikan penayangan siaran misa dari dashboard utama.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Responsive Cards (No Horizontal Scrolling) */}
            <div className="md:hidden space-y-3.5">
              {completedMisa.map((misa) => (
                <div
                  key={misa.id}
                  className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-3.5"
                >
                  {/* Header: ID & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      ID: #{misa.id}
                    </span>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Selesai
                    </span>
                  </div>

                  {/* Title & Petugas */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {misa.jenis_perayaan}
                    </h3>
                    <p className="text-xs text-text-sec mt-1">
                      Petugas: <span className="text-slate-800 font-semibold">{currentUser.nama_kbg}</span>
                    </p>
                  </div>

                  {/* Date & Time */}
                  <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100/80 flex items-center justify-between text-xs">
                    <span className="text-text-sec text-[11px] font-medium">Tanggal & Waktu</span>
                    <span className="font-semibold text-slate-800">
                      {misa.tanggal} • {misa.waktu} WITA
                    </span>
                  </div>

                  {/* Action Button */}
                  <div className="pt-1">
                    <button
                      onClick={() => handleRestore(misa.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-700 border border-amber-200/80 rounded-2xl text-xs font-bold transition-all shadow-2xs active:scale-[0.99] cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Pulihkan Riwayat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-text-sec uppercase tracking-wider">
                      <th className="px-6 py-4">ID Misa</th>
                      <th className="px-6 py-4">Jenis Perayaan Ekaristi</th>
                      <th className="px-6 py-4">Tanggal & Waktu (WITA)</th>
                      <th className="px-6 py-4">Petugas</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {completedMisa.map((misa) => (
                      <tr key={misa.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 text-text-sec">#{misa.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-950">
                          {misa.jenis_perayaan}
                        </td>
                        <td className="px-6 py-4">
                          {misa.tanggal} • {misa.waktu}
                        </td>
                        <td className="px-6 py-4">{currentUser.nama_kbg}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Selesai
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRestore(misa.id)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-amber-50 hover:bg-amber-100/80 text-amber-700 border border-amber-200/70 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                          >
                            Pulihkan Riwayat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

    </div>
  );
}

export default dynamic(() => Promise.resolve(RiwayatPage), { ssr: false });
