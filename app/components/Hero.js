"use client";

import { Playfair_Display } from 'next/font/google';
import Image from 'next/image';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function Hero() {
  return (
    <section className="relative h-screen">
      {/* Hero background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="Penzion"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[#5C4033]/50" />
      </div>

      {/* Hero content */}
      <div className="relative h-full flex items-center justify-center text-center px-4">
        <div className="max-w-4xl">
          <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold text-[#FFFDF5] mb-6 ${playfair.className}`}>
            Doživite nezaboravno iskustvo u našem penzionu
          </h1>
          <p className="text-xl md:text-2xl text-[#FFFDF5]/90 mb-8">
            Udoban smještaj, vrhunska usluga i ugodno druženje u srcu Sarajeva
          </p>
          <button
            onClick={() => document.getElementById('reservation').scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-[#A8C3D7] text-[#5C4033] rounded-full font-medium text-lg hover:bg-blue-300 transition-all hover:scale-105"
          >
            Rezervišite svoj boravak
          </button>
        </div>
      </div>
    </section>
  );
} 