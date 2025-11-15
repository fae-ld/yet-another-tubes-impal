// components/HomePageContent.jsx
import Image from 'next/image';
import Link from 'next/link'; // Diperlukan untuk navigasi

// Mendefinisikan PATH gambar (Pastikan semua path ini benar di folder public/images/)
const IMAGE_PATHS = {
  HERO_BG: '/images/mesin-cuci.jpeg', 
  THINKING_WOMAN: '/images/thinking-woman.png',
  PICKUP: '/images/gambar-1.png', // Asumsi: Pickup
  WASH_DRY: '/images/gambar-2.png', // Asumsi: Cuci & Kering
  IRONING: '/images/ic-ironwash.png', // Asumsi: Setrika
  DELIVERY: '/images/gambar-3.png', // Asumsi: Delivery
};

// --- Komponen Pembantu ---

const SectionContainer = ({ children, className = '' }) => (
  <section className={`py-16 md:py-24 ${className}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  </section>
);

const StepCard = ({ number, title, description, imageSrc }) => (
  <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
    <div className="flex justify-center mb-4">
      <Image src={imageSrc} alt={title} width={120} height={120} className="object-contain" />
    </div>
    <p className="text-sm font-semibold text-[#00A6FB] mb-1">LANGKAH {number}</p>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm">{description}</p>
  </div>
);

const TestimonyCard = ({ name, rating, text }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#00A6FB]"> 
    <div className="flex items-center mb-3">
      <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
      <div>
        <p className="font-semibold text-gray-800">{name}</p>
        <div className="text-yellow-400 text-sm">
          {'★'.repeat(rating) + '☆'.repeat(5 - rating)}
        </div>
      </div>
    </div>
    <p className="text-gray-600 text-sm italic">"{text}"</p>
  </div>
);

// --- Komponen Utama ---

export default function HomePageContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header / Hero Section */}
      <header className="relative text-white pt-24 pb-32 md:pt-32 md:pb-48 overflow-hidden" 
              style={{ 
                backgroundImage: `url(${IMAGE_PATHS.HERO_BG})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                minHeight: '70vh', 
                display: 'flex', 
                alignItems: 'center', 
              }}>
        <div className="absolute inset-0 bg-[#00A6FB] opacity-80"></div> 
        
        {/* Konten Hero */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-start justify-center h-full">
          
          {/* Judul dengan font custom (memerlukan konfigurasi di tailwind.config.js) */}
          <h1 className="font-rethink text-[40px] leading-[40px] font-extrabold mb-4 max-w-2xl text-left">
            Bersihkan Pakaianmu dan Dapatkan Layanan Terbaik Tanpa Harus Keluar Rumah
          </h1>
          <p className="text-xl mb-8 max-w-xl text-left">
            Laundry Pintar Hadir untuk Kamu Sekarang!
          </p>
          
          {/* TOMBOL LAYANAN: Mengarah ke /services/1 */}
          <Link 
            href="/services/" 
            className="bg-white text-[#00A6FB] font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition duration-300 inline-block"
          >
            Layanan
          </Link>
          
        </div>
      </header>

      {/* About Us Section */}
      <SectionContainer className="bg-white">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          About Us: Mengapa Harus Memilih LaundryGo?
        </h2>
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/3 flex justify-center">
            <Image 
              src={IMAGE_PATHS.THINKING_WOMAN} 
              alt="Thinking Woman" 
              width={300} 
              height={300} 
              className="w-full max-w-xs h-auto" 
            />
          </div>
          <div className="md:w-2/3">
            <p className="text-gray-600 mb-4 text-lg leading-relaxed">
              <span className="font-bold">LaundryGo</span> adalah layanan *laundry* digital yang dirancang untuk memudahkan hidup Anda. Lewat aplikasi, Anda dapat mencuci pakaian secara mandiri dengan cepat, praktis, dan transparan tanpa harus antre atau bergantung pada staf.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Kami menghadirkan pengalaman *self-service* yang efisien dan modern, sehingga Anda bisa mengatur waktu dengan lebih fleksibel. Semua proses dirancang agar mudah digunakan, bahkan bagi pengguna baru.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* 4 Steps Section */}
      <SectionContainer className="bg-blue-50">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Selesai dalam 4 Langkah
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <StepCard 
            number={1} 
            title="Pickup" 
            description="Pakaian kotor Anda akan dijemput langsung dari rumah Anda."
            imageSrc={IMAGE_PATHS.PICKUP} 
          />
          <StepCard 
            number={2} 
            title="Cuci & Kering" 
            description="Proses pencucian dan pengeringan yang cepat dan higienis."
            imageSrc={IMAGE_PATHS.WASH_DRY} 
          />
          <StepCard 
            number={3} 
            title="Setrika" 
            description="Pakaian disetrika rapi agar siap dipakai kembali."
            imageSrc={IMAGE_PATHS.IRONING} 
          />
          <StepCard 
            number={4} 
            title="Delivery" 
            description="Pakaian bersih diantar kembali ke rumah Anda."
            imageSrc={IMAGE_PATHS.DELIVERY} 
          />
        </div>
      </SectionContainer>

      {/* Testimonials Section */}
      <SectionContainer className="bg-white">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Testimoni Pengguna
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TestimonyCard 
            name="Erysha" 
            rating={5} 
            text="Layanan pickup-nya sangat membantu! Jadi bisa pesan laundry sambil mengerjakan tugas lain. Hasilnya bersih banget." 
          />
          <TestimonyCard 
            name="Eizarin" 
            rating={5} 
            text="Prosesnya cepat, hasil cucian bersih dan wangi. Benar-benar praktis!" 
          />
          <TestimonyCard 
            name="Qaarina" 
            rating={5} 
            text="Saya sangat terbantu menghemat waktu dan tenaga. Hanya pesan dari rumah, pakaian sudah bersih dan wangi. Top banget." 
          />
        </div>
      </SectionContainer>

      {/* CTA Bottom Section */}
      <div className="bg-[#00A6FB] py-16 text-center text-white"> 
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Mulai Cuci Praktis dan Hidup Lebih Efisien
        </h2>
       
      </div>

    </div>
  );
}