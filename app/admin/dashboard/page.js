"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { Playfair_Display } from 'next/font/google';
import Image from 'next/image';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
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
    thisMonth: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    search: ''
  });
  const [statusChangeModal, setStatusChangeModal] = useState({
    show: false,
    reservation: null,
    newStatus: '',
    note: ''
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
      }
    };

    const fetchReservations = async () => {
      try {
        console.log('Fetching reservations...'); // Debug log
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error); // Debug log
          throw error;
        }

        console.log('Reservations fetched:', data); // Debug log
        setReservations(data);
        calculateStats(data);
      } catch (error) {
        console.error('Error fetching reservations:', error); // Debug log
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const calculateStats = (data) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getFullYear(), now.getMonth() - 1, now.getDate());

      const stats = {
        total: data.length,
        pending: data.filter(r => r.status === 'pending').length,
        confirmed: data.filter(r => r.status === 'confirmed').length,
        cancelled: data.filter(r => r.status === 'cancelled').length,
        today: data.filter(r => new Date(r.created_at) >= today).length,
        thisWeek: data.filter(r => new Date(r.created_at) >= weekAgo).length,
        thisMonth: data.filter(r => new Date(r.created_at) >= monthAgo).length
      };

      setStats(stats);
    };

    checkAuth();
    fetchReservations();

    // Osvježavaj podatke svakih 30 sekundi
    const interval = setInterval(fetchReservations, 30000);

    // Čisti interval kada se komponenta unmounta
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
            <a href="/" className="w-16 h-16 relative block">
              <Image
                src="/images/slike/logo.png"
                alt="Ajdinovica Logo"
                fill
                className="object-contain"
              />
            </a>
            <div>
              <h1 className={`text-3xl ${playfair.className} font-bold text-gray-900 mb-2`}>
                Ajdinovica - Admin Panel
              </h1>
              <p className="text-gray-600">
                Upravljanje rezervacijama za penzionere
              </p>
              <a 
                href="/" 
                className="text-sm text-[#ffd700] hover:text-[#ffd700]/80 mt-1 inline-flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Povratak na web stranicu
              </a>
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
            <h3 className="text-sm font-medium text-gray-500">Otkazano</h3>
            <p className="mt-2 text-3xl font-semibold text-red-600">{stats.cancelled}</p>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${(stats.cancelled / stats.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700]"
              >
                <option value="all">Svi statusi</option>
                <option value="pending">Na čekanju</option>
                <option value="confirmed">Potvrđeno</option>
                <option value="cancelled">Otkazano</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vremenski period
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700]"
              >
                <option value="all">Sve rezervacije</option>
                <option value="today">Danas</option>
                <option value="week">Ovaj tjedan</option>
                <option value="month">Ovaj mjesec</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pretraži
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Ime, email, telefon..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#ffd700] focus:ring-[#ffd700]"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#FFFDF5] shadow-xl rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h2 className={`text-xl ${playfair.className} font-bold text-[#5C4033]`}>
              Rezervacije
            </h2>
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
                    Broj gostiju
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#5C4033] uppercase tracking-wider">
                    Status
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5C4033]">
                      {reservation.guests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                        {reservation.status === 'confirmed' ? 'Potvrđeno' :
                         reservation.status === 'cancelled' ? 'Otkazano' :
                         'Na čekanju'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
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
                        <button
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setShowModal(true);
                          }}
                          className="text-[#ffd700] hover:text-[#ffd700]/80"
                        >
                          Detalji
                        </button>
                      </div>
                      {reservation.status_note && (
                        <div className="mt-1 text-xs text-gray-500">
                          {reservation.status_note}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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