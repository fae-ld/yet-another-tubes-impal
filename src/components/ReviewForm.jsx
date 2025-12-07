"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase"; // Asumsi lokasi supabase
import { useUser } from "@/contexts/UserContext"; // Asumsi Anda menggunakan context user

/**
 * Komponen Form Ulasan (ReviewForm)
 * Digunakan oleh pelanggan untuk memberikan rating dan komentar pada pesanan yang sudah selesai.
 * * @param {object} props
 * @param {number} props.orderId - ID pesanan yang akan diulas.
 * @param {function} props.onReviewSubmitted - Callback setelah ulasan berhasil dikirim.
 */
export default function ReviewForm({ orderId, onReviewSubmitted }) {
  const { user } = useUser();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fungsi untuk mengubah rating saat bintang diklik atau di-hover
  const handleRatingChange = (newRating) => {
    if (!loading) {
      setRating(newRating);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi minimal rating 1
    if (rating === 0) {
      setError("Anda harus memberikan minimal 1 bintang.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const newReview = {
      id_pesanan: orderId,
      id_pelanggan: user?.id,
      rating: rating,
      ulasan_teks: reviewText.trim() || null, // Kirim null jika teks kosong
    };

    try {
      // 1. Insert ulasan ke tabel 'ulasan'
      const { error: insertError } = await supabase
        .from("ulasan")
        .insert([newReview]);

      if (insertError) {
        // Contoh: Error jika ulasan sudah ada (constraint unik pada id_pesanan)
        if (insertError.code === "23505") {
          throw new Error("Pesanan ini sudah pernah diulas.");
        }
        throw insertError;
      }

      setSuccess("Terima kasih! Ulasan Anda berhasil dikirim.");

      // Panggil callback untuk menginformasikan komponen induk (misal: refresh data)
      onReviewSubmitted();
    } catch (err) {
      console.error("Gagal mengirim ulasan:", err);
      setError(err.message || "Terjadi kesalahan saat mengirim ulasan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-6">
      <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
        Beri Ulasan Kami ✨
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Bagian Rating Bintang */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Rating Anda (1-5 Bintang)
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((starValue) => (
              <Star
                key={starValue}
                size={30}
                fill={starValue <= rating ? "#facc15" : "none"} // Kuning terang saat terisi
                stroke="#facc15" // Garis luar kuning
                className={`cursor-pointer transition-transform duration-150 ${
                  starValue <= rating ? "scale-110" : "hover:scale-110"
                }`}
                onClick={() => handleRatingChange(starValue)}
                aria-label={`Beri ${starValue} bintang`}
              />
            ))}
          </div>
        </div>

        {/* Bagian Ulasan Teks */}
        <div className="mb-6">
          <label
            htmlFor="reviewText"
            className="block text-gray-700 font-medium mb-2"
          >
            Komentar Anda (Opsional)
          </label>
          <textarea
            id="reviewText"
            rows="4"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Bagaimana pengalaman Anda dengan layanan kami?"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 resize-none"
            disabled={loading}
          ></textarea>
        </div>

        {/* Feedback dan Tombol Kirim */}
        {error && (
          <p className="mb-3 text-sm font-medium text-red-600 bg-red-100 p-2 rounded">
            ❌ {error}
          </p>
        )}
        {success && (
          <p className="mb-3 text-sm font-medium text-green-600 bg-green-100 p-2 rounded">
            ✅ {success}
          </p>
        )}

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200 flex items-center justify-center"
          disabled={loading || success}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin mr-2" />
              Mengirim...
            </>
          ) : (
            "Kirim Ulasan"
          )}
        </Button>
      </form>
    </div>
  );
}
