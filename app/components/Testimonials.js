"use client";

import { Playfair_Display } from 'next/font/google';
import Image from 'next/image';

const playfair = Playfair_Display({ subsets: ['latin'] });

const testimonials = [
  {
    name: 'Ahmed i Lejla',
    location: 'Sarajevo',
    text: 'Prekrasan boravak! Osoblje je bilo izuzetno ljubazno, soba je bila čista i udobna, a lokacija je savršena za istraživanje grada.',
    image: '/images/testimonial-1.jpg'
  },
  {
    name: 'Mirza i Amina',
    location: 'Tuzla',
    text: 'Odlična usluga i ugodan ambijent. Definitivno ćemo se vratiti!',
    image: '/images/testimonial-2.jpg'
  },
  {
    name: 'Haris i Dženana',
    location: 'Mostar',
    text: 'Preporučujemo svima! Smještaj je bio odličan, a cijena je vrlo povoljna.',
    image: '/images/testimonial-3.jpg'
  }
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-[#F6E8C1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className={`text-4xl ${playfair.className} font-bold text-[#5C4033] mb-4`}>
            Šta kažu naši gosti?
          </h2>
          <p className="text-lg text-[#5C4033]/80 max-w-2xl mx-auto">
            Pročitajte iskustva naših zadovoljnih gostiju
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[#FFFDF5] rounded-2xl shadow-xl p-8 transition-all hover:scale-105"
            >
              <div className="flex items-center mb-6">
                <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className={`text-lg ${playfair.className} font-bold text-[#5C4033]`}>
                    {testimonial.name}
                  </h3>
                  <p className="text-[#5C4033]/80">
                    {testimonial.location}
                  </p>
                </div>
              </div>
              <p className="text-[#5C4033]/80 italic">
                &ldquo;{testimonial.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 