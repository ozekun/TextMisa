import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="KOMSOS Logo" className="w-8 h-8 object-contain shrink-0" />
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-slate-900">Running </span>
              <span className="text-brand-primary">Teks</span>
            </span>
          </div>
          <nav>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-hover rounded-full transition-all shadow-sm hover:shadow-md"
            >
              Masuk
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto">
        <div className="space-y-6">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-brand-primary border border-emerald-100 uppercase tracking-wider">
            Otomatisasi Running Teks Liturgi
          </span>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Persiapan Running Teks Misa Menjadi{" "}
            <span className="text-brand-primary">Lebih Mudah & Cepat</span>
          </h1>
          
          <p className="text-lg md:text-xl text-text-sec font-light max-w-2xl mx-auto leading-relaxed">
            MisaText memudahkan Petugas Liturgi Kelompok Umat Basis (KBG) menyusun teks lirik lagu, ordinarium, dan running teks liturgi Ekaristi secara otomatis untuk SPX Graphics.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Mulai Susun Teks Misa
            </Link>
            <Link
              href="#fitur"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all"
            >
              Pelajari Fitur
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <section id="fitur" className="mt-32 w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
              <span className="text-brand-primary font-bold text-lg">01</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Auto-Split Lirik</h3>
            <p className="text-text-sec text-sm leading-relaxed">
              Input lirik lagu Anda secara bebas, dan sistem kami secara otomatis membaginya menjadi maksimal 2 baris per slide dengan format tag ayat yang tepat.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
              <span className="text-brand-primary font-bold text-lg">02</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Real-Time SPX Preview</h3>
            <p className="text-text-sec text-sm leading-relaxed">
              Lihat pratinjau tampilan running teks Anda secara instan di dalam mockup card SPX Graphics, sebelum mengirimkan teks ke sistem broadcast.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
              <span className="text-brand-primary font-bold text-lg">03</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Manajemen Jadwal</h3>
            <p className="text-text-sec text-sm leading-relaxed">
              Kelola status draf, perayaan liturgi siap siar, serta arsip riwayat perayaan Ekaristi dalam satu dashboard terpusat yang intuitif.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between text-xs text-text-sec">
          <p>&copy; {new Date().getFullYear()} MisaText. Semua Hak Dilindungi.</p>
          <p>Didesain untuk Komsos Paroki.</p>
        </div>
      </footer>
    </div>
  );
}
