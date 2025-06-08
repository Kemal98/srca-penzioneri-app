"use client";

import { useState } from 'react';
import { Playfair_Display } from 'next/font/google';
import { supabase } from '../lib/supabase';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: '',
    roomType: '',
    specialRequests: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  const validateForm = () => {
    // Validacija imena
    if (formData.name.length < 3) {
      throw new Error('Ime mora imati najmanje 3 karaktera');
    }

    // Validacija emaila
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error('Unesite validnu email adresu');
    }

    // Validacija telefona
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(formData.phone)) {
      throw new Error('Unesite validan broj telefona');
    }

    // Validacija datuma
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      throw new Error('Datum dolaska ne može biti u prošlosti');
    }

    if (checkOut <= checkIn) {
      throw new Error('Datum odlaska mora biti nakon datuma dolaska');
    }

    // Validacija broja gostiju
    const guests = parseInt(formData.guests);
    if (isNaN(guests) || guests < 1 || guests > 10) {
      throw new Error('Broj gostiju mora biti između 1 i 10');
    }

    // Validacija tipa sobe
    if (!formData.roomType) {
      throw new Error('Molimo odaberite tip sobe');
    }
  };

  const sendVerificationEmail = async () => {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(code);

      // Spremi kod u bazu
      const { error: dbError } = await supabase
        .from('verification_codes')
        .insert([{
          email: formData.email,
          code: code,
          created_at: new Date().toISOString()
        }]);

      if (dbError) throw dbError;

      // Pošalji email kroz Edge Function
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          email: formData.email,
          code: code
        })
      });

      if (!response.ok) {
        throw new Error('Greška pri slanju emaila');
      }

      setShowVerification(true);
      setVerificationSent(true);
    } catch (error) {
      setError('Greška pri slanju verifikacijskog koda: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validacija forme
      validateForm();

      // Provjera verifikacijskog koda
      if (!verificationSent) {
        await sendVerificationEmail();
        setLoading(false);
        return;
      }

      if (verificationCode !== formData.verificationCode) {
        throw new Error('Pogrešan verifikacijski kod');
      }

      // Spremanje rezervacije
      const { error } = await supabase
        .from('reservations')
        .insert([{
          ...formData,
          status: 'pending',
          created_at: new Date().toISOString(),
          verified: true
        }]);

      if (error) throw error;

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        checkIn: '',
        checkOut: '',
        guests: '',
        roomType: '',
        specialRequests: ''
      });
      setVerificationSent(false);
      setShowVerification(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFDF5] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className={`text-3xl ${playfair.className} font-bold text-[#5C4033] mb-4`}>
            Rezervirajte svoj boravak
          </h2>
          <p className="text-[#5C4033]/80 max-w-2xl mx-auto">
            Ispunite obrazac ispod kako bismo vam omogućili nezaboravan boravak u našem penzionu.
            Naš tim će vas kontaktirati u najkraćem mogućem roku.
          </p>
        </div>

        {success && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Hvala vam na rezervaciji!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Vaša rezervacija je uspješno poslana. Naš tim će vas kontaktirati u najkraćem mogućem roku za potvrdu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#5C4033]">
                Ime i prezime
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700] text-[#5C4033] placeholder-black"
                placeholder="Unesite vaše ime i prezime"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#5C4033]">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700] text-[#5C4033] placeholder-black"
                placeholder="Unesite vašu email adresu"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#5C4033]">
                Telefon
              </label>
              <input
                type="tel"
                id="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700] text-[#5C4033] placeholder-black"
                placeholder="Unesite vaš broj telefona"
              />
            </div>

            <div>
              <label htmlFor="guests" className="block text-sm font-medium text-[#5C4033]">
                Broj gostiju
              </label>
              <input
                type="number"
                id="guests"
                required
                min="1"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700] text-[#5C4033] placeholder-black"
                placeholder="Unesite broj gostiju"
              />
            </div>

            <div>
              <label htmlFor="checkIn" className="block text-sm font-medium text-[#5C4033]">
                Datum dolaska
              </label>
              <input
                type="date"
                id="checkIn"
                required
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700] text-[#5C4033] placeholder-black"
              />
            </div>

            <div>
              <label htmlFor="checkOut" className="block text-sm font-medium text-[#5C4033]">
                Datum odlaska
              </label>
              <input
                type="date"
                id="checkOut"
                required
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700] text-[#5C4033] placeholder-black"
              />
            </div>

            <div>
              <label htmlFor="roomType" className="block text-sm font-medium text-[#5C4033]">
                Tip sobe
              </label>
              <select
                id="roomType"
                required
                value={formData.roomType}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                className="mt-1 block w-full rounded-md border-2 border-[#5C4033] shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700] text-[#5C4033] bg-white font-medium"
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%235C4033'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="" className="text-[#5C4033] bg-white font-medium">Odaberite tip sobe</option>
                <option value="standard" className="text-[#5C4033] bg-white font-medium">Standardna soba</option>
                <option value="deluxe" className="text-[#5C4033] bg-white font-medium">Deluxe soba</option>
                <option value="suite" className="text-[#5C4033] bg-white font-medium">Suite</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="specialRequests" className="block text-sm font-medium text-[#5C4033]">
              Posebni zahtjevi
            </label>
            <textarea
              id="specialRequests"
              rows={4}
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700] text-[#5C4033] placeholder-black"
              placeholder="Unesite sve posebne zahtjeve ili napomene..."
            />
          </div>

          {showVerification && (
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-[#5C4033]">
                Verifikacijski kod
              </label>
              <input
                type="text"
                id="verificationCode"
                required
                value={formData.verificationCode || ''}
                onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                className="mt-1 block w-full rounded-md border-2 border-[#5C4033] shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700] text-[#5C4033] bg-white font-medium"
                placeholder="Unesite 6-cifreni kod poslan na vaš email"
              />
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-black bg-[#ffd700] hover:bg-[#ffd700]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffd700] ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Slanje...' : verificationSent ? 'Potvrdi rezervaciju' : 'Pošalji verifikacijski kod'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 