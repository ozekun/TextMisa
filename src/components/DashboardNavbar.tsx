"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function DashboardNavbar() {
  const { currentUser, setCurrentUser } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/");
  };

  // Get initial letters of user for profile icon
  const getInitials = () => {
    if (!currentUser) return "U";
    const name = currentUser.nama_kbg || currentUser.username;
    return name
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-slate-100/80">
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="KOMSOS Logo" className="w-8 h-8 object-contain shrink-0" />
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-brand-primary">Teks</span>
            <span className="text-slate-900">Misa</span>
          </span>
        </Link>

        {/* Navigation Pills */}
        <nav className="bg-slate-100/80 p-1 rounded-full flex gap-1 border border-slate-200/20">
          <Link
            href="/dashboard"
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${pathname === "/dashboard"
              ? "bg-white text-brand-primary shadow-sm"
              : "text-text-sec hover:text-slate-950"
              }`}
          >
            Home
          </Link>
          <Link
            href="/dashboard/riwayat"
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${pathname === "/dashboard/riwayat"
              ? "bg-white text-brand-primary shadow-sm"
              : "text-text-sec hover:text-slate-950"
              }`}
          >
            Riwayat
          </Link>
        </nav>

        {/* Profile Dropdown */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-800 leading-none">
              {currentUser?.nama_kbg || "Petugas Liturgi"}
            </p>
            <p className="text-[10px] text-text-sec mt-1 leading-none">
              {currentUser?.nama_kbg?.startsWith("KBG") ? "Akun KBG" : "Akun Lingkungan"}
            </p>
          </div>

          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary text-xs font-bold hover:bg-brand-primary/20 transition-colors focus:outline-none cursor-pointer"
          >
            {getInitials()}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-12 w-56 bg-white rounded-3xl border border-slate-100 shadow-xl py-2 z-50 origin-top-right transition-all top-0">
              <div className="px-4 py-3 border-b border-slate-100 md:hidden">
                <p className="text-xs text-text-sec">
                  {currentUser?.nama_kbg?.startsWith("KBG") ? "Akun KBG" : "Akun Lingkungan"}
                </p>
                <p className="text-sm font-bold text-slate-800 truncate" title={currentUser?.nama_kbg || "Petugas Liturgi"}>
                  {currentUser?.nama_kbg || "Petugas Liturgi"}
                </p>
                <p className="text-[10px] text-text-sec truncate mt-0.5">
                  @{currentUser?.username || "kbg_user"}
                </p>
              </div>
              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50/50 rounded-2xl transition-colors cursor-pointer"
                >
                  Logout / Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
