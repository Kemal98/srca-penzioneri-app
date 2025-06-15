"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      console.log('Attempting login with:', { email });
      console.log('Environment variables:', {
        adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        hasPassword: !!process.env.NEXT_PUBLIC_ADMIN_PASSWORD
      });

      if (email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        console.log('Login successful, redirecting...');
        localStorage.setItem('adminToken', 'authenticated');
        router.push('/admin/dashboard');
      } else {
        console.log('Login failed: Invalid credentials');
        setError('Pogrešan email ili lozinka');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Došlo je do greške prilikom prijave');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Prijava
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#009641] focus:border-[#009641] focus:z-10 sm:text-sm"
                placeholder="Email adresa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#009641] focus:border-[#009641] focus:z-10 sm:text-sm"
                placeholder="Lozinka"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#009641] hover:bg-[#007a33] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#009641]"
            >
              Prijavi se
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 