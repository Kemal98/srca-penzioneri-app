"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { Playfair_Display } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalContacts: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    search: '',
    contactType: 'all',
    contactStatus: 'all',
    contactDateRange: 'all'
  });
  const [statusChangeModal, setStatusChangeModal] = useState({
    show: false,
    contact: null,
    newStatus: ''
  });
  const [activeTab, setActiveTab] = useState('reservations');
  const [contactStatuses, setContactStatuses] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fontSize, setFontSize] = useState(16); // Default font size
  const [highContrast, setHighContrast] = useState(false); // High contrast mode
  const [showAccessibility, setShowAccessibility] = useState(false); // Show/hide accessibility panel
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
      }
    };

    const checkTableStructure = async () => {
      try {
        console.log('Provjeravam strukturu tabele contacts...');
        
        // Prvo provjeri da li tabela postoji
        const { data: tableInfo, error: tableError } = await supabase
          .from('contacts')
          .select('*')
          .limit(1);

        if (tableError) {
          console.error('Greška pri provjeri tabele:', tableError);
          throw new Error('Greška pri provjeri tabele: ' + tableError.message);
        }

        console.log('Tabela contacts postoji:', tableInfo);

        // Provjeri strukturu prvog reda
        if (tableInfo && tableInfo.length > 0) {
          const firstRow = tableInfo[0];
          console.log('Struktura prvog reda:', Object.keys(firstRow));
          
          // Provjeri da li postoje potrebne kolone
          const requiredColumns = ['id', 'status', 'created_at', 'updated_at'];
          const missingColumns = requiredColumns.filter(col => !(col in firstRow));
          
          if (missingColumns.length > 0) {
            console.error('Nedostaju kolone:', missingColumns);
            throw new Error('Nedostaju kolone: ' + missingColumns.join(', '));
          }
        }

        return true;
      } catch (error) {
        console.error('Greška pri provjeri strukture:', error);
        setError(error.message);
        return false;
      }
    };

    const initializeData = async () => {
      try {
        // Prvo provjeri strukturu tabele
        const structureOk = await checkTableStructure();
        if (!structureOk) {
          throw new Error('Problem sa strukturom tabele');
        }

        // Zatim učitaj podatke
        console.log('Počinjem učitavanje podataka...');
        
        // Fetch contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (contactsError) {
          console.error('Greška pri učitavanju kontakata:', contactsError);
          throw contactsError;
        }

        console.log('Kontakti učitani:', contactsData?.length || 0);

        // Postavi početne statuse za kontakte
        const initialStatuses = {};
        contactsData?.forEach(contact => {
          initialStatuses[contact.id] = contact.status || 'pending';
        });
        
        console.log('Inicijalni statusi:', initialStatuses);
        setContactStatuses(initialStatuses);
        setContacts(contactsData || []);

        // Fetch reservations
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });

        if (reservationsError) {
          console.error('Greška pri učitavanju rezervacija:', reservationsError);
          throw reservationsError;
        }

        setReservations(reservationsData || []);
        calculateStats(reservationsData || [], contactsData || []);
        setIsInitialized(true);
      } catch (error) {
        console.error('Greška pri inicijalizaciji:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const calculateStats = (reservationsData, contactsData) => {
      console.log('Računam statistiku...', { 
        reservationsCount: reservationsData?.length || 0,
        contactsCount: contactsData?.length || 0
      });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getFullYear(), now.getMonth() - 1, now.getDate());

      const stats = {
        total: reservationsData?.length || 0,
        pending: reservationsData?.filter(r => r.status === 'pending')?.length || 0,
        confirmed: reservationsData?.filter(r => r.status === 'confirmed')?.length || 0,
        cancelled: reservationsData?.filter(r => r.status === 'cancelled')?.length || 0,
        today: reservationsData?.filter(r => new Date(r.created_at) >= today)?.length || 0,
        thisWeek: reservationsData?.filter(r => new Date(r.created_at) >= weekAgo)?.length || 0,
        thisMonth: reservationsData?.filter(r => new Date(r.created_at) >= monthAgo)?.length || 0,
        totalContacts: contactsData?.length || 0
      };

      console.log('Statistika izračunata:', stats);
      setStats(stats);
    };

    const fetchContacts = async () => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Greška pri dohvaćanju kontakata:', error);
          throw error;
        }

        setContacts(data || []);
      } catch (error) {
        console.error('Greška:', error);
        setError('Greška pri dohvaćanju podataka');
      }
    };

    checkAuth();
    initializeData();
    fetchContacts();

    // Osvježavaj podatke svakih 30 sekundi
    const interval = setInterval(initializeData, 30000);

    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const handleReservationStatusChange = async (reservation, newStatus) => {
    try {
      console.log('Ažuriranje statusa rezervacije:', { id: reservation.id, newStatus });

      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          status: newStatus
        })
        .eq('id', reservation.id);

      if (updateError) {
        console.error('Greška pri ažuriranju rezervacije:', updateError);
        throw new Error('Greška pri ažuriranju statusa rezervacije');
      }

      // Osvježi podatke
      const { data: updatedReservations, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error('Greška pri osvježavanju podataka');
      }

      setReservations(updatedReservations || []);
      console.log('Status rezervacije uspješno ažuriran');
    } catch (error) {
      console.error('Greška:', error);
      setError(error.message);
    }
  };

  const updateContactStatus = async (contactId, newStatus) => {
    try {
      // Prvo ažuriraj status
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          last_action: newStatus,
          last_action_at: new Date().toISOString()
        })
        .eq('id', contactId);

      if (updateError) throw updateError;

      // Zatim dohvati sve kontakte
      const { data: updatedContacts, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Ažuriraj stanje
      setContacts(updatedContacts || []);
      return true;
    } catch (error) {
      console.error('Greška pri ažuriranju statusa:', error);
      setError('Greška pri ažuriranju statusa');
      return false;
    }
  };

  const confirmStatusChange = async () => {
    try {
      const { contact, newStatus } = statusChangeModal;
      
      if (!contact || !newStatus) {
        setError('Nedostaju podaci za ažuriranje');
        return;
      }

      const success = await updateContactStatus(contact.id, newStatus);
      
      if (success) {
        setStatusChangeModal({ show: false, contact: null, newStatus: '' });
        setError(null);
      }
    } catch (error) {
      console.error('Greška:', error);
      setError(error.message);
    }
  };

  const getStatusChangeHistory = (reservation) => {
    return [
      {
        status: reservation.status,
        date: new Date(reservation.status_changed_at || reservation.created_at),
        note: reservation.status_note
      }
    ];
  };

  const filteredReservations = reservations.filter(reservation => {
    // Status filter
    if (filters.status !== 'all' && reservation.status !== filters.status) {
      return false;
    }

    // Date range filter
    const reservationDate = new Date(reservation.created_at);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), now.getMonth() - 1, now.getDate());

    if (filters.dateRange === 'today' && reservationDate < today) return false;
    if (filters.dateRange === 'week' && reservationDate < weekAgo) return false;
    if (filters.dateRange === 'month' && reservationDate < monthAgo) return false;

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        reservation.name.toLowerCase().includes(searchTerm) ||
        reservation.email.toLowerCase().includes(searchTerm) ||
        reservation.phone.toLowerCase().includes(searchTerm) ||
        reservation.roomType.toLowerCase().includes(searchTerm)
      );
    }

    return true;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Ime', 'Email', 'Telefon', 'Dolazak', 'Odlazak', 'Gosti', 'Tip sobe', 'Status', 'Datum rezervacije'];
    
    const csvData = filteredReservations.map(reservation => [
      reservation.id,
      reservation.name,
      reservation.email,
      reservation.phone,
      new Date(reservation.check_in).toLocaleDateString('hr-HR'),
      new Date(reservation.check_out).toLocaleDateString('hr-HR'),
      reservation.guests,
      reservation.roomType,
      getStatusText(reservation.status),
      new Date(reservation.created_at).toLocaleDateString('hr-HR')
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `rezervacije_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoomTypeLabel = (type) => {
    if (!type) return 'Nije odabrano';
    
    const roomTypes = {
      'lux-apartment': 'LUX Apartmani (45 EUR/noć)',
      'hotel-central': 'Hotel Central (45 EUR/noć)',
      'bungalow': 'Bungalovi (33 EUR/noć)',
      'mountain-house': 'Planinske kuće (33 EUR/noć)',
      'hotel-horizont': 'Hotel Horizont (33 EUR/noć)',
      'hotel-depadans': 'Hotel Depadans (33 EUR/noć)'
    };
    return roomTypes[type] || type;
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const contactData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        country: formData.get('country'),
        message: formData.get('message'),
        action: 'contact_request',
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert([contactData])
        .select();

      if (error) {
        console.error('Greška Supabase:', error);
        throw new Error('Došlo je do greške prilikom slanja podataka. Molimo pokušajte ponovo.');
      }

      // Reset form
      e.target.reset();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);

    } catch (error) {
      console.error('Greška u slanju forme:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funkcija za povećanje/smanjenje slova
  const adjustFontSize = (size) => {
    setFontSize(size);
    document.documentElement.style.fontSize = `${size}px`;
  };

  // Funkcija za promjenu kontrasta
  const toggleContrast = () => {
    setHighContrast(!highContrast);
    document.body.classList.toggle('high-contrast');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffd700]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 p-8 ${highContrast ? 'high-contrast' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with Logo and Title */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="w-16 h-16 relative block">
              <Image
                src="https://i.imgur.com/BJX7nNA.jpeg"
                alt="Ajdinovica Logo"
                fill
                className="object-contain"
              />
            </Link>
            <div>
              <h1 className={`text-3xl ${playfair.className} font-bold text-gray-900 mb-2`}>
                Ajdinovica - Admin Panel
              </h1>
              <p className="text-gray-600">
                Upravljanje rezervacijama za penzionere
              </p>
              <Link href="/" className="text-sm text-[#009641] hover:text-[#009641]/80 mt-1 inline-flex items-center">
                ← Povratak na početnu
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Accessibility Button */}
            <button
              onClick={() => setShowAccessibility(!showAccessibility)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#ffd700] hover:bg-[#ffd700]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffd700]"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Pristupačnost
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#ffd700] hover:bg-[#ffd700]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffd700]"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Odjava
            </button>
          </div>
        </div>

        {/* Accessibility Panel */}
        {showAccessibility && (
          <div className="fixed top-20 right-4 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Pristupačnost</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Veličina slova
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => adjustFontSize(14)}
                    className={`px-3 py-1 rounded ${fontSize === 14 ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                  >
                    A-
                  </button>
                  <button
                    onClick={() => adjustFontSize(16)}
                    className={`px-3 py-1 rounded ${fontSize === 16 ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => adjustFontSize(18)}
                    className={`px-3 py-1 rounded ${fontSize === 18 ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                  >
                    A+
                  </button>
                  <button
                    onClick={() => adjustFontSize(20)}
                    className={`px-3 py-1 rounded ${fontSize === 20 ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                  >
                    A++
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kontrast
                </label>
                <button
                  onClick={toggleContrast}
                  className={`px-4 py-2 rounded ${highContrast ? 'bg-[#ffd700]' : 'bg-gray-100'}`}
                >
                  {highContrast ? 'Isključi visoki kontrast' : 'Uključi visoki kontrast'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            Posljednje ažuriranje: {new Date().toLocaleTimeString()}
          </div>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#ffd700] hover:bg-[#ffd700]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffd700]"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Izvezi CSV
          </button>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Ukupno rezervacija</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
            <div className="mt-2 flex space-x-2">
              <span className="text-sm text-gray-500">Danas: {stats.today}</span>
              <span className="text-sm text-gray-500">Ovaj tjedan: {stats.thisWeek}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Na čekanju</h3>
            <p className="mt-2 text-3xl font-semibold text-yellow-600">{stats.pending}</p>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Potvrđeno</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">{stats.confirmed}</p>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(stats.confirmed / stats.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Zahtjevi za poziv</h3>
            <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.totalContacts}</p>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(stats.totalContacts / (stats.total + stats.totalContacts)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Add this after the statistics section and before the tables */}
        <div className="mb-8">
          <nav className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'reservations'
                  ? 'border-b-2 border-[#ffd700] text-[#5C4033]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Rezervacije
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'contacts'
                  ? 'border-b-2 border-[#ffd700] text-[#5C4033]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Zahtjevi za poziv
            </button>
          </nav>
        </div>

        {/* Replace the existing tables section with this */}
        {activeTab === 'contacts' ? (
          <div className="bg-[#FFFDF5] shadow-xl rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h2 className={`text-xl ${playfair.className} font-bold text-[#5C4033]`}>
                Zahtjevi za poziv
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                      Ime i prezime
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                      Kontakt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                      Država
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                      Poruka
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                      Datum i vrijeme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                      Akcije
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                        <div className="text-sm text-gray-500">{contact.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.country || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {contact.message || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(contact.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setStatusChangeModal({
                              show: true,
                              contact,
                              newStatus: 'kontaktiran'
                            })}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                              contact.status === 'kontaktiran' 
                                ? 'bg-green-500 text-white border border-green-600' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                            }`}
                          >
                            Kontaktiran
                          </button>
                          <button
                            onClick={() => setStatusChangeModal({
                              show: true,
                              contact,
                              newStatus: 'nije_odgovorio'
                            })}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                              contact.status === 'nije_odgovorio' 
                                ? 'bg-red-500 text-white border border-red-600' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                            }`}
                          >
                            Nije odgovorio
                          </button>
                          <button
                            onClick={() => setStatusChangeModal({
                              show: true,
                              contact,
                              newStatus: 'rezervisano'
                            })}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                              contact.status === 'rezervisano' 
                                ? 'bg-blue-500 text-white border border-blue-600' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                            }`}
                          >
                            Rezervisano
                          </button>
                        </div>
                        {contact.last_action && contact.last_action_at && (
                          <div className="mt-1 text-xs text-gray-500">
                            Zadnja akcija: {contact.last_action} - {new Date(contact.last_action_at).toLocaleString('hr-HR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-[#FFFDF5] shadow-xl rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h2 className={`text-xl ${playfair.className} font-bold text-[#5C4033]`}>
                Rezervacije
              </h2>
              <div className="flex space-x-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700]"
              >
                <option value="all">Svi statusi</option>
                <option value="pending">Na čekanju</option>
                <option value="confirmed">Potvrđeno</option>
                <option value="cancelled">Otkazano</option>
              </select>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700]"
              >
                  <option value="all">Svi datumi</option>
                <option value="today">Danas</option>
                <option value="week">Ovaj tjedan</option>
                <option value="month">Ovaj mjesec</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                    Gost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                      Smještaj
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                    Status
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                      Datum i vrijeme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#5C4033]">{reservation.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#5C4033]">{reservation.email}</div>
                      <div className="text-sm text-[#5C4033]/80">{reservation.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#5C4033]">
                        {new Date(reservation.check_in).toLocaleDateString()} - {new Date(reservation.check_out).toLocaleDateString()}
                      </div>
                        <div className="text-sm text-[#5C4033]/80">
                          {reservation.guests} {reservation.guests === 1 ? 'gost' : 'gostiju'}
                      </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#5C4033]">
                          {getRoomTypeLabel(reservation.roomType)}
                        </div>
                        <div className="text-sm text-[#5C4033]/80">
                          {reservation.roomType && (reservation.roomType.includes('lux') || reservation.roomType.includes('central')) ? '45 EUR/noć' : '33 EUR/noć'}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={reservation.status}
                          onChange={(e) => handleReservationStatusChange(reservation, e.target.value)}
                          className={`text-sm rounded-md border-gray-300 focus:ring-[#ffd700] focus:border-[#ffd700] ${
                            reservation.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                            reservation.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                            'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          <option value="pending">Na čekanju</option>
                          <option value="confirmed">Potvrđeno</option>
                          <option value="cancelled">Otkazano</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5C4033]">
                        {new Date(reservation.created_at).toLocaleString('hr-HR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setShowModal(true);
                          }}
                          className="text-[#ffd700] hover:text-[#ffd700]/80"
                        >
                          Detalji
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* Status Change Modal */}
      {statusChangeModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 relative animate-slide-up">
            <div className="p-6">
              <h3 className={`text-xl ${playfair.className} font-bold text-gray-900 mb-4`}>
                Promjena statusa
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kontakt
                  </label>
                  <div className="text-sm text-gray-900">
                    {statusChangeModal.contact?.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Novi status
                  </label>
                  <div className="text-sm text-gray-900">
                    {statusChangeModal.newStatus}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Vrijeme akcije će biti postavljeno na trenutno vrijeme
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}
              </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                  onClick={() => {
                    setStatusChangeModal({ show: false, contact: null, newStatus: '' });
                    setError(null);
                  }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Odustani
                  </button>
                  <button
                  onClick={confirmStatusChange}
                    className="px-4 py-2 text-sm font-medium text-black bg-[#ffd700] hover:bg-[#ffd700]/90 rounded-md"
                  >
                    Potvrdi promjenu
                  </button>
                </div>
              </div>
            </div>
          </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <strong className="font-bold">Greška: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="absolute top-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Zatvori</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// Dodajte ove stilove u vaš CSS
const styles = `
.high-contrast {
  --text-color: #000000;
  --bg-color: #ffffff;
  --link-color: #0000ff;
  --button-bg: #ffff00;
  --button-text: #000000;
}

.high-contrast body {
  color: var(--text-color);
  background-color: var(--bg-color);
}

.high-contrast a {
  color: var(--link-color);
}

.high-contrast button {
  background-color: var(--button-bg);
  color: var(--button-text);
  border: 2px solid var(--button-text);
}
`; 