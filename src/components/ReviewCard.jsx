import { Star, User } from "lucide-react";

/**
 * Komponen Kartu Ulasan (ReviewCard)
 * Menampilkan ulasan yang sudah ada (rating, teks, dan info pengulas).
 * * @param {object} props
 * @param {object} props.review - Objek ulasan dari database.
 * @param {number} props.review.rating - Nilai rating (1-5).
 * @param {string} props.review.ulasan_teks - Teks ulasan/komentar.
 * @param {string} props.review.tgl_ulasan - Timestamp tanggal ulasan.
 * @param {string} props.review.pelanggan_nama - (Asumsi di-join) Nama pelanggan.
 * @param {string} [props.variant='default'] - Varian tampilan ('default' atau 'compact').
 */
export default function ReviewCard({ review, variant = "default" }) {
  // Safety check dan destructuring
  if (!review) {
    return (
      <div className="text-gray-500 italic p-4 border rounded-lg">
        Ulasan tidak ditemukan.
      </div>
    );
  }

  const { rating, ulasan_teks, tgl_ulasan } = review;

  // Asumsi nama pelanggan ada di objek review (misalnya, hasil join di fetch data)
  const reviewerName = review.pelanggan_nama || "Pelanggan";

  // Format tanggal
  const formattedDate = tgl_ulasan
    ? new Date(tgl_ulasan).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Tanggal tidak diketahui";

  // Tentukan style berdasarkan variant
  const isCompact = variant === "compact";
  const cardStyle = isCompact
    ? "p-3 border-l-4 border-blue-400 bg-gray-50"
    : "p-5 border-2 border-gray-100 bg-white shadow-md";

  return (
    <div
      className={`rounded-xl ${cardStyle} transition duration-300 hover:shadow-lg`}
    >
      <div className="flex items-center justify-between mb-2">
        {/* Rating Bintang */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={isCompact ? 16 : 20}
              fill={i < rating ? "#facc15" : "none"}
              stroke="#facc15"
              aria-label={`${rating} dari 5 bintang`}
            />
          ))}
          <span
            className={`font-semibold ${isCompact ? "text-sm" : "text-md"} text-gray-700 ml-1`}
          >
            {rating}/5
          </span>
        </div>

        {/* Info Reviewer */}
        <div className="flex items-center text-gray-500 text-sm">
          <User size={16} className="mr-1" />
          <span className="font-medium">{reviewerName}</span>
        </div>
      </div>

      {/* Teks Ulasan */}
      {ulasan_teks && (
        <p
          className={`text-gray-800 italic ${isCompact ? "text-sm" : "text-base"} my-3`}
        >
          "{ulasan_teks}"
        </p>
      )}

      {/* Tanggal Ulasan */}
      <div
        className={`mt-2 text-right text-gray-400 ${isCompact ? "text-xs" : "text-sm"}`}
      >
        Diulas pada {formattedDate}
      </div>
    </div>
  );
}
