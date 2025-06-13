"use client";

import Image from "next/image";
import { Inter, Playfair_Display, Montserrat, Poppins } from 'next/font/google';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import AccessibilityPanel from './components/AccessibilityPanel';
import { sendSMS, formatReservationMessage } from './lib/infobip';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'] });
const montserrat = Montserrat({ 
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'] 
});
const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'] 
});

export default function Home() {
  const [location, setLocation] = useState('Balkanu');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [reservationData, setReservationData] = useState({
    name: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: '1',
    roomType: 'standard',
    specialRequests: '',
    country: '',
    action: ''
  });
  const [formStatus, setFormStatus] = useState({
    loading: false,
    success: false,
    error: null
  });
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [currentFoodImageIndex, setCurrentFoodImageIndex] = useState(0);
  const [currentAccommodationImageIndex, setCurrentAccommodationImageIndex] = useState(0);
  const [currentWellnessImageIndex, setCurrentWellnessImageIndex] = useState(0);
  const [currentEntertainmentImageIndex, setCurrentEntertainmentImageIndex] = useState(0);
  const [currentTripsImageIndex, setCurrentTripsImageIndex] = useState(0);
  const [currentZooImageIndex, setCurrentZooImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const foodImages = [
    "https://i.imgur.com/asCNLpJ.jpeg",
    "https://i.imgur.com/GajaKjB.jpeg",
    "https://i.imgur.com/UzLFwzr.jpeg",
    "https://i.imgur.com/vYn8vJC.jpeg",
    "https://i.imgur.com/4i6xdHa.jpeg"
  ];

  const accommodationImages = [
    "https://i.imgur.com/O66fr1v.jpeg",
    "https://i.imgur.com/rrXhCKK.jpeg",
    "https://i.imgur.com/UzLFwzr.jpeg",
    "https://i.imgur.com/vYn8vJC.jpeg",
    "https://i.imgur.com/4i6xdHa.jpeg"
  ];

  const wellnessImages = [
    "https://i.imgur.com/gMPHBtB.jpeg",
    "https://i.imgur.com/swvH196.jpeg",
    "https://i.imgur.com/Ma1tygm.jpeg",
    "https://i.imgur.com/4i6xdHa.jpeg"
  ];

  const entertainmentImages = [
    "https://i.imgur.com/asCNLpJ.jpeg",
    "https://i.imgur.com/GajaKjB.jpeg",
    "https://i.imgur.com/UzLFwzr.jpeg",
    "https://i.imgur.com/vYn8vJC.jpeg",
    "https://i.imgur.com/4i6xdHa.jpeg"
  ];

  const tripsImages = [
    "https://i.imgur.com/asCNLpJ.jpeg",
    "https://i.imgur.com/GajaKjB.jpeg",
    "https://i.imgur.com/UzLFwzr.jpeg",
    "https://i.imgur.com/vYn8vJC.jpeg",
    "https://i.imgur.com/4i6xdHa.jpeg"
  ];

  const zooImages = [
    "https://i.imgur.com/asCNLpJ.jpeg",
    "https://i.imgur.com/GajaKjB.jpeg",
    "https://i.imgur.com/UzLFwzr.jpeg",
    "https://i.imgur.com/vYn8vJC.jpeg",
    "https://i.imgur.com/4i6xdHa.jpeg"
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const timer = setInterval(() => {
      const now = new Date();
      const difference = endDate - now;

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });

      if (difference <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Funkcija za dohvaćanje lokacije
    const getLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const country = data.country_name;
        
        // Mapiranje država na regije
        const regionMap = {
          'Croatia': 'Hrvatskoj',
          'Serbia': 'Srbiji',
          'Montenegro': 'Crnoj Gori',
          'Slovenia': 'Sloveniji',
          'Bosnia and Herzegovina': 'Bosni i Hercegovini',
          'North Macedonia': 'Makedoniji'
        };

        setLocation(regionMap[country] || 'Balkanu');
      } catch (error) {
        console.error('Error fetching location:', error);
        setLocation('Balkanu');
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    const intervals = [
      setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentFoodImageIndex((prevIndex) => 
            prevIndex === foodImages.length - 1 ? 0 : prevIndex + 1
          );
          setIsTransitioning(false);
        }, 1000);
      }, 5000),
      setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentAccommodationImageIndex((prevIndex) => 
            prevIndex === accommodationImages.length - 1 ? 0 : prevIndex + 1
          );
          setIsTransitioning(false);
        }, 1000);
      }, 5000),
      setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentWellnessImageIndex((prevIndex) => 
            prevIndex === wellnessImages.length - 1 ? 0 : prevIndex + 1
          );
          setIsTransitioning(false);
        }, 1000);
      }, 5000),
      setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentEntertainmentImageIndex((prevIndex) => 
            prevIndex === entertainmentImages.length - 1 ? 0 : prevIndex + 1
          );
          setIsTransitioning(false);
        }, 1000);
      }, 5000),
      setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentTripsImageIndex((prevIndex) => 
            prevIndex === tripsImages.length - 1 ? 0 : prevIndex + 1
          );
          setIsTransitioning(false);
        }, 1000);
      }, 5000),
      setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentZooImageIndex((prevIndex) => 
            prevIndex === zooImages.length - 1 ? 0 : prevIndex + 1
          );
          setIsTransitioning(false);
        }, 1000);
      }, 5000)
    ];

    return () => intervals.forEach(interval => clearInterval(interval));
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ loading: true, success: false, error: null });

    try {
      // Validacija podataka
      if (!reservationData.name || !reservationData.phone || !reservationData.country) {
        throw new Error('Molimo popunite sva obavezna polja');
      }

      // Validacija broja telefona
      const phoneRegex = /^(\+387|0)?[0-9]{8,9}$/;
      if (!phoneRegex.test(reservationData.phone)) {
        throw new Error('Molimo unesite ispravan broj telefona (npr. 0603422909 ili +387603422909)');
      }

      // Ako je rezervacija, provjeri dodatna polja
      if (reservationData.action === 'reservation') {
        if (!reservationData.checkIn || !reservationData.checkOut || !reservationData.roomType) {
          throw new Error('Molimo popunite sva polja za rezervaciju (datume dolaska, odlaska i tip smještaja)');
        }
      }

      const data = {
        name: reservationData.name,
        phone: reservationData.phone,
        email: reservationData.email || '',
        country: reservationData.country,
        action: reservationData.action || 'info',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Dodaj polja za rezervaciju ako je action = 'reservation'
      if (reservationData.action === 'reservation') {
        Object.assign(data, {
          check_in: reservationData.checkIn,
          check_out: reservationData.checkOut,
          room_type: reservationData.roomType,
          guests: reservationData.guests || '1',
          special_requests: reservationData.specialRequests || ''
        });
      }

      // Pokušavamo spremiti podatke
      const tableName = reservationData.action === 'reservation' ? 'reservations' : 'contacts';
      const { error: insertError } = await supabase
        .from(tableName)
        .insert([data]);

      if (insertError) {
        console.error('Greška Supabase:', insertError);
        if (insertError.code === '42P01') {
          throw new Error('Tabela ne postoji. Molimo kontaktirajte administratora.');
        }
        throw new Error('Došlo je do greške prilikom slanja podataka. Molimo pokušajte ponovo.');
      }
      
      // Pošalji SMS potvrdu
      const message = formatReservationMessage(data);
      const smsResult = await sendSMS(reservationData.phone, message);

      if (!smsResult.success) {
        console.error('SMS sending failed:', smsResult.error);
      }
      
      setFormStatus({ loading: false, success: true, error: null });
      
      // Reset form data
      setReservationData({
        name: '',
        email: '',
        phone: '',
        country: '',
        action: '',
        checkIn: '',
        checkOut: '',
        roomType: '',
        guests: '1',
        specialRequests: ''
      });
      
      // Zatvori modal ako je otvoren
      if (showReservationForm) {
        setShowReservationForm(false);
      }
      
    } catch (error) {
      console.error('Greška u slanju forme:', error);
      setFormStatus({ 
        loading: false, 
        success: false, 
        error: error.message || 'Došlo je do greške prilikom slanja podataka. Molimo pokušajte ponovo.' 
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReservationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={`min-h-screen bg-white ${poppins.className}`}>
      {/* Header with Logo */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg' : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
        <Image
                src="/slike/logo.png"
                alt="Ajdinovići Logo"
                width={200}
                height={80}
                className="h-10 w-auto hover:scale-105 transition-transform duration-300"
              />
              <div className="hidden md:block">
                <p className="text-sm text-gray-600">
                  {location === 'Srbiji' ? (
                    <span className="text-[#009641] font-semibold animate-pulse">Posebna ponuda za penzionere iz Srbije!</span>
                  ) : (
                    <span className="text-gray-800 font-medium">Posebna ponuda za penzionere u <span className="text-[#009641] font-semibold">{location}</span></span>
                  )}
                </p>
              </div>
            </div>
            <button className="bg-[#009641] text-white px-5 py-2 rounded-full text-base font-medium hover:bg-[#009641]/90 transition-all hover:scale-105 hover:-translate-y-0.5 duration-300">
              Zatraži poziv
            </button>
          </div>
        </div>
      </header>
      
      {/* Special Offer Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 relative animate-slide-up">
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg hover:shadow-xl transition-all hover:scale-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-6">
              <div className="text-center mb-4">
                <h3 className={`text-xl ${playfair.className} font-bold text-gray-900 mb-2`}>
                  Posebna ponuda za penzionere iz {location}!
                </h3>
                <p className="text-gray-600 text-sm">
                  Uštedite <span className="text-[#ff0000] font-bold">50%</span> na redovne cijene
                </p>
              </div>

              <div className="bg-[#009641]/10 rounded-xl p-4 mb-4">
                <p className="text-center text-sm text-gray-600 mb-2">Ponuda ističe za:</p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-[#009641]">{timeLeft.days}</div>
                    <div className="text-gray-600 text-xs">dana</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-[#009641]">{timeLeft.hours}</div>
                    <div className="text-gray-600 text-xs">sati</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-[#009641]">{timeLeft.minutes}</div>
                    <div className="text-gray-600 text-xs">min</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-[#009641]">{timeLeft.seconds}</div>
                    <div className="text-gray-600 text-xs">sec</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-[#009641] text-black px-4 py-2.5 rounded-xl text-base font-semibold hover:bg-[#009641]/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 duration-300">
                  Rezervišite sada
                </button>
                <button 
                  onClick={() => setShowPopup(false)}
                  className="w-full text-gray-500 hover:text-gray-700 transition-colors text-sm"
                >
                  Zatvorite i nastavite pregled
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-[#009641] text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 duration-300 z-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen pt-20">
        <div className="absolute inset-0">
          <Image
            src="/slike/naslovna.jpg"
            alt="Penzion za penzionere"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 min-h-screen flex flex-col justify-center items-center text-center">
          <div className="max-w-3xl space-y-4 animate-fade-in-up">
            <h1 className={`text-4xl md:text-5xl ${playfair.className} text-white font-bold leading-tight animate-slide-up`}>
              POSEBNA PONUDA ZA PENZIONERE
            </h1>
            <p className={`text-3xl md:text-3xl ${montserrat.className} text-white font-bold leading-tight animate-slide-up delay-100`}>
              <span className="bg-[#ff0000] text-white px-4 py-1">50% POPUSTA</span> PO NOĆI
            </p>
            <p className="text-xl md:text-xl text-white/90 leading-relaxed animate-slide-up delay-200">
              Birajte sami koliko noći želite — sve je All-Inclusive!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-300 mt-4">
              <button
                onClick={() => setShowReservationForm(true)}
                className="bg-[#009641] text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-[#009641]/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 duration-300"
              >
                Rezerviši sada
              </button>
              <button
                onClick={() => setShowAboutUs(true)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-white/20 transition-all hover:scale-105 hover:-translate-y-0.5 duration-300"
              >
                Saznaj više o nama
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden">
            <div className="relative">
              <button
                onClick={() => setShowWelcomePopup(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="p-8">
                <h2 className={`text-3xl font-bold text-gray-900 mb-6 ${playfair.className}`}>
                  Dobrodošli u našu oazu mira i ugodnosti
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <img
                      src="https://i.imgur.com/UzLFwzr.jpeg"
                      alt="Tradicionalna hrana"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <img
                      src="https://i.imgur.com/asCNLpJ.jpeg"
                      alt="Specijaliteti"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <img
                      src="https://i.imgur.com/4i6xdHa.jpeg"
                      alt="Restoran"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  Naš kompleks nudi vrhunski smještaj, izvrsnu hranu i nezaboravno iskustvo u srcu prirode. Otkrijte naše posebne ponude i uživajte u čaroliji planine.
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowWelcomePopup(false)}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-[#009641] hover:bg-[#009641]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#009641] transition-all"
                  >
                    Zatvori
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 animate-fade-in">
            <h2 className={`text-2xl md:text-3xl ${playfair.className} text-gray-900 mb-2 animate-slide-up`}>
              Jedna cijena. <span className="bg-[#009641] text-white px-2">Sve uključeno</span>. <span className="text-[#ff0000] font-bold">Samo za penzionere!</span>
            </h2>
            <p className="text-base text-gray-600 animate-slide-up delay-100">Bez doplata. Bez troškova.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { 
                title: "Smještaj",
                description: "Hoteli, bungalovi, planinske kuće, vile",
                isSlideshow: true,
                images: accommodationImages,
                currentIndex: currentAccommodationImageIndex
              },
              { 
                title: "Wellness",
                description: "SPA & Wellness centar",
                isSlideshow: true,
                images: wellnessImages,
                currentIndex: currentWellnessImageIndex
              },
              { 
                title: "Hrana",
                description: "Neograničena hrana i piće",
                isSlideshow: true,
                images: foodImages,
                currentIndex: currentFoodImageIndex
              },
              { 
                title: "Zabava",
                description: "Posebni programi za penzionere",
                isSlideshow: true,
                images: entertainmentImages,
                currentIndex: currentEntertainmentImageIndex
              },
              { 
                title: "Izleti",
                description: "Organizovani izleti u prirodu",
                isSlideshow: true,
                images: tripsImages,
                currentIndex: currentTripsImageIndex
              },
              { 
                title: "ZOO vrt",
                description: "Posjeta ZOO vrtu",
                isSlideshow: true,
                images: zooImages,
                currentIndex: currentZooImageIndex
              }
            ].map((item, index) => (
              <div key={index} className="space-y-2">
                <div 
                  className="relative h-48 rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => {
                    const modal = document.getElementById('imageModal');
                    const modalImg = document.getElementById('modalImage');
                    const modalTitle = document.getElementById('modalTitle');
                    modal.classList.remove('hidden');
                    modalImg.src = item.images[item.currentIndex];
                    modalTitle.textContent = item.title;
                  }}
                >
                  {item.isSlideshow ? (
                    <div className="relative w-full h-full">
                      {item.images.map((img, idx) => (
                        <img 
                          key={idx}
                          src={img} 
                          alt={item.title} 
                          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                            idx === item.currentIndex 
                              ? 'opacity-100 scale-100' 
                              : 'opacity-0 scale-110'
                          } ${isTransitioning ? 'transform-gpu' : ''}`}
                        />
                      ))}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                        {item.images.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all duration-1000 ${
                              idx === item.currentIndex 
                                ? 'bg-white scale-125' 
                                : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Image 
                      src={item.image} 
                      alt={item.title} 
                      fill 
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <h3 className={`text-lg ${playfair.className} font-bold`}>{item.title}</h3>
                  </div>
                </div>
                <p className={`text-sm ${montserrat.className} text-gray-600 text-center`}>{item.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
            <p className={`text-lg ${montserrat.className} text-gray-700 text-center italic leading-relaxed`}>
              Na 950 metara nadmorske visine, na 400.000 m² u srcu Bosne i Hercegovine — sve na jednom mjestu za vaš savršen odmor i opuštanje.
            </p>
          </div>

          <div className="bg-[#009641]/10 p-6 rounded-2xl text-center">
            <p className="text-2xl font-bold text-gray-900 mb-2">
              Sve ovo po cijeni od SAMO <span className="text-[#ff0000]">33 EUR</span> po noći!
            </p>
            <p className="text-xl text-gray-600 font-bold">
              <span className="line-through">66 EUR</span> → 33 EUR (50% POPUSTA)
            </p>
            <p className="text-lg text-gray-700 mt-4">
              👉 Birate sami koliko noći želite ostati
            </p>
          </div>
        </div>

        {/* Image Modal */}
        <div id="imageModal" className="fixed inset-0 bg-black/90 z-50 hidden flex items-center justify-center p-4" onClick={() => document.getElementById('imageModal').classList.add('hidden')}>
          <div className="relative max-w-4xl w-full">
            <button 
              className="absolute -top-12 right-0 text-white hover:text-[#009641] transition-colors"
              onClick={() => document.getElementById('imageModal').classList.add('hidden')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 id="modalTitle" className="text-2xl text-white mb-4 text-center"></h3>
            <div className="relative h-[70vh] rounded-xl overflow-hidden">
              <Image 
                id="modalImage"
                src="/slike/1.jpg" 
                alt="Modal image" 
                fill 
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Section */}
      <div className="mb-12">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h3 className={`text-2xl ${playfair.className} font-bold text-gray-900 mb-6`}>
                Zašto Ajdinovići?
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-[#009641] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-700">Već preko <span className="font-bold">5.000 penzionera</span> uživalo je u našem centru</p>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-[#009641] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-700">Više od <span className="font-bold">2.000 pozitivnih recenzija</span> na Google-u</p>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-[#009641] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-700">Dugogodišnje iskustvo u organizaciji penzionerskih odmora</p>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-[#009641] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-700">Srdačno i ljubazno osoblje koje brine o svakom gostu</p>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-[#009641] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-700">Sigurno, toplo i prijateljsko okruženje</p>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-[#009641] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-700">Ugošćili smo goste iz <span className="font-bold">Srbije, Hrvatske, Crne Gore, Slovenije i Makedonije</span></p>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-[#009641] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-700">Sarađujemo sa <span className="font-bold">brojnim penzionerskim udruženjima</span> iz cijele regije</p>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-[#009641] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-700">Organizujemo <span className="font-bold">posebne programe i izlete</span> za penzionere</p>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-2 gap-2 md:gap-4 w-full md:w-64">
              {[
                { image: "/slike/grupa1.jpg" },
                { image: "/slike/grupa2.jpg" },
                { image: "/slike/grupa3.jpg" },
                { image: "/slike/grupa4.jpg" },
                { image: "/slike/grupa5.jpg" },
                { image: "/slike/grupa6.jpg" }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    const modal = document.getElementById('testimonialModal');
                    const modalImg = document.getElementById('testimonialImage');
                    modal.classList.remove('hidden');
                    modalImg.src = item.image;
                  }}
                >
                  <Image
                    src={item.image} 
                    alt="Komentar" 
                    fill 
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Positive Reviews Carousel */}
          <div className="mt-12">
            <h3 className={`text-2xl ${playfair.className} font-bold text-gray-900 mb-6 text-center`}>
              Pozitivne recenzije naših gostiju
            </h3>
            
            {/* First Row */}
            <div className="relative mb-8">
              <div className="overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex space-x-6 min-w-max">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <div 
                      key={num}
                      className="relative w-[300px] md:w-[400px] rounded-xl overflow-hidden cursor-pointer group transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        const modal = document.getElementById('commentModal');
                        const modalImg = document.getElementById('commentImage');
                        modal.classList.remove('hidden');
                        const imagePath = `/slike/komentari/${num}.jpg`;
                        modalImg.src = imagePath;
                        modalImg.alt = `Komentar #${num}`;
                      }}
                    >
                      <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                        <Image 
                          src={`/slike/komentari/${num}.jpg`}
                          alt={`Komentar #${num}`}
                          fill 
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 300px, 400px"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
                onClick={() => {
                  const container = document.querySelector('.overflow-x-auto');
                  container.scrollLeft -= 400;
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
                onClick={() => {
                  const container = document.querySelector('.overflow-x-auto');
                  container.scrollLeft += 400;
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Second Row */}
            <div className="relative">
              <div className="overflow-x-auto pb-4 hide-scrollbar mt-2" id="imageContainer2">
                <div className="flex space-x-6 min-w-max">
                  {Array.from({ length: 10 }, (_, i) => i + 11).map((num) => (
                    <div 
                      key={num}
                      className="relative w-[300px] md:w-[400px] rounded-xl overflow-hidden cursor-pointer group transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        const modal = document.getElementById('commentModal');
                        const modalImg = document.getElementById('commentImage');
                        modal.classList.remove('hidden');
                        const imagePath = `/slike/komentari/${num}.jpg`;
                        modalImg.src = imagePath;
                        modalImg.alt = `Komentar #${num}`;
                      }}
                    >
                      <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                        <Image 
                          src={`/slike/komentari/${num}.jpg`}
                          alt={`Komentar #${num}`}
                          fill 
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 300px, 400px"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
                onClick={() => {
                  const container = document.querySelectorAll('.overflow-x-auto')[1];
                  container.scrollLeft -= 400;
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
                onClick={() => {
                  const container = document.querySelectorAll('.overflow-x-auto')[1];
                  container.scrollLeft += 400;
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="bg-[#009641]/10 p-6 rounded-xl">
              <h4 className={`text-xl ${playfair.className} font-bold text-gray-900 mb-4`}>
                100% Garancija zadovoljstva:
              </h4>
              <p className="text-lg text-gray-700 mb-2">
                Ako prvog dana ne budete zadovoljni — vratimo vam novac!
              </p>
              <p className="text-sm text-gray-600 italic">
                (Niko do sada nije tražio povrat — ali volimo da znate da imate opciju.)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="text-center mb-12">
        <h2 className={`text-2xl md:text-4xl ${playfair.className} text-gray-900 mb-4`}>
          Ne vjerujete nam? <span className="bg-[#009641] text-white px-4 py-1 rounded-full">Vjerujte njima!</span>
        </h2>
        <p className="text-lg text-gray-600 mb-8">Iskustva penzionera</p>

        <div className="relative max-w-7xl mx-auto px-4">
          {/* First Row */}
          <div className="overflow-x-auto pb-4 hide-scrollbar" id="imageContainer">
            <div className="flex space-x-6 min-w-max">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <div 
                  key={num}
                  className={`relative rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                    num === 5 ? 'w-[500px] md:w-[600px]' : 'w-[400px] md:w-[500px]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const modal = document.getElementById('commentModal');
                    const modalImg = document.getElementById('commentImage');
                    modal.classList.remove('hidden');
                    const imagePath = `/slike/komentari/${num}.jpg`;
                    modalImg.src = imagePath;
                    modalImg.alt = `Komentar #${num}`;
                  }}
                >
                  <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                    <Image 
                      src={`/slike/komentari/${num}.jpg`}
                      alt={`Komentar #${num}`}
                      fill 
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 400px, 500px"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Second Row */}
          <div className="overflow-x-auto pb-4 hide-scrollbar mt-2" id="imageContainer2">
            <div className="flex space-x-6 min-w-max">
              {Array.from({ length: 10 }, (_, i) => i + 11).map((num) => (
                <div 
                  key={num}
                  className={`relative rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                    num === 15 ? 'w-[500px] md:w-[600px]' : 'w-[400px] md:w-[500px]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const modal = document.getElementById('commentModal');
                    const modalImg = document.getElementById('commentImage');
                    modal.classList.remove('hidden');
                    const imagePath = `/slike/komentari/${num}.jpg`;
                    modalImg.src = imagePath;
                    modalImg.alt = `Komentar #${num}`;
                  }}
                >
                  <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                    <Image 
                      src={`/slike/komentari/${num}.jpg`}
                      alt={`Komentar #${num}`}
                      fill 
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 400px, 500px"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Scrollbar */}
          <div className="relative h-3 bg-gray-200 rounded-full mt-4 mx-4">
            <div 
              className="absolute h-full bg-[#009641] rounded-full cursor-grab active:cursor-grabbing"
              id="scrollThumb"
              style={{ 
                width: '20%',
                left: '0%'
              }}
            />
          </div>
          
          {/* Navigation Arrows */}
          <button 
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
            onClick={() => {
              const containers = document.querySelectorAll('.overflow-x-auto');
              containers.forEach(container => {
                container.scrollLeft -= 400;
              });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
            onClick={() => {
              const containers = document.querySelectorAll('.overflow-x-auto');
              containers.forEach(container => {
                container.scrollLeft += 400;
              });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
 
        {/* Comment Modal */}
        <div id="commentModal" className="fixed inset-0 bg-black/95 z-50 hidden flex items-center justify-center p-4" onClick={(e) => {
          if (e.target.id === 'commentModal') {
            document.getElementById('commentModal').classList.add('hidden');
          }
        }}>
          <div className="relative max-w-5xl w-full">
            <button 
              className="absolute -top-16 right-0 text-white hover:text-[#009641] transition-colors"
              onClick={() => document.getElementById('commentModal').classList.add('hidden')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative h-[85vh] rounded-xl overflow-hidden">
              <Image 
                id="commentImage"
                src="/slike/komentari/1.jpg" 
                alt="Komentar" 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial Modal */}
      <div id="testimonialModal" className="fixed inset-0 bg-black/90 z-50 hidden flex items-center justify-center p-4" onClick={(e) => {
        if (e.target.id === 'testimonialModal') {
          document.getElementById('testimonialModal').classList.add('hidden');
        }
      }}>
        <div className="relative max-w-4xl w-full">
          <button 
            className="absolute -top-12 right-0 text-white hover:text-[#009641] transition-colors"
            onClick={() => document.getElementById('testimonialModal').classList.add('hidden')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative h-[70vh] rounded-xl overflow-hidden">
            <Image 
              id="testimonialImage"
              src="/slike/grupa1.jpg" 
              alt="Testimonial image" 
              fill 
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-2xl md:text-3xl ${playfair.className} text-gray-900 mb-2`}>
              Česta <span className="bg-[#009641] text-white px-2">pitanja</span>
            </h2>
            <p className="text-base text-gray-600">Sve što trebate znati</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                question: "Kako mogu doći do Ajdinovića?",
                answer: [
                  "Sportsko-rekreativni centar Ajdinovići se nalazi u srcu Bosne i Hercegovine, na idealnoj lokaciji — 50 minuta vožnje od Sarajeva, na magistralnom putu Sarajevo–Tuzla, otprilike na pola puta između ova dva grada.",
                  "Do našeg centra dolazite vlastitim prevozom.",
                  "Ne vršimo organizovani prijevoz, ali mnoge penzionerske organizacije i udruženja u BiH, Hrvatskoj, Srbiji i Sloveniji redovno organizuju dolaske u Ajdinoviće."
                ]
              },
              {
                question: "Da li je ponuda zaista All-Inclusive? Šta sve uključuje?",
                answer: [
                  "Da, ponuda je potpuno All-Inclusive — jednom kad stignete u centar, sve što Vam je potrebno je već uključeno u cijenu.",
                  "Ponuda uključuje:",
                  "✅ Smještaj (sobe, bungalovi, vile ili hotelske sobe — prema dogovoru)",
                  "✅ Neograničena hrana (3 obroka dnevno + užine)",
                  "✅ Neograničeno piće (alkoholna i bezalkoholna pića)",
                  "✅ Korištenje svih bazena (unutrašnjih i vanjskih)",
                  "✅ Korištenje spa centra (sauna, parno kupatilo, relaks zona)",
                  "✅ ZOO vrt i šetnje kroz prirodu",
                  "✅ Sportski tereni (tenis, nogomet, košarka, odbojka...)",
                  "✅ Večernji program:",
                  "   • Muzika uživo",
                  "   • Folklor",
                  "   • Bingo večeri",
                  "   • Tematske zabave",
                  "✅ Animacije i druženja tokom dana",
                  "Sve navedeno je uključeno u cijenu — nema dodatnih troškova!"
                ]
              },
              {
                question: "Da li je centar prilagođen starijim osobama?",
                answer: [
                  "Da, centar je potpuno prilagođen i za starije osobe:",
                  "✅ Imamo prilazne staze bez stepenica gdje je potrebno",
                  "✅ Liftove u glavnom objektiu",
                  "✅ Dovoljno prostora i mjesta za odmor tokom šetnji",
                  "✅ Fizioterapeuti su dostupni za konsultacije i tretmane u centru (posebno popularno kod penzionera)",
                  "✅ Posebno vodimo računa da programi nisu naporni i da svaki gost može uživati svojim tempom."
                ]
              },
              {
                question: "Kako da rezervišem i šta mi je potrebno za dolazak?",
                answer: [
                  "➡️ Vrlo jednostavno — samo ostavite Vaše ime i broj telefona putem ove stranice.",
                  "➡️ Naš tim će Vas pozvati i pomoći Vam da rezervišete najbolji mogući termin.",
                  "➡️ Ako dolazite preko udruženja, možemo Vam pomoći da ih kontaktirate.",
                  "➡️ Za individualne dolaske — slobodno rezervišite direktno kod nas."
                ]
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <button
                  onClick={() => {
                    const answer = document.getElementById(`answer-${index}`);
                    const icon = document.getElementById(`icon-${index}`);
                    if (answer.style.maxHeight) {
                      answer.style.maxHeight = null;
                      icon.style.transform = 'rotate(0deg)';
                    } else {
                      answer.style.maxHeight = answer.scrollHeight + "px";
                      icon.style.transform = 'rotate(180deg)';
                    }
                  }}
                  className="w-full text-left p-6 focus:outline-none flex justify-between items-center"
                >
                  <h3 className={`text-xl ${playfair.className} font-bold text-gray-900`}>
                    {faq.question}
                  </h3>
                  <svg
                    id={`icon-${index}`}
                    className="w-6 h-6 text-[#009641] transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  id={`answer-${index}`}
                  className="overflow-hidden transition-all duration-300 ease-in-out max-h-0"
                >
                  <div className="p-6 pt-0 space-y-3">
                    {faq.answer.map((line, lineIndex) => (
                      <p key={lineIndex} className="text-gray-600">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <h2 className={`text-2xl md:text-3xl ${playfair.className} text-gray-900 mb-2`}>
              Zatražite poziv i saznajte sve <span className="bg-[#009641] text-white px-2">bez obaveza</span>
            </h2>
            <p className="text-base text-gray-600 mb-8">
              Naša recepcija će vas pozvati i objasniti sve što vas zanima. Posebna ponuda za penzionere - 50% popusta na redovne cijene!
            </p>

            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setFormStatus({ ...formStatus, action: 'info' })}
                  className={`p-4 rounded-xl text-center transition-all ${
                    formStatus.action === 'info'
                      ? 'bg-[#009641] text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Želim da me pozovete
                </button>
                <button
                  onClick={() => setFormStatus({ ...formStatus, action: 'reservation' })}
                  className={`p-4 rounded-xl text-center transition-all ${
                    formStatus.action === 'reservation'
                      ? 'bg-[#009641] text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Želim rezervaciju
                </button>
              </div>

              {formStatus.action === 'reservation' ? (
                <form onSubmit={handleReservationSubmit} className="space-y-6 animate-slide-up delay-200">
                  <p className="text-gray-600 text-sm mb-4">
                    Molimo vas da popunite sva polja kako bismo vas mogli kontaktirati i objasniti sve što vas zanima.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Ime i prezime"
                      name="name"
                      value={reservationData.name}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-3 rounded-lg text-sm w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#009641] placeholder-gray-400 transition-all duration-300 hover:border-[#009641]"
                    />
                    <input
                      type="email"
                      placeholder="Email adresa"
                      name="email"
                      value={reservationData.email}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-3 rounded-lg text-sm w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#009641] placeholder-gray-400 transition-all duration-300 hover:border-[#009641]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="tel"
                      placeholder="Broj telefona"
                      name="phone"
                      value={reservationData.phone}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-3 rounded-lg text-sm w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#009641] placeholder-gray-400 transition-all duration-300 hover:border-[#009641]"
                    />
                    <input
                      type="text"
                      placeholder="Država"
                      name="country"
                      value={reservationData.country}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-3 rounded-lg text-sm w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#009641] placeholder-gray-400 transition-all duration-300 hover:border-[#009641]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="date"
                      name="date"
                      value={reservationData.date}
                      onChange={handleInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="px-4 py-3 rounded-lg text-sm w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#009641] placeholder-gray-400 transition-all duration-300 hover:border-[#009641]"
                    />
                    <input
                      type="time"
                      name="time"
                      value={reservationData.time}
                      onChange={handleInputChange}
                      required
                      className="px-4 py-3 rounded-lg text-sm w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#009641] placeholder-gray-400 transition-all duration-300 hover:border-[#009641]"
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="submit"
                      className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#009641] hover:bg-[#009641]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#009641] transition-all"
                    >
                      Rezerviši termin
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleReservationSubmit} className="space-y-6 animate-slide-up delay-200">
                  <p className="text-gray-600 text-sm mb-4">
                    Molimo vas da popunite sva polja kako bismo vas mogli kontaktirati i objasniti sve što vas zanima.
                  </p>
                  <div className="space-y-4">
                    <div className="relative">
                      <select
                        name="country"
                        value={reservationData.country}
                        onChange={handleInputChange}
                        required
                        className="px-4 py-3 rounded-lg text-sm w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#009641] placeholder-gray-400 transition-all duration-300 hover:border-[#009641]"
                      >
                        <option value="">Izaberite državu</option>
                        <option value="BiH">Bosna i Hercegovina (+387)</option>
                        <option value="HR">Hrvatska (+385)</option>
                        <option value="RS">Srbija (+381)</option>
                        <option value="ME">Crna Gora (+382)</option>
                        <option value="SI">Slovenija (+386)</option>
                        <option value="other">Ostalo</option>
                      </select>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ime i prezime"
                        name="name"
                        value={reservationData.name}
                        onChange={handleInputChange}
                        required
                        className="px-4 py-3 rounded-lg text-sm w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#009641] placeholder-gray-400 transition-all duration-300 hover:border-[#009641]"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">
                          {reservationData.country === 'BiH' ? '+387' :
                           reservationData.country === 'HR' ? '+385' :
                           reservationData.country === 'RS' ? '+381' :
                           reservationData.country === 'ME' ? '+382' :
                           reservationData.country === 'SI' ? '+386' : ''}
                        </span>
                      </div>
                      <input
                        type="tel"
                        placeholder="Broj telefona"
                        name="phone"
                        value={reservationData.phone}
                        onChange={handleInputChange}
                        required
                        className={`px-4 py-3 rounded-lg text-sm w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#009641] placeholder-gray-400 transition-all duration-300 hover:border-[#009641] ${
                          reservationData.country ? 'pl-16' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="submit"
                      className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#009641] hover:bg-[#009641]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#009641] transition-all"
                    >
                      Pošalji zahtjev
                    </button>
                  </div>
                </form>
              )}

              {formStatus.error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg mt-4">
                  {formStatus.error}
                </div>
              )}

              {formStatus.success && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Zahtjev uspješno poslat!</h3>
                  <p className="text-gray-600">Naša recepcija će vas kontaktirati u najkraćem mogućem roku.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Live Comments Bar */}
      {/* <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 py-3 z-40">
        <div className="relative overflow-hidden">
          <div className="animate-scroll flex space-x-8 whitespace-nowrap">
            {[
              "Marija, 68: 'Najljepši odmor od penzionisanja! Hrana je odlična, osoblje ljubazno.'",
              "Petar, 72: 'Bila sam sama, sad imam društvo za cijeli život. Svaki dan je nova zabava!'",
              "Ana, 65: 'Hrana kao kod moje majke, a sve spremno bez stresa. Osjećam se kao kod kuće.'",
              "Stevan, 70: 'Tamburaši su odlični, a bingo je svaki dan! Nema dosade.'",
              "Milica, 67: 'Fizioterapeut je odličan, pomogao mi je s leđima. Sada se bolje osjećam.'",
              "Dragan, 71: 'Organizovani izleti su super. Vidjeli smo sve znamenitosti bez stresa.'",
              "Jelena, 64: 'Sobe su čiste, hrana odlična, a društvo predivno. Vraćam se sigurno!'",
              "Milan, 69: 'Prijevoz je bio udoban, a osoblje je pomoglo oko prtljage. Bez stresa!'",
              "Ljubica, 66: 'Joga za penzionere je odlična. Održavam se u formi i družim se.'",
              "Zoran, 73: 'Medicinski tim je dostupan 24/7. Osjećam se sigurno i zaštićeno.'"
            ].map((comment, index) => (
              <div key={index} className="inline-flex items-center text-gray-600 text-sm">
                <span className="text-[#009641] mr-2">★</span>
                {comment}
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* Reservation Form Modal */}
      {showReservationForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 relative animate-slide-up">
            <button 
              onClick={() => setShowReservationForm(false)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg hover:shadow-xl transition-all hover:scale-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-8">
              <h2 className={`text-2xl ${playfair.className} font-bold text-gray-900 mb-6 text-center`}>
                Rezervacija smještaja
              </h2>

              {formStatus.success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Rezervacija uspješna!</h3>
                  <p className="text-gray-600">Uskoro ćemo vas kontaktirati za potvrdu.</p>
                </div>
              ) : (
                <form onSubmit={handleReservationSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ime i prezime</label>
                      <input
                        type="text"
                        name="name"
                        value={reservationData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009641] focus:border-transparent"
                        placeholder="Unesite vaše ime i prezime"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={reservationData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009641] focus:border-transparent"
                        placeholder="vasa@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                      <input
                        type="tel"
                        name="phone"
                        value={reservationData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009641] focus:border-transparent"
                        placeholder="+387 XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Broj gostiju</label>
                      <select
                        name="guests"
                        value={reservationData.guests}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009641] focus:border-transparent"
                      >
                        {[1,2,3,4,5,6].map(num => (
                          <option key={num} value={num}>{num} {num === 1 ? 'osoba' : 'osobe'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dolazak</label>
                      <input
                        type="date"
                        name="checkIn"
                        value={reservationData.checkIn}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009641] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Odlazak</label>
                      <input
                        type="date"
                        name="checkOut"
                        value={reservationData.checkOut}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009641] focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-[#009641]/10 p-4 rounded-xl mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">All-Inclusive ponuda za penzionere</h3>
                        <p className="text-gray-700 mb-2">Odaberite smještajnu jedinicu sa 50% popusta za penzionere</p>
                        <div className="flex items-center gap-2 text-[#ff0000] font-bold">
                          <span className="line-through">90 EUR</span>
                          <span>→</span>
                          <span>45 EUR</span>
                          <span className="text-sm">(Premium smještaj)</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#ff0000] font-bold">
                          <span className="line-through">66 EUR</span>
                          <span>→</span>
                          <span>33 EUR</span>
                          <span className="text-sm">(Standardni smještaj)</span>
                        </div>
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tip smještaja</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Premium smještaj - 45 EUR/noć</h4>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="roomType"
                                value="lux-apartment"
                                checked={reservationData.roomType === 'lux-apartment'}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-[#009641] focus:ring-[#009641]"
                              />
                              <span className="text-gray-700">LUX Apartmani</span>
                            </label>
                            <label className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="roomType"
                                value="hotel-central"
                                checked={reservationData.roomType === 'hotel-central'}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-[#009641] focus:ring-[#009641]"
                              />
                              <span className="text-gray-700">Hotel Central</span>
                            </label>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Standardni smještaj - 33 EUR/noć</h4>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="roomType"
                                value="bungalow"
                                checked={reservationData.roomType === 'bungalow'}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-[#009641] focus:ring-[#009641]"
                              />
                              <span className="text-gray-700">Bungalovi</span>
                            </label>
                            <label className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="roomType"
                                value="mountain-house"
                                checked={reservationData.roomType === 'mountain-house'}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-[#009641] focus:ring-[#009641]"
                              />
                              <span className="text-gray-700">Planinske kuće</span>
                            </label>
                            <label className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="roomType"
                                value="hotel-horizont"
                                checked={reservationData.roomType === 'hotel-horizont'}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-[#009641] focus:ring-[#009641]"
                              />
                              <span className="text-gray-700">Hotel Horizont</span>
                            </label>
                            <label className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="roomType"
                                value="hotel-depadans"
                                checked={reservationData.roomType === 'hotel-depadans'}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-[#009641] focus:ring-[#009641]"
                              />
                              <span className="text-gray-700">Hotel Depadans</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Posebni zahtjevi</label>
                    <textarea
                      name="specialRequests"
                      value={reservationData.specialRequests}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009641] focus:border-transparent"
                      placeholder="Unesite sve posebne zahtjeve ili napomene..."
                    ></textarea>
                  </div>

                  {formStatus.error && (
                    <div className="text-red-500 text-sm text-center">{formStatus.error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={formStatus.loading}
                    className={`w-full bg-[#009641] text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all ${
                      formStatus.loading 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-[#009641]/90 hover:scale-105 hover:-translate-y-0.5'
                    }`}
                  >
                    {formStatus.loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Slanje rezervacije...
                      </span>
                    ) : (
                      'Rezerviši sada'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* About Us Modal */}
      {showAboutUs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[95%] md:max-w-[90%] lg:max-w-[85%] xl:max-w-[1200px] my-8 relative">
            <button
              onClick={() => setShowAboutUs(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-4 md:p-6 lg:p-8 xl:p-12 max-h-[90vh] overflow-y-auto">
              <div className="space-y-8 mb-8">
                {/* Location Section */}
                <div>
                  <h3 className={`text-xl md:text-2xl font-bold text-gray-900 mb-4 ${playfair.className}`}>
                    Gdje se nalazimo
                  </h3>
                  <p className="text-gray-600 text-base md:text-lg mb-4">
                    Smješten u srcu Bosne i Hercegovine, na nadmorskoj visini od 950 metara, Sportsko-rekreativni centar Ajdinovići idealno je mjesto za odmor, opuštanje i druženje u prirodi. Nalazimo se tačno na pola puta između Sarajeva i Tuzle, svega 50 kilometara udaljeni od oba grada, što naš centar čini lako dostupnim gostima iz cijele regije.
                  </p>
                  <p className="text-gray-600 text-base md:text-lg mb-8">
                    Već 10 godina pružamo vrhunski all-inclusive doživljaj na površini od preko 400.000 kvadratnih metara netaknute prirode. Naš kompleks zatvorenog tipa nudi savršen spoj prirodnog okruženja i bogatog sadržaja — od uređenih šetnih staza, zoološkog vrta, kafića, restorana sa tradicionalnom bosanskom kuhinjom (pite, domaći kolači, specijaliteti), do modernog wellness & spa centra, unutrašnjih i vanjskih bazena i sportskih terena.
                  </p>

                  {/* Google Maps Embed */}
                  <div className="relative h-64 md:h-72 lg:h-80 rounded-xl overflow-hidden shadow-lg mb-8">
                    <iframe 
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d442298.6908528376!2d18.49231485338172!3d44.04845697328216!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x475928294f0af933%3A0x1989668180dc04d0!2sSportsko-rekreativni%20centar%20Ajdinovi%C4%87i!5e0!3m2!1sbs!2sba!4v1749847321690!5m2!1sbs!2sba" 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen="" 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
                </div>

                {/* All-inclusive Section */}
                <div>
                  <h3 className={`text-xl md:text-2xl font-bold text-gray-900 mb-4 ${playfair.className}`}>
                    All-inclusive ponuda za penzionere
                  </h3>
                  <p className="text-gray-600 text-base md:text-lg mb-4">
                    Naša all-inclusive ponuda za penzionere omogućava vam bezbrižan odmor po jedinstvenoj cijeni, bez ijednog dodatnog troška. Do sada su nas posjetile stotine zadovoljnih penzionera iz Srbije, Hrvatske, Sjeverne Makedonije, Slovenije i Crne Gore, a svi su uživali u potpunoj udobnosti i gostoljubivosti našeg centra.
                  </p>
                  <div className="bg-gray-50 p-4 md:p-6 rounded-xl mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">U cijenu boravka uključeni su:</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <span className="text-[#ffd700] mr-2">★</span>
                        smještaj u udobnim objektima (hoteli, vile, planinske kuće, bungalovi)
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#ffd700] mr-2">★</span>
                        neograničena hrana i piće (bezalkoholno i alkoholno) tokom cijelog boravka
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#ffd700] mr-2">★</span>
                        pristup slanim sobama, hladnim sobama, hladnim klupama i kompletnom wellness & spa centru
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#ffd700] mr-2">★</span>
                        korištenje unutrašnjih i vanjskih bazena
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#ffd700] mr-2">★</span>
                        uživanje u bogatom prirodnom ambijentu i sadržajima našeg centra
                      </li>
                    </ul>
                  </div>

                  {/* Second Image */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative h-64 md:h-72 lg:h-80 rounded-xl overflow-hidden shadow-lg">
                      <img
                        src="https://i.imgur.com/UzLFwzr.jpeg"
                        alt="Tradicionalna hrana"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="relative h-64 md:h-72 lg:h-80 rounded-xl overflow-hidden shadow-lg">
                      <img
                        src="https://i.imgur.com/la2it2V.jpeg"
                        alt="Bazeni Ajdinovici"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
