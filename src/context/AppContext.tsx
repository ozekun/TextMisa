"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { JadwalMisa, LaguMisa, User } from "../types";
import { supabase } from "../lib/supabaseClient";

interface AppContextType {
  currentUser: User | null;
  misaList: JadwalMisa[];
  songs: LaguMisa[];
  isLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  addMisa: (misa: Omit<JadwalMisa, "id" | "created_at" | "user_id">) => Promise<JadwalMisa | null>;
  updateMisaStatus: (misaId: number, status: JadwalMisa["status"]) => Promise<void>;
  getMisaSongs: (misaId: number) => LaguMisa[];
  saveMisaSongs: (misaId: number, categorySongs: Omit<LaguMisa, "id" | "created_at">[]) => Promise<void>;
  deleteMisa: (misaId: number) => Promise<boolean>;
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
    const { error } = await supabase
      .from('jadwal_misa')
      .delete()
      .eq('id', misaId);

    if (error) {
      console.error("Error deleting misa:", error);
      return false;
    }

    setMisaList((prev) => prev.filter((m) => m.id !== misaId));
    return true;
  };

  const getMisaSongs = (misaId: number) => {
    return songs.filter((s) => s.misa_id === misaId);
  };

  const saveMisaSongs = async (misaId: number, categorySongs: Omit<LaguMisa, "id" | "created_at">[]) => {
    if (categorySongs.length === 0) return;
    const category = categorySongs[0].kategori;

    const { error: deleteError } = await supabase
      .from('lagu_misa')
      .delete()
      .eq('misa_id', misaId)
      .eq('kategori', category);

    if (deleteError) {
      console.error("Error deleting old songs:", deleteError);
      return;
    }

    const songsToInsert = categorySongs.map(song => {
      const { id, created_at, ...rest } = song as any;
      return rest;
    });

    const { data, error: insertError } = await supabase
      .from('lagu_misa')
      .insert(songsToInsert)
      .select();

    if (insertError) {
      console.error("Error saving new songs:", insertError);
      return;
    }

    if (data) {
      setSongs((prev) => {
        const filtered = prev.filter(s => !(s.misa_id === misaId && s.kategori === category));
        return [...filtered, ...data];
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        misaList,
        songs,
        isLoading,
        setCurrentUser,
        addMisa,
        updateMisaStatus,
        getMisaSongs,
        saveMisaSongs,
        deleteMisa,
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
