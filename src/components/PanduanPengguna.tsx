"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default function PanduanPengguna() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Menentukan gambar panduan berdasarkan halaman saat ini
  let imageSrc = "https://via.placeholder.com/1200x800?text=Gambar+Panduan+Pengguna+Umum";

  if (pathname === "/dashboard") {
    imageSrc = "/panduan-home.png";
  } else if (pathname === "/dashboard/riwayat") {
    imageSrc = "/panduan-riwayat.png";
  } else if (pathname?.startsWith("/dashboard/misa/") && pathname !== "/dashboard/misa") {
    imageSrc = "/panduan-misa-detail.png";
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
        <span className="text-sm font-bold">Panduan Pengguna</span>
      </button>

      {/* Full-screen Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          {/* Close Button - Fixed di pojok layar */}
          <button
            onClick={() => setIsOpen(false)}
            className="fixed top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white bg-slate-800/50 hover:bg-slate-700/80 p-3 rounded-full transition-all z-[110] shadow-lg"
            title="Tutup Panduan"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Kontainer Gambar */}
          <div 
            className="relative w-full max-w-[95vw] sm:max-w-[90vw] max-h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageSrc}
              alt="Panduan Pengguna"
              className="max-w-full max-h-[95vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
