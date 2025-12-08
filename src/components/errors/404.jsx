import Link from "next/link";
import { Home, Frown } from "lucide-react";

/**
 * @typedef {object} NotFoundProps
 * @property {string} [title] - Judul yang ditampilkan di halaman 404.
 * @property {string} [message] - Pesan detail untuk user.
 * @property {string} [redirectPath] - Path untuk tombol kembali. Default: "/dashboard".
 * @property {string} [redirectText] - Teks untuk tombol kembali. Default: "Kembali ke Dashboard".
 */

/**
 * Komponen tampilan error 404 (Not Found) yang stylish.
 * @param {NotFoundProps} props
 */
export default function NotFound({
  title = "404 - Halaman Tidak Ditemukan",
  message = "Maaf, kami tidak dapat menemukan halaman yang Anda cari. Mungkin halaman tersebut sudah dihapus, diubah namanya, atau alamatnya salah ketik.",
  redirectPath = "/",
  redirectText = "Kembali ke Beranda",
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-xl shadow-2xl border border-gray-100">
        {/* Ikon dan Kode Error */}
        <div className="mb-6 flex flex-col items-center">
          <Frown className="w-16 h-16 text-red-500 mb-4 animate-bounce-slow" />
          <h1 className="text-6xl font-extrabold text-red-600 mb-2">404</h1>
        </div>

        {/* Judul dan Pesan */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
          {title}
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">{message}</p>

        {/* Tombol Aksi */}
        <Link href={redirectPath}>
          <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Home className="w-5 h-5 mr-2" />
            {redirectText}
          </button>
        </Link>

        {/* Footer/Catatan Kaki */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-400">
          <p>
            Jika Anda yakin ini adalah kesalahan, silakan hubungi administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
