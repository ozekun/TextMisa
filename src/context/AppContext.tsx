"use client";

import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
import { DataLagu, JadwalMisa, LaguMisa, User } from "../types";
import { supabase } from "../lib/supabaseClient";
import { formatHeaderBuku, formatJudulLagu } from "../utils/songSplitter";

interface AppContextType {
  currentUser: User | null;
  misaList: JadwalMisa[];
  songs: LaguMisa[];
  isLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  addMisa: (misa: Omit<JadwalMisa, "id" | "created_at" | "user_id">) => Promise<JadwalMisa | null>;
  updateMisa: (misaId: number, data: Partial<JadwalMisa>) => Promise<boolean>;
  updateMisaStatus: (misaId: number, status: JadwalMisa["status"]) => Promise<void>;
  getMisaSongs: (misaId: number) => LaguMisa[];
  saveMisaSongs: (misaId: number, categorySongs: Omit<LaguMisa, "id" | "created_at">[]) => Promise<boolean>;
  deleteMisa: (misaId: number) => Promise<boolean>;
  searchDataLagu: (query: string, sourceType?: "ps" | "mb" | "teks") => Promise<{ data: DataLagu[]; error: boolean }>;
  saveSongsToDataLagu: (
    songsToSave: Pick<
      LaguMisa,
      "judul_lagu" | "header_buku" | "teks_reff" | "teks_ayat_1" | "json_ayat_tambahan" | "susunan_nyanyi"
    >[]
  ) => Promise<void>;
  fetchDataLagu: () => Promise<{ data: DataLagu[]; error: boolean }>;
  fetchDataLaguById: (id: number) => Promise<{ data: DataLagu | null; error: boolean }>;
  updateDataLagu: (
    id: number,
    payload: Pick<DataLagu, "judul_lagu" | "header_buku" | "teks_reff" | "teks_ayat_1" | "json_ayat_tambahan" | "susunan_nyanyi">
  ) => Promise<{ data: DataLagu | null; error: string | null }>;
  deleteDataLagu: (id: number) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [misaList, setMisaList] = useState<JadwalMisa[]>([]);
  const [songs, setSongs] = useState<LaguMisa[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Initial auth check from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setCurrentUserState(parsedUser);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  // 2. Fetch data specifically for the logged-in user
  useEffect(() => {
    const fetchInitialData = async () => {
      // If no user is logged in, clear data
      if (!currentUser) {
        setMisaList([]);
        setSongs([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      const { data: misaData, error: misaError } = await supabase
        .from('jadwal_misa')
        .select('*')
        .order('tanggal', { ascending: false })
        .eq('user_id', currentUser.id); // Strictly enforce RLS via code
        
      if (!misaError) {
        setMisaList(misaData || []);
      }

      const { data: songsData, error: songsError } = await supabase
        .from('lagu_misa')
        .select('*');

      if (!songsError) {
        setSongs(songsData || []);
      }

      setIsLoading(false);
    };

    fetchInitialData();
  }, [currentUser?.id]);

  const setCurrentUser = (user: User | null) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    setCurrentUserState(user);
  };

  const addMisa = async (misaInput: Omit<JadwalMisa, "id" | "created_at" | "user_id">) => {
    const { data, error } = await supabase
      .from('jadwal_misa')
      .insert([{
         ...misaInput,
         user_id: currentUser?.id
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding misa:", error);
      return null;
    }
    
    setMisaList((prev) => [data, ...prev]);
    return data;
  };

  const updateMisa = async (misaId: number, data: Partial<JadwalMisa>) => {
    const { error } = await supabase
      .from('jadwal_misa')
      .update(data)
      .eq('id', misaId);

    if (error) {
      console.error("Error updating misa:", error);
      return false;
    }

    setMisaList((prev) => prev.map((m) => (m.id === misaId ? { ...m, ...data } : m)));
    return true;
  };

  const updateMisaStatus = async (misaId: number, status: JadwalMisa["status"]) => {
    const { error } = await supabase
      .from('jadwal_misa')
      .update({ status })
      .eq('id', misaId);

    if (error) {
      console.error("Error updating misa status:", error);
      return;
    }

    setMisaList((prev) => prev.map((m) => (m.id === misaId ? { ...m, status } : m)));
  };

  const deleteMisa = async (misaId: number) => {
    // Hapus lagu terkait terlebih dahulu untuk menghindari foreign key constraint error
    const { error: songError } = await supabase
      .from('lagu_misa')
      .delete()
      .eq('misa_id', misaId);

    if (songError) {
      console.error("Error deleting misa songs:", songError);
    }

    const { error } = await supabase
      .from('jadwal_misa')
      .delete()
      .eq('id', misaId);

    if (error) {
      console.error("Error deleting misa:", error);
      return false;
    }

    setMisaList((prev) => prev.filter((m) => m.id !== misaId));
    setSongs((prev) => prev.filter((s) => s.misa_id !== misaId));
    return true;
  };

  const getMisaSongs = (misaId: number) => {
    return songs.filter((s) => s.misa_id === misaId);
  };

  const saveMisaSongs = async (misaId: number, categorySongs: Omit<LaguMisa, "id" | "created_at">[]): Promise<boolean> => {
    if (categorySongs.length === 0) return true;
    const category = categorySongs[0].kategori;

    // Simpan snapshot lagu saat ini untuk rollback jika terjadi kesalahan di database
    const previousSongsForCategory = songs.filter(s => s.misa_id === misaId && s.kategori === category);

    const songsToInsert = categorySongs.map(song => {
      const { id, created_at, ...rest } = song as any;
      return rest;
    });

    try {
      // 1. Hapus lagu lama untuk kategori ini
      const { error: deleteError } = await supabase
        .from('lagu_misa')
        .delete()
        .eq('misa_id', misaId)
        .eq('kategori', category);

      if (deleteError) {
        console.error("Error deleting old songs during save:", deleteError);
        throw deleteError;
      }

      // 2. Masukkan lagu baru
      const { data, error: insertError } = await supabase
        .from('lagu_misa')
        .insert(songsToInsert)
        .select();

      if (insertError) {
        console.error("Error saving new songs during save:", insertError);
        // ROLLBACK: Kembalikan data lama ke Supabase jika insert gagal setelah delete
        if (previousSongsForCategory.length > 0) {
          const rollbackPayload = previousSongsForCategory.map(s => {
            const { id, created_at, ...rest } = s as any;
            return rest;
          });
          await supabase.from('lagu_misa').insert(rollbackPayload);
        }
        throw insertError;
      }

      if (data) {
        setSongs((prev) => {
          const filtered = prev.filter(s => !(s.misa_id === misaId && s.kategori === category));
          return [...filtered, ...data];
        });
      }
      return true;
    } catch (err) {
      console.error("saveMisaSongs failed. Rolling back local state:", err);
      // Rollback state lokal agar tidak sinkron dengan data yang rusak
      setSongs((prev) => {
        const hasSongs = prev.some(s => s.misa_id === misaId && s.kategori === category);
        if (!hasSongs && previousSongsForCategory.length > 0) {
          return [...prev, ...previousSongsForCategory];
        }
        return prev;
      });
      return false;
    }
  };

  const searchDataLagu = useCallback(async (query: string, sourceType?: "ps" | "mb" | "teks"): Promise<{ data: DataLagu[]; error: boolean }> => {
    const cleanQuery = query.trim().replace(/[,()]/g, " ");
    const minLength = sourceType === "ps" || sourceType === "mb" ? 1 : 2;
    if (cleanQuery.length < minLength) return { data: [], error: false };

    let request = supabase.from("data_lagu").select("*");

    if (sourceType === "ps") {
      const digits = cleanQuery.replace(/\D/g, "");
      if (!digits) return { data: [], error: false };
      request = request
        .or("header_buku.ilike.%puji syukur%,header_buku.ilike.ps%,header_buku.ilike.% ps%")
        .ilike("header_buku", `%${digits}%`);
    } else if (sourceType === "mb") {
      const digits = cleanQuery.replace(/\D/g, "");
      if (!digits) return { data: [], error: false };
      request = request
        .or("header_buku.ilike.%madah bhakti%,header_buku.ilike.%madah bakti%,header_buku.ilike.mb%,header_buku.ilike.% mb%")
        .ilike("header_buku", `%${digits}%`);
    } else if (sourceType === "teks") {
      request = request
        .or("header_buku.is.null,and(header_buku.not.ilike.%puji syukur%,header_buku.not.ilike.ps%,header_buku.not.ilike.% ps%,header_buku.not.ilike.%madah bhakti%,header_buku.not.ilike.%madah bakti%,header_buku.not.ilike.mb%,header_buku.not.ilike.% mb%)")
        .or(`judul_lagu.ilike.%${cleanQuery}%,header_buku.ilike.%${cleanQuery}%,teks_ayat_1.ilike.%${cleanQuery}%`);
    } else {
      request = request.or(`judul_lagu.ilike.%${cleanQuery}%,header_buku.ilike.%${cleanQuery}%`);
    }
    const { data, error } = await request
      .order("judul_lagu", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Error searching data_lagu:", error);
      return { data: [], error: true };
    }

    return { data: data || [], error: false };
  }, []);

  const saveSongsToDataLagu = useCallback(async (
    songsToSave: Pick<
      LaguMisa,
      "judul_lagu" | "header_buku" | "teks_reff" | "teks_ayat_1" | "json_ayat_tambahan" | "susunan_nyanyi"
    >[]
  ) => {
    // Samakan normalisasi dedup_key DB agar 1 batch upsert tidak berisi dua key identik (Postgres 21000)
    const deduped = new Map<string, {
      judul_lagu: string;
      header_buku: string | null;
      teks_reff: string | null;
      teks_ayat_1: string;
      json_ayat_tambahan: string;
      susunan_nyanyi: string;
    }>();

    for (const song of songsToSave) {
      const judul = formatJudulLagu(song.judul_lagu || "");
      const ayat1 = (song.teks_ayat_1 || "").trim();
      if (!judul || !ayat1) continue;
      const header = formatHeaderBuku(song.header_buku || "");
      const normalizedHeader = header
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/^(puji syukur|ps)\.?\s*(no\.?\s*)?(?=[0-9]|$)/, "ps ")
        .replace(/^(madah bh?akti|mb)\.?\s*(no\.?\s*)?(?=[0-9]|$)/, "mb ")
        .trim();
      const key = `${judul.toLowerCase().replace(/\s+/g, " ")}||${normalizedHeader}`;
      deduped.set(key, {
        judul_lagu: judul,
        header_buku: header || null,
        teks_reff: song.teks_reff?.trim() || null,
        teks_ayat_1: song.teks_ayat_1,
        json_ayat_tambahan: song.json_ayat_tambahan || JSON.stringify([]),
        susunan_nyanyi: song.susunan_nyanyi || "ayat-only",
      });
    }

    const payloads = Array.from(deduped.values());
    if (payloads.length === 0) return;

    const { error } = await supabase
      .from("data_lagu")
      .upsert(payloads, { onConflict: "dedup_key" });

    if (error) {
      console.error("Error upserting data_lagu:", error);
    }
  }, []);

  const fetchDataLagu = useCallback(async (): Promise<{ data: DataLagu[]; error: boolean }> => {
    const { data, error } = await supabase
      .from("data_lagu")
      .select("*")
      .order("judul_lagu", { ascending: true });

    if (error) {
      console.error("Error fetching data_lagu:", error);
      return { data: [], error: true };
    }
    return { data: data || [], error: false };
  }, []);

  const fetchDataLaguById = useCallback(async (id: number): Promise<{ data: DataLagu | null; error: boolean }> => {
    const { data, error } = await supabase
      .from("data_lagu")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching data_lagu by id:", error);
      return { data: null, error: true };
    }
    return { data, error: false };
  }, []);

  const updateDataLagu = useCallback(async (
    id: number,
    payload: Pick<DataLagu, "judul_lagu" | "header_buku" | "teks_reff" | "teks_ayat_1" | "json_ayat_tambahan" | "susunan_nyanyi">
  ): Promise<{ data: DataLagu | null; error: string | null }> => {
    const cleanPayload = {
      judul_lagu: formatJudulLagu(payload.judul_lagu),
      header_buku: formatHeaderBuku(payload.header_buku || "") || null,
      teks_reff: payload.teks_reff?.trim() || null,
      teks_ayat_1: payload.teks_ayat_1,
      json_ayat_tambahan: payload.json_ayat_tambahan || JSON.stringify([]),
      susunan_nyanyi: payload.susunan_nyanyi || "ayat-only",
    };

    const { data, error } = await supabase
      .from("data_lagu")
      .update(cleanPayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { data: null, error: "Lagu dengan judul dan nomor buku tersebut sudah ada (duplikat)." };
      }
      console.error("Error updating data_lagu:", error);
      return { data: null, error: "Gagal menyimpan perubahan lagu ke database." };
    }

    return { data, error: null };
  }, []);

  const deleteDataLagu = useCallback(async (id: number): Promise<boolean> => {
    const { error } = await supabase.from("data_lagu").delete().eq("id", id);
    if (error) {
      console.error("Error deleting data_lagu:", error);
      return false;
    }
    return true;
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        misaList,
        songs,
        isLoading,
        setCurrentUser,
        addMisa,
        updateMisa,
        updateMisaStatus,
        getMisaSongs,
        saveMisaSongs,
        deleteMisa,
        searchDataLagu,
        saveSongsToDataLagu,
        fetchDataLagu,
        fetchDataLaguById,
        updateDataLagu,
        deleteDataLagu,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
