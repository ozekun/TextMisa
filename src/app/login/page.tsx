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
    password: ""
  }
];

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useApp();
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [selectedKbg, setSelectedKbg] = useState("");
  const [customGroupName, setCustomGroupName] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 text-3xl font-extrabold tracking-tight hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="KOMSOS Logo" className="w-10 h-10 object-contain shrink-0" />
            <span>
              <span className="text-slate-900">Running </span>
              <span className="text-brand-primary">Teks</span>
            </span>
          </Link>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Masuk ke Akun Anda
          </h2>
          <p className="mt-2 text-sm text-text-sec">
            Pilih lingkungan/kategori dan masukkan password petugas
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-10 px-8 border border-slate-100 shadow-xl rounded-4xl sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 text-xs text-red-600 border border-red-100 font-medium">
                {error}
              </div>
            )}

            {/* Dropdown Menu (Only environments and main categories) */}
            <div>
              <label
                htmlFor="group-select"
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                Pilih Lingkungan / Kategori
              </label>
              <select
                id="group-select"
                value={selectedGroupName}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition-all bg-white"
              >
                <option value="">-- Pilih Lingkungan / Kategori --</option>
                {ACCOUNT_GROUPS.map((group, idx) => (
                  <option key={idx} value={group.name}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Manual input if "Lainnya" is selected */}
            {selectedGroupName === "Lainnya" && (
              <div className="animate-in fade-in duration-200">
                <label
                  htmlFor="custom-group"
                  className="block text-sm font-semibold text-slate-800 mb-2"
                >
                  Nama Lingkungan / Kategori Manual
                </label>
                <input
                  id="custom-group"
                  type="text"
                  required
                  value={customGroupName}
                  onChange={(e) => setCustomGroupName(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition-all"
                  placeholder="Contoh: Lingkungan St. Teresa"
                />
              </div>
            )}

            {/* KBG Sub-Selection (Radio Buttons) */}
            {selectedGroup && selectedGroup.kbgs.length > 0 && (
              <div className="animate-in fade-in duration-200 bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                  Pilih KBG (Opsional - Klik lagi untuk batal memilih)
                </label>
                <div className="flex flex-col gap-3">
                  {selectedGroup.kbgs.map((kbgName) => {
                    const isChecked = selectedKbg === kbgName;
                    return (
                      <div
                        key={kbgName}
                        onClick={() => handleKbgClick(kbgName)}
                        className={`flex items-center gap-3 px-4 py-3 border rounded-2xl cursor-pointer transition-all ${
                          isChecked
                            ? "bg-teal-50/50 border-brand-primary text-brand-primary font-bold shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`kbg-${kbgName}`}
                          name="kbg-selection"
                          checked={isChecked}
                          onChange={() => {}} // Handled by onClick of container
                          className="w-4 h-4 text-brand-primary focus:ring-brand-primary/20 border-slate-300 shrink-0"
                        />
                        <label
                          htmlFor={`kbg-${kbgName}`}
                          className="text-xs cursor-pointer select-none flex-1"
                        >
                          {kbgName}
                        </label>
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
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all"
              >
                Autentikasi & Masuk
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-brand-primary hover:text-brand-hover transition-colors"
            >
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
