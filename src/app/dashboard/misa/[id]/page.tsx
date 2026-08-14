"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { LaguMisa } from "@/types";
import { generateSlideSequence, Slide } from "@/utils/songSplitter";
import Link from "next/link";
import Swal from "sweetalert2";

interface PageProps {
  params: Promise<{ id: string }>;
}

const LITURGY_SECTIONS = [
  { key: "Pembukaan", label: "1. Pembukaan", ordinarium: false, multi: false },
  { key: "Kyrie", label: "2. Tuhan Kasihanilah (Kyrie)", ordinarium: true, multi: false },
  { key: "Gloria", label: "3. Kemuliaan (Gloria)", ordinarium: true, multi: false },
  { key: "Persembahan", label: "4. Persembahan", ordinarium: false, multi: false },
  { key: "Sanctus", label: "5. Kudus (Sanctus)", ordinarium: true, multi: false },
  { key: "Agnus Dei", label: "6. Anak Domba (Agnus Dei)", ordinarium: true, multi: false },
  { key: "Komuni", label: "7. Komuni", ordinarium: false, multi: true },
  { key: "Penutup", label: "8. Penutup", ordinarium: false, multi: true },
];

import dynamic from "next/dynamic";

function WorkspacePage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const misaId = parseInt(resolvedParams.id, 10);

  const { currentUser, misaList, updateMisaStatus, getMisaSongs, saveMisaSongs } = useApp();

  const [activeTab, setActiveTab] = useState("Pembukaan");
  const [activeMisa, setActiveMisa] = useState<any>(null);

  // Song state for the active tab
  const [songsInTab, setSongsInTab] = useState<LaguMisa[]>([]);
  const [activeSongIndex, setActiveSongIndex] = useState(0); // for Multi-Lagu

  // Preview Slide Index
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpxNotification, setShowSpxNotification] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Authenticate & load data
  useEffect(() => {
    if (mounted) {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/login");
        return;
      }

      const misa = misaList.find((m) => m.id === misaId);
      if (misa) {
        setActiveMisa(misa);
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
    }
  }, [currentUser, misaId, misaList, router, mounted]);

  // Load songs whenever the active tab changes
  useEffect(() => {
    if (!mounted || !activeMisa) return;

    const allMisaSongs = getMisaSongs(misaId);
    const filtered = allMisaSongs.filter((s) => s.kategori === activeTab);

    if (filtered.length > 0) {
      // Sort by urutan_lagu
      const sorted = [...filtered].sort((a, b) => a.urutan_lagu - b.urutan_lagu);
      setSongsInTab(sorted);
    } else {
      // Initialize with one default blank song
      const blankSong: LaguMisa = {
        id: Date.now(),
        misa_id: misaId,
        kategori: activeTab,
        urutan_lagu: 1,
        judul_lagu: "",
        teks_ayat_1: "",
        json_ayat_tambahan: JSON.stringify([]),
        susunan_nyanyi: "ayat-only",
        created_at: new Date().toISOString(),
      };
      setSongsInTab([blankSong]);
    }
    setActiveSongIndex(0);
    setCurrentSlideIndex(0);
  }, [activeTab, activeMisa]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-teal-50/50">
        <div className="text-slate-500 font-medium">Memuat data Workspace...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-white p-8 sm:p-12 border border-slate-100 shadow-xl rounded-4xl max-w-md w-full space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-650 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Akses Ditolak
            </h2>
            <p className="text-xs text-text-sec leading-relaxed">
              Anda tidak memiliki izin untuk mengakses halaman Workspace ini karena perayaan Misa ini ditugaskan untuk Lingkungan / Kategori lain.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              ← Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || !activeMisa) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-teal-50/50">
        <div className="text-slate-500 font-medium">Memuat data Workspace...</div>
      </div>
    );
  }

  const activeSection = LITURGY_SECTIONS.find((s) => s.key === activeTab)!;

  // Handler to update song attributes
  const updateSongField = (index: number, field: keyof LaguMisa, value: any) => {
    const updated = songsInTab.map((song, i) => {
      if (i === index) {
        return { ...song, [field]: value };
      }
      return song;
    });
    setSongsInTab(updated);
  };

  // Handler to update additional verses (Non-Ordinarium)
  const updateAdditionalVerse = (songIdx: number, verseIdx: number, text: string) => {
    const song = songsInTab[songIdx];
    const verses = song.json_ayat_tambahan ? JSON.parse(song.json_ayat_tambahan) : [];
    verses[verseIdx] = text;
    updateSongField(songIdx, "json_ayat_tambahan", JSON.stringify(verses));
  };

  const addAdditionalVerse = (songIdx: number) => {
    const song = songsInTab[songIdx];
    const verses = song.json_ayat_tambahan ? JSON.parse(song.json_ayat_tambahan) : [];
    verses.push("");
    updateSongField(songIdx, "json_ayat_tambahan", JSON.stringify(verses));
  };

  const removeAdditionalVerse = (songIdx: number, verseIdx: number) => {
    const song = songsInTab[songIdx];
    const verses = song.json_ayat_tambahan ? JSON.parse(song.json_ayat_tambahan) : [];
    const filtered = verses.filter((_: any, i: number) => i !== verseIdx);
    updateSongField(songIdx, "json_ayat_tambahan", JSON.stringify(filtered));
  };

  // Multi-Lagu handlers
  const addNewSongToTab = () => {
    const newUrutan = songsInTab.length + 1;
    const newSong: LaguMisa = {
      id: Date.now() + newUrutan,
      misa_id: misaId,
      kategori: activeTab,
      urutan_lagu: newUrutan,
      judul_lagu: "",
      teks_ayat_1: "",
      json_ayat_tambahan: JSON.stringify([]),
      susunan_nyanyi: "ayat-only",
      created_at: new Date().toISOString(),
    };
    setSongsInTab([...songsInTab, newSong]);
    setActiveSongIndex(songsInTab.length);
    setCurrentSlideIndex(0);
  };

  const removeSongFromTab = (index: number) => {
    if (songsInTab.length <= 1) return;
    const filtered = songsInTab.filter((_, i) => i !== index);
    // Re-index urutan_lagu
    const reindexed = filtered.map((song, i) => ({
      ...song,
      urutan_lagu: i + 1,
    }));
    setSongsInTab(reindexed);
    setActiveSongIndex(Math.max(0, index - 1));
    setCurrentSlideIndex(0);
  };

  // Save changes to local database state
  const handleSaveTab = async () => {
    await saveMisaSongs(misaId, songsInTab);
    Swal.fire({
      title: "Lirik berhasil disimpan!",
      icon: "success",
      draggable: true
    });
  };

  // Complete mass liturgy composition
  const handlePublish = async () => {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm mx-1 active:scale-95 cursor-pointer",
        cancelButton: "px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm mx-1 active:scale-95 cursor-pointer"
      },
      buttonsStyling: false
    });

    swalWithBootstrapButtons.fire({
      title: "Simpan Lagu?",
      text: "Jadwal Misa ini akan disimpan dan ditandai sebagai 'Ready'!",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan!",
      cancelButtonText: "Batal",
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        await saveMisaSongs(misaId, songsInTab);
        await updateMisaStatus(misaId, "Ready");

        await swalWithBootstrapButtons.fire({
          title: "Berhasil!",
          text: "Jadwal Misa ditandai sebagai 'Ready' untuk SPX Graphic.",
          icon: "success",
          confirmButtonText: "OK"
        });
        router.push("/dashboard");
      }
    });
  };

  const handleFinishMass = async () => {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm mx-1 active:scale-95 cursor-pointer",
        cancelButton: "px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm mx-1 active:scale-95 cursor-pointer"
      },
      buttonsStyling: false
    });

    swalWithBootstrapButtons.fire({
      title: "Selesaikan Perayaan Misa?",
      text: "Jadwal Misa akan diarsipkan ke Riwayat dan tidak dapat diubah kembali kecuali dipulihkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Selesaikan!",
      cancelButtonText: "Batal",
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        await saveMisaSongs(misaId, songsInTab);
        await updateMisaStatus(misaId, "Selesai");

        await swalWithBootstrapButtons.fire({
          title: "Selesai!",
          text: "Jadwal Misa telah diarsipkan ke halaman Riwayat.",
          icon: "success",
          confirmButtonText: "OK"
        });
        router.push("/dashboard");
      }
    });
  };

  // Compile active song slides for SPX Preview
  const currentSong = songsInTab[activeSongIndex] || songsInTab[0];

  const parsedAdditionalVerses = currentSong?.json_ayat_tambahan
    ? JSON.parse(currentSong.json_ayat_tambahan)
    : [];

  const previewSlides: Slide[] = currentSong
    ? generateSlideSequence({
      kategori: activeTab,
      teksReff: currentSong.teks_reff,
      teksAyat1: currentSong.teks_ayat_1,
      ayatTambahan: parsedAdditionalVerses,
      susunanNyanyi: currentSong.susunan_nyanyi,
    })
    : [];

  const activeSlide: Slide | undefined = previewSlides[currentSlideIndex];

  // Helper to parse and render slide text replacing <nr>X</nr> tags
  const renderSlideText = (text: string) => {
    const match = text.match(/<nr>(\d+)<\/nr>\s*([\s\S]*)/);
    if (match) {
      return (
        <div className="flex items-start justify-center gap-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs shrink-0 mt-0.5">
            {match[1]}
          </span>
          <span className="text-left font-nunito whitespace-pre-wrap leading-relaxed text-sm tracking-wide">
            {match[2]}
          </span>
        </div>
      );
    }
    return (
      <span className="font-nunito whitespace-pre-wrap leading-relaxed text-sm tracking-wide block">
        {text}
      </span>
    );
  };

  // Trigger Mock Send to SPX Graphics
  const handleSendToSpx = () => {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm mx-1 active:scale-95 cursor-pointer",
        cancelButton: "px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm mx-1 active:scale-95 cursor-pointer"
      },
      buttonsStyling: false
    });

    swalWithBootstrapButtons.fire({
      title: "Apakah lagu sudah sesuai?",
      text: "Lirik lagu ini akan segera dikirim ke SPX Graphic!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Kirim!",
      cancelButtonText: "Batal",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        setShowSpxNotification(true);
        setTimeout(() => setShowSpxNotification(false), 3000);

        swalWithBootstrapButtons.fire({
          title: "Berhasil!",
          text: "Lirik lagu terkirim ke SPX Graphic.",
          icon: "success",
          confirmButtonText: "Tutup"
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        swalWithBootstrapButtons.fire({
          title: "Dibatalkan",
          text: "Pengiriman lirik lagu dibatalkan.",
          icon: "error",
          confirmButtonText: "Tutup"
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-workspace flex flex-col transition-colors duration-300">
      {/* Workspace Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-teal-100/50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-sm transition-all active:scale-95"
            >
              ←
            </Link>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary">
                Perayaan Ekaristi
              </span>
              <h1 className="text-sm font-black text-slate-900 line-clamp-1">
                {activeMisa.jenis_perayaan}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold border ${activeMisa.status === "Ready"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-amber-50 text-amber-700 border-amber-100"
                }`}
            >
              Status: {activeMisa.status}
            </span>

            {activeMisa.status !== "Selesai" && (
              <>
                <button
                  onClick={handlePublish}
                  className="px-5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
                >
                  Simpan Lagu
                </button>
                <button
                  onClick={handleFinishMass}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
                >
                  Hapus
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Left Side: Liturgy Tab & Inputs Form */}
        <section className="flex-1 space-y-6">
          {/* Liturgy Section Tabs */}
          <div className="bg-white/80 p-1.5 rounded-3xl border border-teal-100/50 grid grid-cols-2 sm:grid-cols-4 gap-1.5 shadow-sm">
            {LITURGY_SECTIONS.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveTab(section.key)}
                className={`px-3 py-2.5 rounded-2xl text-[11px] font-bold transition-all text-center cursor-pointer ${activeTab === section.key
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-50/50"
                  }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Form Container */}
          <div className="bg-white border border-teal-100/30 rounded-4xl p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Pengisian Lagu Liturgi
                </h2>
                <p className="text-xs text-text-sec mt-0.5">
                  Lengkapi lirik lagu untuk bagian liturgi <strong>{activeTab}</strong>
                </p>
              </div>

              {/* Multi-Lagu Tabs (Komuni & Penutup) */}
              {activeSection.multi && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                    {songsInTab.map((song, i) => (
                      <button
                        key={song.id}
                        onClick={() => {
                          setActiveSongIndex(i);
                          setCurrentSlideIndex(0);
                        }}
                        className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all ${activeSongIndex === i
                          ? "bg-white text-brand-primary shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                          }`}
                      >
                        Lagu {song.urutan_lagu}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={addNewSongToTab}
                    className="px-4 py-2 text-xs bg-emerald-50 text-brand-primary border border-emerald-150 rounded-xl font-extrabold hover:bg-emerald-100/70 transition-colors active:scale-95"
                  >
                    + Tambah Lagu Baru
                  </button>
                  {songsInTab.length > 1 && (
                    <button
                      onClick={() => removeSongFromTab(activeSongIndex)}
                      className="px-4 py-2 text-xs bg-red-50 text-red-600 border border-red-150 rounded-xl font-extrabold hover:bg-red-100/70 transition-colors active:scale-95"
                    >
                      Hapus Lagu Ini
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Song Form */}
            {currentSong && (
              <div className="space-y-5">
                {/* Book Header & Title (Hidden for Ordinarium) */}
                {!activeSection.ordinarium && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Judul Lagu
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Pujilah Tuhan"
                        value={currentSong.judul_lagu || ""}
                        onChange={(e) => updateSongField(activeSongIndex, "judul_lagu", e.target.value)}
                        className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Nomor Lagu / Teks
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Puji Syukur No. 320"
                        value={currentSong.header_buku || ""}
                        onChange={(e) => updateSongField(activeSongIndex, "header_buku", e.target.value)}
                        className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Ordinarium Title (Only for Kyrie, Gloria, etc) */}
                {activeSection.ordinarium && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Judul / Kategori Ordinarium
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Tuhan Kasihanilah Kami (Misa Kita II)"
                      value={currentSong.judul_lagu || ""}
                      onChange={(e) => updateSongField(activeSongIndex, "judul_lagu", e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    />
                  </div>
                )}

                {/* Sequence Dropdown (Hidden for Ordinarium) */}
                {!activeSection.ordinarium && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Susunan Urutan Nyanyi
                    </label>
                    <select
                      value={currentSong.susunan_nyanyi || "ayat-only"}
                      onChange={(e) => {
                        updateSongField(activeSongIndex, "susunan_nyanyi", e.target.value);
                        setCurrentSlideIndex(0);
                      }}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all bg-white"
                    >
                      <option value="ayat-only">Ayat Saja (Tanpa Reff)</option>
                      <option value="reff-ayat-reff">Reff - Ayat - Reff </option>
                      <option value="ayat-reff-ayat">Ayat - Reff - Ayat </option>
                      <option value="reff-ayat">Reff - Ayat - Ayat </option>
                    </select>
                  </div>
                )}

                {/* Refrain Text (Hidden for Ordinarium) */}
                {!activeSection.ordinarium &&
                  (currentSong.susunan_nyanyi && currentSong.susunan_nyanyi !== "ayat-only") && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex justify-between">
                        <span>Teks Refrain (Reff)</span>
                        <span className="text-[10px] text-text-sec font-medium">Batas baris: otomatis per 2 baris</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Masukkan lirik Reff..."
                        value={currentSong.teks_reff || ""}
                        onChange={(e) => {
                          updateSongField(activeSongIndex, "teks_reff", e.target.value);
                          setCurrentSlideIndex(0);
                        }}
                        className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-mono"
                      />
                    </div>
                  )}

                {/* Verses (Teks Ayat 1) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex justify-between">
                    <span>
                      {activeSection.ordinarium ? "Teks Ordinarium" : "Teks Ayat 1"}
                    </span>
                    <span className="text-[10px] text-text-sec font-medium">Batas baris: otomatis per 2 baris</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder={
                      activeSection.ordinarium
                        ? "Masukkan lirik ordinarium lengkap..."
                        : "Masukkan lirik Ayat 1..."
                    }
                    value={currentSong.teks_ayat_1 || ""}
                    onChange={(e) => {
                      updateSongField(activeSongIndex, "teks_ayat_1", e.target.value);
                      setCurrentSlideIndex(0);
                    }}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-mono"
                  />
                </div>

                {/* Additional Verses List (Hidden for Ordinarium) */}
                {!activeSection.ordinarium && parsedAdditionalVerses.map((verseText: string, vIdx: number) => (
                  <div key={vIdx} className="space-y-1.5 pt-2 border-t border-dashed border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        Teks Ayat {vIdx + 2}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          removeAdditionalVerse(activeSongIndex, vIdx);
                          setCurrentSlideIndex(0);
                        }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors"
                      >
                        Hapus Ayat {vIdx + 2}
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder={`Masukkan lirik Ayat ${vIdx + 2}...`}
                      value={verseText}
                      onChange={(e) => {
                        updateAdditionalVerse(activeSongIndex, vIdx, e.target.value);
                        setCurrentSlideIndex(0);
                      }}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-mono"
                    />
                  </div>
                ))}

                {/* Add Verse Button (Hidden for Ordinarium) */}
                {!activeSection.ordinarium && (
                  <button
                    type="button"
                    onClick={() => addAdditionalVerse(activeSongIndex)}
                    className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    + Tambah Ayat Baru
                  </button>
                )}

                {/* Save Section Button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveTab}
                    className="px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    Simpan Perubahan Lirik
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Real-Time SPX Preview Card */}
        <section className="w-full lg:w-[420px] shrink-0 space-y-6">
          <div className="sticky top-28 space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Pratinjau / Preview
              </h2>
              <p className="text-xs text-text-sec mt-0.5">
                Representasi tampilan running teks pada layar siaran
              </p>
            </div>

            {/* SPX Monitor Box */}
            <div className="bg-brand-dark rounded-4xl p-6 text-white shadow-xl flex flex-col justify-between aspect-video relative overflow-hidden group">
              {/* Broadcast Grid overlay decoration */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

              {/* Top info badge */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 z-10 font-mono">
                <span>PREVIEW CHANNEL</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  SPX ONLINE
                </span>
              </div>

              {/* Lower-third Overlay mockup */}
              <div className="my-auto py-4 z-10 min-h-[96px] flex flex-col justify-center text-center">
                {activeSlide ? (
                  <div className="bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {(currentSong?.judul_lagu || currentSong?.header_buku) && (
                      <div className="flex items-center justify-center gap-2 mb-3 text-[10px] font-bold">
                        {currentSong?.header_buku && (
                          <span className="bg-brand-primary/20 px-2 py-0.5 rounded text-white">{currentSong.header_buku}</span>
                        )}
                        {currentSong?.judul_lagu && (
                          <span className="uppercase tracking-wider text-teal-300">{currentSong.judul_lagu}</span>
                        )}
                      </div>
                    )}
                    {renderSlideText(activeSlide.text)}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs italic">
                    Masukkan lirik lagu untuk melihat pratinjau slide grafis.
                  </div>
                )}
              </div>

              {/* Bottom slide info & control */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 z-10">
                <span className="font-bold">
                  {activeSlide ? activeSlide.label : "Slide 0/0"}
                </span>
                {previewSlides.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                      disabled={currentSlideIndex === 0}
                      className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-white font-black transition-colors"
                    >
                      ‹
                    </button>
                    <span className="px-2 font-mono">
                      {currentSlideIndex + 1}/{previewSlides.length}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentSlideIndex(
                          Math.min(previewSlides.length - 1, currentSlideIndex + 1)
                        )
                      }
                      disabled={currentSlideIndex === previewSlides.length - 1}
                      className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-white font-black transition-colors"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions card */}
            <div className="bg-white border border-teal-100/30 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Bagian Akhir
              </h3>
              <p className="text-[11px] text-text-sec leading-relaxed">
                Kirimkan slide lirik lagu langsung ke sistem.
              </p>

              <button
                onClick={handleSendToSpx}
                disabled={previewSlides.length === 0}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Kirim Teks ke Sistem
              </button>

              {showSpxNotification && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold rounded-2xl text-center animate-in fade-in duration-200">
                  Slide berhasil dipos ke API SPX Graphic!
                </div>
              )}
            </div>

            {/* Slide Index List panel */}
            {previewSlides.length > 0 && (
              <div className="bg-white border border-teal-100/30 rounded-3xl p-6 shadow-sm space-y-3 max-h-[300px] flex flex-col">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider shrink-0">
                  Daftar Slide Deck ({previewSlides.length})
                </h3>
                <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
                  {previewSlides.map((slide, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-xl text-[11px] transition-all flex items-center justify-between border ${currentSlideIndex === idx
                        ? "bg-teal-50 text-brand-primary border-brand-primary/20 font-bold"
                        : "bg-slate-50/50 hover:bg-slate-50 text-slate-700 border-slate-100"
                        }`}
                    >
                      <span className="truncate max-w-[240px]">
                        {slide.text.replace(/<nr>\d+<\/nr>\s*/g, "")}
                      </span>
                      <span className="text-[9px] uppercase shrink-0 px-2 py-0.5 rounded bg-white border border-slate-100 text-slate-500">
                        {slide.label.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default dynamic(() => Promise.resolve(WorkspacePage), { ssr: false });
