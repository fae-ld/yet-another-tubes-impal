"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const UserContext = createContext();

const insertPelanggan = async (user) => {
  if (!user) return null;

  // Cek apakah email ada di tabel staf
  const { data: stafData } = await supabase
    .from("staf")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();

  if (stafData) return null;

  // 1. Cek apakah user sudah ada
  const { data: existingData, error: selectError } = await supabase
    .from("pelanggan")
    .select("nama")
    .eq("id_pelanggan", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("Gagal memeriksa pelanggan:", selectError.message);
    return null;
  }

  // 2. Jika SUDAH ADA, langsung kembalikan namanya
  if (existingData) {
    return existingData.nama;
  }

  // 3. Jika BELUM ADA, insert baru
  const fullName =
    user.user_metadata?.display_name || user.user_metadata?.full_name;
  const { error: insertError } = await supabase.from("pelanggan").insert([
    {
      id_pelanggan: user.id,
      nama: fullName,
    },
  ]);

  if (insertError) {
    console.error("Gagal insert:", insertError.message);
    return null;
  }

  return fullName;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- 1. Ambil user saat komponen pertama kali dimuat ---
    const getInitialUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          const namaDariDb = await insertPelanggan(currentUser);
          setUser({ ...currentUser, nama_pelanggan: namaDariDb });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
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
