import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "role";
const COOKIE_SECRET = process.env.COOKIE_SECRET;

// Rute yang diizinkan untuk diakses publik (dinamis: menampilkan login jika belum auth, dashboard jika sudah auth)
// Kita masukkan '/' dan '/staff' di sini.
const ALLOWED_PUBLIC_PATHS = ["/", "/staff"];

export async function middleware(req) {
  const url = req.nextUrl.clone();
  const { pathname } = req.nextUrl;

  // Cek apakah pathname yang diakses adalah salah satu dari entry point publik
  const isPublicPath = ALLOWED_PUBLIC_PATHS.includes(pathname);

  // 1. Ambil cookie dan verifikasi token
  const token = req.cookies.get(COOKIE_NAME)?.value;
  let role = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(COOKIE_SECRET),
      );
      role = payload.role;
    } catch (err) {
      console.log("Invalid role token, deleting cookie:", err.message);
      // Jika token invalid/expired, hapus cookie dan arahkan ke root
      const response = NextResponse.redirect(new URL("/", req.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // =========================================================
  // LOGIKA UTAMA: PROTEKSI DAN OTORISASI
  // =========================================================

  // A. Jika pengguna BELUM LOGIN (role null)
  if (!role) {
    // Jika mencoba mengakses rute SELAIN rute publik ('/' atau '/staff')
    if (!isPublicPath) {
      // Redirect ke rute root "/" (yang akan menampilkan form login pelanggan)
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Jika mengakses rute publik ('/' atau '/staff') saat belum login, biarkan akses.
    // Asumsi: Component di / dan /staff akan menampilkan UI login.
    return NextResponse.next();
  }

  // B. Jika pengguna SUDAH LOGIN (role ada)

  // 1. Logic Otorisasi (Pelanggan vs Staf)

  // Kalau staff → harus ke /staff*
  // Jika staff mencoba mengakses rute non-staff (e.g., /orders atau /)
  if (role === "staf" && !pathname.startsWith("/staff")) {
    url.pathname = "/staff"; // Redirect ke dashboard staf
    return NextResponse.redirect(url);
  }

  // Kalau pelanggan → tidak boleh ke /staff*
  // Jika pelanggan mencoba mengakses rute staf (e.g., /staff atau /staff/orders)
  if (role === "pelanggan" && pathname.startsWith("/staff")) {
    url.pathname = "/"; // Redirect ke dashboard pelanggan
    return NextResponse.redirect(url);
  }

  // Lanjutkan jika semua rule dilewati
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|images|api).*)"],
};
