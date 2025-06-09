"use client";

import Image from "next/image";
import { Inter, Playfair_Display, Montserrat, Poppins } from 'next/font/google';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

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
    specialRequests: ''
  });
  const [formStatus, setFormStatus] = useState({
    loading: false,
    success: false,
    error: null
  });

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
      if (!reservationData.name || !reservationData.email || !reservationData.phone || !reservationData.checkIn || !reservationData.checkOut || !reservationData.guests) {
        throw new Error('Molimo popunite sva obavezna polja');
      }

      console.log('Form data before submission:', reservationData);

      const data = {
        name: reservationData.name,
        email: reservationData.email,
        phone: reservationData.phone,
        check_in: reservationData.checkIn,
        check_out: reservationData.checkOut,
        guests: parseInt(reservationData.guests),
        message: reservationData.specialRequests || '',
        status: 'pending'
      };

      console.log('Sending reservation data:', data);

      // Prvo provjerimo da li možemo pristupiti tabeli
      console.log('Testing table access...');
      const { data: testData, error: testError } = await supabase
        .from('reservations')
        .select('count')
        .single();

      if (testError) {
        console.error('Error accessing reservations table:', {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        });
        throw new Error('Problem pristupa bazi podataka');
      }

      console.log('Successfully accessed reservations table');

      // Pokušavamo spremiti rezervaciju
      console.log('Attempting to insert reservation...');
      const { data: insertData, error: insertError } = await supabase
        .from('reservations')
        .insert([data])
        .select();

      if (insertError) {
        console.error('Supabase error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw new Error(`Greška prilikom spremanja rezervacije: ${insertError.message}`);
      }

      if (!insertData || insertData.length === 0) {
        throw new Error('Rezervacija nije uspješno spremljena');
      }

      console.log('Reservation saved successfully:', insertData);
      
      setFormStatus({ loading: false, success: true, error: null });
      setReservationData({
        name: '',
        email: '',
        phone: '',
        checkIn: '',
        checkOut: '',
        guests: '1',
        roomType: 'standard',
        specialRequests: ''
      });
      
      // Zatvori formu nakon 3 sekunde
      setTimeout(() => {
        setShowReservationForm(false);
        setFormStatus({ loading: false, success: false, error: null });
      }, 3000);
    } catch (error) {
      console.error('Error in form submission:', error);
      setFormStatus({ 
        loading: false, 
        success: false, 
        error: error.message || 'Došlo je do greške prilikom slanja rezervacije. Molimo pokušajte ponovo.' 
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
                image: "/slike/1.jpg", 
                title: "Smještaj",
                description: "Hoteli, bungalovi, planinske kuće, vile"
              },
              { 
                image: "/slike/2.jpg", 
                title: "Wellness",
                description: "SPA & Wellness centar"
              },
              { 
                image: "/slike/3.jpg", 
                title: "Hrana",
                description: "Neograničena hrana i piće"
              },
              { 
                image: "/slike/4.jpg", 
                title: "Zabava",
                description: "Posebni programi za penzionere"
              },
              { 
                image: "/slike/5.jpg", 
                title: "Izleti",
                description: "Organizovani izleti u prirodu"
              },
              { 
                image: "/slike/6.jpg", 
                title: "ZOO vrt",
                description: "Posjeta ZOO vrtu"
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
                    modalImg.src = item.image;
                    modalTitle.textContent = item.title;
                  }}
                >
                  <Image 
                    src={item.image} 
                    alt={item.title} 
                    fill 
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
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
                  <p className="text-gray-700">Više od <span className="font-bold">300 pozitivnih recenzija</span> na Facebooku i Googlu</p>
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
          <div className="overflow-x-auto pb-4 hide-scrollbar" id="imageContainer">
            <div className="flex space-x-6 min-w-max">
              {Array.from({ length: 21 }, (_, i) => i + 1).map((num) => (
                <div 
                  key={num}
                  className={`relative rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                    num === 11 ? 'w-[500px] md:w-[600px]' : 'w-[400px] md:w-[500px]'
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
                  "✅ Imamo rampe i prilazne staze bez stepenica gdje je potrebno",
                  "✅ Liftove u glavnim objektima",
                  "✅ Dovoljno prostora i mjesta za odmor tokom šetnji",
                  "✅ Fizioterapeuti su dostupni za konsultacije i tretmane u centru (posebno popularno kod penzionera)",
                  "✅ Medicinsko osoblje je dostupno 24/7 u slučaju potrebe",
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
            <p className="text-base text-gray-600">Naš tim će vas nazvati, objasniti ponudu i pomoći vam da rezervišete bez stresa. Sve informacije su besplatne i bez obaveza.</p>

            <form onSubmit={handleReservationSubmit} className="space-y-6 animate-slide-up delay-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Ime"
                  name="name"
                  value={reservationData.name}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 rounded-lg text-sm w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#009641] placeholder-gray-400 transition-all duration-300 hover:border-[#009641]"
                />
                <input
                  type="email"
                  placeholder="Email"
                  name="email"
                  value={reservationData.email}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 rounded-lg text-sm w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#009641] placeholder-gray-400 transition-all duration-300 hover:border-[#009641]"
                />
                <input
                  type="tel"
                  placeholder="Broj telefona"
                  name="phone"
                  value={reservationData.phone}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 rounded-lg text-sm w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#009641] placeholder-gray-400 transition-all duration-300 hover:border-[#009641]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Tip smještaja</label>
                <select
                  name="roomType"
                  value={reservationData.roomType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009641] focus:border-transparent"
                >
                  <option value="standard">Standardna soba</option>
                  <option value="deluxe">Deluxe soba</option>
                  <option value="villa">Vikendica</option>
                </select>
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
                className={`w-full bg-[#009641] text-white px-8 py-3 rounded-full text-base font-semibold transition-all ${
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

            <div className="mt-8 animate-fade-in delay-300">
              <a href="#" className="text-gray-600 text-sm hover:text-gray-900 transition-colors duration-300 hover:underline">
                Preuzmite besplatan vodič: Kako isplanirati siguran i povoljan odmor u penziji
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Live Comments Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 py-3 z-40">
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
      </div>

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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tip smještaja</label>
                      <select
                        name="roomType"
                        value={reservationData.roomType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009641] focus:border-transparent"
                      >
                        <option value="standard">Standardna soba</option>
                        <option value="deluxe">Deluxe soba</option>
                        <option value="villa">Vikendica</option>
                      </select>
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
        <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
          <div className="min-h-screen w-full flex items-start justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl mx-auto my-8 relative animate-slide-up">
              <button 
                onClick={() => setShowAboutUs(false)}
                className="fixed top-4 right-4 md:top-8 md:right-8 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="p-6 md:p-8 lg:p-12">
                <h2 className={`text-2xl md:text-3xl lg:text-4xl ${playfair.className} font-bold text-gray-900 mb-6 md:mb-8 text-center`}>
                  Sportsko-rekreativni centar Ajdinovići
                </h2>

                <div className="max-w-4xl mx-auto mb-8 md:mb-12">
                  <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
                    <p className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed mb-4 md:mb-6">
                      Naš centar se nalazi u srcu Bosne i Hercegovine, na 950 metara nadmorske visine, na prekrasnom prostoru od 400.000 m². Ovo je mjesto gdje priroda i udobnost stvaraju savršenu kombinaciju za vaš odmor.
                    </p>
                    <p className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed mb-4 md:mb-6">
                      Već preko 10 godina pružamo nezaboravna iskustva našim gostima, posebno penzionerima koji su našu posebnu pažnju. Naš tim stručnjaka brine o svakom detalju vašeg boravka.
                    </p>
                    <div className="text-center mt-6 md:mt-8">
                      <a 
                        href="https://www.srca.ba" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-[#009641] hover:text-[#009641]/80 transition-colors"
                      >
                        <span className="text-lg md:text-xl font-semibold">Posjetite našu oficijalnu stranicu</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    <div className="bg-[#009641]/10 p-6 md:p-8 rounded-xl">
                      <h3 className={`text-xl md:text-2xl lg:text-3xl ${playfair.className} font-bold text-gray-900 mb-4 md:mb-6`}>
                        Zašto baš Ajdinovići?
                      </h3>
                      <ul className="space-y-4 md:space-y-6">
                        <li className="flex items-start">
                          <svg className="h-6 w-6 md:h-7 md-w-7 text-[#009641] mr-3 md:mr-4 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-base md:text-lg lg:text-xl text-gray-700">Prekrasna priroda i čist zrak na 950m nadmorske visine</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-6 w-6 md:h-7 md-w-7 text-[#009641] mr-3 md:mr-4 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-base md:text-lg lg:text-xl text-gray-700">Moderan wellness centar sa bazenima i spa tretmanima</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-6 w-6 md:h-7 md-w-7 text-[#009641] mr-3 md:mr-4 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-base md:text-lg lg:text-xl text-gray-700">Vrhunska hrana i piće u all-inclusive sistemu</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-6 w-6 md:h-7 md-w-7 text-[#009641] mr-3 md:mr-4 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-base md:text-lg lg:text-xl text-gray-700">Raznovrsni programi za zabavu i druženje</span>
                        </li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        "/slike/centar1.jpg",
                        "/slike/centar2.jpg",
                        "/slike/centar3.jpg",
                        "/slike/centar4.jpg"
                      ].map((image, index) => (
                        <div 
                          key={index}
                          className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                          onClick={() => {
                            const modal = document.getElementById('galleryModal');
                            const modalImg = document.getElementById('galleryImage');
                            modal.classList.remove('hidden');
                            modalImg.src = image;
                          }}
                        >
                          <Image 
                            src={image}
                            alt={`Centar Ajdinovići ${index + 1}`}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
                  {[
                    {
                      title: "Smještaj",
                      description: "Udobne sobe, bungalovi i vile sa svim modernim sadržajima",
                      image: "/slike/smjestaj.jpg"
                    },
                    {
                      title: "Wellness",
                      description: "Bazeni, sauna, parno kupatilo i spa tretmani",
                      image: "/slike/wellness.jpg"
                    },
                    {
                      title: "Zabava",
                      description: "Muzika uživo, folklor, bingo i tematske večeri",
                      image: "/slike/zabava.jpg"
                    }
                  ].map((item, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:scale-105">
                      <div className="relative h-48 md:h-56 lg:h-64">
                        <Image 
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                      <div className="p-4 md:p-6">
                        <h3 className={`text-xl md:text-2xl ${playfair.className} font-bold text-gray-900 mb-2 md:mb-3`}>
                          {item.title}
                        </h3>
                        <p className="text-base md:text-lg text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      <div id="galleryModal" className="fixed inset-0 bg-black/95 z-50 hidden flex items-center justify-center p-4" onClick={() => document.getElementById('galleryModal').classList.add('hidden')}>
        <div className="relative max-w-5xl w-full">
          <button 
            className="absolute -top-16 right-0 text-white hover:text-[#009641] transition-colors"
            onClick={() => document.getElementById('galleryModal').classList.add('hidden')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative h-[85vh] rounded-xl overflow-hidden">
            <Image 
              id="galleryImage"
              src="/slike/centar1.jpg"
              alt="Galerija centra"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Activities Calendar Section */}
      <section className="py-10 bg-[#FFFDF5]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-2xl md:text-3xl ${playfair.className} text-gray-900 mb-2`}>
              Kalendar <span className="bg-[#009641] text-white px-2">aktivnosti</span>
            </h2>
            <p className="text-base text-gray-600">Svaki dan nova zabava i druženje</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                day: "Ponedjeljak",
                activities: [
                  "Jutarnja gimnastika",
                  "Bingo",
                  "Večernji tamburaši"
                ]
              },
              {
                day: "Utorak",
                activities: [
                  "Izlet u prirodu",
                  "Karaoke",
                  "Film večer"
                ]
              },
              {
                day: "Srijeda",
                activities: [
                  "Joga za penzionere",
                  "Kartanje",
                  "Folklor"
                ]
              },
              {
                day: "Četvrtak",
                activities: [
                  "Šetnja",
                  "Kviz znanja",
                  "Muzički program"
                ]
              }
            ].map((day, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 duration-300">
                <h3 className={`text-xl ${playfair.className} font-bold text-gray-900 mb-4`}>{day.day}</h3>
                <ul className="space-y-3">
                  {day.activities.map((activity, actIndex) => (
                    <li key={actIndex} className="flex items-center text-gray-600">
                      <svg className="h-5 w-5 text-[#009641] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {activity}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center mb-6 animate-fade-in">
            <Image
              src="/slike/logo.png"
              alt="Ajdinovići Logo"
              width={200}
              height={80}
              className="h-10 w-auto hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="text-center space-y-4">
            <a 
              href="https://www.srca.ba" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-[#009641] hover:text-[#009641]/80 transition-colors"
            >
              <span className="text-lg font-semibold">Posjetite našu oficijalnu stranicu</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <p className="text-gray-600 text-sm animate-fade-in delay-100">
              © 2024 Ajdinovići. Sva prava zadržana.
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const container = document.getElementById('imageContainer');
            const thumb = document.getElementById('scrollThumb');
            let isDragging = false;
            let startX;
            let scrollLeft;

            // Update thumb position based on scroll
            function updateThumbPosition() {
              const scrollWidth = container.scrollWidth - container.clientWidth;
              const scrollLeft = container.scrollLeft;
              const percentage = (scrollLeft / scrollWidth) * 100;
              thumb.style.left = percentage + '%';
            }

            // Handle thumb drag
            thumb.addEventListener('mousedown', (e) => {
              isDragging = true;
              startX = e.pageX - thumb.offsetLeft;
              thumb.style.cursor = 'grabbing';
            });

            document.addEventListener('mousemove', (e) => {
              if (!isDragging) return;
              e.preventDefault();
              
              const containerRect = container.getBoundingClientRect();
              const thumbRect = thumb.getBoundingClientRect();
              const containerWidth = containerRect.width;
              const thumbWidth = thumbRect.width;
              
              let newLeft = e.pageX - containerRect.left - startX;
              newLeft = Math.max(0, Math.min(newLeft, containerWidth - thumbWidth));
              
              const percentage = (newLeft / (containerWidth - thumbWidth)) * 100;
              container.scrollLeft = (percentage / 100) * (container.scrollWidth - container.clientWidth);
            });

            document.addEventListener('mouseup', () => {
              isDragging = false;
              thumb.style.cursor = 'grab';
            });

            // Update on scroll
            container.addEventListener('scroll', updateThumbPosition);
            window.addEventListener('resize', updateThumbPosition);
            updateThumbPosition();
          });
        `
      }} />
    </div>
  );
}

