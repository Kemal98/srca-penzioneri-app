"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Za demo svrhe, koristimo jednostavnu provjeru
      if (email === 'admin@penzion.ba' && password === 'admin123') {
        // Spremi token u localStorage
        localStorage.setItem('adminToken', 'demo-token');
        router.push('/admin/dashboard');
      } else {
        throw new Error('Pogrešan email ili lozinka');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#FFFDF5] p-8 rounded-2xl shadow-xl">
        <div>
          <h2 className={`mt-6 text-center text-3xl font-bold text-[#5C4033] ${playfair.className}`}>
            Admin Panel
          </h2>
          <p className="mt-2 text-center text-sm text-[#5C4033]/80">
            Prijavite se za pristup admin panelu
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email adresa
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#5C4033] rounded-t-md focus:outline-none focus:ring-[#A8C3D7] focus:border-[#A8C3D7] focus:z-10 sm:text-sm"
                placeholder="Email adresa"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Lozinka
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#5C4033] rounded-b-md focus:outline-none focus:ring-[#A8C3D7] focus:border-[#A8C3D7] focus:z-10 sm:text-sm"
                placeholder="Lozinka"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-[#5C4033] ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#A8C3D7] hover:bg-blue-300'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A8C3D7]`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-[#5C4033] border-t-transparent rounded-full animate-spin mr-2"></div>
                  Prijava...
                </div>
              ) : (
                'Prijavi se'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 