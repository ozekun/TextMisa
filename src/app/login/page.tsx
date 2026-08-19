"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

interface AccountGroup {
  name: string;
  kbgs: string[];
  password?: string;
}

const ACCOUNT_GROUPS: AccountGroup[] = [
  {
    name: "Lingkungan St. Brigitta-Bitera",
    kbgs: ["St. Yusuf", "St. Fransiskus Xaverius"],
    password: "brigitta2026"
  },
  {
    name: "Lingkungan St. Barbara-Gianyar",
    kbgs: ["St. 1", "St. 2"],
    password: "barbara2026"
  },
  {
    name: "Lingkungan St. Damianus-Bangli",
    kbgs: ["St. 1", "St. 2"],
    password: "damianus2026"
  },
  {
    name: "Lingkungan St. Mikael-Ubud",
    kbgs: ["St. Maria Fatima", "St. 2"],
    password: "mikael2026"
  },
  {
    name: "Lingkungan St. Rafael-Ubud",
    kbgs: ["St. Maria", "St. 1"],
    password: "rafael2026"
  },
  {
    name: "Lingkungan St. Gabriel-Gianyar",
    kbgs: ["St. Paulus", "St. 1"],
    password: "gabriel2026"
  },
  {
    name: "Lingkungan St. Yoseph-Batubulan",
    kbgs: ["St. Madalena Canossa", "St. 1"],
    password: "yoseph2026"
  },
  {
    name: "OMK",
    kbgs: [],
    password: "omk2026"
  },
  {
    name: "Sekami",
    kbgs: [],
    password: "sekami2026"
  },
  {
    name: "Peribu",
    kbgs: [],
    password: "peribu2026"
  },
  {
    name: "Persaba",
    kbgs: [],
    password: "persaba2026"
  },
  {
    name: "Lainnya",
    kbgs: [],
    password: "kategorial2026"
  }
];

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useApp();
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [selectedKbg, setSelectedKbg] = useState("");
  const [customGroupName, setCustomGroupName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleGroupChange = (name: string) => {
    setSelectedGroupName(name);
    setSelectedKbg(""); // reset KBG selection
    setError("");
  };

  // Toggle KBG selection (click again to deselect)
  const handleKbgClick = (kbgName: string) => {
    if (selectedKbg === kbgName) {
      setSelectedKbg(""); // Deselect
    } else {
      setSelectedKbg(kbgName); // Select
    }
  };

  const selectedGroup = ACCOUNT_GROUPS.find((g) => g.name === selectedGroupName);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupName) {
      setError("Silakan pilih Lingkungan / Kategori terlebih dahulu.");
      return;
    }

    let finalGroupName = selectedGroupName;
    if (selectedGroupName === "Lainnya") {
      if (!customGroupName.trim()) {
        setError("Silakan isi nama Lingkungan/Kategori secara manual.");
        return;
      }
      finalGroupName = customGroupName.trim();
    }

    if (!password.trim()) {
      setError("Password harus diisi.");
      return;
    }

    // Password validation
    if (selectedGroup && selectedGroup.password && password !== selectedGroup.password) {
      setError("Password salah. Silakan coba lagi.");
      return;
    }

    // Build the final display name: KBG Name or Lingkungan Name
    const displayName = selectedKbg
      ? `KBG ${selectedKbg}`
      : finalGroupName;

    // Stable ID based on the index in ACCOUNT_GROUPS
    const groupIndex = ACCOUNT_GROUPS.findIndex((g) => g.name === selectedGroupName);

    // Make ID unique for KBG vs Lingkungan so they have different data sessions
    let stableId = groupIndex !== -1 ? groupIndex + 1 : 999;
    if (selectedKbg && selectedGroup) {
      const kbgIndex = selectedGroup.kbgs.indexOf(selectedKbg);
      // KBG IDs will be in the 1000s, e.g., 1001, 1002, 2001, etc.
      stableId = (stableId * 1000) + (kbgIndex + 1);
    }

    // Set user data in Context (which also handles localStorage)
    setCurrentUser({
      id: stableId,
      username: displayName.toLowerCase().replace(/\s+/g, "_"),
      nama_kbg: displayName,
    });

    // Redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="w-full max-w-md mx-auto text-center px-2 sm:px-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight hover:opacity-90 transition-opacity"
        >
          <img src="/logo.png" alt="KOMSOS Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0" />
          <span>
            <span className="text-slate-900">Running </span>
            <span className="text-brand-primary">Teks</span>
          </span>
        </Link>
        <h2 className="mt-5 sm:mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Masuk ke Akun Anda
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-text-sec max-w-xs sm:max-w-sm mx-auto leading-relaxed">
          Pilih lingkungan/kategori dan masukkan password petugas
        </p>
      </div>

      <div className="mt-6 sm:mt-8 w-full max-w-md mx-auto">
        <div className="bg-white py-8 px-5 sm:py-10 sm:px-8 border border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl sm:rounded-4xl">
          <form className="space-y-5 sm:space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-red-50 text-xs sm:text-sm text-red-600 border border-red-200/80 font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Dropdown Menu */}
            <div>
              <label
                htmlFor="group-select"
                className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2"
              >
                Pilih Lingkungan / Kategori
              </label>
              <div className="relative">
                <select
                  id="group-select"
                  value={selectedGroupName}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  className="block w-full px-4 py-3 sm:py-3.5 pr-10 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-base sm:text-sm font-medium transition-all bg-white appearance-none cursor-pointer shadow-xs"
                >
                  <option value="">-- Pilih Lingkungan / Kategori --</option>
                  {ACCOUNT_GROUPS.map((group, idx) => (
                    <option key={idx} value={group.name}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Manual input if "Lainnya" is selected */}
            {selectedGroupName === "Lainnya" && (
              <div className="animate-in fade-in duration-200">
                <label
                  htmlFor="custom-group"
                  className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2"
                >
                  Nama Lingkungan / Kelompok Kategorial
                </label>
                <input
                  id="custom-group"
                  type="text"
                  required
                  value={customGroupName}
                  onChange={(e) => setCustomGroupName(e.target.value)}
                  className="block w-full px-4 py-3 sm:py-3.5 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-base sm:text-sm transition-all shadow-xs"
                  placeholder="Contoh: Lingkungan St. Teresa"
                />
              </div>
            )}

            {/* KBG Sub-Selection (Radio Buttons) */}
            {selectedGroup && selectedGroup.kbgs.length > 0 && (
              <div className="animate-in fade-in duration-200 bg-slate-50/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                  Pilih KBG (Opsional - Klik lagi untuk batal)
                </label>
                <div className="flex flex-col gap-2 sm:gap-2.5">
                  {selectedGroup.kbgs.map((kbgName) => {
                    const isChecked = selectedKbg === kbgName;
                    return (
                      <div
                        key={kbgName}
                        onClick={() => handleKbgClick(kbgName)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 border rounded-xl sm:rounded-2xl cursor-pointer transition-all ${isChecked
                            ? "bg-teal-50/60 border-brand-primary text-brand-primary font-bold shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 active:bg-slate-50"
                          }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isChecked ? "border-brand-primary bg-brand-primary" : "border-slate-300 bg-white"
                          }`}>
                          {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs sm:text-sm select-none flex-1 font-medium">
                          {kbgName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Password input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-4 pr-11 py-3 sm:py-3.5 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-base sm:text-sm font-medium transition-all shadow-xs"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md shadow-brand-primary/20 text-sm sm:text-base font-bold text-white bg-brand-primary hover:bg-brand-hover active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all"
              >
                Autentikasi & Masuk
              </button>
            </div>
          </form>

          <div className="mt-6 sm:mt-8 border-t border-slate-100 pt-5 sm:pt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-primary hover:text-brand-hover transition-colors py-1.5 px-3 rounded-lg hover:bg-teal-50/50"
            >
              <span>←</span>
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
