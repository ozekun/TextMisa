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
  { key: "Pembukaan", label: "1. Pembukaan", ordinarium: false, multi: false, isReading: false },
  { key: "Kyrie", label: "2. Tuhan Kasihanilah (Kyrie)", ordinarium: true, multi: false, isReading: false },
  { key: "Gloria", label: "3. Kemuliaan (Gloria)", ordinarium: true, multi: false, isReading: false },
  { key: "Bacaan 1", label: "4. Bacaan 1", ordinarium: false, multi: false, isReading: true },
  { key: "Bacaan 2", label: "5. Bacaan 2", ordinarium: false, multi: false, isReading: true },
  { key: "Injil", label: "6. Injil", ordinarium: false, multi: false, isReading: true },
  { key: "Persembahan", label: "7. Persembahan", ordinarium: false, multi: false, isReading: false },
  { key: "Sanctus", label: "8. Kudus (Sanctus)", ordinarium: true, multi: false, isReading: false },
  { key: "Agnus Dei", label: "9. Anak Domba (Agnus Dei)", ordinarium: true, multi: false, isReading: false },
  { key: "Komuni", label: "10. Komuni", ordinarium: false, multi: true, isReading: false },
  { key: "Penutup", label: "11. Penutup", ordinarium: false, multi: true, isReading: false },
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

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
      let defaultJudul = "";
      let defaultTeks = "";

      if (activeTab === "Agnus Dei") {
        defaultJudul = "Anak Domba Allah";
        defaultTeks = `Anak Domba Allah\n\nYang menghapus dosa dunia\n\nKasihanilah kami,\nkasihanilah kami\n\nAnak Domba Allah\n\nYang menghapus dosa,\ndosa-dosa dunia\n\nKasihanilah kami,\nkasihanilah kami,\n\nkasihanilah kami\n\nAnak Domba Allah\n\nYang menghapus dosa dunia\n\nBerilah kami damai,\n\nberilah kami damai`;
      } else if (activeTab === "Bacaan 1") {
        defaultJudul = "Bacaan 1";
      } else if (activeTab === "Bacaan 2") {
        defaultJudul = "Bacaan 2";
      } else if (activeTab === "Injil") {
        defaultJudul = "Bacaan Injil";
      }

      // Initialize with one default blank song
      const blankSong: LaguMisa = {
        id: Date.now(),
        misa_id: misaId,
        kategori: activeTab,
        urutan_lagu: 1,
        judul_lagu: defaultJudul,
        teks_ayat_1: defaultTeks,
        json_ayat_tambahan: JSON.stringify([]),
        susunan_nyanyi: "ayat-only",
        created_at: new Date().toISOString(),
      };
      setSongsInTab([blankSong]);
    }
    setActiveSongIndex(0);
    setCurrentSlideIndex(0);
  }, [activeTab, activeMisa]);

  // Auto-save effect (must be above early returns)
  useEffect(() => {
    if (!mounted || !activeMisa || songsInTab.length === 0) return;

    const timer = setTimeout(() => {
      // Inline the call or make handleSaveTab safe to call
      setSaveStatus("saving");
      saveMisaSongs(misaId, songsInTab).then(() => {
        setSaveStatus("saved");
        setTimeout(() => {
          setSaveStatus("idle");
        }, 2500);
      });
    }, 500); // Tunggu 0.5 detik setelah user selesai mengetik

    return () => clearTimeout(timer);
  }, [songsInTab, misaId, mounted, activeMisa]);

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
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-start justify-center gap-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white font-bold text-xs shrink-0 mt-0.5">
              {match[1]}
            </span>
            <span className="text-center font-nunito whitespace-pre-wrap leading-relaxed text-sm tracking-wide max-w-[280px]">
              {match[2]}
            </span>
          </div>
        </div>
      );
    }
    return (
      <span className="font-nunito whitespace-pre-wrap leading-relaxed text-sm tracking-wide block text-center max-w-[280px] mx-auto">
        {text}
      </span>
    );
  };

  // Trigger Send to SPX Graphics via SFTP (Generate Rundown)
  const handleSendToSpx = async () => {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm mx-1 active:scale-95 cursor-pointer",
        cancelButton: "px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm mx-1 active:scale-95 cursor-pointer"
      },
      buttonsStyling: false
    });

    const result = await swalWithBootstrapButtons.fire({
      title: "Buat Rundown SPX?",
      text: "Seluruh lirik lagu dari Misa ini akan di-export sebagai Rundown langsung ke server SPX!",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Buat Rundown!",
      cancelButtonText: "Batal",
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        // 1. Ambil semua lagu di misa ini yang sudah TERSIMPAN di database
        const savedMisaSongs = getMisaSongs(misaId);

        // 2. Gabungkan dengan data dari tab yang SEDANG DIBUKA (jika ada perubahan yang belum di-save)
        const otherSavedSongs = savedMisaSongs.filter(s => s.kategori !== activeTab);
        const currentSongs = [...otherSavedSongs, ...songsInTab];

        // 3. Format setiap lagu menjadi Item SPX berdasarkan urutan LITURGY_SECTIONS
        const items: any[] = [];

        LITURGY_SECTIONS.forEach((section) => {
          const songsInSection = currentSongs.filter(s => s.kategori === section.key);

          if (songsInSection.length > 0) {
            // Urutkan berdasarkan urutan_lagu
            songsInSection.sort((a, b) => a.urutan_lagu - b.urutan_lagu).forEach((song) => {
              const parsedAdditionalVerses = song.json_ayat_tambahan ? JSON.parse(song.json_ayat_tambahan) : [];
              const slides = generateSlideSequence({
                kategori: song.kategori,
                teksReff: song.teks_reff,
                teksAyat1: song.teks_ayat_1,
                ayatTambahan: parsedAdditionalVerses,
                susunanNyanyi: song.susunan_nyanyi,
              });

              let f0_val = song.header_buku || "";
              let f1_val = slides.length > 0 ? slides.map(slide => slide.text).join("\n\n\n") : "[Lirik belum diisi]";
              let f2_val = song.judul_lagu || section.key;

              let listName = section.key;

              if (section.isReading) {
                if (section.key === "Bacaan 1") {
                  listName = "Bacaan 1";
                  f2_val = "Bacaan Pertama";
                } else if (section.key === "Bacaan 2") {
                  listName = "Bacaan 2";
                  f2_val = "Bacaan Kedua";
                } else if (section.key === "Injil") {
                  listName = "Bacaan Injil";
                  f2_val = "Injil";
                }

                // f0 adalah sumber kitab (header_buku)
                f0_val = song.header_buku || "";
                // f1 kosong untuk bacaan
                f1_val = "";
              }

              items.push({
                DataFields: [
                  { field: "comment", value: section.isReading ? listName : `${section.key} - ${f2_val}` },
                  { field: "f0", value: f0_val },
                  { field: "f1", value: f1_val },
                  { field: "f2", value: f2_val },
                  { field: "f3", value: "none" },
                  { field: "f4", value: "gfxCenter" }
                ]
              });
            });
          } else {
            // Jika kategori ini belum ada isinya sama sekali, buatkan placeholder
            let emptyF0 = ""; // nomor lagu / sumber kitab
            let emptyF1 = section.isReading ? "" : "[Lagu belum diisi]";
            let emptyF2 = section.key; // judul lagu / kategori liturgi
            let emptyList = section.key;
            if (section.isReading) {
              if (section.key === "Bacaan 1") { emptyList = "Bacaan Pertama"; emptyF2 = "Bacaan Pertama"; }
              else if (section.key === "Bacaan 2") { emptyList = "Bacaan Kedua"; emptyF2 = "Bacaan Kedua"; }
              else if (section.key === "Injil") { emptyList = "Bacaan Injil"; emptyF2 = "Injil"; }
            }

            items.push({
              DataFields: [
                { field: "comment", value: section.isReading ? `[KOSONG] ${emptyList}` : `[KOSONG] ${section.key}` },
                { field: "f0", value: emptyF0 },
                { field: "f1", value: emptyF1 },
                { field: "f2", value: emptyF2 },
                { field: "f3", value: "none" },
                { field: "f4", value: "gfxCenter" }
              ]
            });
          }

          // Sisipkan teks Aklamasi Anamnesis secara otomatis setelah Sanctus (tanpa tampil di web)
          if (section.key === "Sanctus") {
            const anamnesis1 = `Wafat-Mu Tuhan\n\n\nkami wartakan\n\n\nKebangkitan-Mu\n\n\nkami muliakan\n\n\nhingga Engkau datang`;
            const anamnesis2 = `Setiap kali kami makan roti ini\n\n\ndan minum dari piala ini\n\n\nwafat-Mu Tuhan, kami wartakan\n\n\nhingga Engkau datang`;
            const anamnesis3 = `Penyelamat dunia\n\n\nSelamatkanlah kami\n\n\nKarena melalui salib\n\n\ndan kebangkitan-Mu\n\n\nEngkau telah membebaskan kami`;

            const anamnesisList = [
              { title: "Wafat-Mu Tuhan", header: "Anamnesis 1", text: anamnesis1 },
              { title: "Setiap kali", header: "Anamnesis 2a & 2b", text: anamnesis2 },
              { title: "Penyelamat dunia", header: "Anamnesis 3a & 3b", text: anamnesis3 }
            ];

            anamnesisList.forEach((item) => {
              items.push({
                DataFields: [
                  { field: "comment", value: `Anamnesis - ${item.title}` },
                  { field: "f0", value: item.title },
                  { field: "f1", value: item.text },
                  { field: "f2", value: item.header },
                  { field: "f3", value: "none" },
                  { field: "f4", value: "gfxCenter" }
                ]
              });
            });
          }
        });

        // 4. Format Nama File: tgl,bulan - KBG
        const dateObj = new Date(activeMisa.tanggal);
        const tgl = dateObj.getDate();
        const bulanArr = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const bulan = bulanArr[dateObj.getMonth()];
        const kbg = currentUser?.nama_kbg || "Lingkungan";

        let rawFilename = `${tgl} ${bulan} - ${kbg}`;
        const safeFilename = rawFilename.replace(/[<>:"/\\|?*]/g, '_'); // Bersihkan karakter ilegal OS

        const payload = {
          filename: safeFilename,
          items: items
        };

        const response = await fetch("/api/spx/export", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Gagal mengirim ke SPX Server");
        }

        setShowSpxNotification(true);
        setTimeout(() => setShowSpxNotification(false), 3000);

        swalWithBootstrapButtons.fire({
          title: "Berhasil!",
          text: `Rundown "${safeFilename}.json" sukses dibuat di server SPX.`,
          icon: "success",
          confirmButtonText: "OK"
        });
      } catch (error: any) {
        console.error("SPX Send Error:", error);
        swalWithBootstrapButtons.fire({
          title: "Gagal Membuat Rundown",
          text: error.message || "Terjadi kesalahan sistem.",
          icon: "error",
          confirmButtonText: "Tutup"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-workspace flex flex-col transition-colors duration-300">
      {/* Workspace Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-teal-100/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2">
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-xs transition-all active:scale-95 shrink-0"
              title="Kembali ke Dashboard"
            >
              ←
            </Link>
            <div className="min-w-0">
              <span className="hidden sm:block text-[10px] font-extrabold uppercase tracking-wider text-brand-primary">
                Perayaan Ekaristi
              </span>
              <h1 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                {activeMisa.jenis_perayaan}
              </h1>
            </div>
          </div>

          {/* Right: Status & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <span
              className={`hidden md:inline-flex px-3 py-1 rounded-full text-[10px] font-bold border ${activeMisa.status === "Ready"
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
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Simpan<span className="hidden sm:inline"> Lagu</span></span>
                </button>
                <button
                  onClick={handleFinishMass}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                  title="Selesaikan / Hapus Perayaan Misa"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="hidden sm:inline">Hapus</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col lg:flex-row gap-6 sm:gap-8">
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
          <div className="bg-white border border-teal-100/30 rounded-3xl sm:rounded-4xl p-5 sm:p-8 shadow-sm space-y-6">
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
                        {activeSection.isReading ? "Judul Bacaan (Permanen)" : "Judul Lagu"}
                      </label>
                      <input
                        type="text"
                        placeholder={activeSection.isReading ? "" : "Contoh: Pujilah Tuhan"}
                        value={
                          activeSection.isReading
                            ? (activeSection.key === "Injil" ? "Bacaan Injil" : activeSection.key)
                            : (currentSong.judul_lagu || "")
                        }
                        onChange={(e) => {
                          if (!activeSection.isReading) {
                            updateSongField(activeSongIndex, "judul_lagu", e.target.value);
                          }
                        }}
                        disabled={activeSection.isReading}
                        className={`block w-full px-4 py-3 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all ${activeSection.isReading
                          ? "bg-slate-100 text-slate-500 font-semibold cursor-not-allowed"
                          : "text-slate-900 bg-white"
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        {activeSection.isReading ? "Sumber Kitab / Injil" : "Nomor Lagu / Teks"}
                      </label>
                      <input
                        type="text"
                        placeholder={activeSection.isReading ? "Contoh: Kej 1:1-5" : "Contoh: Puji Syukur No. 320"}
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

                {/* Sequence Dropdown (Hidden for Ordinarium and Readings) */}
                {!activeSection.ordinarium && !activeSection.isReading && (
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

                {/* Refrain Text (Hidden for Ordinarium and Readings) */}
                {!activeSection.ordinarium && !activeSection.isReading &&
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

                {/* Verses (Teks Ayat 1) - Hidden for Readings */}
                {!activeSection.isReading && (
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
                )}

                {/* Additional Verses List (Hidden for Ordinarium and Readings) */}
                {!activeSection.ordinarium && !activeSection.isReading && parsedAdditionalVerses.map((verseText: string, vIdx: number) => (
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

                {/* Add Verse Button (Hidden for Ordinarium and Readings) */}
                {!activeSection.ordinarium && !activeSection.isReading && (
                  <button
                    type="button"
                    onClick={() => addAdditionalVerse(activeSongIndex)}
                    className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    + Tambah Ayat Baru
                  </button>
                )}

                {/* Auto-Save Indicator */}
                <div className="pt-4 border-t border-slate-100 flex justify-end items-center gap-3 h-12">
                  {saveStatus === "saving" && (
                    <span className="text-xs font-bold text-amber-500 animate-pulse flex items-center gap-1.5">
                      <svg className="animate-spin h-3.5 w-3.5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Menyimpan...
                    </span>
                  )}
                  {saveStatus === "saved" && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Tersimpan otomatis
                    </span>
                  )}
                  {saveStatus === "idle" && (
                    <span className="text-[11px] font-medium text-slate-400 italic">Perubahan akan otomatis tersimpan</span>
                  )}
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
                {activeSlide || (activeSection.isReading && currentSong?.header_buku) ? (
                  <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 w-full relative pt-5">
                    {/* Top Box: Song Number / Reading Source (Yellow badge / f0) */}
                    {currentSong?.header_buku && (
                      <div className="bg-[#ffa500] text-[#2a1c00] px-3 py-1 rounded-lg border border-amber-600/20 shadow-md text-[9px] font-extrabold uppercase tracking-wider z-20">
                        {currentSong.header_buku}
                      </div>
                    )}
                    
                    {/* Lyrics Box: f1 (White background, black text) */}
                    {activeSlide && (
                      <div className="w-full bg-white text-black px-6 py-4 rounded-2xl border border-slate-100 font-semibold shadow-md mt-1">
                        {renderSlideText(activeSlide.text)}
                      </div>
                    )}
                    
                    {/* Title Box: f2 (Yellow background, dark text) */}
                    <div className="bg-[#ffa500] text-[#2a1c00] px-4 py-1.5 rounded-xl border border-amber-600/20 shadow-md text-[10px] font-extrabold uppercase tracking-wider mt-1">
                      {activeSection.isReading 
                        ? (activeTab === "Bacaan 1" ? "Bacaan Pertama" : activeTab === "Bacaan 2" ? "Bacaan Kedua" : "Injil")
                        : (currentSong?.judul_lagu || activeTab)}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs italic">
                    {activeSection.isReading
                      ? "Tampilan slide akan memuat Judul Bacaan dan Sumber Kitab yang Anda isikan."
                      : "Masukkan lirik lagu untuk melihat pratinjau slide grafis."}
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
