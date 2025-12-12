"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const UserContext = createContext();

const insertPelanggan = async (user) => {
  if (!user) return;

  // 1. Cek apakah user sudah ada di tabel 'pelanggan'
  const { data: existingData, error: selectError } = await supabase
    .from("pelanggan")
    .select("id_pelanggan")
    .eq("id_pelanggan", user.id)
    .maybeSingle();

  if (selectError && selectError.code !== "PGRST116") {
    // PGRST116 = Data tidak ditemukan
    console.error("Gagal memeriksa pelanggan:", selectError.message);
    return;
  }

  // 2. Jika data pelanggan BELUM ADA, baru masukkan (INSERT)
  if (!existingData) {
    console.log("Memasukkan pelanggan baru ke tabel 'pelanggan'...");

    // Supabase menyimpan nama user dari OAuth di object user_metadata
    const fullName = user.user_metadata?.full_name || user.email;

    const { error: insertError } = await supabase.from("pelanggan").insert([
      {
        id_pelanggan: user.id,
        nama: fullName,
      },
    ]);

    if (insertError) {
      console.error("Gagal menyisipkan pelanggan baru:", insertError.message);
    } else {
      console.log(`Pelanggan baru (${fullName}) berhasil ditambahkan!`);
    }
  }
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- 1. Ambil user saat komponen pertama kali dimuat ---
    const getInitialUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);
      setLoading(false);

      // Panggil insertPelanggan untuk kasus user sudah login tapi data profil belum ada
      if (currentUser) {
        insertPelanggan(currentUser);
      }
    };

    getInitialUser();

    // --- 2. Dengarkan perubahan status otentikasi ---
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // JIKA event-nya adalah SIGNED_IN (yaitu setelah login sukses atau redirect)
      // Lakukan penyisipan data pelanggan
      if (event === "SIGNED_IN" && currentUser) {
        insertPelanggan(currentUser);
      }

      // Matikan loading setelah mendapatkan sesi pertama kali
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
