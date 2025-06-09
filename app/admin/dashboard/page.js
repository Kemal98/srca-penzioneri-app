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
    reservation: null,
    newStatus: '',
    note: ''
  });
  const [activeTab, setActiveTab] = useState('reservations');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
      }
    };

    const fetchData = async () => {
      try {
        console.log('Počinjem učitavanje podataka...'); // Debug log
        
        // Fetch reservations
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });

        if (reservationsError) {
          console.error('Greška pri učitavanju rezervacija:', reservationsError);
          throw reservationsError;
        }

        console.log('Rezervacije uspješno učitane:', reservationsData?.length || 0);

        // Fetch contacts
        console.log('Učitavam zahtjeve za poziv...'); // Debug log
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (contactsError) {
          console.error('Greška pri učitavanju zahtjeva za poziv:', contactsError);
          throw contactsError;
        }

        console.log('Zahtjevi za poziv uspješno učitani:', contactsData?.length || 0);
        
        setReservations(reservationsData || []);
        setContacts(contactsData || []);
        calculateStats(reservationsData || [], contactsData || []);
      } catch (error) {
        console.error('Greška pri učitavanju podataka:', error);
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

    checkAuth();
    fetchData();

    // Osvježavaj podatke svakih 30 sekundi
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const updateReservationStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === id 
            ? { ...reservation, status: newStatus }
            : reservation
        )
      );
    } catch (error) {
      setError(error.message);
    }
  };

  const handleStatusChange = (reservation, newStatus) => {
    setStatusChangeModal({
      show: true,
      reservation,
      newStatus,
      note: ''
    });
  };

  const confirmStatusChange = async () => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: statusChangeModal.newStatus
        })
        .eq('id', statusChangeModal.reservation.id);

      if (error) {
        console.error('Error updating status:', error);
        throw error;
      }

      // Ažuriraj lokalno stanje
      setReservations(prev => 
        prev.map(res => 
          res.id === statusChangeModal.reservation.id 
            ? { 
                ...res, 
                status: statusChangeModal.newStatus
              }
            : res
        )
      );

      setStatusChangeModal({ show: false, reservation: null, newStatus: '', note: '' });
    } catch (error) {
      console.error('Error in confirmStatusChange:', error);
      setError('Greška pri promjeni statusa: ' + error.message);
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

  const updateContactStatus = async (id, newStatus) => {
    try {
      console.log('Pokušavam ažurirati status:', { id, newStatus });

      // Prvo provjeri da li kontakt postoji
      const { data: existingContact, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Greška pri provjeri kontakta:', fetchError);
        throw new Error('Kontakt nije pronađen');
      }

      console.log('Postojeći kontakt:', existingContact);

      // Ažuriraj status kontakta
      const { data, error: updateError } = await supabase
        .from('contacts')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (updateError) {
        console.error('Greška pri ažuriranju statusa:', updateError);
        throw new Error('Greška pri ažuriranju statusa: ' + updateError.message);
      }

      console.log('Ažurirani kontakt:', data);

      // Ažuriraj lokalno stanje
      setContacts(prev => {
        const updatedContacts = prev.map(contact => 
          contact.id === id 
            ? { 
                ...contact, 
                status: newStatus,
                updated_at: new Date().toISOString()
              }
            : contact
        );
        console.log('Ažurirani kontakti:', updatedContacts);
        return updatedContacts;
      });

      // Osvježi podatke nakon uspješnog ažuriranja
      const { data: refreshedData, error: refreshError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!refreshError && refreshedData) {
        setContacts(refreshedData);
        console.log('Podaci osvježeni:', refreshedData);
      }

      console.log('Status uspješno ažuriran');
    } catch (error) {
      console.error('Greška:', error);
      setError(error.message || 'Greška pri ažuriranju statusa');
    }
  };

  // Ažuriraj handleContactStatusChange funkciju
  const handleContactStatusChange = async (contact, newStatus) => {
    if (window.confirm(`Da li želite promijeniti status za ${contact.name} u "${newStatus}"?`)) {
      try {
        await updateContactStatus(contact.id, newStatus);
        // Osvježi cijelu listu nakon promjene
        const { data: refreshedData, error: refreshError } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!refreshError && refreshedData) {
          setContacts(refreshedData);
        }
      } catch (error) {
        console.error('Greška pri promjeni statusa:', error);
        setError(error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffd700]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logo and Title */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="w-16 h-16 relative block">
              <Image
                src="/images/slike/logo.png"
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
              <div className="flex space-x-4">
                <select
                  value={filters.contactStatus}
                  onChange={(e) => setFilters({ ...filters, contactStatus: e.target.value })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700]"
                >
                  <option value="all">Svi statusi</option>
                  <option value="pending">Na čekanju</option>
                  <option value="contacted">Kontaktirano</option>
                  <option value="called">Pozvano</option>
                </select>
                <select
                  value={filters.contactDateRange}
                  onChange={(e) => setFilters({ ...filters, contactDateRange: e.target.value })}
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
                      Ime i prezime
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                      Kontakt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                      Država
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
                  {contacts
                    .filter(contact => {
                      if (filters.contactStatus !== 'all' && contact.status !== filters.contactStatus) {
                        return false;
                      }
                      const contactDate = new Date(contact.created_at);
                      const now = new Date();
                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                      const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

                      if (filters.contactDateRange === 'today' && contactDate < today) return false;
                      if (filters.contactDateRange === 'week' && contactDate < weekAgo) return false;
                      if (filters.contactDateRange === 'month' && contactDate < monthAgo) return false;

                      return true;
                    })
                    .map((contact) => (
                    <tr key={contact.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#5C4033]">{contact.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#5C4033]">{contact.email}</div>
                        <div className="text-sm text-[#5C4033]/80">{contact.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5C4033]">
                        {contact.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={contact.status || 'pending'}
                          onChange={(e) => handleContactStatusChange(contact, e.target.value)}
                          className={`text-sm rounded-md border-gray-300 focus:ring-[#ffd700] focus:border-[#ffd700] ${
                            contact.status === 'contacted' ? 'bg-blue-50 text-blue-700' :
                            contact.status === 'called' ? 'bg-green-50 text-green-700' :
                            'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          <option value="pending">Na čekanju</option>
                          <option value="contacted">Kontaktirano</option>
                          <option value="called">Pozvano</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5C4033]">
                        {new Date(contact.created_at).toLocaleString('hr-HR', {
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
                            setSelectedReservation(contact);
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
                          onChange={(e) => handleStatusChange(reservation, e.target.value)}
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
      {statusChangeModal.show && statusChangeModal.reservation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 relative animate-slide-up">
            <button 
              onClick={() => setStatusChangeModal({ show: false, reservation: null, newStatus: '', note: '' })}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg hover:shadow-xl transition-all hover:scale-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-6">
              <h2 className={`text-xl ${playfair.className} font-bold text-gray-900 mb-4`}>
                Promjena statusa rezervacije
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gost
                  </label>
                  <p className="text-gray-900">{statusChangeModal.reservation.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Novi status
                  </label>
                  <select
                    value={statusChangeModal.newStatus}
                    onChange={(e) => setStatusChangeModal(prev => ({ ...prev, newStatus: e.target.value }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700]"
                  >
                    <option value="pending">Na čekanju</option>
                    <option value="confirmed">Potvrđeno</option>
                    <option value="cancelled">Otkazano</option>
                  </select>
                </div>

                {error && (
                  <div className="text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setStatusChangeModal({ show: false, reservation: null, newStatus: '', note: '' })}
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
        </div>
      )}
    </div>
  );
} 